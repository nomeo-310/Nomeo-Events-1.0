import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Notification } from "@/models/notification";
import { User } from "@/models/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB();

  const loggedInUser = await getCurrentUser();
    
  if (!loggedInUser) {
    return NextResponse.json(
      { success: false, error: "Unauthenticated. Please log in to continue." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'unread';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const skip = (page - 1) * limit;
    
    // Build query based on status
    const query: any = { receiverId: loggedInUser.id };
    
    switch (status) {
      case 'unread':
        query.status = 'unread';
        break;
      case 'read':
        query.status = 'read';
        break;
      case 'archived':
        query.status = 'archived';
        break;
      default:
        // If 'all' or invalid status, show unread by default
        query.status = 'unread';
    }
    
    const totalCount = await Notification.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Build sort options dynamically
    const sortOptions: any = {};
    
    if (sortBy === 'timestamp' || sortBy === 'createdAt') {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    
    // Add secondary sort for consistency when primary sort has ties
    if (sortBy !== 'timestamp' && sortBy !== 'createdAt') {
      sortOptions['timestamp'] = -1; // Secondary sort by newest
    }
    
    const notifications = await Notification.find(query)
      .populate({
        path: 'senderId',
        model: User,
        select: 'name email image'
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
    
    return NextResponse.json(
      { 
        success: true, 
        data: notifications.map(n => ({
          ...n.toObject(),
          timeAgo: n.getTimeAgo()
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        count: notifications.length 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    
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

// Update notification status (mark as read, archive, etc.)
export async function PATCH(request: Request) {
  await connectDB();

  const loggedInUser = await getCurrentUser();
    
  if (!loggedInUser) {
    return Response.json(
      { success: false, error: "Unauthenticated. Please log in to continue." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { notificationId, action } = body;

    if (!notificationId || !action) {
      return Response.json(
        { success: false, error: "Notification ID and action are required" },
        { status: 400 }
      );
    }

    // Verify notification belongs to user
    console.log(notificationId),
    console.log(loggedInUser.id)
    const notification = await Notification.findOne({ _id: notificationId, receiverId: loggedInUser.id });

    if (!notification) {
      return Response.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'mark-as-read':
        updateData.status = 'read';
        updateData.readAt = new Date();
        message = 'Notification marked as read';
        break;
      
      case 'mark-as-unread':
        updateData.status = 'unread';
        updateData.readAt = null;
        message = 'Notification marked as unread';
        break;
      
      case 'archive':
        updateData.status = 'archived';
        updateData.archivedAt = new Date();
        message = 'Notification archived';
        break;
      
      case 'restore':
        updateData.status = 'read';
        updateData.archivedAt = null;
        message = 'Notification restored';
        break;
      
      case 'delete':
        updateData.status = 'archived';
        updateData.archivedAt = new Date();
        message = 'Notification deleted';
        break;
      
      default:
        return Response.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    const updatedNotification = await Notification.findByIdAndUpdate(notificationId, updateData, { new: true })
    .populate({
      path: 'senderId',
      model: User,
      select: 'name email image'
    });

    return Response.json(
      { 
        success: true, 
        message,
        data: updatedNotification 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating notification:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bulk actions (mark all as read, etc.)
export async function POST(request: Request) {
  await connectDB();

  const loggedInUser = await getCurrentUser();
    
  if (!loggedInUser) {
    return Response.json(
      { success: false, error: "Unauthenticated. Please log in to continue." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return Response.json(
        { success: false, error: "Action is required" },
        { status: 400 }
      );
    }

    let filter: any = { recipientId: loggedInUser.id };
    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'mark-all-read':
        filter.status = 'unread';
        updateData.status = 'read';
        updateData.readAt = new Date();
        message = 'All notifications marked as read';
        break;
      
      case 'clear-read':
        filter.status = 'read';
        updateData.status = 'archived';
        updateData.archivedAt = new Date();
        message = 'Read notifications archived';
        break;
      
      case 'archive-all':
        filter.$or = [
          { status: 'read' },
          { status: 'unread' }
        ];
        updateData.status = 'archived';
        updateData.archivedAt = new Date();
        message = 'All notifications archived';
        break;
      
      case 'delete-archived':
        filter.status = 'archived';
        // For permanent deletion
        await Notification.deleteMany(filter);
        message = 'Archived notifications permanently deleted';
        return Response.json(
          { success: true, message },
          { status: 200 }
        );
      
      default:
        return Response.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    const result = await Notification.updateMany(filter, updateData);

    return Response.json(
      { 
        success: true, 
        message,
        data: { modifiedCount: result.modifiedCount }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}