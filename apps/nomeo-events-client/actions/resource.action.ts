'use server'

import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongoose";
import { Subscription } from "@/models/subscription";

export const deleteImage = async (publicId:string) => {
  cloudinary.uploader.destroy(publicId, function(error: any,result: any) {
  }).then((response: any) => {
    return {response}; 
  })
    .catch((_err: any) => console.log("Something went wrong, please try again later.")
  );
};

export const deleteImages = async (images:string[]) => {
  try {
    const response = await cloudinary.api.delete_resources(images);
  } catch (error) {
    console.error('Error deleting images:', error);
  }
};


export const uploadSignedImage = async ({ image, userId }: { image: File | null, userId: string }) => {
  try {
    if (!image) throw new Error('No image provided');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(image.type)) {
      throw new Error('Only JPG, PNG, WEBP or PDF files are allowed');
    }

    if (image.size > 5 * 1024 * 1024) {
      throw new Error('File size must be under 5MB');
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `nomeo_events/credentials/${userId}`,
          public_id: `cred_${userId}_${Date.now()}`,
          resource_type: 'auto',
          tags: ['user-credentials', userId],
          type: 'authenticated',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return result as any;

  } catch (error) {
    console.error('Error uploading verification credential:', error);
    throw error;
  }
};