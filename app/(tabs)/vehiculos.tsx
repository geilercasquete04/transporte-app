import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../contexts/ThemeContext';
import { Vehiculo, vehiculosApi } from '../../services/vehiculosAPI';

export default function VehiculosScreen() {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Nuevo estado

  const perfil_id = '09a3de3c-d389-4049-a670-1081dc02dfed';

  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    capacidad: '',
    tipo_combustible: '',
  });

  const cargarVehiculos = async () => {
    try {
      const perfil_id = '09a3de3c-d389-4049-a670-1081dc02dfed';
      const data = await vehiculosApi.getVehiculos(perfil_id);
      setVehiculos(data);
    } catch (error) {
      console.error('❌ Error al cargar vehículos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarVehiculos();
    setRefreshing(false);
  };

  const handleDelete = (id: string, placa: string) => {
  Alert.alert(
    'Confirmar eliminación',
    `¿Estás seguro de eliminar el vehículo ${placa}?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await vehiculosApi.delete(id, perfil_id); // ✅ Agregado perfil_id
            Alert.alert('Éxito', 'Vehículo eliminado correctamente');
            cargarVehiculos();
            setSelectedVehiculo(null);
          } catch (error: any) {
            const mensaje = error.response?.data?.error || 
                           error.response?.data?.message || 
                           'Error al eliminar el vehículo';
            Alert.alert('Error', mensaje);
          }
        },
      },
    ]
  );
};

  const handleCreateVehiculo = async () => {
    if (!formData.placa.trim()) {
      Alert.alert('Error', 'La placa es obligatoria');
      return;
    }

    try {
      setIsCreating(true);
      
      const vehiculoData: any = {
        placa: formData.placa.trim().toUpperCase(),
        perfil_id: perfil_id,
      };

      if (formData.marca.trim()) vehiculoData.marca = formData.marca.trim();
      if (formData.modelo.trim()) vehiculoData.modelo = formData.modelo.trim();
      if (formData.capacidad.trim()) {
        vehiculoData.capacidad = parseFloat(formData.capacidad);
      }
      if (formData.tipo_combustible.trim()) {
        vehiculoData.tipo_combustible = formData.tipo_combustible.trim();
      }

      await vehiculosApi.create(vehiculoData);
      
      Alert.alert('Éxito', 'Vehículo creado correctamente');
      setShowModal(false);
      resetForm();
      cargarVehiculos();
    } catch (error: any) {
      const mensaje = error.response?.data?.message || 
                      error.response?.data?.error ||
                      'Error al crear el vehículo';
      Alert.alert('Error', mensaje);
    } finally {
      setIsCreating(false);
    }
  };

  // Nueva función para actualizar vehículo
  // Nueva función para actualizar vehículo
const handleUpdateVehiculo = async () => {
  if (!selectedVehiculo || !formData.placa.trim()) {
    Alert.alert('Error', 'La placa es obligatoria');
    return;
  }

  try {
    setIsCreating(true);
    
    const vehiculoData: any = {
      placa: formData.placa.trim().toUpperCase(),
      perfil_id: perfil_id, // ✅ Agregado
    };

    if (formData.marca.trim()) vehiculoData.marca = formData.marca.trim();
    if (formData.modelo.trim()) vehiculoData.modelo = formData.modelo.trim();
    if (formData.capacidad.trim()) {
      vehiculoData.capacidad = parseFloat(formData.capacidad);
    }
    if (formData.tipo_combustible.trim()) {
      vehiculoData.tipo_combustible = formData.tipo_combustible.trim();
    }

    await vehiculosApi.update(selectedVehiculo.id, vehiculoData);
    
    Alert.alert('Éxito', 'Vehículo actualizado correctamente');
    setShowModal(false);
    setIsEditing(false);
    resetForm();
    setSelectedVehiculo(null);
    cargarVehiculos();
  } catch (error: any) {
    const mensaje = error.response?.data?.message || 
                    error.response?.data?.error ||
                    'Error al actualizar el vehículo';
    Alert.alert('Error', mensaje);
  } finally {
    setIsCreating(false);
  }
};

  // Nueva función para abrir modo edición
  const handleEditVehiculo = (vehiculo: Vehiculo) => {
    setFormData({
      placa: vehiculo.placa,
      marca: vehiculo.marca || '',
      modelo: vehiculo.modelo?.toString() || '',
      capacidad: vehiculo.capacidad?.toString() || '',
      tipo_combustible: vehiculo.tipo_combustible || '',
    });
    setSelectedVehiculo(vehiculo);
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      placa: '',
      marca: '',
      modelo: '',
      capacidad: '',
      tipo_combustible: '',
    });
  };

  const renderVehiculo = ({ item }: { item: Vehiculo }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card },
        selectedVehiculo?.id === item.id && { borderWidth: 2, borderColor: colors.primary }
      ]}
      onPress={() => setSelectedVehiculo(item)}
      onLongPress={() => handleDelete(item.id, item.placa)}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.placa, { color: colors.primary }]}>🚛 {item.placa}</Text>
        <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>Ver</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        {item.marca && <Text style={[styles.label, { color: colors.text }]}>Marca: {item.marca}</Text>}
        {item.modelo && <Text style={[styles.label, { color: colors.text }]}>Modelo: {item.modelo}</Text>}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondary }]}>Cargando vehículos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <FlatList
        data={vehiculos}
        renderItem={renderVehiculo}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={[styles.emptyText, { color: colors.secondary }]}>No hay vehículos registrados</Text>
            <Text style={[styles.emptySubtext, { color: colors.secondary }]}>Toca el botón + para agregar uno</Text>
          </View>
        }
      />

      {/* Botón flotante para agregar */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          resetForm();
          setIsEditing(false);
          setSelectedVehiculo(null);
          setShowModal(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Panel de detalles */}
      {selectedVehiculo && !showModal && (
        <View style={[styles.detailPanel, { backgroundColor: colors.card }]}>
          <View style={[styles.detailHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.detailTitle, { color: colors.text }]}>Detalles del Vehículo</Text>
            <TouchableOpacity onPress={() => setSelectedVehiculo(null)}>
              <Text style={[styles.closeButton, { color: colors.secondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.detailContent}>
            <Text style={[styles.detailPlaca, { color: colors.primary }]}>🚛 {selectedVehiculo.placa}</Text>
            
            <View style={styles.detailSection}>
              {selectedVehiculo.marca && (
                <DetailItem label="Marca" value={selectedVehiculo.marca} colors={colors} />
              )}
              {selectedVehiculo.modelo && (
                <DetailItem label="Modelo" value={selectedVehiculo.modelo.toString()} colors={colors} />
              )}
              {selectedVehiculo.capacidad && (
                <DetailItem label="Capacidad" value={`${selectedVehiculo.capacidad} ton`} colors={colors} />
              )}
              {selectedVehiculo.tipo_combustible && (
                <DetailItem label="Combustible" value={selectedVehiculo.tipo_combustible} colors={colors} />
              )}
            </View>

            {/* Botón de Editar */}
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={() => handleEditVehiculo(selectedVehiculo)}
            >
              <Text style={styles.editButtonText}>✏️ Editar Vehículo</Text>
            </TouchableOpacity>

            {/* Botón de Eliminar */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(selectedVehiculo.id, selectedVehiculo.placa)}
            >
              <Text style={styles.deleteButtonText}>🗑️ Eliminar Vehículo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Modal para crear/editar vehículo */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowModal(false);
          setIsEditing(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isEditing ? 'Editar Vehículo' : 'Nuevo Vehículo'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowModal(false);
                setIsEditing(false);
                resetForm();
              }}>
                <Text style={[styles.closeButton, { color: colors.secondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Placa *</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background, 
                    borderColor: colors.border,
                    color: colors.text 
                  }]}
                  value={formData.placa}
                  onChangeText={(text) => setFormData({ ...formData, placa: text })}
                  placeholder="Ej: ABC-123"
                  placeholderTextColor={colors.secondary}
                  autoCapitalize="characters"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Marca</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background, 
                    borderColor: colors.border,
                    color: colors.text 
                  }]}
                  value={formData.marca}
                  onChangeText={(text) => setFormData({ ...formData, marca: text })}
                  placeholder="Ej: Chevrolet"
                  placeholderTextColor={colors.secondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Modelo/Año</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background, 
                    borderColor: colors.border,
                    color: colors.text 
                  }]}
                  value={formData.modelo}
                  onChangeText={(text) => setFormData({ ...formData, modelo: text })}
                  placeholder="Ej: 2022"
                  placeholderTextColor={colors.secondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Capacidad (ton)</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background, 
                    borderColor: colors.border,
                    color: colors.text 
                  }]}
                  value={formData.capacidad}
                  onChangeText={(text) => setFormData({ ...formData, capacidad: text })}
                  placeholder="Ej: 5.5"
                  placeholderTextColor={colors.secondary}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Tipo de Combustible</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background, 
                    borderColor: colors.border,
                    color: colors.text 
                  }]}
                  value={formData.tipo_combustible}
                  onChangeText={(text) => setFormData({ ...formData, tipo_combustible: text })}
                  placeholder="Ej: Diésel"
                  placeholderTextColor={colors.secondary}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton, 
                  { backgroundColor: colors.primary },
                  isCreating && styles.submitButtonDisabled
                ]}
                onPress={isEditing ? handleUpdateVehiculo : handleCreateVehiculo}
                disabled={isCreating}
              >
                <Text style={styles.submitButtonText}>
                  {isCreating ? 'Guardando...' : (isEditing ? '✓ Actualizar Vehículo' : '✓ Crear Vehículo')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

interface DetailItemProps {
  label: string;
  value: string;
  colors: any;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, colors }) => (
  <View style={[styles.detailItem, { borderBottomColor: colors.border }]}>
    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}:</Text>
    <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  placa: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 8,
  },
  marca: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  detailPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: '60%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
  },
  detailContent: {
    padding: 20,
  },
  detailPlaca: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailSection: {
    gap: 12,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  editButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});