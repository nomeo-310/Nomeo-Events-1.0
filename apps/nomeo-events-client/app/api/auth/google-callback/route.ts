// app/api/auth/google-callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/auth-client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Get the session after Google auth
  const { data: session } = await authClient.getSession();
  
  if (!session?.user) {
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }
  
  try {
    // Check profile status
    const profileRes = await fetch(`${request.nextUrl.origin}/api/profile/me`, {
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    });
    const profileData = await profileRes.json();
    
    if (profileRes.ok && profileData?.data) {
      const profile = profileData.data;
      
      // Check for deactivated or suspended accounts
      if (profile.activeStatus !== "active") {
        // Sign out the user
        await authClient.signOut();
        
        let errorCode = "";
        if (profile.activeStatus === "deactivated") {
          errorCode = profile.metadata?.deletionScheduled 
            ? "account_scheduled_for_deletion" 
            : "account_deactivated";
        } else if (profile.activeStatus === "suspended") {
          errorCode = "account_suspended";
        }
        
        return NextResponse.redirect(new URL(`/?error=${errorCode}`, request.url));
      }
    }
    
    // Get the return URL from sessionStorage (passed via query param)
    const returnUrl = searchParams.get("returnUrl") || "/dashboard";
    return NextResponse.redirect(new URL(returnUrl, request.url));
    
  } catch (error) {
    console.error("Google callback profile check failed:", error);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}