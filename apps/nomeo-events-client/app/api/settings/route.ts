import { NextRequest, NextResponse } from "next/server";
import { Setting } from "@/models/setting";
import { getCurrentUser } from "@/lib/session";
import { connectDB } from "@/lib/mongoose";

// GET /api/settings - Get current user's settings
export async function GET(request: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();
    
    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    let settings = await Setting.findOne({ userId: loggedInUser.id });
    
    // Create default settings if none exist
    if (!settings) {
      settings = await Setting.create({ userId: loggedInUser.id });
    }
    
    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch settings" },
      { status: 500 }
    );
  }
};

// PATCH /api/settings - Update specific section
export async function PATCH(request: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();
    
    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { success: false, message: "Section and data are required" },
        { status: 400 }
      );
    }

    // Build update object for nested section
    const updateData: any = {};
    Object.keys(data).forEach(key => {
      updateData[`${section}.${key}`] = data[key];
    });

    const settings = await Setting.findOneAndUpdate(
      { userId: loggedInUser.id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update settings" },
      { status: 500 }
    );
  }
};