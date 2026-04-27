"""
StudySession model for tracking Pomodoro, stopwatch, and break sessions.
Field names are designed for pandas/analytics compatibility.
"""
from django.db import models
from django.conf import settings


class StudySession(models.Model):
    """
    Records a single timer session (pomodoro, stopwatch, short_break, long_break).
    Used by analytics/pandas module for user study pattern analysis.
    """

    SESSION_TYPE_CHOICES = [
        ('pomodoro', 'Pomodoro'),
        ('stopwatch', 'Kronometre'),
        ('short_break', 'Kısa Mola'),
        ('long_break', 'Uzun Mola'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='study_sessions',
        db_index=True,
    )
    session_type = models.CharField(
        max_length=20,
        choices=SESSION_TYPE_CHOICES,
        db_index=True,
    )
    title = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text='Ders adı veya çalışma başlığı',
    )
    planned_duration_minutes = models.PositiveIntegerField(
        default=25,
        help_text='Planlanan süre (dakika). Kronometre için 0.',
    )
    actual_duration_seconds = models.PositiveIntegerField(
        default=0,
        help_text='Gerçek çalışma süresi (saniye).',
    )
    started_at = models.DateTimeField(
        help_text='Oturumun başladığı zaman.',
    )
    ended_at = models.DateTimeField(
        help_text='Oturumun bittiği zaman.',
    )
    completed = models.BooleanField(
        default=False,
        help_text='Oturum tamamlandı mı (süre doldu) yoksa erken mi durduruldu.',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-ended_at']
        indexes = [
            models.Index(fields=['user', 'session_type']),
            models.Index(fields=['user', 'ended_at']),
            models.Index(fields=['user', 'title']),
        ]
        verbose_name = 'Study Session'
        verbose_name_plural = 'Study Sessions'

    def __str__(self):
        return f"{self.user.email} - {self.get_session_type_display()} - {self.title or 'Untitled'} ({self.actual_duration_seconds}s)"

    @property
    def actual_duration_minutes(self):
        """Convenience property for analytics: actual duration in minutes."""
        return round(self.actual_duration_seconds / 60, 2)
