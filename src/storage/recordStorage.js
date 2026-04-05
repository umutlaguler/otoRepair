import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_RECORDS } from '../constants/mockData';

const STORAGE_KEY = '@dijital_foreman_records';
const INITIALIZED_KEY = '@dijital_foreman_initialized';
const APPOINTMENTS_KEY = '@dijital_foreman_appointments';

/**
 * İlk çalıştırmada mock verileri yükler
 */
export async function initializeStorage() {
  try {
    const initialized = await AsyncStorage.getItem(INITIALIZED_KEY);
    if (!initialized) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
      await AsyncStorage.setItem(INITIALIZED_KEY, 'true');
    }
  } catch (error) {
    console.error('Storage initialization error:', error);
  }
}

/**
 * Tüm kayıtları getirir (en yeni en üstte)
 */
export async function getAllRecords() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const records = JSON.parse(data);
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Error reading records:', error);
    return [];
  }
}

/**
 * Tek bir kaydı ID ile getirir
 */
export async function getRecordById(id) {
  try {
    const records = await getAllRecords();
    return records.find((r) => r.id === id) || null;
  } catch (error) {
    console.error('Error getting record:', error);
    return null;
  }
}

/**
 * Yeni kayıt ekler
 */
export async function addRecord(record) {
  try {
    const records = await getAllRecords();
    const newRecord = {
      ...record,
      id: Date.now().toString(),
    };
    records.push(newRecord);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return newRecord;
  } catch (error) {
    console.error('Error adding record:', error);
    return null;
  }
}

/**
 * Mevcut kaydı günceller
 */
export async function updateRecord(updatedRecord) {
  try {
    const records = await getAllRecords();
    const index = records.findIndex((r) => r.id === updatedRecord.id);
    if (index === -1) return false;
    records[index] = updatedRecord;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (error) {
    console.error('Error updating record:', error);
    return false;
  }
}

/**
 * Kaydı siler
 */
export async function deleteRecord(id) {
  try {
    const records = await getAllRecords();
    const filtered = records.filter((r) => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting record:', error);
    return false;
  }
}

/**
 * Kayıtlarda arama yapar (plaka, isim, telefon)
 */
export async function searchRecords(query) {
  try {
    const records = await getAllRecords();
    if (!query || query.trim() === '') return records;
    const q = query.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.plate.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.includes(q)
    );
  } catch (error) {
    console.error('Error searching records:', error);
    return [];
  }
}

/**
 * Belirli bir plakaya ait tum kayitlari getirir (en yeni en ustte)
 */
export async function getRecordsByPlate(plate) {
  try {
    const records = await getAllRecords();
    if (!plate || plate.trim() === '') return [];
    const p = plate.toLowerCase().trim();
    return records.filter((r) => r.plate.toLowerCase().trim() === p);
  } catch (error) {
    console.error('Error getting records by plate:', error);
    return [];
  }
}

/**
 * Storage'ı sıfırlar (geliştirme amaçlı)
 */
export async function resetStorage() {
  try {
    await AsyncStorage.removeItem(INITIALIZED_KEY);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await initializeStorage();
  } catch (error) {
    console.error('Error resetting storage:', error);
  }
}

// ===================== RANDEVU (APPOINTMENT) FONKSIYONLARI =====================

/**
 * Belirli bir güne ait randevuları getirir
 * dateStr: "YYYY-MM-DD"
 */
export async function getAppointmentsByDate(dateStr) {
  try {
    const data = await AsyncStorage.getItem(APPOINTMENTS_KEY);
    if (!data) return [];
    const all = JSON.parse(data);
    return (all[dateStr] || []).sort((a, b) => a.time.localeCompare(b.time));
  } catch (error) {
    console.error('Error reading appointments:', error);
    return [];
  }
}

/**
 * Randevu ekler
 * dateStr: "YYYY-MM-DD"
 * appointment: { customerName, time }
 */
export async function addAppointment(dateStr, appointment) {
  try {
    const data = await AsyncStorage.getItem(APPOINTMENTS_KEY);
    const all = data ? JSON.parse(data) : {};
    if (!all[dateStr]) all[dateStr] = [];
    all[dateStr].push({
      id: Date.now().toString(),
      ...appointment,
    });
    await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));
    return true;
  } catch (error) {
    console.error('Error adding appointment:', error);
    return false;
  }
}

/**
 * Randevu siler
 */
export async function removeAppointment(dateStr, appointmentId) {
  try {
    const data = await AsyncStorage.getItem(APPOINTMENTS_KEY);
    if (!data) return false;
    const all = JSON.parse(data);
    if (!all[dateStr]) return false;
    all[dateStr] = all[dateStr].filter((a) => a.id !== appointmentId);
    await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));
    return true;
  } catch (error) {
    console.error('Error removing appointment:', error);
    return false;
  }
}
