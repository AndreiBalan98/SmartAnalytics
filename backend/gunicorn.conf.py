"""
Gunicorn configuration file
"""

import os

# Bind to PORT from environment (Render provides this)
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"

# Worker configuration
workers = 2
worker_class = "sync"

# Timeout configuration
timeout = 600  # 600 seconds (10 minutes) for sync operations with many ad accounts
graceful_timeout = 60
keepalive = 10

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = "info"

# Security
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190
