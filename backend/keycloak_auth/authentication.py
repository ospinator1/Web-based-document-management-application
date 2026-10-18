import jwt
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions

User = get_user_model()

_JWKS_CACHE = {'keys': None}


def _fetch_jwks():
    if _JWKS_CACHE['keys'] is not None:
        return _JWKS_CACHE['keys']
    url = (
        f"{settings.KEYCLOAK_SERVER_URL}/realms/"
        f"{settings.KEYCLOAK_REALM}/protocol/openid-connect/certs"
    )
    resp = requests.get(url, timeout=5)
    resp.raise_for_status()
    data = resp.json()
    _JWKS_CACHE['keys'] = data.get('keys', [])
    return _JWKS_CACHE['keys']


class KeycloakAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ', 1)[1].strip()
        if not token:
            return None

        try:
            payload = self._decode_token(token)
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Невалидный токен: {e}')

        user = self._sync_user(payload)
        if user is None or not user.is_active:
            raise exceptions.AuthenticationFailed('Пользователь отключен')

        request.keycloak_payload = payload
        return (user, payload)

    def _decode_token(self, token: str) -> dict:
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        keys = _fetch_jwks()

        public_key = None
        for key in keys:
            if key.get('kid') == kid:
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break
        if public_key is None:
            _JWKS_CACHE['keys'] = None
            keys = _fetch_jwks()
            for key in keys:
                if key.get('kid') == kid:
                    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                    break
        if public_key is None:
            raise exceptions.AuthenticationFailed('Публичный ключ не найден')

        return jwt.decode(
            token,
            key=public_key,
            algorithms=['RS256'],
            options={'verify_aud': False},
        )

    def _sync_user(self, payload: dict):
        username = payload.get('preferred_username')
        if not username:
            return None

        email = payload.get('email', '') or ''
        first_name = payload.get('given_name', '') or ''
        last_name = payload.get('family_name', '') or ''

        realm_roles = (payload.get('realm_access') or {}).get('roles', [])

        role_priority = ['ADMIN', 'DIRECTOR', 'DEPARTMENT_HEAD', 'OWNER', 'AUDITOR', 'USER']
        role = 'USER'
        for r in role_priority:
            if r in realm_roles:
                role = r
                break

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'role': role,
                'is_active': True,
            },
        )

        changed = False
        for field, value in [
            ('email', email),
            ('first_name', first_name),
            ('last_name', last_name),
            ('role', role),
        ]:
            if value and getattr(user, field) != value:
                setattr(user, field, value)
                changed = True

        if created:
            user.set_unusable_password()
            changed = True

        if changed:
            user.save()

        return user