import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { useAuthStore } from "../store/authStore";
import { saveToken } from "../services/auth";
import { apiClient } from "../api/client";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

export default function LoginScreen() {
  const { login } = useAuthStore();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  async function handleGoogleSignIn() {
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) {
        Alert.alert("Error", "Failed to get ID token from Google");
        return;
      }
      const res = await apiClient.post("/auth/google", { idToken });
      const { accessToken, user } = res.data;
      await saveToken(accessToken);
      login(user, accessToken);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        return;
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services are not available");
        return;
      }
      console.error("Google sign-in failed:", error);
      Alert.alert("Error", "Google sign-in failed. Please try again.");
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
