import os
import sys
from django.conf import settings

# Setup Django environment
sys.path.append('c:\\Users\\surad\\Desktop\\MonkMode-integration-test')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Monke_Mode.settings')

import django
django.setup()

test_var = os.environ.get('TEST_VAR')
print(f"TEST_VAR: {test_var}")

client_id = os.environ.get('GOOGLE_OAUTH2_CLIENT_ID')
print(f"GOOGLE_OAUTH2_CLIENT_ID: {client_id}")
