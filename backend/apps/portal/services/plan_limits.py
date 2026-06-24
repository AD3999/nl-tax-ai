"""
Subscription plan feature limits.
Free → 3 clients max
Professional → 25 clients max
Firm → unlimited clients
AI extraction only on professional+
"""

PLAN_LIMITS = {
    "free": {
        "max_clients":     3,
        "max_engagements": 6,
        "ai_extraction":   False,
        "advanced_risks":  False,
        "inbox_view":      False,
    },
    "professional": {
        "max_clients":     25,
        "max_engagements": 100,
        "ai_extraction":   True,
        "advanced_risks":  True,
        "inbox_view":      True,
    },
    "firm": {
        "max_clients":     None,
        "max_engagements": None,
        "ai_extraction":   True,
        "advanced_risks":  True,
        "inbox_view":      True,
    },
}


def get_plan(user) -> str:
    try:
        firm = user.accountant_profile.firm
        if firm:
            return firm.subscription_plan or "free"
    except Exception:
        pass
    return getattr(user, "plan", "free") or "free"


def get_limits(user) -> dict:
    return PLAN_LIMITS.get(get_plan(user), PLAN_LIMITS["free"])


def check_client_limit(user) -> tuple:
    """Returns (allowed: bool, error_message: str)."""
    from apps.portal.models import AccountantClientProfile
    from django.db.models import F
    limits = get_limits(user)
    max_c = limits["max_clients"]
    if max_c is None:
        return True, ""
    current = AccountantClientProfile.objects.filter(
        accountant_user=user
    ).exclude(client_user=F("accountant_user")).count()
    if current >= max_c:
        plan = get_plan(user)
        return False, (
            f"Your {plan} plan allows up to {max_c} clients. "
            f"Upgrade to add more clients."
        )
    return True, ""
