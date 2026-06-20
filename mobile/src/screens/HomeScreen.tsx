import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../store/authStore";
import { useUploadStore } from "../store/uploadStore";
import { uploadImage } from "../services/upload";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import type { RootStackParamList } from "../navigation/types";

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { setImage, setUploading, setUploaded, setError } = useUploadStore();
  const navigation = useNavigation<HomeNav>();

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera access is needed to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setImage(uri);
    setUploading(true);

    try {
      const imageUrl = await uploadImage(uri);
      setUploaded(imageUrl);
      navigation.navigate("Analysis", { imageUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      Alert.alert("Upload Failed", message);
    }
  }

  async function handleUploadGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Gallery access is needed to select photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setImage(uri);
    setUploading(true);

    try {
      const imageUrl = await uploadImage(uri);
      setUploaded(imageUrl);
      navigation.navigate("Analysis", { imageUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      Alert.alert("Upload Failed", message);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Hello, {user?.name ?? "Plant Parent"}! 🌱</Text>
          <Text style={styles.tagline}>Identify any plant disease instantly</Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="Take Photo"
            variant="primary"
            onPress={handleTakePhoto}
            style={styles.actionButton}
          />
          <Button
            title="Upload from Gallery"
            variant="outline"
            onPress={handleUploadGallery}
            style={styles.actionButton}
          />
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Diagnoses</Text>
          <EmptyState
            icon="🔍"
            title="No diagnoses yet"
            subtitle="Take a photo or upload an image to get started"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: "#666",
  },
  actions: {
    gap: 12,
    marginBottom: 40,
  },
  actionButton: {
    width: "100%",
  },
  recentSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
  },
});
