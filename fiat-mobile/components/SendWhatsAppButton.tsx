import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { apiService } from '../src/lib/api';
import { useSettingsStore } from '../src/store/useSettingsStore';

interface SendWhatsAppButtonProps {
  transactionId: number;
}

export const SendWhatsAppButton = ({ transactionId }: SendWhatsAppButtonProps) => {
  const { targetRecipient } = useSettingsStore();

  const handleSend = async () => {
    try {
      await apiService.sendWhatsApp(transactionId, targetRecipient);
      alert("Enviando a WhatsApp...");
    } catch (error) {
      console.error(error);
      alert("Error al enviar a WhatsApp");
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleSend}>
      <Text style={styles.text}>Enviar a WhatsApp</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#25D366',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
