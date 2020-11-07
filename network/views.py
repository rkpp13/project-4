from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.core.paginator import Paginator, EmptyPage
from django.shortcuts import render
from django.urls import reverse

from .models import *
import json

def index(request):
    return render(request, "network/index.html")

def posts(request):
    follow = request.GET.get('following')
    username = request.GET.get('profile')

    if username:
        posts = Post.objects.order_by("-timestamp").filter(user=User.objects.get(username=username))
    elif follow:
        posts = Post.objects.order_by("-timestamp").filter(user__in=request.user.following.all())
    else:
        posts = Post.objects.order_by("-timestamp").all()

    pages = Paginator(posts, 10)
    num = request.GET.get('page')
    obj = pages.page(num)
    page = {'previous': obj.has_previous(), 'next': obj.has_next(), 'number': obj.number, 'logged': request.user.is_authenticated}
    data = []
    for post in obj:
        save = post.serialize()
        save.update(like = post.like(request.user))
        save.update(author = post.user == request.user)
        data.append(save)
    return JsonResponse([data, page], safe=False)

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


def new(request):
    if request.method == "GET":
        return JsonResponse({"logged": request.user.is_authenticated})
    if request.method == "POST":
        data = json.loads(request.body)
        if body := data["body"].strip():
            Post.objects.create(user=request.user,content=body)
            return JsonResponse({"message": "Post created successfully."}, status=201)
    return JsonResponse({"error": "Bad Request"}, status=400)

def like(request):
    if request.user.is_authenticated:
        if request.method == "PUT":
            data = json.loads(request.body)
            post = Post.objects.get(id=data["id"])
            if data["like"]:
                post.likes.remove(request.user)
                message = "Unliked"
            else:
                post.likes.add(request.user)
                message = "Liked"
            return JsonResponse({"message": message, "count": post.likes.count()}, status=202)
    return JsonResponse({"error": "Bad Request"}, status=400)

def edit(request):
    if request.method == "POST":
        data = json.loads(request.body)
        post = Post.objects.get(id=data["id"])
        if request.user == post.user:
            if body := data["body"].strip():
                post.content = body
                post.save()
                return JsonResponse({"message": "Post edited successfully."}, status=202)
        else:
            return JsonResponse({"error": "You are not the owner of this post."}, status=403)
    return JsonResponse({"error": "Bad Request"}, status=400)

def profile(request):
    username = request.GET.get('username')
    user = User.objects.get(username=username)
    data = {
        'followers': user.followers.count(),
        'following': user.following.count(),
        'holder': request.user == user,
        'logged': request.user.is_authenticated,
        'follow': request.user in user.followers.all()
    }
    return JsonResponse(data)

def follow(request):
    if request.user.is_authenticated:
        if request.method == "PUT":
            data = json.loads(request.body)
            user = User.objects.get(username=data["username"])
            requester = request.user
            if requester != user:
                if requester in user.followers.all():
                    user.followers.remove(requester)
                    requester.following.remove(user)
                    message = "Unfollowed"
                else:
                    user.followers.add(requester)
                    requester.following.add(user)
                    message = "Followed"
                return JsonResponse({"message": message}, status=202)
    return JsonResponse({"error": "Bad Request"}, status=400)
