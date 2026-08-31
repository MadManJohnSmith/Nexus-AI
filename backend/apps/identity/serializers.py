from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import authenticate
from apps.identity.models import CustomUser


class CustomUserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 'role', 'is_active']
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser.objects.create_user(password=password, **validated_data)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = attrs.get('email') or attrs.get('username')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError({
                'non_field_errors': ['Debe incluir correo electrónico y contraseña.']
            })

        user = authenticate(request=self.context.get('request'), email=email, password=password)

        if not user:
            raise AuthenticationFailed({
                'non_field_errors': ['Credenciales de acceso inválidas o usuario inactivo.']
            })

        if not user.is_active:
            raise AuthenticationFailed({
                'non_field_errors': ['La cuenta de usuario se encuentra inactiva. Contacte a la coordinación.']
            })

        data = super().validate(attrs)
        data['user'] = CustomUserSerializer(user).data
        return data
