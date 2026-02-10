from django.db import models


class SystemLog(models.Model):
    LEVEL_CHOICES = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]

    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, db_index=True)
    logger_name = models.CharField(max_length=255, db_index=True)
    message = models.TextField()
    pathname = models.CharField(max_length=500, blank=True)
    lineno = models.IntegerField(null=True, blank=True)
    funcname = models.CharField(max_length=255, blank=True)
    exc_info = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'system_log'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at', 'level']),
            models.Index(fields=['logger_name', '-created_at']),
        ]

    def __str__(self):
        return f"[{self.level}] {self.logger_name}: {self.message[:50]}"
