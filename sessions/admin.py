from django.contrib import admin
from .models import StudySession


@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'session_type',
        'title',
        'planned_duration_minutes',
        'actual_duration_seconds',
        'completed',
        'started_at',
        'ended_at',
    ]
    list_filter = ['session_type', 'completed', 'started_at']
    search_fields = ['user__email', 'title']
    ordering = ['-ended_at']
