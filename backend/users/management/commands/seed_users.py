import json
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from users.models import User, UserGroup

class Command(BaseCommand):

    def handle(self, *args, **kwargs):
        json_path = os.path.join(settings.BASE_DIR, '..', 'keycloak', 'realm-export.json')

        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR(f'Файл не найден: {json_path}'))
            return

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        users_data = data.get('users', [])
        if not users_data:
            self.stdout.write(self.style.WARNING('В JSON нет пользователей.'))
            return

        for u_data in users_data:
            username = u_data.get('username')
            
            # Определяем роль (берем первую из списка realmRoles)
            roles = u_data.get('realmRoles', [])
            role = roles[0] if roles else 'USER'

            # Определяем отдел (берем первую группу из списка groups)
            groups = u_data.get('groups', [])
            department_name = groups[0] if groups else None

            group = None
            if department_name and role != 'DIRECTOR':
                group, _ = UserGroup.objects.get_or_create(name=department_name)

            # Создаем или обновляем пользователя
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "role": role,
                    "department": group,
                    "first_name": u_data.get('firstName', ''),
                    "last_name": u_data.get('lastName', ''),
                    "email": u_data.get('email', ''),
                    "is_active": True,
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f"Создан: {username} ({role}, {department_name})"))
            else:
                # Если пользователь уже есть, обновляем ему роль и отдел
                user.role = role
                user.department = group
                user.first_name = u_data.get('firstName', '')
                user.last_name = u_data.get('lastName', '')
                user.save()
                self.stdout.write(f"Обновлен: {username}")

        self.stdout.write(self.style.SUCCESS("Синхронизация из JSON завершена!"))