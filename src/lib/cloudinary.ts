import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
  secure: true,
});

export { cloudinary };

/**
 * Build the signed params the browser needs to upload directly to Cloudinary.
 * Signing happens here so the API secret never leaves the server.
 */
export function buildUploadSignature(folder?: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const uploadFolder = folder ? `${env.cloudinaryFolder}/${folder}` : env.cloudinaryFolder;

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: uploadFolder },
    env.cloudinaryApiSecret,
  );

  return {
    signature,
    timestamp,
    apiKey: env.cloudinaryApiKey,
    cloudName: env.cloudinaryCloudName,
    folder: uploadFolder,
  };
}

export async function destroyAsset(publicId: string) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
}
