import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuthStore } from "../store/authStore";
import { removeToken } from "../services/auth";

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  async function handleSignOut() {
    await removeToken();
    logout();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {user?.name ?? "User"}!</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
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
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  signOutButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  signOutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
