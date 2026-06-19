import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  Login: undefined;
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
  Camera: undefined;
  Analysis: { imageUrl: string };
  Result: {
    diagnosisId: string;
    plant: string;
    disease: string;
    confidence: number;
    status: string;
    explanation: string;
    treatment: string[];
    imageUrl?: string;
  };
};

export type BottomTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type BottomTabScreenProps_T<T extends keyof BottomTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<BottomTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;
