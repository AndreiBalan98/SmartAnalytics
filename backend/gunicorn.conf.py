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
timeout = 60  # 60 seconds for sync operations
graceful_timeout = 30
keepalive = 5

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = "info"

# Security
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190
