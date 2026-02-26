from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

# 1. KULLANICI YÖNETİCİSİ (Sisteme Email ile kayıt olmak için bel kemiği)
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Kullanıcıların bir e-posta adresi olmalıdır.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(email, password, **extra_fields)

# 2. ÖZEL KULLANICI MODELİMİZ (Gereksiz alanlardan arındırılmış)
class CustomUser(AbstractUser):
    username = None  # Klasik kullanıcı adını tamamen iptal ediyoruz
    email = models.EmailField("E-posta Adresi", unique=True)
    
    # Giriş yapmak için kullanılacak ana alan e-posta olacak
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email

# 3. KATEGORİ TABLOSU (Her kullanıcının kendi açtığı dersler/konular)
class Category(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, verbose_name="Kullanıcı")
    name = models.CharField(max_length=100, verbose_name="Kategori Adı")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.name}"

# 4. ODAKLANMA SEANSI TABLOSU (Sistemdeki ana veri havuzumuz)
class FocusSession(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, verbose_name="Kullanıcı")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Kategori")
    
    duration_minutes = models.PositiveIntegerField(verbose_name="Odaklanma Süresi (Dakika)")
    start_time = models.DateTimeField(verbose_name="Başlangıç Zamanı")
    end_time = models.DateTimeField(verbose_name="Bitiş Zamanı")
    notes = models.TextField(blank=True, null=True, verbose_name="Seans Notları")
    
    def __str__(self):
        kategori_adi = self.category.name if self.category else "Kategorisiz"
        return f"{self.user.email} | {kategori_adi} | {self.duration_minutes} dk"