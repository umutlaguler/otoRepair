import { useFocusEffect } from "@react-navigation/native";
import { usePostHog } from "posthog-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DaySchedule from "../components/DaySchedule";
import RecordCard from "../components/RecordCard";
import SearchBar from "../components/SearchBar";
import SectionTitle from "../components/SectionTitle";
import { COLORS } from "../constants/colors";
import { getAllRecords } from "../storage/recordStorage";
import { formatPrice } from "../utils/currency";
import { getTodayString } from "../utils/date";

export default function HomeScreen({ navigation }) {
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const posthog = usePostHog();
  const searchTimerRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
      posthog?.screen("HomeScreen");
    }, []),
  );

  async function loadRecords() {
    const data = await getAllRecords();
    setRecords(data);
  }

  const recentRecords = records.slice(0, 3);

  // Gunluk kazanc hesapla
  const todayStr = getTodayString();
  const todayRecords = records.filter((r) => r.date === todayStr);
  const todayTotal = todayRecords.reduce(
    (sum, r) => sum + (r.totalAmount || 0),
    0,
  );
  const todayCollected = todayRecords.reduce((sum, r) => {
    if (r.paymentStatus === "paid") return sum + (r.totalAmount || 0);
    if (r.paymentStatus === "partial") return sum + (r.paidAmount || 0);
    return sum;
  }, 0);
  const todayPending = todayTotal - todayCollected;

  // Arama sonuçları (sadece yazıyorsa göster)
  const filteredRecords = searchQuery.trim()
    ? records.filter(
        (r) =>
          r.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.customerPhone.includes(searchQuery),
      )
    : [];

  // Arama yapildiginda PostHog event'i gonder (debounced)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (searchQuery.trim().length >= 2) {
      searchTimerRef.current = setTimeout(() => {
        posthog?.capture("search_performed", {
          screen: "HomeScreen",
          query: searchQuery.trim(),
          results_count: filteredRecords.length,
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
      >
        {/* Baslik */}
        <Text style={styles.headerTitle}>AL-AZ OTOMOTIV</Text>

        {/* Arama */}
        <SearchBar
          placeholder="Plaka veya musteri adi ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Arama sonuclari */}
        {searchQuery.trim() !== "" && (
          <View style={styles.searchResults}>
            {filteredRecords.length > 0 ? (
              filteredRecords.slice(0, 5).map((record) => (
                <TouchableOpacity
                  key={record.id}
                  style={styles.searchResultItem}
                  onPress={() => {
                    setSearchQuery("");
                    navigation.navigate("RecordDetail", { record });
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.searchResultPlate}>{record.plate}</Text>
                  <Text style={styles.searchResultName}>
                    {record.customerName}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.searchResultItem}>
                <Text style={styles.searchNoResult}>Sonuc bulunamadi.</Text>
              </View>
            )}
          </View>
        )}

        {/* Gunluk Kazanc */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>Bugunun Kazanci</Text>
          <Text style={styles.earningsTotal}>{formatPrice(todayTotal)} TL</Text>
          <View style={styles.earningsRow}>
            <View style={styles.earningsItem}>
              <View
                style={[styles.earningsDot, { backgroundColor: COLORS.green }]}
              />
              <Text style={styles.earningsLabel}>Tahsil Edilen</Text>
              <Text style={[styles.earningsValue, { color: COLORS.green }]}>
                {formatPrice(todayCollected)} TL
              </Text>
            </View>
            <View style={styles.earningsItem}>
              <View
                style={[styles.earningsDot, { backgroundColor: COLORS.red }]}
              />
              <Text style={styles.earningsLabel}>Bekleyen</Text>
              <Text style={[styles.earningsValue, { color: COLORS.red }]}>
                {formatPrice(todayPending)} TL
              </Text>
            </View>
          </View>
          <Text style={styles.earningsCount}>
            {todayRecords.length} islem yapildi
          </Text>
        </View>

        {/* Gunluk Takvim */}
        <SectionTitle title="Gunluk Program" />
        <DaySchedule />

        {/* Son Kayitlar */}
        <SectionTitle
          title="Son Kayitlar"
          actionText="Hepsini Gor"
          onAction={() => navigation.navigate("History")}
          style={{ marginTop: 6 }}
        />

        {recentRecords.length > 0 ? (
          recentRecords.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              compact
              onPress={() => navigation.navigate("RecordDetail", { record })}
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Henuz kayit yok.</Text>
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
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 4,
  },

  // Arama sonuclari
  searchResults: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginTop: -6,
    overflow: "hidden",
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  searchResultPlate: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  searchResultName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchNoResult: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // Bos
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },

  // Gunluk kazanc
  earningsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.green,
  },
  earningsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  earningsTotal: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 6,
  },
  earningsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 14,
  },
  earningsItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  earningsDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  earningsLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  earningsCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 10,
  },
});
