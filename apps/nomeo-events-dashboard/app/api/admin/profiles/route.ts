import { requireAuth } from "@/lib/admin/authorization";
import { connectDB } from "@/lib/mongoose";
import { Profile } from "@/models/profile";
import { User } from "@/models/user";
import { NextResponse } from "next/server";

// Build query from search params
function buildProfileQuery(searchParams: URLSearchParams) {
  const query: any = {};
  
  // Search across multiple fields
  const search = searchParams.get("search");
  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { fullName: searchRegex },
      { organizationName: searchRegex },
      { "contact.email": searchRegex },
      { "contact.phoneNumber": searchRegex },
      { bio: searchRegex },
      { "publicProfile.slug": searchRegex }
    ];
  }
  
  // Individual field filters
  const name = searchParams.get("name");
  if (name) query.fullName = new RegExp(name, "i");
  
  const organization = searchParams.get("organization");
  if (organization) query.organizationName = new RegExp(organization, "i");
  
  const email = searchParams.get("email");
  if (email) query["contact.email"] = new RegExp(email, "i");
  
  // Location filters
  const state = searchParams.get("state");
  if (state) query["location.state"] = state;
  
  const city = searchParams.get("city");
  if (city) query["location.city"] = city;
  
  const country = searchParams.get("country");
  if (country) query["location.country"] = country;
  
  // Status filters
  const accountType = searchParams.get("accountType");
  if (accountType && ["individual", "organization"].includes(accountType)) {
    query.accountType = accountType;
  }
  
  const verificationStatus = searchParams.get("verificationStatus");
  if (verificationStatus && ["pending", "verified", "rejected", "suspended", "unverified"].includes(verificationStatus)) {
    query.verificationStatus = verificationStatus;
  }
  
  const activeStatus = searchParams.get("activeStatus");
  if (activeStatus && ["active", "deactivated", "pending", "suspended"].includes(activeStatus)) {
    query.activeStatus = activeStatus;
  }
  
  // Date range filters
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return query;
}

export async function GET(req: Request) {
  await connectDB();

  const loggedInUser = await requireAuth();
  
  if (!loggedInUser) {
    return NextResponse.json({ error: "Unauthorized, Login!!" }, { status: 401 });
  }
  
  try {
    const { searchParams } = new URL(req.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    
    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sortOptions: any = { [sortBy]: sortOrder };
    
    // Build query for profiles
    const profileQuery = buildProfileQuery(searchParams);
    
    // First, get all user IDs where role is 'user' (not admin or super_admin)
    const regularUsers = await User.find({ 
      role: { $in: ['user', 'organizer'] } // Adjust roles as needed
    }).select('_id');
    
    const regularUserIds = regularUsers.map(user => user._id);
    
    // Add condition to only include profiles belonging to regular users
    profileQuery.userId = { $in: regularUserIds };
    
    // Execute query with population
    const profiles = await Profile.find(profileQuery)
      .populate("userId", "email role")
      .populate("verifiedBy", "fullName email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count (excluding admin/super_admin users)
    const total = await Profile.countDocuments(profileQuery);
    
    return NextResponse.json({
      success: true,
      data: profiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: {
        search: searchParams.get("search"),
        dateRange: {
          startDate: searchParams.get("startDate"),
          endDate: searchParams.get("endDate")
        },
        location: {
          state: searchParams.get("state"),
          city: searchParams.get("city"),
          country: searchParams.get("country")
        },
        accountType: searchParams.get("accountType"),
        verificationStatus: searchParams.get("verificationStatus"),
        activeStatus: searchParams.get("activeStatus")
      }
    });
  } catch (error: any) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}