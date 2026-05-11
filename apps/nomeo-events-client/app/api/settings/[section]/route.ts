import { NextRequest, NextResponse } from "next/server";
import { Setting, ISetting } from "@/models/setting";
import { getCurrentUser } from "@/lib/session";
import { connectDB } from "@/lib/mongoose";

// Type-safe way to get section data
function getSectionData(settings: ISetting, section: string) {
  return (settings as Record<string, any>)[section];
}

// GET /api/settings/:section - Get specific settings section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  const { section } = await params;

  try {
    const loggedInUser = await getCurrentUser();
    
    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const settings = await Setting.findOne(
      { userId: loggedInUser.id },
      { [section]: 1 }
    );

    if (!settings) {
      return NextResponse.json(
        { success: false, message: "Settings not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: getSectionData(settings.toObject(), section)
    });
  } catch (error) {
    console.error("Error fetching settings section:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch settings section" },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/:section - Update specific section directly
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  const { section } = await params;

  try {
    const loggedInUser = await getCurrentUser();
    
    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const data = await request.json();

    const updateData: Record<string, any> = {};
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
      data: getSectionData(settings.toObject(), section)
    });
  } catch (error) {
    console.error("Error updating settings section:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update settings section" },
      { status: 500 }
    );
  }
}