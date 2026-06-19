import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { useAuthStore } from "../store/authStore";
import { saveToken } from "../services/auth";
import { apiClient, setTokenGetter } from "../api/client";

export default function LoginScreen() {
  const { login } = useAuthStore();

  async function handleGoogleSignIn() {
    try {
      console.log("[Login] Checking Play Services...");
      await GoogleSignin.hasPlayServices();
      console.log("[Login] Play Services OK");

      console.log("[Login] Starting Google sign-in...");
      await GoogleSignin.signIn();
      console.log("[Login] Google sign-in completed");

      console.log("[Login] Getting ID token...");
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) {
        console.error("[Login] No ID token returned from Google");
        Alert.alert("Error", "Failed to get ID token from Google");
        return;
      }
      console.log("[Login] ID token received");

      console.log("[Login] Authenticating with backend...");
      const res = await apiClient.post("/auth/google", { idToken });
      const { accessToken, user } = res.data;
      console.log("[Login] Backend auth success — user:", user.email);

      console.log("[Login] Saving token...");
      await saveToken(accessToken);

      console.log("[Login] Wiring token to API client...");
      setTokenGetter(() => accessToken);

      console.log("[Login] Updating auth state...");
      login(user, accessToken);

      console.log("[Login] ✅ Complete");
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("[Login] User cancelled sign-in");
        return;
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        console.log("[Login] Sign-in already in progress");
        return;
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error("[Login] Play Services not available");
        Alert.alert("Error", "Google Play Services are not available");
        return;
      }
      if (error.response) {
        console.error(`[Login] Backend error ${error.response.status}:`, error.response.data);
        const msg = error.response.data?.message || error.message;
        Alert.alert("Authentication Failed", msg);
      } else if (error.request) {
        console.error("[Login] Network error — backend unreachable at", apiClient.defaults.baseURL);
        Alert.alert("Connection Error", "Cannot reach the server. Make sure the backend is running.");
      } else {
        console.error("[Login] Unexpected error:", error);
        Alert.alert("Error", "Google sign-in failed. Please try again.");
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PlantDoc AI</Text>
      <Text style={styles.subtitle}>Identify plant diseases instantly with AI</Text>
      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 48,
    textAlign: "center",
  },
  googleButton: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  googleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
