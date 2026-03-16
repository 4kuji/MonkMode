from django.urls import path
from . import views

urlpatterns = [
    # Gelen kişi /register adresine gelirse, views.py içindeki register_user fonksiyonunu çalıştır
    path('register/', views.register_user, name='register'),
<<<<<<< HEAD
    #Seans kaydetme
    path('save-session/', views.save_session, name='save_session'),
=======
>>>>>>> 5ecaaf283b525fb43db71598bc45b830cff14f25
]