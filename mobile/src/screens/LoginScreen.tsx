import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button, Surface, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { useAuthStore } from "../store/authStore";
import { saveToken } from "../services/auth";
import { apiClient, setTokenGetter } from "../api/client";
import { useSnackbar } from "../hooks/useSnackbar";

export default function LoginScreen() {
  const { login } = useAuthStore();
  const theme = useTheme();
  const snackbar = useSnackbar();

  async function handleGoogleSignIn() {
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) {
        snackbar.show("Failed to get ID token from Google");
        return;
      }
      const res = await apiClient.post("/auth/google", { idToken });
      const { accessToken, user } = res.data;
      await saveToken(accessToken);
      setTokenGetter(() => accessToken);
      login(user, accessToken);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (error.code === statusCodes.IN_PROGRESS) return;
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        snackbar.show("Google Play Services are not available");
        return;
      }
      if (error.response) {
        snackbar.show(error.response.data?.message || error.message || "Authentication failed");
      } else if (error.request) {
        snackbar.show("Cannot reach the server. Make sure the backend is running.");
      } else {
        snackbar.show("Google sign-in failed. Please try again.");
      }
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <View style={styles.logoSection}>
            <View style={[styles.logoCircle, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="leaf" size={48} color={theme.colors.primary} />
            </View>
            <Text variant="displaySmall" style={[styles.title, { color: theme.colors.onSurface }]}>
              PlantDoc AI
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              Identify plant diseases instantly with AI
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={handleGoogleSignIn}
            icon={() => (
              <MaterialCommunityIcons name="google" size={20} color="#fff" />
            )}
            contentStyle={styles.googleButton}
            style={[styles.googleButtonContainer, { backgroundColor: "#4285F4" }]}
            labelStyle={styles.googleButtonText}
          >
            Sign in with Google
          </Button>
        </Surface>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 24,
  },
  googleButton: {
    height: 48,
  },
  googleButtonContainer: {
    borderRadius: 12,
    width: "100%",
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
