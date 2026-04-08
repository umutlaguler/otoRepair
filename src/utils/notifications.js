import Constants from "expo-constants";
import { Platform } from "react-native";

let Notifications = null;

// Expo Go ortaminda mi calistigini kontrol et
function isExpoGo() {
  try {
    const appOwnership = Constants.executionEnvironment;
    return appOwnership === "storeClient";
  } catch {
    return true;
  }
}

// expo-notifications sadece development build veya standalone'da calisir
// Expo Go'da SDK 53+ ile Android push destegi kaldirildi
function isNotificationsAvailable() {
  if (Platform.OS === "web") return false;
  if (isExpoGo()) return false;
  return Notifications !== null;
}

// Module'u guvenli sekilde yukle
try {
  if (!isExpoGo()) {
    Notifications = require("expo-notifications");
    if (isNotificationsAvailable()) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }
  }
} catch (e) {
  // Sessizce devam et — Expo Go veya desteklenmeyen ortam
  Notifications = null;
}

/**
 * Bildirim izinlerini ister
 */
export async function requestNotificationPermissions() {
  if (!isNotificationsAvailable()) {
    return false;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Bildirim izni verilmedi.");
      return false;
    }

    // Android icin bildirim kanali olustur
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("appointments", {
        name: "Randevu Bildirimleri",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
      });
    }

    return true;
  } catch (error) {
    console.error("Bildirim izni hatasi:", error);
    return false;
  }
}

/**
 * Randevu icin 30 dakika onceden bildirim zamanlar
 * dateStr: "YYYY-MM-DD"
 * time: "09:00"
 * customerName: "Ahmet Yilmaz"
 * appointmentId: benzersiz ID
 */
export async function scheduleAppointmentNotification(
  dateStr,
  time,
  customerName,
  appointmentId,
) {
  if (!isNotificationsAvailable()) return null;

  try {
    // Randevu tarih/saat objesini olustur
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);

    const appointmentDate = new Date(year, month - 1, day, hour, minute, 0, 0);

    // 30 dakika oncesini hesapla
    const notifyDate = new Date(appointmentDate.getTime() - 30 * 60 * 1000);

    // Eger bildirim zamani gecmisse, zamanlama
    if (notifyDate.getTime() <= Date.now()) {
      console.log("Bildirim zamani gecmis, zamanlanmadi.");
      return null;
    }

    const notifyHour = String(notifyDate.getHours()).padStart(2, "0");
    const notifyMinute = String(notifyDate.getMinutes()).padStart(2, "0");

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Randevu Hatirlatma ⏰",
        body: `${customerName} - Saat ${time} randevunuza 30 dakika kaldi!`,
        data: { appointmentId, dateStr, time },
        ...(Platform.OS === "android" ? { channelId: "appointments" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notifyDate,
        ...(Platform.OS === "android" ? { channelId: "appointments" } : {}),
      },
    });

    console.log(
      `Bildirim zamanlandi: ${notificationId} - ${notifyHour}:${notifyMinute}'de tetiklenecek (randevu: ${time})`,
    );
    return notificationId;
  } catch (error) {
    console.error("Bildirim zamanlama hatasi:", error);
    return null;
  }
}

/**
 * Belirli bir bildirimi iptal eder
 */
export async function cancelNotification(notificationId) {
  if (!isNotificationsAvailable()) return;

  try {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  } catch (error) {
    console.error("Bildirim iptal hatasi:", error);
  }
}

/**
 * Tum zamanlanmis bildirimleri iptal eder
 */
export async function cancelAllNotifications() {
  if (!isNotificationsAvailable()) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Tum bildirimler iptal hatasi:", error);
  }
}
