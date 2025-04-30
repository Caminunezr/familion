from django.contrib import admin
from .models import Cuenta, Pago, Profile, Proveedor

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'group_id')
    search_fields = ('user__username', 'group_id')

admin.site.register(Cuenta)
admin.site.register(Pago)
admin.site.register(Proveedor)
