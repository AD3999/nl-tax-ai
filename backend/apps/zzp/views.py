"""
ZZP Daily Workspace API views.

Permission model:
  - All ZZP entry CRUD is scoped to request.user (clients manage their own data).
  - Accountant review endpoints require portal access (role=accountant/admin/staff).
  - Summary endpoint is available to the owning user and their accountant.
"""
from __future__ import annotations

from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal

from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    ZZPRevenueEntry, ZZPExpenseEntry, ZZPHoursEntry,
    ZZPMileageEntry, AccountantReviewEvent,
)
from .serializers import (
    ZZPRevenueEntrySerializer, ZZPExpenseEntrySerializer,
    ZZPHoursEntrySerializer, ZZPMileageEntrySerializer,
    AccountantReviewEventSerializer,
)


def _is_portal_user(user):
    return user.is_staff or getattr(user, "role", "client") in ("accountant", "admin")


# ── Revenue ───────────────────────────────────────────────────────────────────

class RevenueListView(APIView):
    """GET /api/zzp/revenue/   POST /api/zzp/revenue/"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        year = request.query_params.get("year", timezone.now().year)
        qs   = ZZPRevenueEntry.objects.filter(user=request.user, year=year).order_by("-date")
        return Response(ZZPRevenueEntrySerializer(qs, many=True, context={"request": request}).data)

    def post(self, request):
        s = ZZPRevenueEntrySerializer(data=request.data, context={"request": request})
        if not s.is_valid():
            return Response(s.errors, status=400)
        entry = s.save(user=request.user)
        return Response(ZZPRevenueEntrySerializer(entry, context={"request": request}).data, status=201)


class RevenueDetailView(APIView):
    """GET / PATCH / DELETE /api/zzp/revenue/<pk>/"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def _get(self, request, pk):
        entry = get_object_or_404(ZZPRevenueEntry, pk=pk)
        if entry.user_id != request.user.id and not _is_portal_user(request.user):
            return None, Response({"detail": "Not found."}, status=404)
        return entry, None

    def get(self, request, pk):
        entry, err = self._get(request, pk)
        if err:
            return err
        return Response(ZZPRevenueEntrySerializer(entry, context={"request": request}).data)

    def patch(self, request, pk):
        entry, err = self._get(request, pk)
        if err:
            return err
        s = ZZPRevenueEntrySerializer(entry, data=request.data, partial=True, context={"request": request})
        if not s.is_valid():
            return Response(s.errors, status=400)
        return Response(ZZPRevenueEntrySerializer(s.save(), context={"request": request}).data)

    def delete(self, request, pk):
        entry, err = self._get(request, pk)
        if err:
            return err
        if entry.invoice_file:
            entry.invoice_file.delete(save=False)
        entry.delete()
        return Response(status=204)


# ── Expenses ──────────────────────────────────────────────────────────────────

class ExpenseListView(APIView):
    """GET /api/zzp/expenses/   POST /api/zzp/expenses/"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        year = request.query_params.get("year", timezone.now().year)
        qs   = ZZPExpenseEntry.objects.filter(user=request.user, year=year).order_by("-date")
        return Response(ZZPExpenseEntrySerializer(qs, many=True, context={"request": request}).data)

    def post(self, request):
        s = ZZPExpenseEntrySerializer(data=request.data, context={"request": request})
        if not s.is_valid():
            return Response(s.errors, status=400)
        entry = s.save(user=request.user)
        return Response(ZZPExpenseEntrySerializer(entry, context={"request": request}).data, status=201)


class ExpenseDetailView(APIView):
    """GET / PATCH / DELETE /api/zzp/expenses/<pk>/"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def _get(self, request, pk):
        entry = get_object_or_404(ZZPExpenseEntry, pk=pk)
        if entry.user_id != request.user.id and not _is_portal_user(request.user):
            return None, Response({"detail": "Not found."}, status=404)
        return entry, None

    def get(self, request, pk):
        entry, err = self._get(request, pk)
        if err:
            return err
        return Response(ZZPExpenseEntrySerializer(entry, context={"request": request}).data)

    def patch(self, request, pk):
        entry, err = self._get(request, pk)
        if err:
            return err
        s = ZZPExpenseEntrySerializer(entry, data=request.data, partial=True, context={"request": request})
        if not s.is_valid():
            return Response(s.errors, status=400)
        return Response(ZZPExpenseEntrySerializer(s.save(), context={"request": request}).data)

    def delete(self, request, pk):
        entry, err = self._get(request, pk)
        if err:
            return err
        if entry.receipt_file:
            entry.receipt_file.delete(save=False)
        entry.delete()
        return Response(status=204)


# ── Hours ─────────────────────────────────────────────────────────────────────

class HoursListView(APIView):
    """GET /api/zzp/hours/   POST /api/zzp/hours/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        year = request.query_params.get("year", timezone.now().year)
        qs   = ZZPHoursEntry.objects.filter(user=request.user, year=year).order_by("-date")
        total_hours = qs.aggregate(total=Sum("hours"))["total"] or Decimal("0")
        return Response({
            "entries": ZZPHoursEntrySerializer(qs, many=True).data,
            "total_hours": float(total_hours),
            "urencriterium": ZZPHoursEntry.URENCRITERIUM,
            "progress_pct": min(100, round(float(total_hours) / ZZPHoursEntry.URENCRITERIUM * 100, 1)),
        })

    def post(self, request):
        s = ZZPHoursEntrySerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)
        entry = s.save(user=request.user)
        return Response(ZZPHoursEntrySerializer(entry).data, status=201)


class HoursDetailView(APIView):
    """GET / PATCH / DELETE /api/zzp/hours/<pk>/"""
    permission_classes = [permissions.IsAuthenticated]

    def _get(self, request, pk):
        entry = get_object_or_404(ZZPHoursEntry, pk=pk)
        if entry.user_id != request.user.id and not _is_portal_user(request.user):
            return None, Response({"detail": "Not found."}, status=404)
        return entry, None

    def get(self, request, pk):
        entry, err = self._get(request, pk)
        if err:
            return err
        return Response(ZZPHoursEntrySerializer(entry).data)

    def patch(self, request, pk):
        entry, err = self._get(request, pk)
        if err:
            return err
        s = ZZPHoursEntrySerializer(entry, data=request.data, partial=True)
        if not s.is_valid():
            return Response(s.errors, status=400)
        return Response(ZZPHoursEntrySerializer(s.save()).data)

    def delete(self, request, pk):
        entry, err = self._get(request, pk)
        if err:
            return err
        entry.delete()
        return Response(status=204)


# ── Mileage ───────────────────────────────────────────────────────────────────

class MileageListView(APIView):
    """GET /api/zzp/mileage/   POST /api/zzp/mileage/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        year = request.query_params.get("year", timezone.now().year)
        qs   = ZZPMileageEntry.objects.filter(user=request.user, year=year).order_by("-date")
        total_km = qs.aggregate(total=Sum("km"))["total"] or Decimal("0")
        business_km = qs.filter(is_business=True).aggregate(total=Sum("km"))["total"] or Decimal("0")
        return Response({
            "entries": ZZPMileageEntrySerializer(qs, many=True).data,
            "total_km": float(total_km),
            "business_km": float(business_km),
            "deductible_amount": round(float(business_km) * ZZPMileageEntry.RATE_PER_KM, 2),
        })

    def post(self, request):
        s = ZZPMileageEntrySerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)
        entry = s.save(user=request.user)
        return Response(ZZPMileageEntrySerializer(entry).data, status=201)


class MileageDetailView(APIView):
    """GET / PATCH / DELETE /api/zzp/mileage/<pk>/"""
    permission_classes = [permissions.IsAuthenticated]

    def _get(self, request, pk):
        entry = get_object_or_404(ZZPMileageEntry, pk=pk)
        if entry.user_id != request.user.id and not _is_portal_user(request.user):
            return None, Response({"detail": "Not found."}, status=404)
        return entry, None

    def get(self, request, pk):
        entry, err = self._get(request, pk)
        if err:
            return err
        return Response(ZZPMileageEntrySerializer(entry).data)

    def patch(self, request, pk):
        entry, err = self._get(request, pk)
        if err:
            return err
        s = ZZPMileageEntrySerializer(entry, data=request.data, partial=True)
        if not s.is_valid():
            return Response(s.errors, status=400)
        return Response(ZZPMileageEntrySerializer(s.save()).data)

    def delete(self, request, pk):
        entry, err = self._get(request, pk)
        if err:
            return err
        entry.delete()
        return Response(status=204)


# ── Summary ───────────────────────────────────────────────────────────────────

class ZZPSummaryView(APIView):
    """
    GET /api/zzp/summary/?year=2026
    Returns an aggregated profit/VAT/hours/mileage overview for the year,
    broken down by quarter.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        year = int(request.query_params.get("year", timezone.now().year))

        revenue_qs  = ZZPRevenueEntry.objects.filter(user=request.user, year=year)
        expense_qs  = ZZPExpenseEntry.objects.filter(user=request.user, year=year)
        hours_qs    = ZZPHoursEntry.objects.filter(user=request.user, year=year)
        mileage_qs  = ZZPMileageEntry.objects.filter(user=request.user, year=year, is_business=True)

        total_revenue     = revenue_qs.aggregate(t=Sum("amount_excl_vat"))["t"] or Decimal("0")
        total_vat_out     = revenue_qs.aggregate(t=Sum("vat_amount"))["t"] or Decimal("0")
        total_expenses    = expense_qs.aggregate(t=Sum("deductible_amount"))["t"] or Decimal("0")
        total_vat_in      = expense_qs.aggregate(t=Sum("vat_amount"))["t"] or Decimal("0")
        total_hours       = hours_qs.aggregate(t=Sum("hours"))["t"] or Decimal("0")
        total_km          = mileage_qs.aggregate(t=Sum("km"))["t"] or Decimal("0")

        gross_profit      = total_revenue - total_expenses
        vat_payable       = total_vat_out - total_vat_in

        # Quarter breakdowns
        quarters = []
        for q in range(1, 5):
            rev_q = revenue_qs.filter(quarter=q).aggregate(t=Sum("amount_excl_vat"))["t"] or Decimal("0")
            exp_q = expense_qs.filter(quarter=q).aggregate(t=Sum("deductible_amount"))["t"] or Decimal("0")
            vat_out_q = revenue_qs.filter(quarter=q).aggregate(t=Sum("vat_amount"))["t"] or Decimal("0")
            vat_in_q  = expense_qs.filter(quarter=q).aggregate(t=Sum("vat_amount"))["t"] or Decimal("0")
            quarters.append({
                "quarter": q,
                "revenue":      float(rev_q),
                "expenses":     float(exp_q),
                "profit":       float(rev_q - exp_q),
                "vat_payable":  float(vat_out_q - vat_in_q),
            })

        return Response({
            "year":            year,
            "total_revenue":   float(total_revenue),
            "total_expenses":  float(total_expenses),
            "gross_profit":    float(gross_profit),
            "vat_payable":     float(vat_payable),
            "total_hours":     float(total_hours),
            "urencriterium":   ZZPHoursEntry.URENCRITERIUM,
            "hours_progress":  min(100, round(float(total_hours) / ZZPHoursEntry.URENCRITERIUM * 100, 1)),
            "total_km_business": float(total_km),
            "mileage_deductible": round(float(total_km) * ZZPMileageEntry.RATE_PER_KM, 2),
            "quarters":        quarters,
        })


# ── Accountant Review ─────────────────────────────────────────────────────────

class AccountantReviewView(APIView):
    """
    GET  /api/zzp/reviews/?entry_type=revenue&client_id=<id>
    POST /api/zzp/reviews/  — accountant submits a review event
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_portal_user(request.user):
            return Response({"detail": "Portal access required."}, status=403)
        qs = AccountantReviewEvent.objects.filter(reviewer=request.user)
        entry_type = request.query_params.get("entry_type")
        if entry_type:
            qs = qs.filter(entry_type=entry_type)
        client_id = request.query_params.get("client_id")
        if client_id:
            qs = qs.filter(client_id=client_id)
        return Response(AccountantReviewEventSerializer(qs, many=True).data)

    def post(self, request):
        if not _is_portal_user(request.user):
            return Response({"detail": "Portal access required."}, status=403)
        s = AccountantReviewEventSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)
        event = s.save(reviewer=request.user)
        return Response(AccountantReviewEventSerializer(event).data, status=201)


class AccountantReviewDetailView(APIView):
    """PATCH /api/zzp/reviews/<pk>/"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not _is_portal_user(request.user):
            return Response({"detail": "Portal access required."}, status=403)
        event = get_object_or_404(AccountantReviewEvent, pk=pk, reviewer=request.user)
        s = AccountantReviewEventSerializer(event, data=request.data, partial=True)
        if not s.is_valid():
            return Response(s.errors, status=400)
        return Response(AccountantReviewEventSerializer(s.save()).data)
