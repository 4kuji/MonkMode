from django.contrib import admin
from django.urls import path
from ai_planner.views import extract_profile, generate_advice

urlpatterns = [
    path("admin/", admin.site.urls),
    path("ai/extract/", extract_profile),
    path("ai/generate-advice/", generate_advice),
]