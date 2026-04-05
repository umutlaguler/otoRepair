import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { registerRootComponent } from 'expo';
import RootNavigator from './src/navigation/RootNavigator';
import { initializeStorage } from './src/storage/recordStorage';
import { requestNotificationPermissions } from './src/utils/notifications';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      await initializeStorage();
      await requestNotificationPermissions();
      setReady(true);
    }
    init();
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0D47A1" />
      </View>
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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F3F1',
  },
});

export default App;
registerRootComponent(App);
