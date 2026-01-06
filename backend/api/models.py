from django.db import models

class MetaIntegration(models.Model):
    """Single row to store Meta access token"""
    access_token = models.TextField()
    token_type = models.CharField(max_length=50, default='bearer')
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'meta_integration'
    
    def __str__(self):
        return f"Meta Integration (updated: {self.updated_at})"