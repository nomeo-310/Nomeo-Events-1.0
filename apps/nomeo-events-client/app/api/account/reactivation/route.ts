// app/api/account/reactivate/route.ts
import { getCurrentUser } from "@/lib/session";
import { AccountManagementService } from "@/services/account-management-services";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const result = await AccountManagementService.reactivateAccount( loggedInUser.id );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Reactivation error:', error);
    return NextResponse.json(
      { error: error.message || 'Reactivation failed' },
      { status: 500 }
    );
  }
}
