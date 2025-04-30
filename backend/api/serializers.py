from rest_framework import serializers
from django.contrib.auth.models import User  # Import User model
from .models import Cuenta, Pago, Profile, Proveedor

class PagoSerializer(serializers.ModelSerializer):
    # Campo para mostrar el nombre de usuario de quien pagó
    pagado_por_username = serializers.ReadOnlyField(source='pagado_por.username')
    # Marcar el campo 'usuario' como read_only=True
    usuario = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Pago
        fields = '__all__'  # Incluye el nuevo campo y los existentes

class CuentaSerializer(serializers.ModelSerializer):
    pagos = PagoSerializer(many=True, read_only=True)
    # Usar PrimaryKeyRelatedField para la escritura (recibe ID)
    proveedor = serializers.PrimaryKeyRelatedField(queryset=Proveedor.objects.all())
    # Campo para mostrar el nombre del proveedor en la lectura
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    # Campo para mostrar el nombre del creador en la lectura
    creador_username = serializers.ReadOnlyField(source='creador.username')
    # Asegurarse que el creador se pueda escribir (recibe ID)
    creador = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Cuenta
        fields = '__all__'  # Incluye los nuevos campos y los existentes

class ProfileSerializer(serializers.ModelSerializer):
    # Incluir user_id para el frontend
    user_id = serializers.ReadOnlyField(source='user.id')
    username = serializers.ReadOnlyField(source='user.username')  # Añadir username también

    class Meta:
        model = Profile
        # Ajustar fields para incluir los nuevos campos
        fields = ['user_id', 'username', 'group_id']
        read_only_fields = ['user_id', 'username']  # Marcar como solo lectura

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = ['id', 'nombre', 'categoria']