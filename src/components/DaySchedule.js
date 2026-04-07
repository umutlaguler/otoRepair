import { usePostHog } from "posthog-react-native";
import { useEffect, useRef, useState } from "react";
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
import { COLORS } from "../constants/colors";
import {
  addAppointment,
  getAppointmentsByDate,
  removeAppointment,
} from "../storage/recordStorage";
import { scheduleAppointmentNotification } from "../utils/notifications";

const WORK_HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

// Randevulari birbirinden ayirmak icin renk paleti
const APPT_COLORS = [
  { bg: "#DCE6FF", border: "#0D47A1", text: "#0D47A1", dot: "#0D47A1" }, // mavi
  { bg: "#FDECD0", border: "#E65100", text: "#E65100", dot: "#E65100" }, // turuncu
  { bg: "#D4EDDA", border: "#16A34A", text: "#16A34A", dot: "#16A34A" }, // yesil
  { bg: "#F8D7DA", border: "#DC2626", text: "#DC2626", dot: "#DC2626" }, // kirmizi
  { bg: "#E8DAEF", border: "#7B2D8E", text: "#7B2D8E", dot: "#7B2D8E" }, // mor
  { bg: "#D6EAF8", border: "#1A73E8", text: "#1A73E8", dot: "#1A73E8" }, // acik mavi
];

const DAYS_TR = [
  "Pazar",
  "Pazartesi",
  "Sali",
  "Carsamba",
  "Persembe",
  "Cuma",
  "Cumartesi",
];
const MONTHS_TR = [
  "Ocak",
  "Subat",
  "Mart",
  "Nisan",
  "Mayis",
  "Haziran",
  "Temmuz",
  "Agustos",
  "Eylul",
  "Ekim",
  "Kasim",
  "Aralik",
];

function getDateStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDateLabel(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const dayName = DAYS_TR[d.getDay()];
  const day = d.getDate();
  const month = MONTHS_TR[d.getMonth()];
  if (offset === 0) return `Bugun - ${day} ${month}, ${dayName}`;
  if (offset === 1) return `Yarin - ${day} ${month}, ${dayName}`;
  return `${day} ${month}, ${dayName}`;
}

export default function DaySchedule() {
  const [dayOffset, setDayOffset] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedHour, setSelectedHour] = useState("09:00");
  const scrollRef = useRef(null);
  const posthog = usePostHog();

  const dateStr = getDateStr(dayOffset);

  useEffect(() => {
    loadAppointments();
  }, [dayOffset]);

  async function loadAppointments() {
    const data = await getAppointmentsByDate(dateStr);
    setAppointments(data);
  }

  async function handleAddAppointment() {
    if (!newName.trim()) return;
    await addAppointment(dateStr, {
      customerName: newName.trim(),
      time: selectedHour,
    });
    posthog?.capture("appointment_created", {
      date: dateStr,
      time: selectedHour,
      customer_name: newName.trim(),
    });
    // Randevudan 30dk once bildirim zamanla
    await scheduleAppointmentNotification(
      dateStr,
      selectedHour,
      newName.trim(),
      Date.now().toString(),
    );
    setNewName("");
    setModalVisible(false);
    loadAppointments();
  }

  function confirmRemove(appt) {
    Alert.alert(
      "Randevu Silinecek",
      `${appt.customerName} - ${appt.time} randevusunu silmek istediginizden emin misiniz?`,
      [
        { text: "Hayir", style: "cancel" },
        {
          text: "Evet, Sil",
          style: "destructive",
          onPress: () => handleRemove(appt.id),
        },
      ],
    );
  }

  async function handleRemove(id) {
    const removedAppt = appointments.find((a) => a.id === id);
    await removeAppointment(dateStr, id);
    posthog?.capture("appointment_deleted", {
      date: dateStr,
      time: removedAppt?.time,
      customer_name: removedAppt?.customerName,
    });
    loadAppointments();
  }

  function goNext() {
    setDayOffset((prev) => prev + 1);
  }

  function goPrev() {
    setDayOffset((prev) => (prev > 0 ? prev - 1 : 0));
  }

  // Ayni saatteki TUM randevulari getir
  function getAppointmentsForHour(hour) {
    return appointments.filter((a) => a.time === hour);
  }

  // Her randevuya benzersiz bir renk index'i ata (global sirayla)
  function getColorForAppointment(apptId) {
    const idx = appointments.findIndex((a) => a.id === apptId);
    return APPT_COLORS[idx % APPT_COLORS.length];
  }

  return (
    <View style={styles.container}>
      {/* Gun navigasyonu */}
      <View style={styles.dayNav}>
        <TouchableOpacity
          onPress={goPrev}
          style={[styles.navBtn, dayOffset === 0 && styles.navBtnDisabled]}
          disabled={dayOffset === 0}
          activeOpacity={0.6}
        >
          <Text
            style={[
              styles.navArrow,
              dayOffset === 0 && styles.navArrowDisabled,
            ]}
          >
            {"<"}
          </Text>
        </TouchableOpacity>

        <View style={styles.dayLabelContainer}>
          <Text style={styles.dayLabel}>{getDateLabel(dayOffset)}</Text>
        </View>

        <TouchableOpacity
          onPress={goNext}
          style={styles.navBtn}
          activeOpacity={0.6}
        >
          <Text style={styles.navArrow}>{">"}</Text>
        </TouchableOpacity>
      </View>

      {/* Saat dilimleri */}
      <ScrollView
        ref={scrollRef}
        style={styles.timelineScroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {WORK_HOURS.map((hour) => {
          const appts = getAppointmentsForHour(hour);
          return (
            <View key={hour} style={styles.timeSlot}>
              <Text style={styles.timeText}>{hour}</Text>
              <View style={styles.slotContent}>
                {appts.length > 0 ? (
                  <View style={styles.apptRow}>
                    {appts.map((appt) => {
                      const color = getColorForAppointment(appt.id);
                      return (
                        <TouchableOpacity
                          key={appt.id}
                          style={[
                            styles.appointmentChip,
                            {
                              backgroundColor: color.bg,
                              borderLeftColor: color.border,
                            },
                          ]}
                          onLongPress={() => confirmRemove(appt)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.apptDot,
                              { backgroundColor: color.dot },
                            ]}
                          />
                          <Text
                            style={[styles.apptName, { color: color.text }]}
                            numberOfLines={1}
                          >
                            {appt.customerName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptySlot} />
                )}
              </View>
            </View>
          );
        })}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Randevu ekle butonu */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.addButtonText}>+ Randevu Ekle</Text>
      </TouchableOpacity>

      {/* Randevu ekleme modali */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlayInner}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalTitle}>Randevu Ekle</Text>
                <Text style={styles.modalSubtitle}>
                  {getDateLabel(dayOffset)}
                </Text>

                <Text style={styles.modalLabel}>Musteri Adi</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ad Soyad"
                  placeholderTextColor={COLORS.gray}
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                />

                <Text style={styles.modalLabel}>Saat</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.hourPicker}
                  keyboardShouldPersistTaps="handled"
                >
                  {WORK_HOURS.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.hourChip,
                        selectedHour === hour && styles.hourChipActive,
                      ]}
                      onPress={() => setSelectedHour(hour)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.hourChipText,
                          selectedHour === hour && styles.hourChipTextActive,
                        ]}
                      >
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => setModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>Vazgec</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalSave,
                      !newName.trim() && styles.modalSaveDisabled,
                    ]}
                    onPress={handleAddAppointment}
                    disabled={!newName.trim()}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: "hidden",
  },
  dayNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navArrow: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
  },
  navArrowDisabled: {
    color: COLORS.gray,
  },
  dayLabelContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  timelineScroll: {
    maxHeight: 200,
    paddingHorizontal: 14,
  },
  timeSlot: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 36,
    paddingVertical: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  timeText: {
    width: 46,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    paddingTop: 6,
  },
  slotContent: {
    flex: 1,
    paddingLeft: 6,
  },
  emptySlot: {
    height: 28,
  },
  apptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  appointmentChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderLeftWidth: 3,
    gap: 6,
    flex: 1,
    minWidth: 80,
  },
  apptDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  apptName: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  addButton: {
    margin: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
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
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
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
  hourPicker: {
    marginBottom: 24,
  },
  hourChip: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
    minWidth: 70,
    alignItems: "center",
  },
  hourChipActive: {
    backgroundColor: COLORS.primary,
  },
  hourChipText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  hourChipTextActive: {
    color: COLORS.white,
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
