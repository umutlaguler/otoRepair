import { Platform } from 'react-native';

let Notifications = null;

// expo-notifications sadece native platformlarda calisir
// Web ve Expo Go'da native module yok, hata vermemesi icin kontrol ediyoruz
function isNotificationsAvailable() {
  return Platform.OS !== 'web' && Notifications !== null;
}

// Module'u guvenli sekilde yukle
try {
  Notifications = require('expo-notifications');
  if (isNotificationsAvailable()) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
} catch (e) {
  console.log('expo-notifications yuklenemedi (web veya Expo Go ortami).');
  Notifications = null;
}

/**
 * Bildirim izinlerini ister
 */
export async function requestNotificationPermissions() {
  if (!isNotificationsAvailable()) {
    console.log('Bildirimler bu platformda desteklenmiyor.');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Bildirim izni verilmedi.');
      return false;
    }

    // Android icin bildirim kanali olustur
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('appointments', {
        name: 'Randevu Bildirimleri',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.error('Bildirim izni hatasi:', error);
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
export async function scheduleAppointmentNotification(dateStr, time, customerName, appointmentId) {
  if (!isNotificationsAvailable()) return null;

  try {
    // Randevu tarih/saat objesini olustur
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);

    const appointmentDate = new Date(year, month - 1, day, hour, minute, 0);

    // 30 dakika oncesini hesapla
    const notifyDate = new Date(appointmentDate.getTime() - 30 * 60 * 1000);

    // Eger bildirim zamani gecmisse, zamanlama
    if (notifyDate.getTime() <= Date.now()) {
      console.log('Bildirim zamani gecmis, zamanlanmadi.');
      return null;
    }

    const secondsUntilNotify = Math.floor((notifyDate.getTime() - Date.now()) / 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Randevu Hatirlatma',
        body: `${customerName} - Saat ${time} randevunuz 30 dakika sonra!`,
        data: { appointmentId, dateStr, time },
        ...(Platform.OS === 'android' ? { channelId: 'appointments' } : {}),
      },
      trigger: {
        type: 'timeInterval',
        seconds: secondsUntilNotify,
        repeats: false,
      },
    });

    console.log(`Bildirim zamanlandi: ${notificationId} - ${secondsUntilNotify}sn sonra`);
    return notificationId;
  } catch (error) {
    console.error('Bildirim zamanlama hatasi:', error);
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
    console.error('Bildirim iptal hatasi:', error);
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
    console.error('Tum bildirimler iptal hatasi:', error);
  }
}
