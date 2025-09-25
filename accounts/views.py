from django.shortcuts import render

# Create your views here.
from django.views import View
from django.shortcuts import render, redirect
from django.contrib import messages

from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "accounts/dashboard.html"

