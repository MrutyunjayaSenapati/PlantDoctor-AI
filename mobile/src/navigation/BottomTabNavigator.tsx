import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { BottomTabParamList } from "./types";
import HomeScreen from "../screens/HomeScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator<BottomTabParamList>();

type TabName = keyof BottomTabParamList;

const tabIcons: Record<TabName, { focused: keyof typeof MaterialCommunityIcons.glyphMap; unfocused: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  Home: { focused: "home", unfocused: "home-outline" },
  History: { focused: "history", unfocused: "history" },
  Profile: { focused: "account", unfocused: "account-outline" },
};

export default function BottomTabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => {
          const icons = tabIcons[route.name as TabName];
          return (
            <MaterialCommunityIcons
              name={focused ? icons.focused : icons.unfocused}
              size={size}
              color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 0.5,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
