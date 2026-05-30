import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Platform,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService, Transaction } from '../src/lib/api';
import { CITIES, BANKS } from '../src/lib/mock-data';

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}

export const EditTransactionModal = ({
  visible,
  transaction,
  onClose,
  onSaved,
}: EditTransactionModalProps) => {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [banco, setBanco] = useState('');
  const [referencia, setReferencia] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());

  // Reset form when transaction changes
  React.useEffect(() => {
    if (transaction) {
      setDescripcion(transaction.descripcion || '');
      setMonto(String(transaction.monto || ''));
      setCiudad(transaction.ciudad || '');
      setBanco(transaction.banco_usado || '');
      setReferencia(transaction.referencia || '');
      setFechaPago(transaction.fecha_pago || '');
      setImage(null);

      // Parse dd/mm/yyyy to Date for the picker
      if (transaction.fecha_pago) {
        const parts = transaction.fecha_pago.split('/');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          if (!isNaN(d.getTime())) {
            setDateValue(d);
          }
        }
      }
    }
  }, [transaction]);

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const onDateChange = (selectedDate: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateValue(selectedDate);
      setFechaPago(formatDate(selectedDate));
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!transaction) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('id', String(transaction.id));
      formData.append('fecha_pago', fechaPago);
      formData.append('descripcion', descripcion);
      formData.append('monto', monto);
      formData.append('ciudad', ciudad);
      formData.append('banco_usado', banco);
      formData.append('referencia', referencia);

      if (image) {
        const filename = image.split('/').pop() || 'comprobante.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';
        formData.append('image', { uri: image, name: filename, type } as any);
      } else if (transaction.imagen_path) {
        formData.append('imagen_path', transaction.imagen_path);
      }

      await apiService.updateTransaction(formData);
      Alert.alert('Éxito', 'Transacción actualizada');
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar la transacción');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>✏️ Editar Transacción</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Fecha */}
            <Text style={styles.label}>Fecha</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>📅 {fechaPago || 'Seleccionar fecha'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateValue}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                onValueChange={onDateChange}
                onDismiss={() => setShowDatePicker(false)}
              />
            )}

            {/* Descripción */}
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={styles.input}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Descripción"
            />

            {/* Monto */}
            <Text style={styles.label}>Monto</Text>
            <TextInput
              style={styles.input}
              value={monto}
              onChangeText={setMonto}
              placeholder="0.00"
              keyboardType="numeric"
            />

            {/* Ciudad */}
            <Text style={styles.label}>Ciudad</Text>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                onValueChange={setCiudad}
                value={ciudad}
                items={CITIES.map(c => ({ label: c, value: c }))}
              />
            </View>

            {/* Banco */}
            <Text style={styles.label}>Banco</Text>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                onValueChange={setBanco}
                value={banco}
                items={BANKS.map(b => ({ label: b, value: b }))}
              />
            </View>

            {/* Referencia */}
            <Text style={styles.label}>Referencia</Text>
            <TextInput
              style={styles.input}
              value={referencia}
              onChangeText={setReferencia}
              placeholder="Referencia"
            />

            {/* Imagen */}
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={styles.buttonText}>
                {image ? '🔄 Cambiar Imagen' : '📷 Seleccionar Comprobante'}
              </Text>
            </TouchableOpacity>

            {image && (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            )}

            {!image && transaction?.imagen_path ? (
              <View style={styles.existingImageInfo}>
                <Text style={styles.existingImageText}>📎 Imagen actual conservada</Text>
              </View>
            ) : null}

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'Guardando...' : '💾 Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#f9fafb',
  },
  dateText: {
    fontSize: 15,
    color: '#1f2937',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    marginBottom: 14,
    backgroundColor: '#f9fafb',
  },
  imageButton: {
    backgroundColor: '#6366f1',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 14,
  },
  existingImageInfo: {
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    alignItems: 'center',
  },
  existingImageText: {
    color: '#16a34a',
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
