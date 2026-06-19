import { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useAuthStore } from "./src/store/authStore";
import { getToken } from "./src/services/auth";
import { apiClient, setTokenGetter } from "./src/api/client";
import AppNavigator from "./src/navigation/AppNavigator";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

export default function App() {
  const { login, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    console.log("[App] Configuring GoogleSignin...");
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    restoreSession();
  }, []);

  async function restoreSession() {
    console.log("[App] Restoring session...");
    const token = await getToken();

    if (!token) {
      console.log("[App] No saved token found — user must sign in");
      setLoading(false);
      return;
    }

    console.log("[App] Saved token found, wiring to API client...");
    setTokenGetter(() => token);

    try {
      console.log("[App] Verifying token with backend...");
      const res = await apiClient.get("/auth/me");
      console.log("[App] Token valid — user:", res.data.email);
      login(res.data, token);
    } catch (error: any) {
      if (error.response) {
        console.error(`[App] Token verification failed: ${error.response.status}`, error.response.data);
      } else if (error.request) {
        console.error("[App] Network error during session restore — backend unreachable");
      } else {
        console.error("[App] Session restore error:", error.message);
      }
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
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
