from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from users.serializers import UserSerializer


class KeycloakProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = UserSerializer(request.user).data
        payload = getattr(request, 'keycloak_payload', {})
        data['keycloak'] = {
            'realm_roles': (payload.get('realm_access') or {}).get('roles', []),
            'email_verified': payload.get('email_verified', False),
        }
        return Response(data)