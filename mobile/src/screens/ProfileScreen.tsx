import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useAuthStore } from "../store/authStore";
import { removeToken } from "../services/auth";
import Button from "../components/Button";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  async function handleSignOut() {
    try {
      await GoogleSignin.signOut();
      await removeToken();
      logout();
    } catch (error) {
      console.error("Sign out failed:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name ?? "Unknown User"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statLabel}>Total Scans</Text>
          <Text style={styles.statValue}>0</Text>
        </View>

        <View style={styles.logoutSection}>
          <Button title="Sign Out" variant="danger" onPress={handleSignOut} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 24,
  },
  card: {
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666",
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statLabel: {
    fontSize: 16,
    color: "#666",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#22C55E",
  },
  logoutSection: {
    marginTop: "auto",
    paddingTop: 24,
  },
});
