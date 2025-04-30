from django.db import models
from django.contrib.auth.models import User
import uuid
from datetime import datetime

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    group_id = models.CharField(max_length=100, default=uuid.uuid4, editable=True)

    def __str__(self):
        return f"Perfil de {self.user.username} (Grupo: {self.group_id})"

class Cuenta(models.Model):
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    proveedor = models.ForeignKey('Proveedor', on_delete=models.CASCADE, related_name='cuentas')
    fecha_emision = models.DateField(null=True, blank=True)  # Nuevo campo
    fecha_vencimiento = models.DateField()
    categoria = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True)
    factura = models.FileField(upload_to='facturas/', blank=True, null=True)
    creador = models.ForeignKey(User, on_delete=models.CASCADE)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    nombre = models.CharField(max_length=100, blank=True)  # Nuevo campo

    def save(self, *args, **kwargs):
        # Si no se proporciona un nombre, lo genera automáticamente
        if not self.nombre:
            # Usar fecha de vencimiento si existe, si no, fecha de emisión, si no, hoy
            fecha = self.fecha_vencimiento or self.fecha_emision or datetime.today().date()
            mes = fecha.strftime('%B').capitalize()  # Ej: 'Abril'
            año = fecha.year
            self.nombre = f"{self.categoria} / {mes} {año}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre or f"Cuenta {self.pk}"

class Pago(models.Model):
    cuenta = models.ForeignKey(Cuenta, on_delete=models.CASCADE, related_name='pagos')
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_pago = models.DateField()
    comprobante = models.FileField(upload_to='comprobantes/', blank=True, null=True)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        nombre_cuenta = self.cuenta.nombre if self.cuenta and self.cuenta.nombre else f"Cuenta {self.cuenta_id}"
        fecha = self.fecha_pago.strftime('%d/%m/%Y') if self.fecha_pago else ''
        return f"{nombre_cuenta} - {fecha}"

class Proveedor(models.Model):
    nombre = models.CharField(max_length=100)
    categoria = models.CharField(max_length=50)

    class Meta:
        unique_together = ('nombre', 'categoria')

    def __str__(self):
        return f"{self.nombre} ({self.categoria})"
