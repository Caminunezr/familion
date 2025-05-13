from django.contrib import admin
from .models import Cuenta, Pago, Profile, Proveedor, PresupuestoMensual, Aporte, GastoPresupuesto, DeudaPresupuesto, AhorroPresupuesto, MovimientoPresupuesto

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'group_id', 'color')
    search_fields = ('user__username', 'group_id', 'color')

admin.site.register(Cuenta)
admin.site.register(Pago)
admin.site.register(Proveedor)
admin.site.register(PresupuestoMensual)
admin.site.register(Aporte)
admin.site.register(GastoPresupuesto)
admin.site.register(DeudaPresupuesto)
admin.site.register(AhorroPresupuesto)
admin.site.register(MovimientoPresupuesto)
