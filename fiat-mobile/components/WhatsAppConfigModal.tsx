import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { apiService, WhatsAppStatus } from '../src/lib/api';
import { useSettingsStore } from '../src/store/useSettingsStore';

interface WhatsAppConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WhatsAppConfigModal = ({ visible, onClose }: WhatsAppConfigModalProps) => {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { targetRecipient, setTargetRecipient } = useSettingsStore();

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await apiService.getWhatsAppStatus();
      setStatus(data);
    } catch (e) {
      console.error('Error loading WhatsApp status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadStatus();
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>⚙️ WhatsApp</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#25D366" />
              <Text style={styles.loadingText}>Consultando estado...</Text>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Connection Status */}
              <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: status?.connected ? '#25D366' : '#ef4444' }
                  ]} />
                  <Text style={styles.statusText}>
                    {status?.connected ? 'Conectado' : 'Desconectado'}
                  </Text>
                </View>
                {status?.last_error && (
                  <Text style={styles.errorText}>⚠️ {status.last_error}</Text>
                )}
                {!status?.connected && status?.qr ? (
                  <View style={styles.qrContainer}>
                    <Text style={styles.qrInstructions}>
                      Escanea este código QR con la aplicación de WhatsApp en tu teléfono para vincular el dispositivo.
                    </Text>
                    <View style={styles.qrCodeWrapper}>
                      <QRCode value={status.qr} size={200} />
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Groups */}
              {status?.connected && status?.groups && status.groups.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📋 Grupos disponibles (Toca para seleccionar)</Text>
                  {status.groups.map((group, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={[
                        styles.groupItem, 
                        targetRecipient === group && { borderColor: '#25D366', borderWidth: 1 }
                      ]}
                      onPress={() => setTargetRecipient(group)}
                    >
                      <Text style={styles.groupIcon}>👥</Text>
                      <Text style={styles.groupName}>{group}</Text>
                      {targetRecipient === group && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Activo</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Custom Number */}
              {status?.connected && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>👤 O escribe un número / JID</Text>
                  <TextInput
                    style={styles.customInput}
                    value={targetRecipient}
                    onChangeText={setTargetRecipient}
                    placeholder="Ej. 584141234567@s.whatsapp.net"
                  />
                </View>
              )}

              {/* Info */}
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>ℹ️ Información</Text>
                <Text style={styles.infoText}>
                  Los mensajes se enviarán automáticamente al grupo o contacto configurado.
                </Text>
                <Text style={styles.infoText}>
                  Destino actual: <Text style={{ fontWeight: 'bold', color: '#25D366' }}>{targetRecipient}</Text>
                </Text>
              </View>

              {/* Refresh button */}
              <TouchableOpacity style={styles.refreshButton} onPress={loadStatus}>
                <Text style={styles.refreshText}>🔄 Actualizar estado</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
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
    maxHeight: '80%',
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  content: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#ef4444',
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  qrInstructions: {
    marginBottom: 16,
    fontSize: 13,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 18,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    gap: 10,
  },
  groupIcon: {
    fontSize: 16,
  },
  groupName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  activeBadge: {
    backgroundColor: '#25D366',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 4,
    lineHeight: 18,
  },
  refreshButton: {
    backgroundColor: '#f3f4f6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
});
