import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// Ensure PlaceHolderImages is always at least an empty array to prevent .find() or [0] from crashing on undefined
export const PlaceHolderImages: ImagePlaceholder[] = data?.placeholderImages || [];
