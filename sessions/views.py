"""
Views for session management.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers import StudySessionSerializer
from .models import StudySession


class SaveSessionView(APIView):
    """
    POST /api/save-session/
    Saves a completed timer session to the database.
    User is determined from JWT token (request.user).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StudySessionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(
                {
                    'message': 'Oturum kaydedildi.',
                    'session': serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserSessionsView(APIView):
    """
    GET /api/sessions/
    Returns all sessions for the authenticated user.
    Useful for StatsPage and analytics.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = StudySession.objects.filter(user=request.user)

        # Optional query params for filtering
        session_type = request.query_params.get('session_type')
        if session_type:
            sessions = sessions.filter(session_type=session_type)

        limit = request.query_params.get('limit')
        if limit:
            try:
                sessions = sessions[:int(limit)]
            except (ValueError, TypeError):
                pass

        serializer = StudySessionSerializer(sessions, many=True)
        return Response(serializer.data)
