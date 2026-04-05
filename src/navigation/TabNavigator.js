import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import NewRecordScreen from '../screens/NewRecordScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { COLORS } from '../constants/colors';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarActiveBackgroundColor: COLORS.primarySoft,
        }}
      />

      <Tab.Screen
        name="NewRecord"
        component={NewRecordScreen}
        options={{
          tabBarLabel: '+ Yeni Kayit',
          tabBarActiveBackgroundColor: COLORS.primarySoft,
        }}
      />

      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Gecmis',
          tabBarActiveBackgroundColor: COLORS.primarySoft,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 90,
    paddingBottom: 16,
    paddingTop: 12,
    paddingHorizontal: 8,
    backgroundColor: COLORS.card,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  tabItem: {
    borderRadius: 14,
    marginHorizontal: 4,
    paddingVertical: 10,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
