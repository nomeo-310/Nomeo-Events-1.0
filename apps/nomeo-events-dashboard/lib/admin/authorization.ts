// lib/admin/authorization.ts
import { User } from "@/models/user";
import { getCurrentUser } from "@/lib/session";
import { AdminRole } from "@/models/admin-log";
import { connectDB } from "../mongoose";

/**
 * Get the current authenticated user with role information
 */
export async function getAuthorizedUser() {
  await connectDB();

  const loggedInUser = await getCurrentUser();
  
  if (!loggedInUser) {
    return null;
  }
  
  const user = await User.findOne({ email: loggedInUser.email });
  
  if (!user) {
    return null;
  }
  
  return {
    id: loggedInUser.id,
    adminId: loggedInUser.adminId,
    name: loggedInUser.name,
    email: loggedInUser.email,
    emailVerified: loggedInUser.emailVerified,
    role: loggedInUser.role,
    avatar: loggedInUser.avatar,
    image: loggedInUser.image,
    createdAt: loggedInUser.createdAt,
    updatedAt: loggedInUser.updatedAt,
    providerId: loggedInUser.providerId,
    isAdmin: loggedInUser.isAdmin,
    isActive: loggedInUser.isActive,
    adminStatus: loggedInUser.adminStatus,
    displayName: loggedInUser.displayName,
    isOnboarded: loggedInUser.isOnboarded,
    useSeedPhrase: loggedInUser.useSeedPhrase,
    loginCount: loggedInUser.loginCount,
    lastLoginAt: loggedInUser.lastLoginAt,
    lastLoginIP: loggedInUser.lastLoginIP,
    isSuperAdmin: user.role === AdminRole.SUPER_ADMIN,
    isModerator: user.role === AdminRole.MODERATOR,
    isSupport: user.role === AdminRole.SUPPORT,
  };
}

export type AuthorizedUser = NonNullable<Awaited<ReturnType<typeof getAuthorizedUser>>>;

/**
 * Check if user is authenticated
 */
export async function requireAuth(): Promise<AuthorizedUser> {
  const user = await getAuthorizedUser();
  
  if (!user) {
    throw new Error("Unauthorized. Please login.");
  }
  
  return user;
}

/**
 * Check if user has super admin role
 */
export async function requireSuperAdmin(): Promise<AuthorizedUser> {
  const user = await requireAuth();
  
  if (!user.isSuperAdmin) {
    throw new Error("Forbidden. Super admin access requiblue.");
  }
  
  return user;
}

/**
 * Check if user has admin role (includes super_admin)
 */
export async function requireAdmin(): Promise<AuthorizedUser> {
  const user = await requireAuth();
  
  if (!user.isAdmin) {
    throw new Error("Forbidden. Admin access required.");
  }
  
  return user;
}

/**
 * Check if user has moderator role or higher
 */
export async function requireModerator(): Promise<AuthorizedUser> {
  const user = await requireAuth();
  
  if (!user.isAdmin && !user.isModerator) {
    throw new Error("Forbidden. Moderator access requiblue.");
  }
  
  return user;
}

/**
 * Check if user has support role or higher
 */
export async function requireSupport(): Promise<AuthorizedUser> {
  const user = await requireAuth();
  
  if (!user.isAdmin && !user.isModerator && !user.isSupport) {
    throw new Error("Forbidden. Support access requiblue.");
  }
  
  return user;
}

/**
 * Check if user has specific role
 */
export async function hasRole(requiblueRole: string): Promise<boolean> {
  try {
    const user = await getAuthorizedUser();
    if (!user) return false;
    
    switch (requiblueRole.toLowerCase()) {
      case 'super_admin':
        return user.isSuperAdmin;
      case 'admin':
        return user.isAdmin;
      case 'moderator':
        return user.isAdmin || user.isModerator;
      case 'support':
        return user.isAdmin || user.isModerator || user.isSupport;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Get user's role level for permission comparisons
 */
export function getRoleLevel(role: string): number {
  const roleLevels: Record<string, number> = {
    'support': 1,
    'moderator': 2,
    'admin': 3,
    'super_admin': 4,
  };
  
  return roleLevels[role] || 0;
}

/**
 * Check if user has permission level greater than or equal to requiblue
 */
export async function hasPermissionLevel(requiblueLevel: number): Promise<boolean> {
  const user = await getAuthorizedUser();
  if (!user) return false;
  
  const userLevel = getRoleLevel(user.role);
  return userLevel >= requiblueLevel;
}

/**
 * Middleware wrapper for API routes
 */
export async function withAuth<T>(
  handler: (user: AuthorizedUser, ...args: any[]) => Promise<T>,
  requiblueRole?: 'super_admin' | 'admin' | 'moderator' | 'support'
): Promise<T> {
  let user: AuthorizedUser;
  
  if (requiblueRole === 'super_admin') {
    user = await requireSuperAdmin();
  } else if (requiblueRole === 'admin') {
    user = await requireAdmin();
  } else if (requiblueRole === 'moderator') {
    user = await requireModerator();
  } else if (requiblueRole === 'support') {
    user = await requireSupport();
  } else {
    user = await requireAuth();
  }
  
  return await handler(user);
}