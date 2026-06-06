// app/api/admin/newsletter/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Newsletter, NewsletterStatus } from '@/models/newsletter';
import * as XLSX from 'xlsx';
import { requireAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';

// POST /api/admin/newsletter/import - Import subscribers from CSV/Excel
export async function POST(req: NextRequest) {
  try {
    const loggedInUser = await requireAdmin()

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    const subscribers = [];
    const errors = [];

    for (const row of data) {
      const email = row['email'] || row['Email'];
      const name = row['name'] || row['Name'] || row['fullName'];

      if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors.push({ email, error: 'Invalid email' });
        continue;
      }

      try {
        const existing = await Newsletter.findOne({ email: email.toLowerCase() });
        if (existing) {
          if (existing.status === NewsletterStatus.UNSUBSCRIBED) {
            existing.status = NewsletterStatus.ACTIVE;
            existing.unsubscribedAt = undefined;
            await existing.save();
          }
          subscribers.push(existing);
        } else {
          const newsletter = await Newsletter.create({
            email: email.toLowerCase(),
            name,
            status: NewsletterStatus.ACTIVE,
            subscribedAt: new Date()
          });
          subscribers.push(newsletter);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ email, error: message });
      }
    }

    return NextResponse.json({
      success: true,
      imported: subscribers.length,
      errors,
      totalProcessed: data.length
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}