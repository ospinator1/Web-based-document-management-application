from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models


class UserGroup(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название группы")
    description = models.TextField(blank=True, verbose_name="Описание")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создано")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлено")

    class Meta:
        verbose_name = "Отделы"
        verbose_name_plural = "Отделы"

    def __str__(self):
        return self.name


class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Администратор'),
        ('DIRECTOR', 'Директор'),
        ('DEPARTMENT_HEAD', 'Руководитель отдела'),
        ('OWNER', 'Владелец политики'),
        ('AUDITOR', 'Аудитор'),
        ('USER', 'Пользователь'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='USER', verbose_name="Роль")
    groups = models.ManyToManyField(
        UserGroup,
        blank=True,
        related_name='users',
        verbose_name="Группы пользователей"
    )

    phone = models.CharField(max_length=20, blank=True, verbose_name="Телефон")
    department = models.CharField(max_length=100, blank=True, verbose_name="Отдел")
    position = models.CharField(max_length=100, blank=True, verbose_name="Должность")

    auth_groups = models.ManyToManyField(
        Group,
        related_name='custom_user_set',
        blank=True,
        verbose_name='Группы Django'
    )
    auth_user_permissions = models.ManyToManyField(
        Permission,
        related_name='custom_user_set',
        blank=True,
        verbose_name='Права Django'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создано")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлено")

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    def is_admin(self):
        return self.role == 'ADMIN' or self.is_staff

    def is_director(self):
        return self.role == 'DIRECTOR' or self.is_admin()

    def is_department_head(self):
        return self.role == 'DEPARTMENT_HEAD'

    def is_owner(self):
        return self.role == 'OWNER'

    def is_auditor(self):
        return self.role == 'AUDITOR'

    def save(self, *args, **kwargs):
        if self.role == 'ADMIN':
            self.is_staff = True
            self.is_superuser = True
        super().save(*args, **kwargs)