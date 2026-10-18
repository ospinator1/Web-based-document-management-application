from django.urls import path
from .views import KeycloakProfileView

urlpatterns = [
    path('profile/', KeycloakProfileView.as_view(), name='kc_profile'),
]