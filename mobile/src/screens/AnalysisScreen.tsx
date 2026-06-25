import { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, ProgressBar, useTheme, Button } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { uploadImage } from "../services/upload";
import { getDiagnosis } from "../services/diagnosis";
import { useUploadStore } from "../store/uploadStore";
import type { RootStackParamList } from "../navigation/types";

type AnalysisNav = NativeStackNavigationProp<RootStackParamList, "Analysis">;
type AnalysisRoute = RouteProp<RootStackParamList, "Analysis">;

export default function AnalysisScreen() {
  const navigation = useNavigation<AnalysisNav>();
  const route = useRoute<AnalysisRoute>();
  const { imageUrl } = route.params;
  const { setImage, setUploaded, setError } = useUploadStore();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setLocalError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Uploading image...");
  const cloudinaryUrl = useRef<string | null>(
    imageUrl.startsWith("http") ? imageUrl : null,
  );
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    pulse.start();
    rotate.start();
    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, []);

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      let url = cloudinaryUrl.current;
      if (!url) {
        try {
          url = await uploadImage(imageUrl);
          setUploaded(url);
          setImage(imageUrl);
          setStatusText("Analyzing your plant...");
        } catch (err) {
          if (!cancelled) {
            const msg = err instanceof Error ? err.message : "Upload failed";
            setError(msg);
            setLocalError(msg);
            setLoading(false);
          }
          return;
        }
      } else {
        setStatusText("Analyzing your plant...");
      }
      try {
        const result = await getDiagnosis(url);
        if (!cancelled) {
          navigation.replace("Result", { ...result, imageUrl: url, diagnosisId: result.diagnosisId });
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Diagnosis failed";
          setLocalError(msg);
          setLoading(false);
        }
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["top", "bottom"]}>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text variant="bodyLarge" style={{ color: theme.colors.error, textAlign: "center", marginTop: 12, marginBottom: 24 }}>
            {error}
          </Text>
          <Button mode="contained" onPress={() => navigation.replace("Analysis", { imageUrl })}>
            Try Again
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Card mode="elevated" style={[styles.imageCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Cover source={{ uri: imageUrl }} style={styles.image} />
        </Card>

        <View style={styles.loadingSection}>
          <Animated.View style={[styles.iconContainer, { opacity: pulseAnim }]}>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
              <MaterialCommunityIcons name="leaf" size={48} color={theme.colors.primary} />
            </Animated.View>
          </Animated.View>

          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurface, fontWeight: "600", marginTop: 20, marginBottom: 12 }}
          >
            {statusText}
          </Text>

          <ProgressBar
            indeterminate
            color={theme.colors.primary}
            style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
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
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  imageCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 32,
  },
  image: {
    height: 240,
    borderRadius: 0,
  },
  loadingSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    width: "80%",
    maxWidth: 280,
  },
});
