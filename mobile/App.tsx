import { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuthStore } from "./src/store/authStore";
import { getToken } from "./src/services/auth";
import { apiClient, setTokenGetter } from "./src/api/client";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  const { login, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
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

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
