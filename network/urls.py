
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("new", views.new),
    path("like", views.like),
    path("edit", views.edit),
    path("posts", views.posts),
    path("follow", views.follow),
    path("profile", views.profile),
]
