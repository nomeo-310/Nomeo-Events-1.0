// app/api/account/delete/route.ts
import { getCurrentUser } from "@/lib/session";
import { AccountManagementService } from "@/services/account-management-services";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason, confirmation } = body;

    // Require explicit confirmation
    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: 'Please confirm deletion by sending confirmation: "DELETE"' },
        { status: 400 }
      );
    }

    const result = await AccountManagementService.deleteAccount(
      loggedInUser.id,
      reason || 'Permanent account deletion requested'
    );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Deletion error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Deletion failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}