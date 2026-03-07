from django.urls import path
from . import views

urlpatterns = [
    # Gelen kişi /register adresine gelirse, views.py içindeki register_user fonksiyonunu çalıştır
    path('register/', views.register_user, name='register'),
]