from django.urls import path
from .views import UserSignupView,VerifyEmailView, SignupPageView, UserLoginView

urlpatterns = [
    path('signup/', UserSignupView.as_view()),
    path('signup-page/', SignupPageView.as_view()),
    path('verify-email/<str:token>/', VerifyEmailView.as_view()),
    path('login/', UserLoginView.as_view()),
]
