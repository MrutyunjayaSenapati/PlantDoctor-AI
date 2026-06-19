import { useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHistoryStore } from "../store/historyStore";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { items, total, page, totalPages, loading, refreshing, error, fetch, refresh } = useHistoryStore();

  useEffect(() => {
    fetch(1);
  }, []);

  function handleItemPress(item: typeof items[0]) {
    navigation.navigate("Result", {
      diagnosisId: item.id,
      plant: item.plantName ?? "Unknown",
      disease: item.diseaseName ?? "Unknown",
      confidence: item.confidence ? Number(item.confidence) : 0,
      status: item.status ?? "UNKNOWN",
      explanation: item.explanation ?? "",
      treatment: item.treatment ?? [],
      imageUrl: item.imageUrl ?? undefined,
    });
  }

  function handleLoadMore() {
    if (page < totalPages && !loading) {
      fetch(page + 1);
    }
  }

  if (error && items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.container}>
          <Text style={styles.title}>History</Text>
          <ErrorState message={error} onRetry={() => fetch(1)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>History</Text>

        {loading && items.length === 0 ? (
          <LoadingState message="Loading history..." />
        ) : items.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No diagnoses yet"
            subtitle="Your plant diagnosis history will appear here after you run your first analysis."
          />
        ) : (
          <>
            <Text style={styles.count}>{total} diagnosis{total !== 1 ? "es" : ""}</Text>

            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#22C55E" />}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={loading && page > 1 ? <ActivityIndicator style={styles.footer} color="#22C55E" /> : null}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.card} onPress={() => handleItemPress(item)} activeOpacity={0.7}>
                  <View style={styles.cardTop}>
                    <Text style={styles.plantName}>{item.plantName ?? "Unknown plant"}</Text>
                    <Text style={styles.confidence}>
                      {item.confidence ? `${(Number(item.confidence) * 100).toFixed(0)}%` : "—"}
                    </Text>
                  </View>
                  <Text style={styles.diseaseName}>{item.diseaseName ?? "Unknown disease"}</Text>
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </TouchableOpacity>
              )}
            />
          </>
        )}
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 4,
  },
  count: {
    fontSize: 14,
    color: "#999",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  plantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    flex: 1,
  },
  confidence: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22C55E",
    marginLeft: 12,
  },
  diseaseName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  footer: {
    paddingVertical: 20,
  },
});
