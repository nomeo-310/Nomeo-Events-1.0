// app/api/account/deactivate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AccountManagementService } from '@/services/account-management-services';
import { getCurrentUser } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason } = body;

    const result = await AccountManagementService.deactivateAccount(
      loggedInUser.id,
      reason || 'User requested deactivation'
    );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Deactivation error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Deactivation failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}


