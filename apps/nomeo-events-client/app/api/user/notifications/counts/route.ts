import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Notification } from "@/models/notification";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();

  const loggedInUser = await getCurrentUser();

  if (!loggedInUser) {
    return NextResponse.json(
      { success: false, error: "Unauthenticated. Please log in to continue." },
      { status: 401 }
    );
  }

  try {
    const unread = await Notification.countDocuments({receiverId: loggedInUser.id, status: 'unread'})
    const read = await Notification.countDocuments({receiverId: loggedInUser.id, status: 'read'})
    const archived = await Notification.countDocuments({receiverId: loggedInUser.id, status: 'archived'})

    const counts = { read, unread, archived }; 

    return NextResponse.json(
      { 
        success: true, 
        message: 'Notification counts retrieved successfully',
        data: counts 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching school details:', error);
    
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('ObjectId') || error.message.includes('Cast to ObjectId')) {
        errorMessage = 'Invalid data format. Please contact support.';
        statusCode = 400;
      } else if (error.message.includes('connect') || error.message.includes('database')) {
        errorMessage = 'Database connection error. Please try again.';
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }

}