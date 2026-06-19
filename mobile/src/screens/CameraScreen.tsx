import { useRef, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useUploadStore } from "../store/uploadStore";
import { uploadImage } from "../services/upload";
import Button from "../components/Button";
import LoadingState from "../components/LoadingState";
import type { RootStackParamList } from "../navigation/types";

type CameraNav = NativeStackNavigationProp<RootStackParamList>;

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [captured, setCaptured] = useState(false);
  const { setImage, setUploaded, setError } = useUploadStore();
  const navigation = useNavigation<CameraNav>();

  if (!permission) {
    return <LoadingState message="Checking camera permissions..." />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to take plant photos.
          </Text>
          <Button title="Grant Permission" variant="primary" onPress={requestPermission} />
          <Button
            title="Go Back"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.permissionBack}
          />
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
      Alert.alert("Error", message);
      setCaptured(false);
    }
  }

  function handleBack() {
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraHint}>Frame the plant in the center</Text>
          </View>
        </CameraView>

        <View style={styles.controls}>
          <Button
            title={captured ? "Processing..." : "Capture"}
            variant="primary"
            onPress={handleCapture}
            disabled={captured}
            loading={captured}
            style={styles.button}
          />
          <Button title="Cancel" variant="outline" onPress={handleBack} style={styles.button} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
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
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  controls: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    backgroundColor: "#000",
  },
  button: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionBack: {
    marginTop: 12,
  },
});
