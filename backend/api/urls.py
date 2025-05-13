from rest_framework import routers
from .views import (
    CuentaViewSet, PagoViewSet, profile_view, ProveedoresPorCategoriaView, TransferirSobranteView, CerrarMesView,
    PresupuestoMensualViewSet, AporteViewSet, GastoPresupuestoViewSet, DeudaPresupuestoViewSet, AhorroPresupuestoViewSet, MovimientoPresupuestoViewSet
)
from django.urls import path

router = routers.DefaultRouter()
router.register(r'cuentas', CuentaViewSet)
router.register(r'pagos', PagoViewSet)
router.register(r'presupuestos', PresupuestoMensualViewSet)
router.register(r'aportes', AporteViewSet)
router.register(r'gastos-presupuesto', GastoPresupuestoViewSet)
router.register(r'deudas-presupuesto', DeudaPresupuestoViewSet)
router.register(r'ahorros-presupuesto', AhorroPresupuestoViewSet)
router.register(r'movimientos-presupuesto', MovimientoPresupuestoViewSet)

urlpatterns = router.urls + [
    path('profile/', profile_view, name='profile'),
    path('proveedores-por-categoria/', ProveedoresPorCategoriaView.as_view(), name='proveedores-por-categoria'),
    path('presupuesto/<int:presupuesto_id>/transferir-sobrante/', TransferirSobranteView.as_view(), name='transferir-sobrante'),
    path('presupuesto/<int:presupuesto_id>/cerrar-mes/', CerrarMesView.as_view(), name='cerrar-mes'),
]