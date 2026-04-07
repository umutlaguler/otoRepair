import { useFocusEffect } from "@react-navigation/native";
import { usePostHog } from "posthog-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import RecordCard from "../components/RecordCard";
import SearchBar from "../components/SearchBar";
import { COLORS } from "../constants/colors";
import { deleteRecord, getAllRecords } from "../storage/recordStorage";
import { formatPrice } from "../utils/currency";
import { isWithinDays } from "../utils/date";

const FILTERS = [
  { key: "all", label: "Tum Kayitlar" },
  { key: "last30", label: "Son 30 Gun" },
  { key: "heavy", label: "Agir Bakimlar" },
  { key: "unpaid", label: "Tahsil Edilecek" },
];

export default function HistoryScreen({ navigation, route }) {
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const swipeableRefs = useRef({});
  const searchTimerRef = useRef(null);
  const posthog = usePostHog();

  useFocusEffect(
    useCallback(() => {
      loadRecords();
      posthog?.screen("HistoryScreen");
      if (route?.params?.searchQuery) {
        setSearchQuery(route.params.searchQuery);
      }
    }, [route?.params?.searchQuery]),
  );

  async function loadRecords() {
    const data = await getAllRecords();
    setRecords(data);
  }

  function handleEdit(record) {
    // Swipeable'i kapat
    if (swipeableRefs.current[record.id]) {
      swipeableRefs.current[record.id].close();
    }
    posthog?.capture("record_edit_started", {
      record_id: record.id,
      plate: record.plate,
    });
    navigation.navigate("EditRecord", { editRecord: record });
  }

  function handleDelete(recordId) {
    // Swipeable'i kapat
    if (swipeableRefs.current[recordId]) {
      swipeableRefs.current[recordId].close();
    }
    Alert.alert(
      "Kayit Silinecek",
      "Bu kaydi silmek istediginizden emin misiniz? Bu islem geri alinamaz.",
      [
        { text: "Vazgec", style: "cancel" },
        {
          text: "SIL",
          style: "destructive",
          onPress: async () => {
            const success = await deleteRecord(recordId);
            if (success) {
              posthog?.capture("record_deleted", { record_id: recordId });
              setRecords((prev) => prev.filter((r) => r.id !== recordId));
            } else {
              Alert.alert("Hata", "Kayit silinemedi.");
            }
          },
        },
      ],
    );
  }

  function renderRightActions(progress, dragX, recordId) {
    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[styles.deleteAction, { transform: [{ translateX }] }]}
      >
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

  function renderLeftActions(progress, dragX, record) {
    const translateX = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [-100, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[styles.editAction, { transform: [{ translateX }] }]}
      >
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(record)}
          activeOpacity={0.7}
        >
          <Text style={styles.editButtonText}>DUZENLE</Text>
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
          r.customerPhone.includes(q),
      );
    }

    if (activeFilter === "last30") {
      filtered = filtered.filter((r) => isWithinDays(r.date, 30));
    } else if (activeFilter === "heavy") {
      filtered = filtered.filter((r) => r.totalAmount >= 5000);
    } else if (activeFilter === "unpaid") {
      filtered = filtered.filter(
        (r) => r.paymentStatus === "unpaid" || r.paymentStatus === "partial",
      );
    }

    return filtered;
  }

  const filteredRecords = getFilteredRecords();
  const filteredTotal = filteredRecords.reduce(
    (sum, r) => sum + (r.totalAmount || 0),
    0,
  );

  // Arama yapildiginda PostHog event'i gonder (debounced)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (searchQuery.trim().length >= 2) {
      searchTimerRef.current = setTimeout(() => {
        posthog?.capture("search_performed", {
          screen: "HistoryScreen",
          query: searchQuery.trim(),
          results_count: filteredRecords.length,
          filter: activeFilter,
        });
      }, 1000);
    }
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

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
            <Text style={styles.swipeHint}>Sola: Sil / Saga: Duzenle</Text>
          )}
        </View>

        {/* Ozet */}
        {filteredRecords.length > 0 && (
          <View style={styles.summaryBar}>
            <Text style={styles.summaryLabel}>Toplam Ciro</Text>
            <Text style={styles.summaryValue}>
              {formatPrice(filteredTotal)} TL
            </Text>
          </View>
        )}

        {/* Kayit listesi */}
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <Swipeable
              key={record.id}
              ref={(ref) => {
                swipeableRefs.current[record.id] = ref;
              }}
              renderRightActions={(progress, dragX) =>
                renderRightActions(progress, dragX, record.id)
              }
              renderLeftActions={(progress, dragX) =>
                renderLeftActions(progress, dragX, record)
              }
              overshootRight={false}
              overshootLeft={false}
              friction={2}
            >
              <RecordCard
                record={record}
                onPress={() => navigation.navigate("RecordDetail", { record })}
              />
            </Swipeable>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? "Sonuc bulunamadi" : "Henuz kayit yok"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? "Farkli bir arama deneyin."
                : "Yeni kayit ekleyerek baslayabilirsiniz."}
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
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
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
    fontWeight: "700",
    color: COLORS.text,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  resultRow: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultCount: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  swipeHint: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: "italic",
  },
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: COLORS.card,
    borderRadius: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // Swipe delete
  deleteAction: {
    justifyContent: "center",
    alignItems: "flex-end",
    width: 100,
  },
  deleteButton: {
    backgroundColor: COLORS.red,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderRadius: 16,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // Swipe edit
  editAction: {
    justifyContent: "center",
    alignItems: "flex-start",
    width: 110,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    height: "100%",
    borderRadius: 16,
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
