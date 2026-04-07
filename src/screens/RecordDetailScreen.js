import { useFocusEffect } from "@react-navigation/native";
import { usePostHog } from "posthog-react-native";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { getRecordById, getRecordsByPlate } from "../storage/recordStorage";
import { formatPrice } from "../utils/currency";
import { formatDateCompact, formatDateShort } from "../utils/date";

function getPaymentLabel(status) {
  switch (status) {
    case "paid":
      return "Tahsil Edildi";
    case "partial":
      return "Kismen Tahsil Edildi";
    case "unpaid":
      return "Tahsil Edilecek";
    default:
      return "Belirsiz";
  }
}

function getPaymentColor(status) {
  switch (status) {
    case "paid":
      return "#16A34A";
    case "partial":
      return "#D97706";
    case "unpaid":
      return "#DC2626";
    default:
      return "#6B7280";
  }
}

function getPaymentBg(status) {
  switch (status) {
    case "paid":
      return "#DCFCE7";
    case "partial":
      return "#FEF3C7";
    case "unpaid":
      return "#FEE2E2";
    default:
      return "#F3F4F6";
  }
}

export default function RecordDetailScreen({ navigation, route }) {
  const initialRecord = route?.params?.record;
  const [record, setRecord] = useState(initialRecord);
  const [pastRecords, setPastRecords] = useState([]);
  const posthog = usePostHog();

  useFocusEffect(
    useCallback(() => {
      if (initialRecord?.id) {
        refreshRecord();
        posthog?.screen("RecordDetailScreen", { plate: initialRecord.plate });
      }
    }, [initialRecord?.id]),
  );

  async function refreshRecord() {
    const fresh = await getRecordById(initialRecord.id);
    if (fresh) {
      setRecord(fresh);
      loadPastRecords(fresh.plate, fresh.id);
    }
  }

  async function loadPastRecords(plate, currentId) {
    const all = await getRecordsByPlate(plate);
    setPastRecords(all.filter((r) => r.id !== currentId));
  }

  if (!record) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Kayit bulunamadi.</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
            activeOpacity={0.6}
          >
            <Text style={styles.errorButtonText}>Geri Don</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  function handleEdit() {
    navigation.navigate("EditRecord", { editRecord: record });
  }

  function handleNewRecord() {
    navigation.navigate("MainTabs", {
      screen: "NewRecord",
      params: {
        prefillCustomer: {
          customerName: record.customerName,
          customerPhone: record.customerPhone,
          plate: record.plate,
          brand: record.brand,
          model: record.model,
          year: record.year,
        },
      },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.6}
          >
            <Text style={styles.backArrow}>{"<"}</Text>
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kayit Detayi</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Plaka Karti */}
        <View style={styles.plateCard}>
          <View style={styles.plateBadge}>
            <Text style={styles.plateBadgeText}>ARAC PLAKASI</Text>
          </View>
          <Text style={styles.plateText}>{record.plate}</Text>
          <Text style={styles.customerName}>{record.customerName}</Text>
          <Text style={styles.dateText}>{formatDateShort(record.date)}</Text>
        </View>

        {/* Kullanilan Yag */}
        {(record.oilBrand || record.oilViscosity) && (
          <View style={styles.oilBox}>
            <Text style={styles.oilLabel}>KULLANILAN YAG</Text>
            <Text style={styles.oilValue}>
              {record.oilBrand} {record.oilViscosity}
            </Text>
          </View>
        )}

        {/* Yapilan Islemler */}
        {record.services && record.services.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Yapilan Islemler</Text>

            {record.services.map((service, index) => (
              <View key={index} style={styles.serviceCard}>
                <View style={styles.serviceLeft}>
                  <View style={styles.serviceDot} />
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {service.description ? (
                      <Text style={styles.serviceDesc}>
                        {service.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Text style={styles.servicePrice}>
                  {formatPrice(service.price)} TL
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Usta Notu */}
        {record.notes ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>USTA NOTU</Text>
            <Text style={styles.noteText}>"{record.notes}"</Text>
          </View>
        ) : null}

        {/* Toplam Tutar */}
        <View style={styles.totalSection}>
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Toplam Tutar</Text>
            <Text style={styles.totalPrice}>
              {formatPrice(record.totalAmount)} TL
            </Text>
          </View>
        </View>

        {/* Tahsilat Durumu */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentSectionLabel}>TAHSILAT DURUMU</Text>
          <View
            style={[
              styles.paymentStatusBox,
              { backgroundColor: getPaymentBg(record.paymentStatus) },
            ]}
          >
            <View
              style={[
                styles.paymentStatusDot,
                { backgroundColor: getPaymentColor(record.paymentStatus) },
              ]}
            />
            <Text
              style={[
                styles.paymentStatusText,
                { color: getPaymentColor(record.paymentStatus) },
              ]}
            >
              {getPaymentLabel(record.paymentStatus)}
            </Text>
          </View>
          {record.paymentStatus === "partial" && (
            <View style={styles.paymentDetails}>
              <View style={styles.paymentDetailRow}>
                <Text style={styles.paymentDetailLabel}>Tahsil Edilen</Text>
                <Text style={styles.paymentDetailValue}>
                  {formatPrice(record.paidAmount || 0)} TL
                </Text>
              </View>
              <View style={styles.paymentDetailRow}>
                <Text style={styles.paymentDetailLabel}>Kalan Tutar</Text>
                <Text
                  style={[styles.paymentDetailValue, { color: COLORS.red }]}
                >
                  {formatPrice(
                    Math.max(
                      0,
                      (record.totalAmount || 0) - (record.paidAmount || 0),
                    ),
                  )}{" "}
                  TL
                </Text>
              </View>
            </View>
          )}
          {record.paymentStatus === "unpaid" && (
            <View style={styles.paymentDetails}>
              <View style={styles.paymentDetailRow}>
                <Text style={styles.paymentDetailLabel}>Bekleyen Tutar</Text>
                <Text
                  style={[styles.paymentDetailValue, { color: COLORS.red }]}
                >
                  {formatPrice(record.totalAmount || 0)} TL
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Gecmis Kayitlar (ayni plaka) */}
        {pastRecords.length > 0 && (
          <View style={styles.pastSection}>
            <Text style={styles.pastTitle}>Bu Aracin Gecmis Kayitlari</Text>
            <Text style={styles.pastSubtitle}>
              {pastRecords.length} onceki islem
            </Text>
            {pastRecords.map((past) => (
              <TouchableOpacity
                key={past.id}
                style={styles.pastCard}
                onPress={() =>
                  navigation.push("RecordDetail", { record: past })
                }
                activeOpacity={0.6}
              >
                <View style={styles.pastCardLeft}>
                  <Text style={styles.pastDate}>
                    {formatDateCompact(past.date)}
                  </Text>
                  <Text style={styles.pastServices} numberOfLines={1}>
                    {past.services && past.services.length > 0
                      ? past.services.map((s) => s.name).join(", ")
                      : "Islem bilgisi yok"}
                  </Text>
                </View>
                <Text style={styles.pastPrice}>
                  {formatPrice(past.totalAmount)} TL
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Butonlar */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleEdit}
            activeOpacity={0.6}
          >
            <Text style={styles.secondaryBtnText}>Duzenle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleNewRecord}
            activeOpacity={0.6}
          >
            <Text style={styles.primaryBtnText}>Yeni Kayit</Text>
          </TouchableOpacity>
        </View>

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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
  },
  errorButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingRight: 12,
  },
  backArrow: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: "700",
  },
  backText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },

  // Plate Card
  plateCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  plateBadge: {
    backgroundColor: COLORS.peach,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
  },
  plateBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.peachDark,
    letterSpacing: 1.5,
  },
  plateText: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 2,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 10,
  },
  dateText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 6,
  },

  // Oil Box
  oilBox: {
    backgroundColor: COLORS.peach,
    borderRadius: 16,
    padding: 18,
  },
  oilLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.peachDark,
    letterSpacing: 1,
  },
  oilValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.peachDark,
    marginTop: 4,
  },

  // Section
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 1,
    marginTop: 4,
  },

  // Service Card
  serviceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  serviceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  serviceDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
    marginLeft: 8,
  },

  // Note Box
  noteBox: {
    backgroundColor: COLORS.noteBackground,
    borderRadius: 18,
    padding: 20,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.text,
    fontStyle: "italic",
  },

  // Total
  totalSection: {
    marginTop: 4,
  },
  totalDivider: {
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    color: COLORS.text,
  },
  totalPrice: {
    fontSize: 34,
    fontWeight: "900",
    color: COLORS.primary,
  },

  // Buttons
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    height: 58,
    borderRadius: 16,
    backgroundColor: COLORS.graySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  primaryBtn: {
    flex: 1.2,
    height: 58,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
  },

  // Payment
  paymentSection: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
  },
  paymentSectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  paymentStatusBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  paymentStatusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  paymentStatusText: {
    fontSize: 18,
    fontWeight: "800",
  },
  paymentDetails: {
    marginTop: 14,
    gap: 8,
  },
  paymentDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentDetailLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  paymentDetailValue: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  // Gecmis kayitlar
  pastSection: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
  },
  pastTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  pastSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  pastCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.lightGray,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  pastCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  pastDate: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  pastServices: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  pastPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.orange,
  },
});
