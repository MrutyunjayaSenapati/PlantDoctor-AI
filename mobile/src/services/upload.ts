import { apiClient } from "../api/client";

export async function uploadImage(uri: string): Promise<string> {
  const filename = uri.split("/").pop() ?? "photo.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };

  console.log(`[Upload] Starting upload for: ${filename}`);

  const formData = new FormData();
  formData.append("image", {
    uri,
    type: mimeMap[ext] ?? "image/jpeg",
    name: filename,
  } as any);

  const res = await apiClient.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    transformRequest: (data) => data,
  });

  console.log(`[Upload] Success → ${res.data.imageUrl}`);
  return res.data.imageUrl;
}
