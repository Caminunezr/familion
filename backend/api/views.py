from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
import os
from django.conf import settings
from .models import Cuenta, Pago, Profile, Proveedor
from .serializers import CuentaSerializer, PagoSerializer, ProfileSerializer, ProveedorSerializer
from collections import defaultdict
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django_filters.rest_framework import DjangoFilterBackend

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
        # Asigna automáticamente el usuario autenticado
        cuenta = serializer.validated_data.get('cuenta')
        monto_pagado = serializer.validated_data.get('monto_pagado')
        if cuenta and monto_pagado:
            if monto_pagado > cuenta.monto:
                raise serializers.ValidationError({
                    'monto_pagado': 'El monto pagado no puede ser mayor al monto de la cuenta.'
                })
        serializer.save(usuario=self.request.user)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = Profile.objects.get(user=request.user)
            serializer = ProfileSerializer(profile)
            return Response(serializer.data)
        except Profile.DoesNotExist:
            return Response({'detail': 'Perfil no encontrado.'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    profile = getattr(user, 'profile', None)
    return Response({
        "user": user.username,
        "user_id": user.id,
        "group_id": getattr(profile, 'group_id', None) if profile else None,
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
