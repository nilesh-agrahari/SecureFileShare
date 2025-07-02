from django.shortcuts import render,redirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from .serializers import UserSignupSerializer
from django.core.mail import send_mail
from itsdangerous import URLSafeSerializer
from django.conf import settings
from .models import CustomUser
from django.views import View

class SignupPageView(View):
    def get(self, request):
        return render(request, 'signup.html')

    def post(self, request):
        email = request.POST.get('email')
        password = request.POST.get('password')
        role = request.POST.get('role')

        if CustomUser.objects.filter(email=email).exists():
            return render(request, 'signup.html', {'message': 'Email already exists!'})

        user = CustomUser.objects.create_user(
            email=email,
            username=email,
            password=password,
            role=role
        )
        user.is_active = True
        user.save()

        # Generate token
        s = URLSafeSerializer(settings.SECRET_KEY)
        token = s.dumps(user.email)

        verification_link = f"http://localhost:8000/users/verify-email/{token}/"

        # Send email
        send_mail(
            'Verify your email',
            f'Click the link to verify: {verification_link}',
            settings.EMAIL_HOST_USER,
            [user.email],
            fail_silently=False,
        )

        return render(request, 'signup.html', {'message': f'Signup successful. Check your email ({email}) for verification.'})


class UserSignupView(APIView):
    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Generate token
            s = URLSafeSerializer(settings.SECRET_KEY)
            token = s.dumps(user.email)

            # Verification link
            verification_link = f"http://localhost:8000/users/verify-email/{token}/"

            # Send email
            send_mail(
                'Verify your email',
                f'Click the link to verify: {verification_link}',
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=False,
            )

            return Response({'message': 'Signup successful. Check email to verify.', 'verification_link': verification_link})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class VerifyEmailView(APIView):
    def get(self, request, token):
        s = URLSafeSerializer(settings.SECRET_KEY)
        try:
            email = s.loads(token)
            user = CustomUser.objects.get(email=email)
            user.is_verified = True
            user.save()
            return Response({'message': 'Email verified successfully.'})
        except:
            return Response({'message': 'Invalid or expired link.'}, status=status.HTTP_400_BAD_REQUEST)



class UserLoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        token = Token.objects.get(key=response.data['token'])
        user = token.user

        if not user.is_verified:
            return Response({'message': 'Email not verified. Please verify your email first.'}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            'token': token.key,
            'email': user.email,
            'role': user.role,
            'message': 'Login successful'
        })