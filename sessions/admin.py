from django.contrib import admin
from .models import CustomUser, Category, FocusSession

# Tabloları Admin paneline kaydediyoruz
admin.site.register(CustomUser)
admin.site.register(Category)
admin.site.register(FocusSession)