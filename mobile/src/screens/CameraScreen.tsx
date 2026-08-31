import { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button, Text, ActivityIndicator } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useUploadStore } from "../store/uploadStore";
import { validateImage } from "../services/imageSanitizer";
import type { RootStackParamList } from "../navigation/types";
import { useSnackbar } from "../hooks/useSnackbar";

type CameraNav = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SCAN_FRAME_SIZE = Math.min(SCREEN_WIDTH * 0.78, 300);

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [captured, setCaptured] = useState(false);
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [scanMode, setScanMode] = useState<"single" | "multi">("single");
  const [multiShots, setMultiShots] = useState<string[]>([]);

  const { setImage, setError } = useUploadStore();
  const navigation = useNavigation<CameraNav>();
  const snackbar = useSnackbar();

  // Scanline animation
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: SCAN_FRAME_SIZE - 6,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    scanLoop.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.65,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      scanLoop.stop();
      pulseLoop.stop();
    };
  }, [scanAnim, pulseAnim]);

  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: "#0A0F0D" }]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: "#0A0F0D" }]} edges={["top", "bottom"]}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIconCircle}>
            <MaterialCommunityIcons name="camera-off" size={48} color="#10B981" />
          </View>
          <Text variant="titleLarge" style={styles.permissionTitle}>
            Camera Access Required
          </Text>
          <Text variant="bodyMedium" style={styles.permissionText}>
            PlantDoc AI uses your camera to analyze leaf lesions and diagnose diseases in high resolution.
          </Text>
          <Button
            mode="contained"
            onPress={requestPermission}
            style={styles.permissionButton}
            buttonColor="#10B981"
            textColor="#0A0F0D"
          >
            Grant Permission
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.permissionBack}
            textColor="#9CA3AF"
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
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.75,
        skipProcessing: false,
      });

      if (!photo?.uri) throw new Error("Failed to capture image");

      // Frontend Sanitization Pre-check
      const validation = await validateImage(photo.uri);
      if (!validation.isValid) {
        snackbar.show(validation.reason || "⚠️ Please capture a clear photo of a plant leaf.");
        return;
      }

      if (scanMode === "single") {
        setImage(photo.uri);
        navigation.navigate("Analysis", { imageUrl: photo.uri });
      } else {
        const updatedShots = [...multiShots, photo.uri];
        setMultiShots(updatedShots);

        if (updatedShots.length >= 2) {
          setImage(updatedShots[0]);
          navigation.navigate("Analysis", { imageUrl: updatedShots[0] });
        } else {
          snackbar.show("Step 1 captured! Now snap the stem or overall plant.");
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Capture failed";
      setError(message);
      snackbar.show(message);
    } finally {
      setCaptured(false);
    }
  }

  async function handleGalleryPick() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.75,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;

        // Frontend Sanitization Pre-check
        const validation = await validateImage(uri);
        if (!validation.isValid) {
          snackbar.show(validation.reason || "⚠️ Please select a clear photo of a plant leaf.");
          return;
        }

        setImage(uri);
        navigation.navigate("Analysis", { imageUrl: uri });
      }
    } catch {
      snackbar.show("Failed to select image from gallery");
    }
  }

  function handleResetMulti() {
    setMultiShots([]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: "#000" }]} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Camera View rendered as background layer */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flash}
        />

        {/* UI Overlay Controls */}
        <View style={styles.overlayContainer} pointerEvents="box-none">
          {/* Top Bar Controls */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Close camera"
            >
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Scan Mode Toggle Pill */}
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  scanMode === "single" && styles.modeButtonActive,
                ]}
                onPress={() => {
                  setScanMode("single");
                  setMultiShots([]);
                }}
              >
                <Text
                  style={[
                    styles.modeText,
                    scanMode === "single" && styles.modeTextActive,
                  ]}
                >
                  Quick
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  scanMode === "multi" && styles.modeButtonActive,
                ]}
                onPress={() => setScanMode("multi")}
              >
                <Text
                  style={[
                    styles.modeText,
                    scanMode === "multi" && styles.modeTextActive,
                  ]}
                >
                  2-Shot Deep
                </Text>
              </TouchableOpacity>
            </View>

            {/* Flash / Torch Toggle */}
            <TouchableOpacity
              style={[
                styles.headerIconButton,
                flash === "on" && styles.headerIconButtonGlow,
              ]}
              onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
              accessibilityLabel="Toggle flash"
            >
              <MaterialCommunityIcons
                name={flash === "on" ? "flashlight" : "flashlight-off"}
                size={22}
                color={flash === "on" ? "#F59E0B" : "#fff"}
              />
            </TouchableOpacity>
          </View>

          {/* Center Scan Reticle & Guidance */}
          <View style={styles.reticleContainer} pointerEvents="none">
            {/* Dynamic Guidance Pill */}
            <View style={styles.guidancePill}>
              <MaterialCommunityIcons
                name={scanMode === "multi" && multiShots.length === 1 ? "tree" : "leaf"}
                size={16}
                color="#10B981"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.guidanceText}>
                {scanMode === "multi"
                  ? multiShots.length === 0
                    ? "Step 1: Frame leaf close-up"
                    : "Step 2: Frame stem or whole plant"
                  : "Align affected leaf inside brackets"}
              </Text>
            </View>

            {/* Target Box with 4 Corner Brackets */}
            <View style={styles.scanBox}>
              <Animated.View style={[styles.cornerTopLeft, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.cornerTopRight, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.cornerBottomLeft, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.cornerBottomRight, { opacity: pulseAnim }]} />

              <View style={styles.centerTargetDot} />

              <Animated.View
                style={[
                  styles.laserLine,
                  {
                    transform: [{ translateY: scanAnim }],
                  },
                ]}
              />
            </View>
          </View>

          {/* Multi-Shot Preview Bar if any shot taken */}
          {scanMode === "multi" && multiShots.length > 0 && (
            <View style={styles.multiShotTray}>
              <View style={styles.thumbContainer}>
                <Image source={{ uri: multiShots[0] }} style={styles.thumbImage} />
                <View style={styles.thumbBadge}>
                  <MaterialCommunityIcons name="check" size={12} color="#fff" />
                </View>
              </View>
              <Text style={styles.multiShotHint}>Shot 1/2 captured</Text>
              <TouchableOpacity onPress={handleResetMulti} style={styles.retakeButton}>
                <Text style={styles.retakeText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Control Bar */}
          <View style={styles.controlsBar}>
            <TouchableOpacity
              style={styles.sideButton}
              onPress={handleGalleryPick}
              accessibilityLabel="Open gallery"
            >
              <MaterialCommunityIcons name="image-multiple-outline" size={26} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCapture}
              disabled={captured}
              activeOpacity={0.8}
              style={styles.shutterOuter}
              accessibilityLabel="Take diagnosis photo"
            >
              <View style={[styles.shutterInner, captured && styles.shutterProcessing]}>
                {captured ? (
                  <ActivityIndicator size="small" color="#0A0F0D" />
                ) : (
                  <View style={styles.shutterCore} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideButton}
              onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
              accessibilityLabel="Flip camera"
            >
              <MaterialCommunityIcons name="camera-flip-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const CORNER_SIZE = 26;
const CORNER_THICKNESS = 3.5;
const ACCENT_GREEN = "#10B981";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: "relative",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 10,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconButtonGlow: {
    backgroundColor: "rgba(245, 158, 11, 0.25)",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  modeToggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  modeButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  modeButtonActive: {
    backgroundColor: ACCENT_GREEN,
  },
  modeText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  modeTextActive: {
    color: "#0A0F0D",
    fontWeight: "700",
  },
  reticleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  guidancePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10, 15, 13, 0.75)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
  },
  guidanceText: {
    color: "#F3F4F6",
    fontSize: 13,
    fontWeight: "600",
  },
  scanBox: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  cornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: ACCENT_GREEN,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: ACCENT_GREEN,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: ACCENT_GREEN,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: ACCENT_GREEN,
    borderBottomRightRadius: 8,
  },
  centerTargetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(16, 185, 129, 0.7)",
  },
  laserLine: {
    position: "absolute",
    top: 0,
    left: 8,
    right: 8,
    height: 2.5,
    backgroundColor: ACCENT_GREEN,
    shadowColor: ACCENT_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  multiShotTray: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(10, 15, 13, 0.8)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  thumbContainer: {
    position: "relative",
    marginRight: 10,
  },
  thumbImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  thumbBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: ACCENT_GREEN,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  multiShotHint: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 12,
  },
  retakeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 8,
  },
  retakeText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "700",
  },
  controlsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 24,
    paddingHorizontal: 24,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3.5,
    borderColor: ACCENT_GREEN,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterProcessing: {
    backgroundColor: ACCENT_GREEN,
  },
  shutterCore: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fff",
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  permissionIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  permissionTitle: {
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 10,
    textAlign: "center",
  },
  permissionText: {
    textAlign: "center",
    color: "#9CA3AF",
    marginBottom: 28,
    lineHeight: 22,
  },
  permissionButton: {
    width: "100%",
    maxWidth: 280,
    borderRadius: 12,
    paddingVertical: 4,
  },
  permissionBack: {
    marginTop: 12,
    width: "100%",
    maxWidth: 280,
    borderRadius: 12,
    borderColor: "#374151",
  },
});
