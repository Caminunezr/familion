from rest_framework import serializers
from django.contrib.auth.models import User  # Import User model
from .models import Cuenta, Pago, Profile, Proveedor, PresupuestoMensual, Aporte, GastoPresupuesto, DeudaPresupuesto, AhorroPresupuesto, MovimientoPresupuesto, PagoDeudaPresupuesto

def to_camel_case(s):
    parts = s.split('_')
    return parts[0] + ''.join(word.capitalize() for word in parts[1:])

class CamelCaseModelSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        return {to_camel_case(key): value for key, value in ret.items()}

class PagoSerializer(CamelCaseModelSerializer):
    pagadoPorUsername = serializers.ReadOnlyField(source='usuario.username')
    usuario = serializers.HiddenField(default=serializers.CurrentUserDefault())
    aporte = serializers.PrimaryKeyRelatedField(queryset=Aporte.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Pago
        fields = '__all__'

class CuentaSerializer(CamelCaseModelSerializer):
    pagos = PagoSerializer(many=True, read_only=True)
    proveedorNombre = serializers.ReadOnlyField(source='proveedor.nombre')
    creadorUsername = serializers.ReadOnlyField(source='creador.username')

    class Meta:
        model = Cuenta
        fields = '__all__'

class ProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source='user.id')
    username = serializers.ReadOnlyField(source='user.username')
    color = serializers.CharField(default="#607d8b")

    class Meta:
        model = Profile
        fields = ['user_id', 'username', 'group_id', 'color']
        read_only_fields = ['user_id', 'username']

class ProveedorSerializer(CamelCaseModelSerializer):
    class Meta:
        model = Proveedor
        fields = ['id', 'nombre', 'categoria']

class PresupuestoMensualSerializer(CamelCaseModelSerializer):
    class Meta:
        model = PresupuestoMensual
        fields = '__all__'

class AporteSerializer(CamelCaseModelSerializer):
    usuario_username = serializers.SerializerMethodField()
    class Meta:
        model = Aporte
        fields = '__all__'
    def get_usuario_username(self, obj):
        return obj.usuario.username if obj.usuario else None

class GastoPresupuestoSerializer(CamelCaseModelSerializer):
    pagado_por_username = serializers.SerializerMethodField()
    cuenta_nombre = serializers.SerializerMethodField()
    class Meta:
        model = GastoPresupuesto
        fields = '__all__'
    def get_pagado_por_username(self, obj):
        return obj.pagado_por.username if obj.pagado_por else None
    def get_cuenta_nombre(self, obj):
        return str(obj.cuenta) if obj.cuenta else None

class PagoDeudaPresupuestoSerializer(CamelCaseModelSerializer):
    class Meta:
        model = PagoDeudaPresupuesto
        fields = '__all__'

class DeudaPresupuestoSerializer(CamelCaseModelSerializer):
    cuenta_origen_nombre = serializers.SerializerMethodField()
    pagos = PagoDeudaPresupuestoSerializer(many=True, read_only=True)
    porcentaje_pagado_cuotas = serializers.SerializerMethodField()
    porcentaje_pagado_monto = serializers.SerializerMethodField()
    class Meta:
        model = DeudaPresupuesto
        fields = '__all__'
    def get_cuenta_origen_nombre(self, obj):
        return str(obj.cuenta_origen) if obj.cuenta_origen else None
    def get_porcentaje_pagado_cuotas(self, obj):
        if obj.cuotas_totales:
            return round(100 * obj.cuotas_pagadas / obj.cuotas_totales, 2)
        return 0.0
    def get_porcentaje_pagado_monto(self, obj):
        total_pagado = sum([p.monto_pagado for p in obj.pagos.all()])
        if obj.monto:
            return round(100 * float(total_pagado) / float(obj.monto), 2)
        return 0.0

class AhorroPresupuestoSerializer(CamelCaseModelSerializer):
    cuenta_destino_nombre = serializers.SerializerMethodField()
    class Meta:
        model = AhorroPresupuesto
        fields = '__all__'
    def get_cuenta_destino_nombre(self, obj):
        return str(obj.cuenta_destino) if obj.cuenta_destino else None

class MovimientoPresupuestoSerializer(CamelCaseModelSerializer):
    usuario_username = serializers.SerializerMethodField()
    class Meta:
        model = MovimientoPresupuesto
        fields = '__all__'
    def get_usuario_username(self, obj):
        return obj.usuario.username if obj.usuario else None