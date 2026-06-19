import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<string, { button: ViewStyle; text: TextStyle }> = {
  primary: {
    button: { backgroundColor: "#22C55E" },
    text: { color: "#fff" },
  },
  secondary: {
    button: { backgroundColor: "#3B82F6" },
    text: { color: "#fff" },
  },
  outline: {
    button: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "#22C55E" },
    text: { color: "#22C55E" },
  },
  danger: {
    button: { backgroundColor: "#EF4444" },
    text: { color: "#fff" },
  },
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const v = variantStyles[variant];

  return (
    <TouchableOpacity
      style={[styles.button, v.button, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color ?? "#fff"} size="small" />
      ) : (
        <Text style={[styles.text, v.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
