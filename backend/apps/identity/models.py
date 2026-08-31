from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El correo electrónico institucional es obligatorio.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', CustomUser.Role.COORDINADOR)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        COORDINADOR = 'COORDINADOR', 'Coordinador de Posgrado'
        ASESOR = 'ASESOR', 'Tutor / Asesor Académico'
        ESTUDIANTE = 'ESTUDIANTE', 'Estudiante de Doctorado'

    email = models.EmailField(
        'Correo Electrónico',
        unique=True,
        max_length=255,
        db_index=True
    )
    first_name = models.CharField('Nombre(s)', max_length=150)
    last_name = models.CharField('Apellido(s)', max_length=150)
    role = models.CharField(
        'Rol Institucional',
        max_length=20,
        choices=Role.choices,
        default=Role.ESTUDIANTE
    )
    is_active = models.BooleanField('Activo', default=True)
    is_staff = models.BooleanField('Acceso a Staff', default=False)
    created_at = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
