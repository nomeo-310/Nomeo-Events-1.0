// app/api/events/[id]/registrations/route.ts
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Event } from "@/models/event";
import { Registration } from "@/models/registration";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string; }> } ) {
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
  
  if (event.organizerId.toString() !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const ageVerified = searchParams.get('ageVerified');
  const limit = parseInt(searchParams.get('limit') || '100');
  
  try {
    let query: any = { eventId: id };
    if (status) query.status = status;
    if (ageVerified) query.ageVerified = ageVerified === 'true';
    
    const registrations = await Registration.find(query)
      .populate('userId', 'name email image')
      .sort({ registeredAt: -1 })
      .limit(limit);
    
    const stats = {
      total: registrations.length,
      confirmed: registrations.filter(r => r.status === 'confirmed').length,
      attended: registrations.filter(r => r.status === 'attended').length,
      cancelled: registrations.filter(r => r.status === 'cancelled').length,
      checkedIn: registrations.filter(r => r.checkedIn).length,
      pendingAgeVerification: registrations.filter(r => !r.ageVerified && r.attendeeAge < 18).length,
      revenue: registrations.reduce((sum, r) => sum + r.amountPaid, 0)
    };
    
    return NextResponse.json({ 
      success: true, 
      data: registrations,
      stats
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}