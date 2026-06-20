import { useEffect, useState, useRef } from "react";
import { View, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { uploadImage } from "../services/upload";
import { getDiagnosis } from "../services/diagnosis";
import { useUploadStore } from "../store/uploadStore";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import type { RootStackParamList } from "../navigation/types";

type AnalysisNav = NativeStackNavigationProp<RootStackParamList, "Analysis">;
type AnalysisRoute = RouteProp<RootStackParamList, "Analysis">;

export default function AnalysisScreen() {
  const navigation = useNavigation<AnalysisNav>();
  const route = useRoute<AnalysisRoute>();
  const { imageUrl } = route.params;
  const { setImage, setUploaded, setError } = useUploadStore();
  const [loading, setLoading] = useState(true);
  const [error, setLocalError] = useState<string | null>(null);
  const cloudinaryUrl = useRef<string | null>(
    imageUrl.startsWith("http") ? imageUrl : null,
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      let url = cloudinaryUrl.current;

      if (!url) {
        try {
          url = await uploadImage(imageUrl);
          setUploaded(url);
          setImage(imageUrl);
        } catch (err) {
          if (!cancelled) {
            const msg = err instanceof Error ? err.message : "Upload failed";
            setError(msg);
            setLocalError(msg);
            setLoading(false);
          }
          return;
        }
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
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ErrorState message={error} onRetry={() => navigation.replace("Analysis", { imageUrl })} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        <LoadingState message={cloudinaryUrl.current ? "Analyzing your plant..." : "Uploading image..."} />
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
  image: {
    width: "100%",
    height: 240,
    borderRadius: 12,
    marginBottom: 24,
  },
});
