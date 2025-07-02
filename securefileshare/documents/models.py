from django.db import models
from users.models import CustomUser

class Document(models.Model):
    # uploader = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name +"--------------"+self.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')

