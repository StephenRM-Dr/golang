import React, { useEffect, useState, useMemo } from 'react';
import {
  FlatList,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService, Transaction } from '../../src/lib/api';
import { Card } from '../../components/ui/Card';
import { SendWhatsAppButton } from '../../components/SendWhatsAppButton';
import { EditTransactionModal } from '../../components/EditTransactionModal';
import { CITIES, BANKS } from '../../src/lib/mock-data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FILTER_WIDTH = SCREEN_WIDTH * 0.82;

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Edit modal
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterCiudad, setFilterCiudad] = useState('');
  const [filterBanco, setFilterBanco] = useState('');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');
  const [showDesde, setShowDesde] = useState(false);
  const [showHasta, setShowHasta] = useState(false);
  const [desdeDate, setDesdeDate] = useState(new Date());
  const [hastaDate, setHastaDate] = useState(new Date());
  const slideAnim = useState(new Animated.Value(FILTER_WIDTH))[0];

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDate = (str: string): Date | null => {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const loadData = async () => {
    setRefreshing(true);
    try {
      const data = await apiService.getTransactions();
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Eliminar Transacción",
      "¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.deleteTransaction(id);
              loadData();
            } catch (e) {
              Alert.alert("Error", "No se pudo eliminar");
            }
          }
        }
      ]
    );
  };

  const handleEdit = (item: Transaction) => {
    setEditTransaction(item);
    setShowEditModal(true);
  };

  const openFilters = () => {
    setShowFilters(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeFilters = () => {
    Animated.timing(slideAnim, {
      toValue: FILTER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowFilters(false));
  };

  const clearFilters = () => {
    setFilterText('');
    setFilterCiudad('');
    setFilterBanco('');
    setFilterDesde('');
    setFilterHasta('');
  };

  const hasActiveFilters = filterText || filterCiudad || filterBanco || filterDesde || filterHasta;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Text filter
      if (filterText) {
        const search = filterText.toLowerCase();
        const matches =
          t.descripcion?.toLowerCase().includes(search) ||
          t.referencia?.toLowerCase().includes(search) ||
          String(t.monto).includes(search);
        if (!matches) return false;
      }

      // City filter
      if (filterCiudad && t.ciudad !== filterCiudad) return false;

      // Bank filter
      if (filterBanco && t.banco_usado !== filterBanco) return false;

      // Date range
      if (filterDesde) {
        const desde = parseDate(filterDesde);
        const fechaTx = parseDate(t.fecha_pago);
        if (desde && fechaTx && fechaTx < desde) return false;
      }
      if (filterHasta) {
        const hasta = parseDate(filterHasta);
        const fechaTx = parseDate(t.fecha_pago);
        if (hasta && fechaTx && fechaTx > hasta) return false;
      }

      return true;
    });
  }, [transactions, filterText, filterCiudad, filterBanco, filterDesde, filterHasta]);

  useEffect(() => { loadData(); }, []);

  return (
    <View style={styles.wrapper}>
      {/* Header with filter button */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>
          {filteredTransactions.length} transacciones
        </Text>
        <TouchableOpacity style={styles.filterButton} onPress={openFilters}>
          <Text style={styles.filterIcon}>☰</Text>
          <Text style={styles.filterButtonText}>Filtros</Text>
          {hasActiveFilters ? <View style={styles.filterBadge} /> : null}
        </TouchableOpacity>
      </View>

      {/* Transaction list */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay transacciones{hasActiveFilters ? ' con estos filtros' : ''}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card title={item.descripcion}>
            <Text style={styles.txAmount}>${item.monto?.toLocaleString()}</Text>
            <Text style={styles.txDetail}>📅 {item.fecha_pago}</Text>
            <Text style={styles.txDetail}>🏦 {item.banco_usado}</Text>
            <Text style={styles.txDetail}>📍 {item.ciudad}</Text>
            {item.referencia ? <Text style={styles.txDetail}>🔖 {item.referencia}</Text> : null}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.buttonText}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.buttonText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>
            <SendWhatsAppButton transactionId={item.id} />
          </Card>
        )}
      />

      {/* Filter Slider Modal */}
      {showFilters && (
        <Modal transparent visible animationType="none">
          <TouchableOpacity
            style={styles.filterOverlay}
            activeOpacity={1}
            onPress={closeFilters}
          >
            <Animated.View
              style={[
                styles.filterPanel,
                { transform: [{ translateX: slideAnim }] }
              ]}
            >
              <TouchableOpacity activeOpacity={1}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.filterHeader}>
                    <Text style={styles.filterTitle}>🔍 Filtros</Text>
                    <TouchableOpacity onPress={closeFilters}>
                      <Text style={styles.filterClose}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Search text */}
                  <Text style={styles.filterLabel}>Buscar</Text>
                  <TextInput
                    style={styles.filterInput}
                    value={filterText}
                    onChangeText={setFilterText}
                    placeholder="Descripción, referencia..."
                    placeholderTextColor="#9ca3af"
                  />

                  {/* Date Desde */}
                  <Text style={styles.filterLabel}>Desde</Text>
                  <TouchableOpacity
                    style={styles.filterDateInput}
                    onPress={() => setShowDesde(true)}
                  >
                    <Text style={filterDesde ? styles.filterDateText : styles.filterDatePlaceholder}>
                      {filterDesde || 'dd/mm/aaaa'}
                    </Text>
                  </TouchableOpacity>
                  {showDesde && (
                    <DateTimePicker
                      value={desdeDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                      onValueChange={(_e, date) => {
                        setShowDesde(Platform.OS === 'ios');
                        if (date) {
                          setDesdeDate(date);
                          setFilterDesde(formatDate(date));
                        }
                      }}
                      onDismiss={() => setShowDesde(false)}
                    />
                  )}

                  {/* Date Hasta */}
                  <Text style={styles.filterLabel}>Hasta</Text>
                  <TouchableOpacity
                    style={styles.filterDateInput}
                    onPress={() => setShowHasta(true)}
                  >
                    <Text style={filterHasta ? styles.filterDateText : styles.filterDatePlaceholder}>
                      {filterHasta || 'dd/mm/aaaa'}
                    </Text>
                  </TouchableOpacity>
                  {showHasta && (
                    <DateTimePicker
                      value={hastaDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                      onValueChange={(_e, date) => {
                        setShowHasta(Platform.OS === 'ios');
                        if (date) {
                          setHastaDate(date);
                          setFilterHasta(formatDate(date));
                        }
                      }}
                      onDismiss={() => setShowHasta(false)}
                    />
                  )}

                  {/* Ciudad */}
                  <Text style={styles.filterLabel}>Ciudad</Text>
                  <View style={styles.filterPickerContainer}>
                    <RNPickerSelect
                      onValueChange={setFilterCiudad}
                      value={filterCiudad}
                      placeholder={{ label: 'Todas las ciudades', value: '' }}
                      items={CITIES.map(c => ({ label: c, value: c }))}
                    />
                  </View>

                  {/* Banco */}
                  <Text style={styles.filterLabel}>Banco</Text>
                  <View style={styles.filterPickerContainer}>
                    <RNPickerSelect
                      onValueChange={setFilterBanco}
                      value={filterBanco}
                      placeholder={{ label: 'Todos los bancos', value: '' }}
                      items={BANKS.map(b => ({ label: b, value: b }))}
                    />
                  </View>

                  {/* Action buttons */}
                  <TouchableOpacity style={styles.applyButton} onPress={closeFilters}>
                    <Text style={styles.applyButtonText}>✅ Aplicar filtros</Text>
                  </TouchableOpacity>

                  {hasActiveFilters ? (
                    <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                      <Text style={styles.clearButtonText}>🗑️ Limpiar filtros</Text>
                    </TouchableOpacity>
                  ) : null}
                </ScrollView>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        visible={showEditModal}
        transaction={editTransaction}
        onClose={() => {
          setShowEditModal(false);
          setEditTransaction(null);
        }}
        onSaved={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  filterBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 15,
  },
  txAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  txDetail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#4b5563',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Filter Panel
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  filterPanel: {
    width: FILTER_WIDTH,
    backgroundColor: '#fff',
    height: '100%',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filterClose: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
    padding: 4,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 4,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  filterDateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#f9fafb',
  },
  filterDateText: {
    fontSize: 14,
    color: '#1f2937',
  },
  filterDatePlaceholder: {
    fontSize: 14,
    color: '#9ca3af',
  },
  filterPickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    marginBottom: 14,
    backgroundColor: '#f9fafb',
  },
  applyButton: {
    backgroundColor: '#6366f1',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  clearButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
  },
});
