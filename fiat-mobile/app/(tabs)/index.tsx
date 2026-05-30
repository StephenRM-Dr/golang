import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { apiService, Summary } from '../../src/lib/api';
import { Card } from '../../components/ui/Card';
import { WhatsAppConfigModal } from '../../components/WhatsAppConfigModal';

export default function DashboardScreen() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const data = await apiService.getSummary();
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        {/* Toggle visibility */}
        <TouchableOpacity onPress={() => setHidden(!hidden)} style={styles.toggleButton}>
          <Text style={styles.toggleText}>
            {hidden ? '👁️ Mostrar montos' : '🙈 Ocultar montos'}
          </Text>
        </TouchableOpacity>

        {/* Summary Cards */}
        <Card title="Total General">
          <Text style={styles.amount}>
            {hidden ? '● ● ● ● ●' : `$${summary?.total_general?.toLocaleString() ?? '0'}`}
          </Text>
        </Card>

        <Card title="Gastos Este Mes">
          <Text style={styles.amount}>
            {hidden ? '● ● ● ● ●' : `$${summary?.total_mes?.toLocaleString() ?? '0'}`}
          </Text>
        </Card>

        <Card title="Total Transacciones">
          <Text style={styles.amount}>
            {hidden ? '● ●' : `${summary?.conteo ?? 0}`}
          </Text>
        </Card>

        {/* WhatsApp button */}
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={() => setShowWhatsApp(true)}
        >
          <Text style={styles.whatsappIcon}>💬</Text>
          <View>
            <Text style={styles.whatsappTitle}>WhatsApp</Text>
            <Text style={styles.whatsappSubtitle}>Ver configuración y grupos</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <WhatsAppConfigModal
        visible={showWhatsApp}
        onClose={() => setShowWhatsApp(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  toggleButton: {
    marginBottom: 16,
    alignSelf: 'flex-end',
  },
  toggleText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  amount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  whatsappIcon: {
    fontSize: 28,
  },
  whatsappTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#166534',
  },
  whatsappSubtitle: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 2,
  },
});
