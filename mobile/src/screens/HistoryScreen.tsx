import { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Searchbar, ActivityIndicator, useTheme, IconButton } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHistoryStore } from "../store/historyStore";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { items, total, page, totalPages, loading, refreshing, error, fetch, refresh } = useHistoryStore();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch(1);
  }, []);

  const filteredItems = searchQuery
    ? items.filter(
        (item) =>
          (item.plantName ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.diseaseName ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : items;

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
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["top"]}>
        <View style={styles.container}>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
            History
          </Text>
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
            <Text variant="bodyLarge" style={{ color: theme.colors.error, textAlign: "center", marginTop: 12, marginBottom: 16 }}>
              {error}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <View style={styles.container}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
          History
        </Text>

        <Searchbar
          placeholder="Search diagnoses..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
          iconColor={theme.colors.onSurfaceVariant}
          inputStyle={{ color: theme.colors.onSurface }}
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />

        {loading && items.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons
              name={searchQuery ? "file-search-outline" : "clipboard-text-outline"}
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 16, fontWeight: "600" }}
            >
              {searchQuery ? "No matching diagnoses" : "No diagnoses yet"}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 4 }}
            >
              {searchQuery
                ? "Try a different search term"
                : "Your plant diagnosis history will appear here after you run your first analysis."}
            </Text>
          </View>
        ) : (
          <>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
              {searchQuery ? `${filteredItems.length} of ${total} diagnosis${total !== 1 ? "es" : ""}` : `${total} diagnosis${total !== 1 ? "es" : ""}`}
            </Text>

            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  tintColor={theme.colors.primary}
                  colors={[theme.colors.primary]}
                />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                loading && page > 1 ? (
                  <ActivityIndicator style={styles.footer} color={theme.colors.primary} />
                ) : null
              }
              renderItem={({ item }) => (
                <Card
                  style={[styles.card, { backgroundColor: theme.colors.surface }]}
                  mode="elevated"
                  onPress={() => handleItemPress(item)}
                >
                  <Card.Content>
                    <View style={styles.cardTop}>
                      <View style={styles.cardLeft}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                          {item.plantName ?? "Unknown plant"}
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                        >
                          {item.diseaseName ?? "Unknown disease"}
                        </Text>
                        <Text
                          variant="labelSmall"
                          style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, opacity: 0.7 }}
                        >
                          {formatDate(item.createdAt)}
                        </Text>
                      </View>
                      <View style={styles.cardRight}>
                        <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: "700" }}>
                          {item.confidence ? `${(Number(item.confidence) * 100).toFixed(0)}%` : "—"}
                        </Text>
                        {item.imageUrl && (
                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={20}
                            color={theme.colors.onSurfaceVariant}
                            style={{ marginTop: 4 }}
                          />
                        )}
                      </View>
                    </View>
                  </Card.Content>
                </Card>
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
  },
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontWeight: "700",
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
    borderRadius: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  cardRight: {
    alignItems: "flex-end",
  },
  footer: {
    paddingVertical: 20,
  },
});
