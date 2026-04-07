import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NewRecordScreen from "../screens/NewRecordScreen";
import RecordDetailScreen from "../screens/RecordDetailScreen";
import TabNavigator from "./TabNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: "#F5F3F1" },
        }}
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="RecordDetail" component={RecordDetailScreen} />
        <Stack.Screen name="EditRecord" component={NewRecordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
