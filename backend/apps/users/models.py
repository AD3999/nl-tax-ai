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

    PLANS = [("free", "Free"), ("premium", "Premium")]

    user_type = models.CharField(max_length=20, choices=USER_TYPES, blank=True)
    preferred_language = models.CharField(max_length=5, choices=LANGUAGES, default="nl")
    tax_year = models.PositiveIntegerField(default=2026)

    plan = models.CharField(max_length=20, choices=PLANS, default="free")
    stripe_customer_id = models.CharField(max_length=100, blank=True, default="")
    daily_message_count = models.PositiveIntegerField(default=0)
    daily_message_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "users"
