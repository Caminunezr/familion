from django.db import models

class Cuenta(models.Model):
    nombre = models.CharField(max_length=100)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_emision = models.DateField(null=True, blank=True)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    categoria = models.CharField(max_length=50)
    descripcion = models.TextField(null=True, blank=True)
    factura = models.FileField(upload_to='facturas/', null=True, blank=True)
    creador = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    fecha_creacion = models.DateTimeField(auto_now_add=True)