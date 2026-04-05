import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS } from '../constants/colors';
import { getAllRecords, deleteRecord } from '../storage/recordStorage';
import { isWithinDays } from '../utils/date';
import { formatPrice } from '../utils/currency';
import SearchBar from '../components/SearchBar';
import RecordCard from '../components/RecordCard';

const FILTERS = [
  { key: 'all', label: 'Tum Kayitlar' },
  { key: 'last30', label: 'Son 30 Gun' },
  { key: 'heavy', label: 'Agir Bakimlar' },
  { key: 'unpaid', label: 'Tahsil Edilecek' },
];

export default function HistoryScreen({ navigation, route }) {
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const swipeableRefs = useRef({});

  useFocusEffect(
    useCallback(() => {
      loadRecords();
      if (route?.params?.searchQuery) {
        setSearchQuery(route.params.searchQuery);
      }
    }, [route?.params?.searchQuery])
  );

  async function loadRecords() {
    const data = await getAllRecords();
    setRecords(data);
  }

  function handleDelete(recordId) {
    // Swipeable'i kapat
    if (swipeableRefs.current[recordId]) {
      swipeableRefs.current[recordId].close();
    }
    Alert.alert(
      'Kayit Silinecek',
      'Bu kaydi silmek istediginizden emin misiniz? Bu islem geri alinamaz.',
      [
        { text: 'Vazgec', style: 'cancel' },
        {
          text: 'SIL',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteRecord(recordId);
            if (success) {
              setRecords((prev) => prev.filter((r) => r.id !== recordId));
            } else {
              Alert.alert('Hata', 'Kayit silinemedi.');
            }
          },
        },
      ]
    );
  }

  function renderRightActions(progress, dragX, recordId) {
    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(recordId)}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>SIL</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  function getFilteredRecords() {
    let filtered = [...records];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.plate.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.customerPhone.includes(q)
      );
    }

    if (activeFilter === 'last30') {
      filtered = filtered.filter((r) => isWithinDays(r.date, 30));
    } else if (activeFilter === 'heavy') {
      filtered = filtered.filter((r) => r.totalAmount >= 5000);
    } else if (activeFilter === 'unpaid') {
      filtered = filtered.filter((r) => r.paymentStatus === 'unpaid' || r.paymentStatus === 'partial');
    }

    return filtered;
  }

  const filteredRecords = getFilteredRecords();
  const filteredTotal = filteredRecords.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Baslik */}
        <Text style={styles.headerTitle}>Gecmis Kayitlar</Text>

        {/* Arama */}
        <SearchBar
          placeholder="Plaka, isim veya telefon ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filtreler */}
        <View style={styles.filterRow}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.activeChip,
              ]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.activeFilterText,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sonuc sayisi */}
        <View style={styles.resultRow}>
          <Text style={styles.resultCount}>
            {filteredRecords.length} sonuc bulundu
          </Text>
          {filteredRecords.length > 0 && (
            <Text style={styles.swipeHint}>Silmek icin sola kaydir</Text>
          )}
        </View>

        {/* Ozet */}
        {filteredRecords.length > 0 && (
          <View style={styles.summaryBar}>
            <Text style={styles.summaryLabel}>Toplam Ciro</Text>
            <Text style={styles.summaryValue}>{formatPrice(filteredTotal)} TL</Text>
          </View>
        )}

        {/* Kayit listesi */}
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <Swipeable
              key={record.id}
              ref={(ref) => { swipeableRefs.current[record.id] = ref; }}
              renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, record.id)}
              overshootRight={false}
              friction={2}
            >
              <RecordCard
                record={record}
                onPress={() => navigation.navigate('RecordDetail', { record })}
              />
            </Swipeable>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? 'Sonuc bulunamadi' : 'Henuz kayit yok'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? 'Farkli bir arama deneyin.'
                : 'Yeni kayit ekleyerek baslayabilirsiniz.'}
            </Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 22,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  resultRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  swipeHint: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.card,
    borderRadius: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Swipe delete
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 100,
  },
  deleteButton: {
    backgroundColor: COLORS.red,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 16,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
