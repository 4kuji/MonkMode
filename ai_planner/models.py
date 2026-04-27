from django.db import models
from django.contrib.auth.models import User

class GoogleCredentials(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='google_credentials')
    token = models.TextField()
    refresh_token = models.TextField(null=True, blank=True)
    token_uri = models.CharField(max_length=500)
    client_id = models.CharField(max_length=500)
    client_secret = models.CharField(max_length=500)
    scopes = models.TextField()

    def __str__(self):
        return f"{self.user.username}'s Google Credentials"
