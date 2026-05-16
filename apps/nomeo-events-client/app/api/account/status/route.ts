// app/api/account/status/route.ts
import { getCurrentUser } from "@/lib/session";
import { AccountManagementService } from "@/services/account-management-services";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const status = await AccountManagementService.getAccountStatus( loggedInUser.id );

    return NextResponse.json(status);

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}