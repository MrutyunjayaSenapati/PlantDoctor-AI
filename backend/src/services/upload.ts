import cloudinary from "../config/cloudinary";

export async function uploadImage(
  buffer: Buffer,
  mimetype: string,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "plantdoc-ai",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result?.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Upload failed — no URL returned"));
        }
      },
    );

    uploadStream.end(buffer);
  });
}
