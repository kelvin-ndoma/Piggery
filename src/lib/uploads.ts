import "server-only";

export type StoredImage = {
  publicId: string;
  url: string;
};

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function cloudinaryDeliveryUrl(publicId: string): string | null {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloud || !publicId) return null;
  return `https://res.cloudinary.com/${cloud}/image/upload/c_fill,w_800,h_800/${publicId}`;
}
