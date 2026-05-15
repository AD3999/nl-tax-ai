from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    USER_TYPES = [
        ("zzp", "ZZP / Freelancer"),
        ("employee", "Employee"),
        ("expat", "Expat"),
        ("dga", "DGA / Director"),
    ]

    LANGUAGES = [
        ("nl", "Nederlands"),
        ("en", "English"),
        ("fa", "فارسی"),
    ]

    user_type = models.CharField(max_length=20, choices=USER_TYPES, blank=True)
    preferred_language = models.CharField(max_length=5, choices=LANGUAGES, default="nl")
    tax_year = models.PositiveIntegerField(default=2026)

    class Meta:
        db_table = "users"
