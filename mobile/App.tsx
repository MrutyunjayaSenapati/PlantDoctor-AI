import { useEffect } from "react";
import { useColorScheme, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider, ActivityIndicator } from "react-native-paper";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useAuthStore } from "./src/store/authStore";
import { useThemeStore } from "./src/store/themeStore";
import { getToken } from "./src/services/auth";
import { apiClient, setTokenGetter } from "./src/api/client";
import { lightTheme, darkTheme } from "./src/theme";
import { SnackbarProvider } from "./src/hooks/useSnackbar";
import AppNavigator from "./src/navigation/AppNavigator";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

export default function App() {
  const systemScheme = useColorScheme();
  const { init: initTheme, mode } = useThemeStore();
  const { login, setLoading, isLoading } = useAuthStore();

  const resolved: "light" | "dark" = mode === "system"
    ? systemScheme === "dark" ? "dark" : "light"
    : mode;

  const theme = resolved === "dark" ? darkTheme : lightTheme;

  useEffect(() => {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    initTheme();
    restoreSession();
  }, []);

  async function restoreSession() {
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setTokenGetter(() => token);
    try {
      const res = await apiClient.get("/auth/me");
      login(res.data, token);
    } catch {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <SnackbarProvider>
          <AppNavigator />
        </SnackbarProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
