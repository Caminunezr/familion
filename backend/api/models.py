from django.db import models
from django.contrib.auth.models import User
import uuid
from datetime import datetime

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    group_id = models.CharField(max_length=100, default=uuid.uuid4, editable=True)
    color = models.CharField(max_length=20, default="#607d8b")

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
    aporte = models.ForeignKey('Aporte', on_delete=models.SET_NULL, null=True, blank=True, related_name='pagos')  # Nuevo campo

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

class PresupuestoMensual(models.Model):
    familia = models.CharField(max_length=100)  # Puede ser group_id o similar
    fecha_mes = models.DateField()  # Selector de fecha para el mes del presupuesto
    monto_objetivo = models.DecimalField(max_digits=12, decimal_places=2)
    creado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Presupuesto {self.familia} - {self.fecha_mes.strftime('%Y-%m')}"

class Aporte(models.Model):
    presupuesto = models.ForeignKey(PresupuestoMensual, on_delete=models.CASCADE, related_name='aportes')
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    nombre_aportador = models.CharField(max_length=100, blank=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(max_length=30, default='manual')
    comentario = models.TextField(blank=True)
    cuenta_destino = models.ForeignKey('Cuenta', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Aporte {self.monto} por {self.nombre_aportador or self.usuario}"

class GastoPresupuesto(models.Model):
    presupuesto = models.ForeignKey(PresupuestoMensual, on_delete=models.CASCADE, related_name='gastos')
    cuenta = models.ForeignKey('Cuenta', on_delete=models.SET_NULL, null=True, blank=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)
    pagado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    comentario = models.TextField(blank=True)

    def __str__(self):
        return f"Gasto {self.monto} ({self.cuenta})"

class DeudaPresupuesto(models.Model):
    presupuesto = models.ForeignKey(PresupuestoMensual, on_delete=models.CASCADE, related_name='deudas')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    motivo = models.CharField(max_length=200)
    fecha = models.DateTimeField(auto_now_add=True)
    pagado = models.BooleanField(default=False)
    fecha_pago = models.DateTimeField(null=True, blank=True)
    comentario = models.TextField(blank=True)
    cuenta_origen = models.ForeignKey('Cuenta', on_delete=models.SET_NULL, null=True, blank=True)
    # NUEVO: gestión avanzada de deudas
    cuotas_totales = models.PositiveIntegerField(default=1, help_text="Número total de cuotas")
    cuotas_pagadas = models.PositiveIntegerField(default=0, help_text="Cuotas pagadas")
    frecuencia = models.CharField(max_length=20, default='mensual', choices=[('mensual','Mensual'),('quincenal','Quincenal'),('semanal','Semanal')])
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin_estimado = models.DateField(null=True, blank=True)
    documento = models.FileField(upload_to='documentos_deuda/', null=True, blank=True)
    categoria = models.CharField(max_length=100, blank=True)

    def calcular_fecha_fin(self):
        # Calcula la fecha estimada de término según cuotas y frecuencia
        from datetime import timedelta
        if not self.fecha_inicio or not self.cuotas_totales:
            return None
        if self.frecuencia == 'mensual':
            meses = self.cuotas_totales - 1
            return self.fecha_inicio.replace(month=self.fecha_inicio.month + meses)
        elif self.frecuencia == 'quincenal':
            dias = (self.cuotas_totales - 1) * 15
            return self.fecha_inicio + timedelta(days=dias)
        elif self.frecuencia == 'semanal':
            dias = (self.cuotas_totales - 1) * 7
            return self.fecha_inicio + timedelta(days=dias)
        return None

    def __str__(self):
        return f"Deuda {self.monto} - {self.motivo} ({self.cuotas_pagadas}/{self.cuotas_totales} cuotas)"

class PagoDeudaPresupuesto(models.Model):
    deuda = models.ForeignKey(DeudaPresupuesto, on_delete=models.CASCADE, related_name='pagos')
    fecha_pago = models.DateField(auto_now_add=True)
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=2)
    comentario = models.TextField(blank=True)
    comprobante = models.FileField(upload_to='comprobantes_deuda/', null=True, blank=True)

    def __str__(self):
        return f"Pago {self.monto_pagado} de {self.deuda}"

class AhorroPresupuesto(models.Model):
    presupuesto = models.ForeignKey(PresupuestoMensual, on_delete=models.CASCADE, related_name='ahorros')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)
    motivo = models.CharField(max_length=200, blank=True)
    comentario = models.TextField(blank=True)
    cuenta_destino = models.ForeignKey('Cuenta', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Ahorro {self.monto} ({self.presupuesto})"

class MovimientoPresupuesto(models.Model):
    TIPO_CHOICES = [
        ('aporte', 'Aporte'),
        ('gasto', 'Gasto'),
        ('deuda', 'Deuda'),
        ('ahorro', 'Ahorro'),
        ('transferencia_sobrante', 'Transferencia Sobrante'),
        ('ajuste', 'Ajuste'),
    ]
    presupuesto = models.ForeignKey(PresupuestoMensual, on_delete=models.CASCADE, related_name='movimientos')
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    descripcion = models.TextField(blank=True)
    referencia_id = models.PositiveIntegerField(null=True, blank=True)  # ID del objeto relacionado
    cuenta = models.ForeignKey('Cuenta', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Movimiento {self.tipo} - {self.monto}"
