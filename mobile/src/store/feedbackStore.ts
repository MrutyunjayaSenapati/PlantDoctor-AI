import { create } from "zustand";
import { submitFeedback } from "../services/feedback";

interface FeedbackState {
  submitting: boolean;
  error: string | null;
  submit: (data: { diagnosisId: string; isCorrect: boolean; comment?: string }) => Promise<boolean>;
  reset: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  submitting: false,
  error: null,

  submit: async (data) => {
    set({ submitting: true, error: null });
    try {
      await submitFeedback(data);
      set({ submitting: false });
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to submit feedback", submitting: false });
      return false;
    }
  },

  reset: () => set({ submitting: false, error: null }),
}));
