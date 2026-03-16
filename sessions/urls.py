from django.urls import path
from . import views

urlpatterns = [
    # Gelen kişi /register adresine gelirse, views.py içindeki register_user fonksiyonunu çalıştır
    path('register/', views.register_user, name='register'),
    #Seans kaydetme
    path('save-session/', views.save_session, name='save_session'),

    #İstatistikleri getiren kapı! (<int:user_id> kısmı dinamik ID alır)
    path('stats/<int:user_id>/', views.get_user_stats, name='user_stats'),
]