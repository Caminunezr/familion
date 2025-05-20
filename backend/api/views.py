from django.shortcuts import render
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
import os
from django.conf import settings
from .models import Cuenta, Pago, Profile, Proveedor, PresupuestoMensual, Aporte, GastoPresupuesto, DeudaPresupuesto, AhorroPresupuesto, MovimientoPresupuesto, PagoDeudaPresupuesto
from .serializers import (
    CuentaSerializer, PagoSerializer, ProfileSerializer, ProveedorSerializer,
    PresupuestoMensualSerializer, AporteSerializer, GastoPresupuestoSerializer, DeudaPresupuestoSerializer, AhorroPresupuestoSerializer, MovimientoPresupuestoSerializer, PagoDeudaPresupuestoSerializer
)
from collections import defaultdict
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.contrib.auth.models import User
import csv
from django.http import HttpResponse
from datetime import datetime

class CuentaViewSet(viewsets.ModelViewSet):
    queryset = Cuenta.objects.all()
    serializer_class = CuentaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        eliminar_factura = (
            request.data.get('eliminar_factura') == 'true' or
            request.data.get('eliminar_factura') is True
        )
        # Si hay que eliminar la factura
        if eliminar_factura and instance.factura:
            factura_path = instance.factura.path
            instance.factura.delete(save=False)
            if os.path.exists(factura_path):
                os.remove(factura_path)
        # Si se sube un nuevo archivo, reemplaza el anterior
        if 'factura' in request.FILES:
            if instance.factura:
                old_path = instance.factura.path
                instance.factura.delete(save=False)
                if os.path.exists(old_path):
                    os.remove(old_path)
            instance.factura = request.FILES['factura']
        # Actualiza el resto de los campos normalmente
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pago.objects.all()
    serializer_class = PagoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['cuenta']

    def perform_create(self, serializer):
        cuenta = serializer.validated_data.get('cuenta')
        monto_pagado = serializer.validated_data.get('monto_pagado')
        aporte = serializer.validated_data.get('aporte', None)
        if cuenta and monto_pagado:
            if monto_pagado > cuenta.monto:
                raise serializers.ValidationError({
                    'monto_pagado': 'El monto pagado no puede ser mayor al monto de la cuenta.'
                })
        pago = serializer.save(usuario=self.request.user, aporte=aporte)

        # --- Lógica para descontar del presupuesto mensual ---
        from .models import PresupuestoMensual, GastoPresupuesto
        presupuesto = None
        if cuenta and cuenta.fecha_vencimiento:
            presupuesto = PresupuestoMensual.objects.filter(
                fecha_mes__year=cuenta.fecha_vencimiento.year,
                fecha_mes__month=cuenta.fecha_vencimiento.month
            ).first()
        if presupuesto:
            GastoPresupuesto.objects.create(
                presupuesto=presupuesto,
                cuenta=cuenta,
                monto=monto_pagado,
                pagado_por=self.request.user,
                comentario=f'Pago automático al registrar pago de cuenta #{cuenta.id}'
            )

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = Profile.objects.get(user=request.user)
            serializer = ProfileSerializer(profile)
            return Response(serializer.data)
        except Profile.DoesNotExist:
            return Response({'detail': 'Perfil no encontrado.'}, status=404)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    profile = getattr(user, 'profile', None)
    if request.method == 'GET':
        return Response({
            "user": user.username,
            "user_id": user.id,
            "group_id": getattr(profile, 'group_id', None) if profile else None,
            "color": getattr(profile, 'color', None) if profile else None,
        })
    elif request.method == 'PATCH':
        if not profile:
            return Response({'detail': 'Perfil no encontrado.'}, status=404)
        color = request.data.get('color')
        if color:
            profile.color = color
            profile.save()
        return Response({
            "user": user.username,
            "user_id": user.id,
            "group_id": getattr(profile, 'group_id', None),
            "color": profile.color,
        })

class ProveedoresPorCategoriaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categoria = request.query_params.get('categoria')
        if categoria:
            proveedores = Proveedor.objects.filter(categoria=categoria)
        else:
            proveedores = Proveedor.objects.all()
        data = ProveedorSerializer(proveedores, many=True).data
        return Response(data)

class TransferirSobranteView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, presupuesto_id):
        try:
            presupuesto = PresupuestoMensual.objects.get(id=presupuesto_id)
        except PresupuestoMensual.DoesNotExist:
            return Response({'detail': 'Presupuesto no encontrado.'}, status=404)

        # Calcular sobrante: aportes - gastos - deudas pagadas - ahorros
        total_aportes = sum(a.monto for a in presupuesto.aportes.all())
        total_gastos = sum(g.monto for g in presupuesto.gastos.all())
        total_ahorros = sum(a.monto for a in presupuesto.ahorros.all())
        total_deudas_pagadas = sum(d.monto for d in presupuesto.deudas.filter(pagado=True))
        total_deudas_no_pagadas = sum(d.monto for d in presupuesto.deudas.filter(pagado=False))
        sobrante = total_aportes - total_gastos - total_ahorros - total_deudas_pagadas
        if sobrante <= 0:
            return Response({'detail': 'No hay sobrante para transferir.'}, status=400)

        # Prioridad: pagar deudas no pagadas, luego ahorro
        deudas = presupuesto.deudas.filter(pagado=False).order_by('fecha')
        monto_para_deuda = min(sobrante, total_deudas_no_pagadas)
        monto_para_ahorro = sobrante - monto_para_deuda
        movimientos = []
        # Pagar deudas
        for deuda in deudas:
            if monto_para_deuda <= 0:
                break
            pago = min(deuda.monto, monto_para_deuda)
            deuda.pagado = True
            deuda.fecha_pago = transaction.now()
            deuda.save()
            MovimientoPresupuesto.objects.create(
                presupuesto=presupuesto,
                tipo='deuda',
                monto=pago,
                usuario=request.user,
                descripcion=f'Pago automático de deuda al transferir sobrante',
                referencia_id=deuda.id
            )
            monto_para_deuda -= pago
            movimientos.append({'deuda_id': deuda.id, 'pagado': pago})
        # Transferir a ahorro si queda
        ahorro_obj = None
        if monto_para_ahorro > 0:
            ahorro_obj = AhorroPresupuesto.objects.create(
                presupuesto=presupuesto,
                monto=monto_para_ahorro,
                motivo='Ahorro automático por sobrante',
                comentario='Transferencia automática de sobrante a ahorro'
            )
            MovimientoPresupuesto.objects.create(
                presupuesto=presupuesto,
                tipo='ahorro',
                monto=monto_para_ahorro,
                usuario=request.user,
                descripcion='Transferencia automática de sobrante a ahorro',
                referencia_id=ahorro_obj.id
            )
        return Response({
            'sobranteTotal': sobrante,
            'pagadoEnDeudas': sobrante - monto_para_ahorro,
            'ahorrado': monto_para_ahorro,
            'movimientos': movimientos,
            'ahorroId': ahorro_obj.id if ahorro_obj else None
        })

class CerrarMesView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, presupuesto_id):
        try:
            presupuesto = PresupuestoMensual.objects.get(id=presupuesto_id)
        except PresupuestoMensual.DoesNotExist:
            return Response({'detail': 'Presupuesto no encontrado.'}, status=404)
        # Ejecutar transferencia de sobrante
        transfer_view = TransferirSobranteView()
        transfer_response = transfer_view.post(request, presupuesto_id)
        return Response({
            'mensaje': 'Mes cerrado. Sobrante transferido.',
            'transferencia': transfer_response.data
        })

class PresupuestoMensualViewSet(viewsets.ModelViewSet):
    queryset = PresupuestoMensual.objects.all()
    serializer_class = PresupuestoMensualSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['familia', 'fecha_mes']

    def perform_create(self, serializer):
        # Asigna automáticamente el valor fijo para familia
        serializer.save(familia='familia_camnr', creado_por=self.request.user)

class AporteViewSet(viewsets.ModelViewSet):
    queryset = Aporte.objects.all()
    serializer_class = AporteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['presupuesto', 'usuario']

    def perform_create(self, serializer):
        aporte = serializer.save()
        MovimientoPresupuesto.objects.create(
            presupuesto=aporte.presupuesto,
            tipo='aporte',
            monto=aporte.monto,
            usuario=aporte.usuario,
            descripcion=f'Aporte de {aporte.nombre_aportador or aporte.usuario}',
            referencia_id=aporte.id
        )

class GastoPresupuestoViewSet(viewsets.ModelViewSet):
    queryset = GastoPresupuesto.objects.all()
    serializer_class = GastoPresupuestoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['presupuesto', 'cuenta', 'pagado_por']

    def perform_create(self, serializer):
        gasto = serializer.save()
        MovimientoPresupuesto.objects.create(
            presupuesto=gasto.presupuesto,
            tipo='gasto',
            monto=gasto.monto,
            usuario=gasto.pagado_por,
            descripcion=f'Gasto en {gasto.cuenta}',
            referencia_id=gasto.id
        )

class DeudaPresupuestoViewSet(viewsets.ModelViewSet):
    queryset = DeudaPresupuesto.objects.all()
    serializer_class = DeudaPresupuestoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['presupuesto', 'pagado']

    def perform_create(self, serializer):
        deuda = serializer.save()
        MovimientoPresupuesto.objects.create(
            presupuesto=deuda.presupuesto,
            tipo='deuda',
            monto=deuda.monto,
            usuario=self.request.user,
            descripcion=f'Deuda: {deuda.motivo}',
            referencia_id=deuda.id
        )

class AhorroPresupuestoViewSet(viewsets.ModelViewSet):
    queryset = AhorroPresupuesto.objects.all()
    serializer_class = AhorroPresupuestoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['presupuesto']

    def perform_create(self, serializer):
        ahorro = serializer.save()
        MovimientoPresupuesto.objects.create(
            presupuesto=ahorro.presupuesto,
            tipo='ahorro',
            monto=ahorro.monto,
            usuario=self.request.user,
            descripcion=f'Ahorro: {ahorro.motivo}',
            referencia_id=ahorro.id
        )

class MovimientoPresupuestoViewSet(viewsets.ModelViewSet):
    queryset = MovimientoPresupuesto.objects.all()
    serializer_class = MovimientoPresupuestoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['presupuesto', 'tipo', 'usuario']

class UsuariosListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perfiles = Profile.objects.select_related('user').all()
        data = [
            {
                'id': p.user.id,
                'username': p.user.username,
                'color': p.color
            }
            for p in perfiles
        ]
        return Response(data)

class ExportarCuentasCSVView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Obtener parámetros de filtrado
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        categoria = request.query_params.get('categoria')
        estado = request.query_params.get('estado')
        
        # Filtrar cuentas según parámetros
        cuentas = Cuenta.objects.all().select_related('proveedor', 'creador')
        
        if fecha_desde:
            cuentas = cuentas.filter(fecha_vencimiento__gte=fecha_desde)
        if fecha_hasta:
            cuentas = cuentas.filter(fecha_vencimiento__lte=fecha_hasta)
        if categoria:
            cuentas = cuentas.filter(categoria=categoria)
        if estado:
            if estado == 'pagada':
                cuentas = cuentas.filter(pagos__isnull=False).distinct()
            elif estado == 'pendiente':
                # Subconsulta para obtener cuentas sin pagos o con pagos parciales
                from django.db.models import Sum, F, Q
                cuentas_con_pagos_completos = Cuenta.objects.annotate(
                    total_pagado=Sum('pagos__monto_pagado')
                ).filter(total_pagado__gte=F('monto'))
                cuentas = cuentas.exclude(id__in=cuentas_con_pagos_completos)
        
        # Crear respuesta HTTP con contenido CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="historial-cuentas-{datetime.now().strftime("%Y%m%d")}.csv"'
        
        # Configurar escritor CSV
        writer = csv.writer(response)
        
        # Escribir encabezados
        writer.writerow([
            'ID', 'Nombre', 'Monto', 'Proveedor', 'Categoría', 
            'Fecha Emisión', 'Fecha Vencimiento', 'Descripción',
            'Creador', 'Fecha Creación', 'Estado', 'Monto Pagado', 
            'Fecha Último Pago'
        ])
        
        # Iterar sobre las cuentas y escribir filas
        for cuenta in cuentas:
            # Calcular estado y monto pagado
            pagos = Pago.objects.filter(cuenta=cuenta)
            monto_pagado = sum(pago.monto_pagado for pago in pagos)
            ultimo_pago = pagos.order_by('-fecha_pago').first()
            
            if monto_pagado >= cuenta.monto:
                estado_cuenta = 'Pagada'
            elif monto_pagado > 0:
                estado_cuenta = 'Pago Parcial'
            else:
                estado_cuenta = 'Pendiente'
                
            # Escribir datos de la cuenta
            writer.writerow([
                cuenta.id,
                cuenta.nombre,
                cuenta.monto,
                cuenta.proveedor.nombre if cuenta.proveedor else '',
                cuenta.categoria,
                cuenta.fecha_emision.strftime('%Y-%m-%d') if cuenta.fecha_emision else '',
                cuenta.fecha_vencimiento.strftime('%Y-%m-%d'),
                cuenta.descripcion.replace('\n', ' '),
                cuenta.creador.username,
                cuenta.fecha_creacion.strftime('%Y-%m-%d %H:%M'),
                estado_cuenta,
                monto_pagado,
                ultimo_pago.fecha_pago.strftime('%Y-%m-%d') if ultimo_pago else ''
            ])
        
        return response

class PagoDeudaPresupuestoViewSet(viewsets.ModelViewSet):
    queryset = PagoDeudaPresupuesto.objects.all()
    serializer_class = PagoDeudaPresupuestoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['deuda']

    def perform_create(self, serializer):
        pago = serializer.save()
        deuda = pago.deuda
        deuda.cuotas_pagadas = deuda.pagos.count()
        if deuda.cuotas_totales == 1:
            # Deuda de pago manual: sumar todos los pagos
            total_pagado = sum(p.monto_pagado for p in deuda.pagos.all())
            if total_pagado >= deuda.monto:
                deuda.pagado = True
                deuda.fecha_pago = pago.fecha_pago
        else:
            # Deuda en cuotas: lógica original
            if deuda.cuotas_pagadas >= deuda.cuotas_totales:
                deuda.pagado = True
                deuda.fecha_pago = pago.fecha_pago
        deuda.save()
