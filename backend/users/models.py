from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils.translation import gettext as _
from core.models import TimeStampedModel


class UserGroup(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название отдела")
    description = models.TextField(blank=True, verbose_name="Описание")

    class Meta:
        verbose_name = "Отдел"
        verbose_name_plural = "Отделы"

    def __str__(self):
        return self.name


class User(AbstractUser, TimeStampedModel):
    ROLE_CHOICES = [
        ('ADMIN', 'Администратор'),
        ('DIRECTOR', 'Директор'),
        ('DEPARTMENT_HEAD', 'Руководитель отдела'),
        ('USER', 'Сотрудник'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='USER', verbose_name="Роль")
    
    department = models.ForeignKey(
        UserGroup, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='employees',
        verbose_name="Отдел"
    )
    
    position = models.CharField(max_length=100, blank=True, verbose_name="Должность")
    
    # Переопределенные поля для избежания конфликтов с auth.User
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

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    def is_admin(self):
        return self.role == 'ADMIN' or self.is_staff

    def is_director(self):
        return self.role == 'DIRECTOR'

    def is_department_head(self):
        return self.role == 'DEPARTMENT_HEAD'

    def save(self, *args, **kwargs):
        if self.role == 'ADMIN':
            self.is_staff = True
            self.is_superuser = True
        super().save(*args, **kwargs)