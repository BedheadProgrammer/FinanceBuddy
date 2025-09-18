from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Extend now so you're future-proof.
    """
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.username or self.email

