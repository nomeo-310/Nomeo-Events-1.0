//api/auth/verify-otp/route.ts
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { verifyOTP } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, otp, type } = await req.json();
    console.log("Received OTP verification request for:", email, "Type:", type);

    if (!email || !otp || !type) {
      return Response.json({ error: "Email, OTP, and type are required" }, { status: 400 });
    }

    const result = await verifyOTP(email, otp, type);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      message: type === "forget-password" ? "Code verified. You can now reset your password." : "Email verified successfully" 
    });
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}