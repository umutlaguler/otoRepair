import { registerRootComponent } from "expo";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { PostHogProvider } from "posthog-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import TrialExpiredScreen from "./src/screens/TrialExpiredScreen";
import { initializeStorage } from "./src/storage/recordStorage";
import { requestNotificationPermissions } from "./src/utils/notifications";
import useTrial from "./src/utils/useTrial";

const POSTHOG_API_KEY = Constants.expoConfig?.extra?.posthogApiKey;
const POSTHOG_HOST = Constants.expoConfig?.extra?.posthogHost;

function AppContent() {
  const [ready, setReady] = useState(false);
  const { loading: trialLoading, expired } = useTrial();

  useEffect(() => {
    async function init() {
      await initializeStorage();
      await requestNotificationPermissions();
      setReady(true);
    }
    init();
  }, []);

  // Herhangi bir kontrol devam ediyorsa loading goster
  if (!ready || trialLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0D47A1" />
      </View>
    );
  }

  // Deneme suresi dolduysa kilit ekrani goster
  if (expired) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <TrialExpiredScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function App() {
  // PostHog API key yoksa provider'siz calistir (crash onleme)
  if (!POSTHOG_API_KEY) {
    return <AppContent />;
  }

  return (
    <PostHogProvider
      apiKey={POSTHOG_API_KEY}
      options={{
        host: POSTHOG_HOST,
      }}
      autocapture={{
        captureTouches: true,
        captureLifecycleEvents: true,
        captureScreens: false,
      }}
    >
      <AppContent />
    </PostHogProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F3F1",
  },
});

export default App;
registerRootComponent(App);
