import React, { useState } from 'react';
import {
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService } from '../../src/lib/api';
import { CITIES, BANKS } from '../../src/lib/mock-data';

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formSchema = z.object({
  fecha_pago: z.string().min(1, "La fecha es requerida"),
  descripcion: z.string().min(2, "La descripción debe tener al menos 2 caracteres"),
  monto: z.string().min(1, "El monto es requerido"),
  ciudad: z.string().min(1, "La ciudad es requerida"),
  banco_usado: z.string().min(1, "El banco es requerido"),
  referencia: z.string().min(1, "La referencia es requerida"),
});

export default function AddTransactionScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fecha_pago: formatDate(new Date()),
      descripcion: '',
      monto: '',
      ciudad: CITIES[0],
      banco_usado: BANKS[0],
      referencia: '',
    },
  });

  const currentDate = watch('fecha_pago');

  const onDateChange = (selectedDate: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateValue(selectedDate);
      setValue('fecha_pago', formatDate(selectedDate));
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  async function onSubmit(data: any) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));

      if (image) {
        const filename = image.split('/').pop() || 'comprobante.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('image', { uri: image, name: filename, type } as any);
      }

      await apiService.createTransaction(formData);
      Alert.alert("Éxito", "Transacción registrada");
      reset();
      setImage(null);
      setDateValue(new Date());
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo registrar la transacción");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      {/* Fecha with Calendar Picker */}
      <Text style={styles.label}>Fecha</Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateIcon}>📅</Text>
        <Text style={styles.dateText}>{currentDate || 'Seleccionar fecha'}</Text>
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
      <Controller
        control={control}
        name="descripcion"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              onChangeText={onChange}
              value={value}
              placeholder="Ej: Pago servicios"
              placeholderTextColor="#9ca3af"
            />
            {error && <Text style={styles.errorText}>{error.message}</Text>}
          </>
        )}
      />
      
      {/* Monto */}
      <Text style={styles.label}>Monto</Text>
      <Controller
        control={control}
        name="monto"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              onChangeText={onChange}
              value={value}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
            {error && <Text style={styles.errorText}>{error.message}</Text>}
          </>
        )}
      />

      {/* Ciudad */}
      <Text style={styles.label}>Ciudad</Text>
      <Controller
        control={control}
        name="ciudad"
        render={({ field: { onChange, value } }) => (
          <View style={styles.pickerContainer}>
            <RNPickerSelect
              onValueChange={onChange}
              value={value}
              items={CITIES.map(c => ({ label: c, value: c }))}
            />
          </View>
        )}
      />

      {/* Banco */}
      <Text style={styles.label}>Banco</Text>
      <Controller
        control={control}
        name="banco_usado"
        render={({ field: { onChange, value } }) => (
          <View style={styles.pickerContainer}>
            <RNPickerSelect
              onValueChange={onChange}
              value={value}
              items={BANKS.map(b => ({ label: b, value: b }))}
            />
          </View>
        )}
      />

      {/* Referencia */}
      <Text style={styles.label}>Referencia</Text>
      <Controller
        control={control}
        name="referencia"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              onChangeText={onChange}
              value={value}
              placeholder="Número de referencia"
              placeholderTextColor="#9ca3af"
            />
            {error && <Text style={styles.errorText}>{error.message}</Text>}
          </>
        )}
      />

      {/* Image Picker */}
      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <Text style={styles.imageButtonText}>
          {image ? "🔄 Cambiar Imagen" : "📷 Seleccionar Comprobante"}
        </Text>
      </TouchableOpacity>
      
      {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? "⏳ Guardando..." : "💾 Guardar Transacción"}
        </Text>
      </TouchableOpacity>

      {/* Bottom spacing */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  dateIcon: {
    fontSize: 18,
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
    backgroundColor: '#fff',
  },
  imageButton: {
    backgroundColor: '#6366f1',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  imageButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 14,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
