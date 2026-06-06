// app/api/admin/newsletter/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Newsletter, NewsletterStatus } from '@/models/newsletter';
import * as XLSX from 'xlsx';
import { requireAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { IUser } from '@/models/user';
import { Types } from 'mongoose';

// Define the populated subscriber type
interface PopulatedSubscriber {
  _id: Types.ObjectId;
  email: string;
  userId?: IUser | null;
  name?: string;
  status: NewsletterStatus;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  unsubscribeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/admin/newsletter/export - Export subscribers
export async function GET(req: NextRequest) {
  try {
    const loggedInUser = await requireAdmin();

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
    const status = searchParams.get('status') || 'active';

    const query: any = {};
    if (status === 'active') query.status = NewsletterStatus.ACTIVE;
    if (status === 'unsubscribed') query.status = NewsletterStatus.UNSUBSCRIBED;

    const subscribers = (await Newsletter.find(query)
      .populate<{ userId: IUser }>('userId')
      .lean()) as PopulatedSubscriber[];

    const data = subscribers.map(s => ({
      Email: s.email,
      Name: s.name || '',
      'User ID': s.userId?._id?.toString() || '',
      'User Name': s.userId?.name || '',
      'Subscribed At': s.subscribedAt,
      Status: s.status,
      'Unsubscribed At': s.unsubscribedAt || ''
    }));

    if (format === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="newsletter-subscribers-${Date.now()}.csv"`
        }
      });
    } else {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Subscribers');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="newsletter-subscribers-${Date.now()}.xlsx"`
        }
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}