import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

// ─── Sabitler ───────────────────────────────────────────
const TRIAL_START_KEY = "trial_start_date"; // AsyncStorage anahtari
const TRIAL_DAYS = 30; // Deneme suresi (gun)

/**
 * 30 gunluk deneme suresi hook'u.
 *
 * Dondurulen degerler:
 *   loading   – kontrol devam ediyor mu
 *   expired   – deneme suresi doldu mu
 *   daysLeft  – kalan gun sayisi (0..30)
 */
export default function useTrial() {
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [daysLeft, setDaysLeft] = useState(TRIAL_DAYS);

  useEffect(() => {
    checkTrial();
  }, []);

  async function checkTrial() {
    try {
      let startDateStr = await AsyncStorage.getItem(TRIAL_START_KEY);

      // Ilk acilis — baslangic tarihini kaydet
      if (!startDateStr) {
        startDateStr = new Date().toISOString();
        await AsyncStorage.setItem(TRIAL_START_KEY, startDateStr);
      }

      // Gun farki hesapla (milisaniye → gun)
      const startDate = new Date(startDateStr);
      const now = new Date();
      const diffMs = now.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const remaining = Math.max(TRIAL_DAYS - diffDays, 0);

      setDaysLeft(remaining);
      setExpired(remaining <= 0);
    } catch {
      // Okuma hatasi olursa guvenli tarafta kal — uygulamayi ac
      setExpired(false);
      setDaysLeft(TRIAL_DAYS);
    } finally {
      setLoading(false);
    }
  }

  return { loading, expired, daysLeft };
}
