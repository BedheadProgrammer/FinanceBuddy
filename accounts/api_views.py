import json
from django.contrib.auth import authenticate, login, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

User = get_user_model()


@csrf_exempt
@require_POST
def login_view(request):
    try:
        data = json.loads(request.body.decode() or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return JsonResponse({"error": "Username and password are required"}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"error": "Invalid username or password"}, status=400)

    login(request, user)
    return JsonResponse({"ok": True, "username": user.username})


@csrf_exempt
@require_POST
def register_view(request):
    try:
        data = json.loads(request.body.decode() or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    confirm = data.get("confirm") or ""
    email = (data.get("email") or "").strip()

    if not username:
        return JsonResponse({"error": "Username is required"}, status=400)
    if not password:
        return JsonResponse({"error": "Password is required"}, status=400)
    if password != confirm:
        return JsonResponse({"error": "Passwords do not match"}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "Username already taken"}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
    )
    # Log them in immediately after registration
    login(request, user)
    return JsonResponse({"ok": True, "username": user.username})
