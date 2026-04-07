import { usePostHog } from "posthog-react-native";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { QUICK_SERVICES } from "../constants/mockData";
import { addRecord, updateRecord } from "../storage/recordStorage";
import { formatPrice } from "../utils/currency";
import { getTodayString } from "../utils/date";

export default function NewRecordScreen({ navigation, route }) {
  const prefill = route?.params?.prefillCustomer;
  const editRecord = route?.params?.editRecord;
  const isEditMode = !!editRecord;
  const posthog = usePostHog();

  const [customerName, setCustomerName] = useState(
    editRecord?.customerName || prefill?.customerName || "",
  );
  const [customerPhone, setCustomerPhone] = useState(
    editRecord?.customerPhone || prefill?.customerPhone || "",
  );
  const [plate, setPlate] = useState(editRecord?.plate || prefill?.plate || "");
  const [brand, setBrand] = useState(editRecord?.brand || prefill?.brand || "");
  const [model, setModel] = useState(editRecord?.model || prefill?.model || "");
  const [year, setYear] = useState(editRecord?.year || prefill?.year || "");
  const [kilometer, setKilometer] = useState(editRecord?.kilometer || "");
  const [items, setItems] = useState(
    editRecord?.services
      ? editRecord.services.map((s) => ({ name: s.name, price: s.price || 0 }))
      : [],
  );
  const [oilBrand, setOilBrand] = useState(editRecord?.oilBrand || "");
  const [oilViscosity, setOilViscosity] = useState(
    editRecord?.oilViscosity || "",
  );
  const [notes, setNotes] = useState(editRecord?.notes || "");
  const [saving, setSaving] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(
    editRecord?.paymentStatus || "paid",
  );
  const [paidAmount, setPaidAmount] = useState(
    editRecord?.paidAmount ? String(editRecord.paidAmount) : "",
  );

  // Modal state - kalem ekleme
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editItemName, setEditItemName] = useState("");
  const [editItemPrice, setEditItemPrice] = useState("");

  const totalAmount = items.reduce((sum, i) => sum + (i.price || 0), 0);

  function clearForm() {
    setCustomerName("");
    setCustomerPhone("");
    setPlate("");
    setBrand("");
    setModel("");
    setYear("");
    setKilometer("");
    setItems([]);
    setOilBrand("");
    setOilViscosity("");
    setNotes("");
    setPaymentStatus("paid");
    setPaidAmount("");
  }

  function handleClearForm() {
    const hasData =
      customerName ||
      customerPhone ||
      plate ||
      brand ||
      model ||
      year ||
      kilometer ||
      items.length > 0 ||
      oilBrand ||
      oilViscosity ||
      notes;
    if (!hasData) return;
    Alert.alert("Formu Temizle", "Tum alanlari temizlemek istiyor musunuz?", [
      { text: "Vazgec", style: "cancel" },
      { text: "Temizle", style: "destructive", onPress: clearForm },
    ]);
  }

  function openAddModal(presetName = "") {
    setEditItemName(presetName);
    setEditItemPrice("");
    setAddModalVisible(true);
  }

  function handleAddItem() {
    if (!editItemName.trim()) return;
    const price = parseInt(editItemPrice) || 0;
    setItems([...items, { name: editItemName.trim(), price }]);
    setAddModalVisible(false);
    setEditItemName("");
    setEditItemPrice("");
  }

  function addQuickService(serviceName) {
    const exists = items.find((i) => i.name === serviceName);
    if (exists) {
      Alert.alert("Uyari", `${serviceName} zaten ekli.`);
      return;
    }
    openAddModal(serviceName);
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItemPrice(index, value) {
    const updated = [...items];
    updated[index].price = parseInt(value) || 0;
    setItems(updated);
  }

  async function handleSave() {
    if (!customerName.trim()) {
      Alert.alert("Uyari", "Musteri adi giriniz.");
      return;
    }
    if (!plate.trim()) {
      Alert.alert("Uyari", "Arac plakasi giriniz.");
      return;
    }

    setSaving(true);
    const record = {
      ...(isEditMode ? { id: editRecord.id } : {}),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      plate: plate.trim().toUpperCase(),
      brand: brand.trim(),
      model: model.trim(),
      year: year.trim(),
      kilometer: kilometer.trim(),
      date: isEditMode ? editRecord.date : getTodayString(),
      oilBrand: oilBrand.trim(),
      oilViscosity: oilViscosity.trim(),
      services: items.map((i) => ({
        name: i.name,
        description: "",
        price: i.price,
      })),
      items: items.map((i) => ({
        name: i.name,
        quantity: 1,
        unitPrice: i.price,
        total: i.price,
      })),
      notes: notes.trim(),
      laborTotal: 0,
      partsTotal: totalAmount,
      totalAmount,
      status: "completed",
      paymentStatus,
      paidAmount:
        paymentStatus === "paid"
          ? totalAmount
          : paymentStatus === "partial"
            ? parseInt(paidAmount) || 0
            : 0,
    };

    let success;
    if (isEditMode) {
      success = await updateRecord(record);
    } else {
      success = await addRecord(record);
    }
    setSaving(false);

    if (success) {
      posthog?.capture(isEditMode ? "record_updated" : "record_created", {
        plate: record.plate,
        total_amount: record.totalAmount,
        services_count: record.services.length,
        payment_status: record.paymentStatus,
      });
      Alert.alert(
        "Basarili",
        isEditMode ? "Kayit guncellendi." : "Kayit olusturuldu.",
        [
          {
            text: "Tamam",
            onPress: () => {
              if (isEditMode) {
                navigation.goBack();
              } else {
                clearForm();
                navigation.navigate("Home");
              }
            },
          },
        ],
      );
    } else {
      Alert.alert(
        "Hata",
        isEditMode ? "Kayit guncellenemedi." : "Kayit olusturulamadi.",
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>
              {isEditMode
                ? "Kaydi Duzenle"
                : prefill
                  ? "Yeni Islem Ekle"
                  : "Yeni Kayit"}
            </Text>
            {!isEditMode && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearForm}
                activeOpacity={0.6}
              >
                <Text style={styles.clearBtnText}>Temizle</Text>
              </TouchableOpacity>
            )}
          </View>
          {isEditMode && (
            <View style={styles.prefillBanner}>
              <Text style={styles.prefillText}>
                {editRecord.customerName} - {editRecord.plate}
              </Text>
              <Text style={styles.prefillHint}>Kayit duzenleniyor</Text>
            </View>
          )}
          {!isEditMode && prefill && (
            <View style={styles.prefillBanner}>
              <Text style={styles.prefillText}>
                {prefill.customerName} - {prefill.plate}
              </Text>
              <Text style={styles.prefillHint}>
                Musteri bilgileri otomatik dolduruldu
              </Text>
            </View>
          )}

          {/* Musteri Bilgileri */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Musteri Bilgileri</Text>

            <Text style={styles.label}>AD SOYAD</Text>
            <TextInput
              placeholder="Musteri ismini giriniz"
              placeholderTextColor={COLORS.gray}
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.label}>TELEFON</Text>
            <TextInput
              placeholder="0 (5XX) XXX XX XX"
              placeholderTextColor={COLORS.gray}
              style={styles.input}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Arac Bilgileri */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Arac Bilgileri</Text>

            <Text style={styles.label}>PLAKA</Text>
            <TextInput
              placeholder="34 ABC 123"
              placeholderTextColor={COLORS.gray}
              style={styles.input}
              value={plate}
              onChangeText={setPlate}
              autoCapitalize="characters"
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>MARKA</Text>
                <TextInput
                  placeholder="Orn: BMW"
                  placeholderTextColor={COLORS.gray}
                  style={styles.input}
                  value={brand}
                  onChangeText={setBrand}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>MODEL</Text>
                <TextInput
                  placeholder="Orn: 320d"
                  placeholderTextColor={COLORS.gray}
                  style={styles.input}
                  value={model}
                  onChangeText={setModel}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>YIL</Text>
                <TextInput
                  placeholder="2020"
                  placeholderTextColor={COLORS.gray}
                  style={styles.input}
                  value={year}
                  onChangeText={setYear}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>KILOMETRE</Text>
                <TextInput
                  placeholder="145.000"
                  placeholderTextColor={COLORS.gray}
                  style={styles.input}
                  value={kilometer}
                  onChangeText={setKilometer}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          {/* Hizli Islem Ekle */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hizli Islem Ekle</Text>
            <Text style={styles.sectionHint}>
              Bir isleme dokunun, fiyatini girin
            </Text>
            <View style={styles.chipContainer}>
              {QUICK_SERVICES.map((service) => {
                const isAdded = items.some((i) => i.name === service);
                return (
                  <TouchableOpacity
                    key={service}
                    style={[styles.chip, isAdded && styles.chipAdded]}
                    onPress={() => addQuickService(service)}
                    activeOpacity={0.6}
                    disabled={isAdded}
                  >
                    <Text
                      style={[styles.chipPlus, isAdded && styles.chipPlusAdded]}
                    >
                      {isAdded ? "\u2713" : "+"}
                    </Text>
                    <Text
                      style={[styles.chipText, isAdded && styles.chipTextAdded]}
                    >
                      {service}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Eklenen Kalemler */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Eklenen Kalemler</Text>
              <TouchableOpacity
                onPress={() => openAddModal("")}
                style={styles.addCustomBtn}
                activeOpacity={0.6}
              >
                <Text style={styles.addCustomText}>+ Ozel Ekle</Text>
              </TouchableOpacity>
            </View>

            {items.length > 0 ? (
              items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemCardLeft}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemPriceRow}>
                      <TextInput
                        style={styles.itemPriceInput}
                        value={item.price ? String(item.price) : ""}
                        onChangeText={(v) => updateItemPrice(index, v)}
                        keyboardType="number-pad"
                        placeholder="Fiyat"
                        placeholderTextColor={COLORS.gray}
                      />
                      <Text style={styles.itemPriceCurrency}>TL</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeItem(index)}
                    style={styles.removeBtn}
                    activeOpacity={0.5}
                  >
                    <Text style={styles.removeX}>SIL</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyHint}>
                Yukardaki butonlardan veya "Ozel Ekle" ile islem ekleyiniz.
              </Text>
            )}
          </View>

          {/* Yag Bilgisi */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yag Bilgisi</Text>

            <Text style={styles.label}>YAG MARKASI</Text>
            <TextInput
              placeholder="Orn: Mobil 1"
              placeholderTextColor={COLORS.gray}
              style={styles.input}
              value={oilBrand}
              onChangeText={setOilBrand}
            />

            <Text style={styles.label}>VISKOZITE</Text>
            <TextInput
              placeholder="Orn: 5W-30"
              placeholderTextColor={COLORS.gray}
              style={styles.input}
              value={oilViscosity}
              onChangeText={setOilViscosity}
            />
          </View>

          {/* Notlar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notlar</Text>
            <TextInput
              placeholder="Musteri sikayeti veya ek islemler..."
              placeholderTextColor={COLORS.gray}
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Toplam */}
          {items.length > 0 && (
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {items.length} kalem islem
                </Text>
              </View>
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>TOPLAM TUTAR</Text>
                <Text style={styles.grandTotalValue}>
                  {formatPrice(totalAmount)} TL
                </Text>
              </View>
            </View>
          )}

          {/* Tahsilat Durumu */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tahsilat Durumu</Text>
            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentStatus === "paid" && styles.paymentOptionActive,
                  paymentStatus === "paid" && { borderColor: COLORS.green },
                ]}
                onPress={() => setPaymentStatus("paid")}
                activeOpacity={0.6}
              >
                <View
                  style={[
                    styles.paymentDot,
                    paymentStatus === "paid" && {
                      backgroundColor: COLORS.green,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.paymentOptionText,
                    paymentStatus === "paid" && {
                      color: COLORS.green,
                      fontWeight: "800",
                    },
                  ]}
                >
                  Tahsil Edildi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentStatus === "partial" && styles.paymentOptionActive,
                  paymentStatus === "partial" && {
                    borderColor: COLORS.warning,
                  },
                ]}
                onPress={() => setPaymentStatus("partial")}
                activeOpacity={0.6}
              >
                <View
                  style={[
                    styles.paymentDot,
                    paymentStatus === "partial" && {
                      backgroundColor: COLORS.warning,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.paymentOptionText,
                    paymentStatus === "partial" && {
                      color: COLORS.warning,
                      fontWeight: "800",
                    },
                  ]}
                >
                  Kismen Tahsil Edildi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentStatus === "unpaid" && styles.paymentOptionActive,
                  paymentStatus === "unpaid" && { borderColor: COLORS.red },
                ]}
                onPress={() => setPaymentStatus("unpaid")}
                activeOpacity={0.6}
              >
                <View
                  style={[
                    styles.paymentDot,
                    paymentStatus === "unpaid" && {
                      backgroundColor: COLORS.red,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.paymentOptionText,
                    paymentStatus === "unpaid" && {
                      color: COLORS.red,
                      fontWeight: "800",
                    },
                  ]}
                >
                  Tahsil Edilecek
                </Text>
              </TouchableOpacity>
            </View>

            {paymentStatus === "partial" && (
              <View style={styles.partialPaymentBox}>
                <Text style={styles.label}>TAHSIL EDILEN TUTAR (TL)</Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor={COLORS.gray}
                  style={styles.input}
                  value={paidAmount}
                  onChangeText={setPaidAmount}
                  keyboardType="number-pad"
                />
                {totalAmount > 0 && (parseInt(paidAmount) || 0) > 0 && (
                  <View style={styles.remainingRow}>
                    <Text style={styles.remainingLabel}>Kalan Tutar:</Text>
                    <Text style={styles.remainingValue}>
                      {formatPrice(
                        Math.max(0, totalAmount - (parseInt(paidAmount) || 0)),
                      )}{" "}
                      TL
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Kaydet */}
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>
              {saving
                ? isEditMode
                  ? "Guncelleniyor..."
                  : "Kaydediliyor..."
                : isEditMode
                  ? "Kaydi Guncelle"
                  : "Kaydi Kaydet"}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Kalem Ekleme Modali */}
      <Modal visible={addModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlayInner}
            activeOpacity={1}
            onPress={() => setAddModalVisible(false)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalTitle}>Kalem Ekle</Text>

                <Text style={styles.modalLabel}>ISLEM ADI</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Islem adini girin"
                  placeholderTextColor={COLORS.gray}
                  value={editItemName}
                  onChangeText={setEditItemName}
                  autoFocus={!editItemName}
                />

                <Text style={styles.modalLabel}>FIYAT (TL)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.gray}
                  value={editItemPrice}
                  onChangeText={setEditItemPrice}
                  keyboardType="number-pad"
                  autoFocus={!!editItemName}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => setAddModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>Vazgec</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalSave,
                      !editItemName.trim() && styles.modalSaveDisabled,
                    ]}
                    onPress={handleAddItem}
                    disabled={!editItemName.trim()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalSaveText}>Ekle</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
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
    gap: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 4,
  },
  clearBtn: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.red,
  },
  prefillBanner: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  prefillText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  prefillHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: -8,
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 16,
    fontSize: 17,
    color: COLORS.text,
  },
  notesInput: {
    height: 110,
    paddingTop: 14,
    paddingBottom: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },

  // Chip'ler (hizli islem butonlari)
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: -4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  chipAdded: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  chipPlus: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: "700",
  },
  chipPlusAdded: {
    color: COLORS.green,
  },
  chipText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  chipTextAdded: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  // Ozel kalem ekle butonu
  addCustomBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
  },
  addCustomText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Eklenen kalem kartlari
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  itemCardLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  itemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemPriceInput: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    minWidth: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemPriceCurrency: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  removeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
  },
  removeX: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.red,
    letterSpacing: 0.5,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    padding: 16,
    marginTop: -6,
  },

  // Toplam
  totalSection: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 18,
    padding: 18,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 1,
  },
  grandTotalValue: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
  },

  // Kaydet
  saveButton: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },

  // Tahsilat durumu
  paymentOptions: {
    gap: 10,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  paymentOptionActive: {
    backgroundColor: COLORS.card,
  },
  paymentDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.gray,
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  partialPaymentBox: {
    marginTop: 14,
  },
  remainingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
  },
  remainingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  remainingValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.red,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalOverlayInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  modalInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  modalSave: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveDisabled: {
    opacity: 0.4,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
});
