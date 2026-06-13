import os
import stripe
from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

stripe.api_key = settings.STRIPE_SECRET_KEY


class CreateCheckoutSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not settings.STRIPE_SECRET_KEY:
            return Response({"error": "Payments not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        user = request.user
        frontend_url = settings.FRONTEND_URL

        try:
            # Re-use existing Stripe customer or create a new one
            customer_id = user.stripe_customer_id or None
            if not customer_id:
                customer = stripe.Customer.create(email=user.email, metadata={"user_id": str(user.id)})
                customer_id = customer.id
                user.stripe_customer_id = customer_id
                user.save(update_fields=["stripe_customer_id"])

            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[{"price": settings.STRIPE_PRICE_ID, "quantity": 1}],
                mode="subscription",
                success_url=f"{frontend_url}/chat?upgraded=1",
                cancel_url=f"{frontend_url}/pricing",
                metadata={"user_id": str(user.id)},
            )
            return Response({"url": session.url})
        except stripe.StripeError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BillingPortalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not settings.STRIPE_SECRET_KEY:
            return Response({"error": "Payments not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        user = request.user
        if not user.stripe_customer_id:
            return Response({"error": "No billing account found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            session = stripe.billing_portal.Session.create(
                customer=user.stripe_customer_id,
                return_url=f"{settings.FRONTEND_URL}/chat",
            )
            return Response({"url": session.url})
        except stripe.StripeError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET

        if not webhook_secret:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except (ValueError, stripe.SignatureVerificationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        from apps.users.models import User
        from apps.payments.models import Subscription
        from django.utils import timezone
        import datetime

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            user_id = session.get("metadata", {}).get("user_id")
            customer_id = session.get("customer")
            stripe_sub_id = session.get("subscription")
            if user_id:
                User.objects.filter(id=user_id).update(
                    plan="premium",
                    stripe_customer_id=customer_id or "",
                )
                try:
                    user = User.objects.get(id=user_id)
                    Subscription.objects.update_or_create(
                        stripe_subscription_id=stripe_sub_id,
                        defaults={
                            "user": user,
                            "plan": "professional",
                            "status": "active",
                            "stripe_customer_id": customer_id or "",
                        },
                    )
                except User.DoesNotExist:
                    pass

        elif event["type"] in ("customer.subscription.deleted", "customer.subscription.paused"):
            sub_data = event["data"]["object"]
            customer_id = sub_data.get("customer")
            stripe_sub_id = sub_data.get("id")
            if customer_id:
                User.objects.filter(stripe_customer_id=customer_id).update(plan="free")
            if stripe_sub_id:
                status_map = {"deleted": "cancelled", "paused": "past_due"}
                new_status = status_map.get(event["type"].split(".")[2], "cancelled")
                Subscription.objects.filter(stripe_subscription_id=stripe_sub_id).update(
                    status=new_status
                )

        elif event["type"] == "customer.subscription.resumed":
            sub_data = event["data"]["object"]
            customer_id = sub_data.get("customer")
            stripe_sub_id = sub_data.get("id")
            if customer_id:
                User.objects.filter(stripe_customer_id=customer_id).update(plan="premium")
            if stripe_sub_id:
                Subscription.objects.filter(stripe_subscription_id=stripe_sub_id).update(
                    status="active"
                )

        elif event["type"] == "invoice.paid":
            inv_data = event["data"]["object"]
            stripe_sub_id = inv_data.get("subscription")
            stripe_inv_id = inv_data.get("id")
            if stripe_inv_id:
                from apps.payments.models import Invoice as InvoiceModel
                sub = Subscription.objects.filter(stripe_subscription_id=stripe_sub_id).first()
                InvoiceModel.objects.update_or_create(
                    stripe_invoice_id=stripe_inv_id,
                    defaults={
                        "subscription": sub,
                        "user": sub.user if sub else None,
                        "amount_due": inv_data.get("amount_due", 0) / 100,
                        "amount_paid": inv_data.get("amount_paid", 0) / 100,
                        "currency": inv_data.get("currency", "eur").upper(),
                        "status": "paid",
                        "paid_at": timezone.now(),
                    },
                )

        return Response({"status": "ok"})
