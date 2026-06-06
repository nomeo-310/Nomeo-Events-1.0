// lib/cloudinary-newsletter.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  tags?: string[];
  transformation?: any[];
  context?: Record<string, string>;
}

export async function uploadNewsletterImage(
  buffer: Buffer,
  options: UploadOptions = {}
) {
  const {
    folder = 'newsletter/images',
    publicId,
    tags = ['newsletter', 'email-campaign'],
    transformation = [
      { quality: 'auto' },
      { fetch_format: 'auto' },
      { flags: 'progressive' }
    ],
    context = {}
  } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        tags,
        transformation,
        context: Object.entries(context).map(([key, value]) => `${key}=${value}`),
        // Add responsive breakpoints for email clients
        responsive_breakpoints: {
          create_derived: true,
          bytes_step: 20000,
          min_width: 200,
          max_width: 1000,
          max_images: 5
        }
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    
    uploadStream.end(buffer);
  });
}

export async function deleteNewsletterImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId, {
    invalidate: true // Invalidate CDN cache
  });
}

export async function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}
) {
  const { width, height, crop = 'limit', quality = 'auto', format = 'auto' } = options;
  
  let transformation = [];
  
  if (width || height) {
    transformation.push({ width, height, crop });
  }
  
  transformation.push({ quality });
  transformation.push({ fetch_format: format });
  
  return cloudinary.url(publicId, {
    transformation,
    secure: true
  });
}

// Generate email-friendly responsive image HTML
export function getResponsiveImageHtml(
  publicId: string,
  alt: string,
  options: {
    maxWidth?: number;
    className?: string;
    styles?: string;
  } = {}
) {
  const { maxWidth = 600, className = '', styles = '' } = options;
  
  // Generate different size URLs
  const mobileUrl = getOptimizedImageUrl(publicId, { width: 400 });
  const desktopUrl = getOptimizedImageUrl(publicId, { width: maxWidth });
  
  return `
    <picture>
      <source media="(max-width: 480px)" srcset="${mobileUrl}">
      <source media="(min-width: 481px)" srcset="${desktopUrl}">
      <img 
        src="${desktopUrl}" 
        alt="${alt}"
        style="max-width: 100%; height: auto; ${styles}"
        class="${className}"
        loading="lazy"
      />
    </picture>
  `;
}