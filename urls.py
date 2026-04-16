from django.urls import path
from .views import extract_profile, generate_advice

urlpatterns = [
    path("extract/", extract_profile),
    path("generate-advice/", generate_advice),
]