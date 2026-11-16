import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

/** Signature for a direct browser → Cloudinary upload. The file never touches Render. */
export function signUpload() {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = env.CLOUDINARY_FOLDER;
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, env.CLOUDINARY_API_SECRET);
  return {
    timestamp,
    folder,
    signature,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
  };
}

export async function destroyAsset(publicId: string) {
  return cloudinary.uploader.destroy(publicId, { invalidate: true });
}
