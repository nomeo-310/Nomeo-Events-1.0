// lib/image-utils.ts
export function getCloudinaryImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'limit' | 'pad' | 'scale';
    quality?: number;
    format?: 'jpg' | 'png' | 'webp' | 'auto';
    gravity?: 'center' | 'north' | 'south' | 'east' | 'west';
    effects?: string[];
  } = {}
) {
  const transformations = [];
  
  if (options.width || options.height) {
    transformations.push(`c_${options.crop || 'limit'}`);
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
  }
  
  if (options.gravity) transformations.push(`g_${options.gravity}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format && options.format !== 'auto') transformations.push(`f_${options.format}`);
  
  if (options.effects) {
    transformations.push(...options.effects);
  }
  
  const transformationString = transformations.join(',');
  
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}/${publicId}`;
}

// Generate srcset for responsive images
export function getResponsiveSrcSet(publicId: string, widths: number[] = [400, 600, 800, 1000]) {
  return widths
    .map(width => `${getCloudinaryImageUrl(publicId, { width })} ${width}w`)
    .join(', ');
}

// Get blur placeholder for lazy loading
export async function getBlurPlaceholder(publicId: string) {
  const blurUrl = getCloudinaryImageUrl(publicId, { 
    width: 20, 
    quality: 30,
    effects: ['e_blur:1000']
  });
  
  return blurUrl;
}