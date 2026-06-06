// app/api/admin/profiles/[id]/actions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/authorization';
import { AdminAccountManagementService } from '@/services/admin-account-management-services';

export async function POST( request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { action, reason, duration, hardDelete, sendEmail } = body;

    let result;

    switch (action) {
      case 'deactivate':
        result = await AdminAccountManagementService.adminDeactivateAccount(
          userId,
          admin.id,
          admin.email,
          reason,
          sendEmail !== false
        );
        break;

      case 'reactivate':
        result = await AdminAccountManagementService.adminReactivateAccount(
          userId,
          admin.id,
          admin.email
        );
        break;

      case 'suspend':
        if (!reason) {
          return NextResponse.json(
            { error: 'Reason is required for suspension' },
            { status: 400 }
          );
        }
        result = await AdminAccountManagementService.adminSuspendAccount(
          userId,
          admin.id,
          admin.email,
          reason,
          duration,
          sendEmail !== false
        );
        break;

      case 'lift-suspension':
        result = await AdminAccountManagementService.adminLiftSuspension(
          userId,
          admin.id,
          admin.email,
          sendEmail !== false
        );
        break;

      case 'delete':
        result = await AdminAccountManagementService.adminDeleteAccount(
          userId,
          admin.id,
          admin.email,
          reason,
          hardDelete || false,
          sendEmail !== false
        );
        break;

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in admin account action:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET( request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    const status = await AdminAccountManagementService.getAdminAccountStatus(userId);

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error fetching account status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}