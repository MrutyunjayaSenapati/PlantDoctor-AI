import { useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button, Card, useTheme, ActivityIndicator } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../store/authStore";
import { useUploadStore } from "../store/uploadStore";
import { useHistoryStore } from "../store/historyStore";
import { uploadImage } from "../services/upload";
import type { RootStackParamList } from "../navigation/types";
import { useSnackbar } from "../hooks/useSnackbar";

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { setImage, setUploading, setUploaded, setError } = useUploadStore();
  const { items, loading: historyLoading, fetch } = useHistoryStore();
  const navigation = useNavigation<HomeNav>();
  const theme = useTheme();
  const snackbar = useSnackbar();

  useEffect(() => {
    fetch(1);
  }, []);

  const recentItems = items.slice(0, 3);

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      snackbar.show("Camera access is needed to take photos.");
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
      snackbar.show(message);
    }
  }

  async function handleUploadGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      snackbar.show("Gallery access is needed to select photos.");
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
      snackbar.show(message);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeRow}>
            <View style={styles.welcomeText}>
              <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
                Hello, {user?.name ?? "Plant Parent"}!
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                Identify any plant disease instantly
              </Text>
            </View>
            <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="leaf" size={28} color={theme.colors.primary} />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleTakePhoto}
            icon={() => <MaterialCommunityIcons name="camera" size={20} color="#fff" />}
            contentStyle={styles.actionButtonContent}
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
          >
            Take Photo
          </Button>
          <Button
            mode="outlined"
            onPress={handleUploadGallery}
            icon={() => <MaterialCommunityIcons name="image-plus" size={20} color={theme.colors.primary} />}
            contentStyle={styles.actionButtonContent}
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
          >
            Upload from Gallery
          </Button>
        </View>

        <View style={styles.recentSection}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Recent Diagnoses
          </Text>

          {historyLoading && recentItems.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : recentItems.length > 0 ? (
            recentItems.map((item) => (
              <Card
                key={item.id}
                style={[styles.recentCard, { backgroundColor: theme.colors.surface }]}
                mode="contained"
                onPress={() =>
                  navigation.navigate("Result", {
                    diagnosisId: item.id,
                    plant: item.plantName ?? "Unknown",
                    disease: item.diseaseName ?? "Unknown",
                    confidence: item.confidence ? Number(item.confidence) : 0,
                    status: item.status ?? "UNKNOWN",
                    explanation: item.explanation ?? "",
                    treatment: item.treatment ?? [],
                    imageUrl: item.imageUrl ?? undefined,
                  })
                }
              >
                <Card.Content style={styles.recentCardContent}>
                  <View style={styles.recentCardLeft}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                      {item.plantName ?? "Unknown plant"}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                    >
                      {item.diseaseName ?? "Unknown disease"} · {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: "700" }}>
                    {item.confidence ? `${(Number(item.confidence) * 100).toFixed(0)}%` : "—"}
                  </Text>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surfaceVariant }]}           mode="elevated">
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons name="leaf-off" size={40} color={theme.colors.onSurfaceVariant} />
                <Text
                  variant="bodyLarge"
                  style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 12 }}
                >
                  No diagnoses yet
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 4 }}
                >
                  Take a photo or upload an image to get started
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>
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
  },
  welcomeSection: {
    marginBottom: 28,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeText: {
    flex: 1,
    marginRight: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    gap: 12,
    marginBottom: 36,
  },
  actionButton: {
    borderRadius: 12,
  },
  actionButtonContent: {
    height: 52,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  recentSection: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
  },
  recentCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  recentCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recentCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 8,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
});
