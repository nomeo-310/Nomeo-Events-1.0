// app/api/admin/newsletter/images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadNewsletterImage, deleteNewsletterImage } from '@/lib/cloudinary-newsletter';
import { requireAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { NewsletterImage } from '@/models/newsletter-image';

// GET /api/admin/newsletter/images - List images
export async function GET(req: NextRequest) {
  try {
    const loggedInUser = await requireAdmin();

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const campaignId = searchParams.get('campaignId');

    const query: any = {};
    if (campaignId) {
      query.$or = [
        { campaignId },
        { usedInCampaigns: campaignId }
      ];
    }

    const skip = (page - 1) * limit;
    const [images, total] = await Promise.all([
      NewsletterImage.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NewsletterImage.countDocuments(query)
    ]);

    return NextResponse.json({
      images,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/newsletter/images - Upload image
export async function POST(req: NextRequest) {
  try {
    const loggedInUser = await requireAdmin();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const campaignId = formData.get('campaignId') as string;
    const alt = formData.get('alt') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const publicId = `newsletter_${timestamp}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const uploadResult: any = await uploadNewsletterImage(buffer, {
      folder: 'newsletter/images',
      publicId,
      tags: [campaignId ? `campaign_${campaignId}` : 'temp', 'newsletter']
    });

    const image = await NewsletterImage.create({
      filename: uploadResult.public_id,
      originalName: file.name,
      url: uploadResult.secure_url,
      size: file.size,
      width: uploadResult.width,
      height: uploadResult.height,
      mimeType: file.type,
      alt: alt || file.name,
      uploadedBy: loggedInUser.id,
      campaignId: campaignId || null
    });

    return NextResponse.json({
      success: true,
      image: {
        id: image._id,
        url: image.url,
        filename: image.filename,
        size: image.size,
        width: image.width,
        height: image.height,
        alt: image.alt
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// DELETE /api/admin/newsletter/images - Delete image
export async function DELETE(req: NextRequest) {
  try {
    const loggedInUser = await requireAdmin();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get('id');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    const image = await NewsletterImage.findById(imageId);
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (image.usedInCampaigns && image.usedInCampaigns.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete image used in campaigns',
        usedIn: image.usedInCampaigns
      }, { status: 400 });
    }

    await deleteNewsletterImage(image.filename);
    await image.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Image deletion error:', error);
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
  }
}