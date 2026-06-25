import { useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  Avatar,
  Surface,
  Switch,
  useTheme,
  Divider,
} from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useAuthStore } from "../store/authStore";
import { useHistoryStore } from "../store/historyStore";
import { useThemeStore, type ThemeMode } from "../store/themeStore";
import { removeToken } from "../services/auth";
import { useSnackbar } from "../hooks/useSnackbar";

const APP_VERSION = "1.0.0";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { totalScans, fetchStats } = useHistoryStore();
  const { mode, setMode } = useThemeStore();
  const theme = useTheme();
  const snackbar = useSnackbar();

  useEffect(() => {
    fetchStats();
  }, []);

  async function handleSignOut() {
    try {
      await GoogleSignin.signOut();
      await removeToken();
      logout();
    } catch {
      snackbar.show("Failed to sign out. Please try again.");
    }
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const isDark = theme.dark;

  function handleThemeToggle() {
    const next: ThemeMode = isDark ? "light" : "dark";
    setMode(next);
  }

  function handleThemeMode() {
    const modes: ThemeMode[] = ["light", "dark", "system"];
    const currentIndex = modes.indexOf(mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setMode(nextMode);
  }

  const modeLabels: Record<ThemeMode, string> = {
    light: "Light",
    dark: "Dark",
    system: "System",
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
          Profile
        </Text>

        <Surface style={[styles.profileCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.avatarSection}>
            {user?.avatarUrl ? (
              <Avatar.Image size={80} source={{ uri: user.avatarUrl }} />
            ) : (
              <Avatar.Text
                size={80}
                label={initials}
                color="#fff"
                style={{ backgroundColor: theme.colors.primary }}
              />
            )}
            <Text variant="titleLarge" style={[styles.name, { color: theme.colors.onSurface }]}>
              {user?.name ?? "Unknown User"}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {user?.email}
            </Text>
          </View>
        </Surface>

        <Surface style={[styles.statsCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.statRow}>
            <View style={styles.statIcon}>
              <MaterialCommunityIcons name="leaf" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Total Scans
              </Text>
              <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: "700" }}>
                {totalScans}
              </Text>
            </View>
          </View>
        </Surface>

        <Surface style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text
            variant="labelLarge"
            style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 1, marginBottom: 16 }}
          >
            SETTINGS
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name={isDark ? "weather-night" : "weather-sunny"}
                size={22}
                color={theme.colors.onSurface}
              />
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginLeft: 12 }}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              color={theme.colors.primary}
            />
          </View>

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="theme-light-dark"
                size={22}
                color={theme.colors.onSurface}
              />
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginLeft: 12 }}>
                Theme Mode
              </Text>
            </View>
            <Button
              mode="text"
              onPress={handleThemeMode}
              compact
            >
              {modeLabels[mode]}
            </Button>
          </View>

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="information-outline"
                size={22}
                color={theme.colors.onSurface}
              />
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginLeft: 12 }}>
                App Version
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {APP_VERSION}
            </Text>
          </View>
        </Surface>

        <Button
          mode="contained"
          onPress={handleSignOut}
          icon={() => <MaterialCommunityIcons name="logout" size={20} color="#fff" />}
          buttonColor={theme.colors.error}
          textColor="#fff"
          style={styles.signOutButton}
          contentStyle={styles.signOutContent}
        >
          Sign Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontWeight: "700",
    marginBottom: 20,
  },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  avatarSection: {
    alignItems: "center",
  },
  name: {
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  statContent: {
    flex: 1,
  },
  settingsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    marginVertical: 4,
  },
  signOutButton: {
    borderRadius: 12,
    marginTop: "auto",
  },
  signOutContent: {
    height: 48,
  },
});
