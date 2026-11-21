/**
 * Site images live in Vercel Blob storage (not in the repo), so personal
 * photos aren't stored on GitHub.
 *
 * To add a new image:
 *   npx vercel blob put my-photo.jpg --access public --pathname images/my-photo.jpg
 * then use blobImage("my-photo.jpg") in the data files.
 */
export const BLOB_BASE =
  "https://5ogkncz8mgraqdcd.public.blob.vercel-storage.com/images";

export const blobImage = (filename: string) => `${BLOB_BASE}/${filename}`;
