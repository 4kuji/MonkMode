from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import get_user_study_profile

class UserStatsView(APIView):
    """
    GET /api/user/stats/
    Returns study statistics for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = get_user_study_profile(request.user)
        return Response(stats)
