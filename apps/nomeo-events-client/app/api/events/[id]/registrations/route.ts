import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Event } from "@/models/event";
import { Registration, RegistrationStatus, PaymentStatus } from "@/models/registration";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await Event.findById(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.organizerId?.toString() !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden - Only event organizer can view registrations" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const paymentStatus = searchParams.get('paymentStatus');
  const ageVerified = searchParams.get('ageVerified');
  const planType = searchParams.get('planType');
  const isGroup = searchParams.get('isGroup');
  const isCorporate = searchParams.get('isCorporate');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '100');
  const page = parseInt(searchParams.get('page') || '1');
  const skip = (page - 1) * limit;

  try {
    const query: any = { eventId: new mongoose.Types.ObjectId(id) };
    
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (ageVerified !== null) query.ageVerified = ageVerified === 'true';
    if (planType) query.planType = planType;
    if (isGroup !== null) query.isGroupRegistration = isGroup === 'true';
    if (isCorporate !== null) query.isCorporateRegistration = isCorporate === 'true';
    
    if (search) {
      query.$or = [
        { attendeeName: { $regex: search, $options: 'i' } },
        { attendeeEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const [registrations, total] = await Promise.all([
      Registration.find(query)
        .populate('ageVerifiedBy', 'name email')
        .sort({ registeredAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Registration.countDocuments(query)
    ]);

    // Statistics for the organizer
    const stats = {
      total,
      confirmed: registrations.filter(r => r.status === RegistrationStatus.CONFIRMED).length,
      attended: registrations.filter(r => r.status === RegistrationStatus.ATTENDED).length,
      cancelled: registrations.filter(r => r.status === RegistrationStatus.CANCELLED).length,
      pending: registrations.filter(r => r.status === RegistrationStatus.PENDING).length,
      
      paymentStats: {
        completed: registrations.filter(r => r.paymentStatus === PaymentStatus.COMPLETED).length,
        pending: registrations.filter(r => r.paymentStatus === PaymentStatus.PENDING).length,
        failed: registrations.filter(r => r.paymentStatus === PaymentStatus.FAILED).length,
        refunded: registrations.filter(r => r.paymentStatus === PaymentStatus.REFUNDED).length,
      },
      
      ageVerification: {
        verified: registrations.filter(r => r.ageVerified).length,
        pendingVerification: registrations.filter(r => !r.ageVerified && r.attendeeAge && r.attendeeAge < 18).length,
      },
      
      registrationTypes: {
        individual: registrations.filter(r => !r.isGroupRegistration && !r.isCorporateRegistration).length,
        group: registrations.filter(r => r.isGroupRegistration).length,
        corporate: registrations.filter(r => r.isCorporateRegistration).length,
      },
      
      totalRevenue: registrations
        .filter(r => r.paymentStatus === PaymentStatus.COMPLETED)
        .reduce((sum, r) => sum + r.price, 0),
        
      certificatesIssued: registrations.filter(r => r.certificateIssued).length,
    };

    return NextResponse.json({
      success: true,
      data: registrations,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error: any) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}