import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import Button from "../components/Button";
import { useFeedbackStore } from "../store/feedbackStore";
import type { RootStackParamList } from "../navigation/types";

type ResultNav = NativeStackNavigationProp<RootStackParamList, "Result">;
type ResultRoute = RouteProp<RootStackParamList, "Result">;

function confidenceLabel(score: number): string {
  if (score > 0.9) return "High Confidence";
  if (score > 0.7) return "Medium Confidence";
  return "Low Confidence";
}

function confidenceColor(score: number): string {
  if (score > 0.9) return "#22C55E";
  if (score > 0.7) return "#F59E0B";
  return "#EF4444";
}

function statusColor(status: string): string {
  if (status === "HIGH_CONFIDENCE") return "#22C55E";
  if (status === "MEDIUM_CONFIDENCE") return "#F59E0B";
  return "#EF4444";
}

export default function ResultScreen() {
  const navigation = useNavigation<ResultNav>();
  const route = useRoute<ResultRoute>();
  const { diagnosisId, plant, disease, confidence, status, explanation, treatment } = route.params;
  const { submit, submitting, error: feedbackError, reset } = useFeedbackStore();

  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [feedbackValue, setFeedbackValue] = useState(false);
  const [comment, setComment] = useState("");

  async function handleFeedback(isCorrect: boolean) {
    if (isCorrect) {
      await submit({ diagnosisId, isCorrect: true });
      setFeedbackGiven(true);
    } else {
      setFeedbackValue(false);
      setComment("");
      setModalVisible(true);
    }
  }

  async function handleSubmitWithComment() {
    const ok = await submit({ diagnosisId, isCorrect: false, comment: comment || undefined });
    if (ok) {
      setModalVisible(false);
      setFeedbackGiven(true);
    }
  }

  function handleGoHome() {
    reset();
    navigation.popToTop();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Diagnosis Result</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Plant</Text>
          <Text style={styles.value}>{plant}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Disease</Text>
          <Text style={styles.value}>{disease}</Text>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(status) + "20" }]}>
            <Text style={[styles.statusText, { color: statusColor(status) }]}>{status}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Confidence</Text>
          <View style={styles.confidenceRow}>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  { width: `${Math.round(confidence * 100)}%`, backgroundColor: confidenceColor(confidence) },
                ]}
              />
            </View>
            <Text style={[styles.confidenceText, { color: confidenceColor(confidence) }]}>
              {confidenceLabel(confidence)} ({(confidence * 100).toFixed(0)}%)
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Explanation</Text>
          <Text style={styles.explanationText}>{explanation}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Treatment</Text>
          {treatment.map((step, index) => (
            <View key={index} style={styles.treatmentItem}>
              <Text style={styles.treatmentNumber}>{index + 1}.</Text>
              <Text style={styles.treatmentText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Was this diagnosis accurate?</Text>
          {feedbackGiven ? (
            <Text style={styles.feedbackThanks}>Thanks for your feedback!</Text>
          ) : (
            <View style={styles.feedbackRow}>
              <TouchableOpacity
                style={[styles.thumbButton, styles.thumbYes]}
                onPress={() => handleFeedback(true)}
                disabled={submitting}
              >
                <Text style={styles.thumbIcon}>👍</Text>
                <Text style={styles.thumbLabel}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.thumbButton, styles.thumbNo]}
                onPress={() => handleFeedback(false)}
                disabled={submitting}
              >
                <Text style={styles.thumbIcon}>👎</Text>
                <Text style={styles.thumbLabel}>No</Text>
              </TouchableOpacity>
            </View>
          )}
          {feedbackError && <Text style={styles.feedbackError}>{feedbackError}</Text>}
        </View>

        <Button title="Back to Home" variant="primary" onPress={handleGoHome} style={styles.button} />
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Help us improve</Text>
            <Text style={styles.modalSubtitle}>Tell us what went wrong (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. wrong disease, low confidence..."
              placeholderTextColor="#999"
              multiline
              value={comment}
              onChangeText={setComment}
            />
            <View style={styles.modalButtons}>
              <Button title="Skip" variant="outline" onPress={handleSubmitWithComment} style={styles.modalBtn} />
              <Button
                title={submitting ? "Sending..." : "Send"}
                variant="primary"
                onPress={handleSubmitWithComment}
                loading={submitting}
                disabled={submitting}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  statusRow: {
    flexDirection: "row",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  confidenceRow: {
    gap: 8,
  },
  confidenceBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: "600",
  },
  explanationText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  treatmentItem: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  treatmentNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#22C55E",
    width: 20,
  },
  treatmentText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
    lineHeight: 22,
  },
  feedbackRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  thumbButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  thumbYes: {
    backgroundColor: "#22C55E20",
  },
  thumbNo: {
    backgroundColor: "#EF444420",
  },
  thumbIcon: {
    fontSize: 20,
  },
  thumbLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  feedbackThanks: {
    fontSize: 15,
    color: "#22C55E",
    fontWeight: "600",
  },
  feedbackError: {
    fontSize: 13,
    color: "#EF4444",
    marginTop: 8,
  },
  button: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#111",
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
  },
});
