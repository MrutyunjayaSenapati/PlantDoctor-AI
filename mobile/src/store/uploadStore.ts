import { create } from "zustand";

interface UploadState {
  imageUri: string | null;
  imageUrl: string | null;
  isUploading: boolean;
  error: string | null;
  setImage: (uri: string) => void;
  setUploading: (uploading: boolean) => void;
  setUploaded: (url: string) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  imageUri: null,
  imageUrl: null,
  isUploading: false,
  error: null,
  setImage: (uri) => set({ imageUri: uri, error: null }),
  setUploading: (uploading) => set({ isUploading: uploading }),
  setUploaded: (url) => set({ imageUrl: url, isUploading: false, error: null }),
  setError: (error) => set({ error, isUploading: false }),
  reset: () => set({ imageUri: null, imageUrl: null, isUploading: false, error: null }),
}));
