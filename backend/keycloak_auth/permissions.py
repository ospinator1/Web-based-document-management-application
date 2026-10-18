from rest_framework import permissions


class IsDirector(permissions.BasePermission):
    message = 'Доступно только директору'

    def has_permission(self, request, view):
        user = request.user
        return user.is_authenticated and (
            user.role in ('DIRECTOR', 'ADMIN') or user.is_superuser
        )


class IsDepartmentHead(permissions.BasePermission):
    message = 'Доступно только руководителю отдела'

    def has_permission(self, request, view):
        user = request.user
        return user.is_authenticated and (
            user.role in ('DEPARTMENT_HEAD', 'DIRECTOR', 'ADMIN') or user.is_superuser
        )


class IsDepartmentHeadOf(permissions.BasePermission):
    message = 'Нет прав на управление этим отделом'

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role in ('DIRECTOR', 'ADMIN') or user.is_superuser:
            return True
        if user.role != 'DEPARTMENT_HEAD':
            return False
        target_dept = getattr(obj, 'department', None) or getattr(obj, 'name', None)
        return bool(target_dept) and target_dept == user.department