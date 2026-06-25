import { useState, useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  Chip,
  ProgressBar,
  Dialog,
  Portal,
  TextInput,
  IconButton,
  useTheme,
  Surface,
} from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useFeedbackStore } from "../store/feedbackStore";
import { useSnackbar } from "../hooks/useSnackbar";
import type { RootStackParamList } from "../navigation/types";

type ResultNav = NativeStackNavigationProp<RootStackParamList, "Result">;
type ResultRoute = RouteProp<RootStackParamList, "Result">;

function confidenceLabel(score: number): string {
  if (score > 0.9) return "High Confidence";
  if (score > 0.7) return "Medium Confidence";
  return "Low Confidence";
}

function statusVariant(status: string): "success" | "warning" | "error" {
  if (status === "HIGH_CONFIDENCE") return "success";
  if (status === "MEDIUM_CONFIDENCE") return "warning";
  return "error";
}

export default function ResultScreen() {
  const navigation = useNavigation<ResultNav>();
  const route = useRoute<ResultRoute>();
  const { diagnosisId, plant, disease, confidence, status, explanation, treatment, imageUrl } = route.params;
  const { submit, submitting, error: feedbackError, reset } = useFeedbackStore();
  const theme = useTheme();
  const snackbar = useSnackbar();
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [feedbackValue, setFeedbackValue] = useState(false);
  const [comment, setComment] = useState("");

  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: confidence,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [confidence]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  async function handleFeedback(isCorrect: boolean) {
    if (isCorrect) {
      await submit({ diagnosisId, isCorrect: true });
      setFeedbackGiven(true);
      snackbar.show("Thanks for your feedback!");
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
      snackbar.show("Thanks for your feedback!");
    }
  }

  function handleGoHome() {
    reset();
    navigation.popToTop();
  }

  const statusVariantValue = statusVariant(status);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text variant="headlineSmall" style={[styles.heading, { color: theme.colors.onSurface }]}>
          Diagnosis Result
        </Text>

        {imageUrl && (
          <Card mode="elevated" style={[styles.imageCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Cover source={{ uri: imageUrl }} style={styles.image} />
          </Card>
        )}

        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardRow}>
            <View style={styles.cardIcon}>
              <MaterialCommunityIcons name="leaf" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 1 }}>
                PLANT
              </Text>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 2 }}>
                {plant}
              </Text>
            </View>
          </View>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.cardRow}>
            <View style={styles.cardIcon}>
              <MaterialCommunityIcons name="alert-circle" size={24} color={theme.colors.error} />
            </View>
            <View style={styles.cardContent}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 1 }}>
                DISEASE
              </Text>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 2 }}>
                {disease}
              </Text>
            </View>
          </View>
        </Surface>

        <View style={styles.statusRow}>
          <Chip
            icon={() => (
              <MaterialCommunityIcons
                name={
                  statusVariantValue === "success" ? "check-circle" :
                  statusVariantValue === "warning" ? "alert" : "close-circle"
                }
                size={16}
                color={
                  statusVariantValue === "success" ? "#22C55E" :
                  statusVariantValue === "warning" ? "#F59E0B" : "#EF4444"
                }
              />
            )}
            style={{
              backgroundColor:
                statusVariantValue === "success" ? "#22C55E20" :
                statusVariantValue === "warning" ? "#F59E0B20" : "#EF444420",
            }}
            textStyle={{
              color:
                statusVariantValue === "success" ? "#22C55E" :
                statusVariantValue === "warning" ? "#F59E0B" : "#EF4444",
              fontWeight: "700",
            }}
          >
            {status}
          </Chip>
        </View>

        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 1, marginBottom: 12 }}>
            CONFIDENCE
          </Text>
          <View style={styles.confidenceRow}>
            <ProgressBar
              progress={confidence}
              color={
                confidence > 0.9 ? "#22C55E" :
                confidence > 0.7 ? "#F59E0B" : "#EF4444"
              }
              style={[styles.confidenceBar, { backgroundColor: theme.colors.surfaceVariant }]}
            />
            <Text
              variant="labelLarge"
              style={{
                color:
                  confidence > 0.9 ? "#22C55E" :
                  confidence > 0.7 ? "#F59E0B" : "#EF4444",
                fontWeight: "700",
                marginLeft: 12,
              }}
            >
              {confidenceLabel(confidence)} ({(confidence * 100).toFixed(0)}%)
            </Text>
          </View>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 1, marginBottom: 8 }}>
            EXPLANATION
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, lineHeight: 22 }}>
            {explanation}
          </Text>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 1, marginBottom: 12 }}>
            TREATMENT
          </Text>
          {treatment.map((step, index) => (
            <View key={index} style={styles.treatmentItem}>
              <Surface
                style={[styles.treatmentNumber, { backgroundColor: theme.colors.primaryContainer }]}
              >
                <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>{index + 1}</Text>
              </Surface>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1, lineHeight: 22 }}>
                {step}
              </Text>
            </View>
          ))}
        </Surface>

        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 1, marginBottom: 12 }}>
            WAS THIS DIAGNOSIS ACCURATE?
          </Text>
          {feedbackGiven ? (
            <View style={styles.feedbackThanksRow}>
              <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: "600", marginLeft: 8 }}>
                Thanks for your feedback!
              </Text>
            </View>
          ) : (
            <View style={styles.feedbackRow}>
              <Button
                mode="outlined"
                onPress={() => handleFeedback(true)}
                disabled={submitting}
                icon={() => <MaterialCommunityIcons name="thumb-up" size={18} color={theme.colors.primary} />}
                style={styles.feedbackButton}
              >
                Yes
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleFeedback(false)}
                disabled={submitting}
                icon={() => <MaterialCommunityIcons name="thumb-down" size={18} color={theme.colors.error} />}
                style={styles.feedbackButton}
                textColor={theme.colors.error}
              >
                No
              </Button>
            </View>
          )}
          {feedbackError && (
            <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8 }}>
              {feedbackError}
            </Text>
          )}
        </Surface>

        <Button
          mode="contained"
          onPress={handleGoHome}
          icon={() => <MaterialCommunityIcons name="home" size={20} color="#fff" />}
          style={styles.homeButton}
          contentStyle={styles.homeButtonContent}
        >
          Back to Home
        </Button>
      </ScrollView>

      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <Dialog.Title>Help us improve</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}>
              Tell us what went wrong (optional)
            </Text>
            <TextInput
              mode="outlined"
              placeholder="e.g. wrong disease, low confidence..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleSubmitWithComment} disabled={submitting}>
              Skip
            </Button>
            <Button onPress={handleSubmitWithComment} loading={submitting} disabled={submitting}>
              Send
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    gap: 16,
    paddingBottom: 40,
  },
  heading: {
    fontWeight: "700",
    marginBottom: 4,
  },
  imageCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    height: 200,
    borderRadius: 0,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  confidenceBar: {
    height: 10,
    borderRadius: 5,
    flex: 1,
  },
  treatmentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  treatmentNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackRow: {
    flexDirection: "row",
    gap: 12,
  },
  feedbackButton: {
    flex: 1,
    borderRadius: 12,
  },
  feedbackThanksRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  homeButton: {
    borderRadius: 12,
    marginTop: 4,
  },
  homeButtonContent: {
    height: 48,
  },
});
