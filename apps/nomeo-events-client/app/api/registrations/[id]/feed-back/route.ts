// app/api/registrations/[id]/feedback/route.ts
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Registration } from "@/models/registration";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; }> } ) {
  const { id } = await params;

  await connectDB();
  
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { rating, feedback } = await req.json();
    const registration = await Registration.findById(id);
    
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    
    // Check if user owns this registration
    if (registration.userId?.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    await registration.submitFeedback(rating, feedback);
    
    return NextResponse.json({ 
      success: true, 
      message: "Thank you for your feedback!" 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}