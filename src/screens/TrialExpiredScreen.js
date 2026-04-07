import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

// ─── İletişim bilgileri ────────────────────────────────
const CONTACT_NAME = "Umut Güler";
const CONTACT_PHONE = "0538 035 75 33";

export default function TrialExpiredScreen() {
  function handleCall() {
    Linking.openURL(`tel:${CONTACT_PHONE.replace(/\s/g, "")}`);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Kilit ikonu */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🔒</Text>
        </View>

        <Text style={styles.title}>Deneme Suresi Doldu</Text>

        <Text style={styles.message}>
          30 gunluk ucretsiz deneme suresiniz sona ermistir.{"\n\n"}
          Uygulamayi kullanmaya devam etmek icin uretici ile iletisime gecin.
        </Text>

        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCall}
          activeOpacity={0.7}
        >
          <Text style={styles.callButtonText}>
            📞 Uretici ile Iletisime Gec
          </Text>
        </TouchableOpacity>

        <Text style={styles.contactName}>{CONTACT_NAME}</Text>
        <Text style={styles.contactInfo}>{CONTACT_PHONE}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  callButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  callButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "800",
  },
  contactName: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: "800",
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: "600",
  },
});
