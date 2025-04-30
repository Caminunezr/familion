from rest_framework import routers
from .views import CuentaViewSet, PagoViewSet, profile_view, ProveedoresPorCategoriaView
from django.urls import path

router = routers.DefaultRouter()
router.register(r'cuentas', CuentaViewSet)
router.register(r'pagos', PagoViewSet)

urlpatterns = router.urls + [
    path('profile/', profile_view, name='profile'),
    path('proveedores-por-categoria/', ProveedoresPorCategoriaView.as_view(), name='proveedores-por-categoria'),
]