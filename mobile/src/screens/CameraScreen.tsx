import { useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button, IconButton, Text, useTheme, ActivityIndicator } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useUploadStore } from "../store/uploadStore";
import { uploadImage } from "../services/upload";
import type { RootStackParamList } from "../navigation/types";
import { useSnackbar } from "../hooks/useSnackbar";

type CameraNav = NativeStackNavigationProp<RootStackParamList>;

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [captured, setCaptured] = useState(false);
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [facing, setFacing] = useState<"front" | "back">("back");
  const { setImage, setUploaded, setError } = useUploadStore();
  const navigation = useNavigation<CameraNav>();
  const theme = useTheme();
  const snackbar = useSnackbar();

  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["top", "bottom"]}>
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons name="camera-off" size={64} color={theme.colors.onSurfaceVariant} />
          <Text variant="titleLarge" style={[styles.permissionTitle, { color: theme.colors.onSurface }]}>
            Camera Access Required
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.permissionText, { color: theme.colors.onSurfaceVariant }]}
          >
            We need access to your camera to take plant photos.
          </Text>
          <Button mode="contained" onPress={requestPermission} style={styles.permissionButton}>
            Grant Permission
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.permissionBack}
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || captured) return;
    setCaptured(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new Error("Failed to capture photo");
      setImage(photo.uri);
      navigation.navigate("Analysis", { imageUrl: photo.uri });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Capture failed";
      setError(message);
      snackbar.show(message);
      setCaptured(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: "#000" }]} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} flash={flash}>
          <View style={styles.cameraOverlay}>
            <Text style={[styles.cameraHint, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
              Frame the plant in the center
            </Text>
          </View>
        </CameraView>

        <View style={[styles.controls, { backgroundColor: "#000" }]}>
          <IconButton
            icon={() => (
              <MaterialCommunityIcons
                name="flashlight"
                size={24}
                color={flash === "on" ? "#FFD700" : "#fff"}
              />
            )}
            onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
          />

          <Button
            mode="contained"
            onPress={handleCapture}
            disabled={captured}
            loading={captured}
            icon={() => <MaterialCommunityIcons name="camera" size={20} color="#fff" />}
            style={styles.captureButton}
            contentStyle={styles.captureButtonContent}
          >
            {captured ? "Processing..." : "Capture"}
          </Button>

          <IconButton
            icon={() => (
              <MaterialCommunityIcons
                name="camera-flip"
                size={24}
                color="#fff"
              />
            )}
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          />
        </View>
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
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  cameraHint: {
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  captureButton: {
    borderRadius: 28,
    minWidth: 140,
  },
  captureButtonContent: {
    height: 48,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  permissionTitle: {
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  permissionText: {
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    width: "100%",
    maxWidth: 280,
    borderRadius: 12,
  },
  permissionBack: {
    marginTop: 12,
    width: "100%",
    maxWidth: 280,
    borderRadius: 12,
  },
});
