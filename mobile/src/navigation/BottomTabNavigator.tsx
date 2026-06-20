import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, StyleSheet } from "react-native";
import type { BottomTabParamList } from "./types";
import HomeScreen from "../screens/HomeScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator<BottomTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: "🏠",
    History: "📋",
    Profile: "👤",
  };

  return (
    <Text style={[styles.icon, focused && styles.iconFocused]}>
      {icons[label] ?? "•"}
    </Text>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: "#22C55E",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#fff",
    borderTopColor: "#E5E7EB",
    borderTopWidth: 1,
    paddingBottom: 4,
    paddingTop: 4,
    height: 60,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  icon: {
    fontSize: 24,
  },
  iconFocused: {
    fontSize: 28,
  },
});
