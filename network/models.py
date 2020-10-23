from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    followers = models.ManyToManyField('self', symmetrical=False, related_name="following")

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    likes = models.ManyToManyField(User, related_name="liked")
    content = models.CharField(max_length=280)
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "count": self.likes.count(),
            "content": self.content,
            "timestamp": self.timestamp.strftime("%b %-d %Y, %-I:%M %p")
        }

    def like(self, user):
        if user in self.likes.all(): return True
        else: return False
