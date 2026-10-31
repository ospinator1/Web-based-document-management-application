from rest_framework import generics, permissions
from django.db.models import Q
from .models import User
from .serializers import UserSerializer

class UserListCreateView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == 'DIRECTOR':
            return User.objects.exclude(role='ADMIN').exclude(id=user.id).order_by('last_name', 'first_name')

        elif user.role == 'ADMIN':
            return User.objects.all().order_by('last_name', 'first_name')

        elif user.role == 'DEPARTMENT_HEAD':
            if not user.department:
                return User.objects.none()
            return User.objects.filter(
                department=user.department
            ).exclude(
                id=user.id
            ).exclude(role='ADMIN').order_by('last_name', 'first_name')

        else:
            return User.objects.filter(id=user.id)