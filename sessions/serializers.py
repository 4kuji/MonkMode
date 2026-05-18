"""
Serializers for StudySession model.
"""
from rest_framework import serializers
from .models import StudySession


class StudySessionSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and reading StudySession records.
    - `user` is set automatically from request.user (not sent by frontend).
    - All datetime fields accept ISO 8601 format.
    """

    class Meta:
        model = StudySession
        fields = [
            'id',
            'session_type',
            'title',
            'planned_duration_minutes',
            'actual_duration_seconds',
            'started_at',
            'ended_at',
            'completed',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_session_type(self, value):
        valid_types = ['pomodoro', 'stopwatch', 'short_break', 'long_break']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Geçersiz oturum tipi. Geçerli değerler: {', '.join(valid_types)}"
            )
        return value

    def validate(self, data):
        if data.get('started_at') and data.get('ended_at'):
            if data['ended_at'] <= data['started_at']:
                raise serializers.ValidationError({
                    'ended_at': 'Bitiş zamanı başlangıç zamanından sonra olmalıdır.'
                })
        return data
