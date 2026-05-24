// app/api/admin/profiles/pending-verification/route.ts
import { requireAuth } from "@/lib/admin/authorization";
import { connectDB } from "@/lib/mongoose";
import { Profile } from "@/models/profile";
import { User } from "@/models/user";
import { NextResponse } from "next/server";

function buildPendingVerificationQuery(searchParams: URLSearchParams) {
  const query: any = {
    verificationStatus: "pending",
    verificationDocuments: { $exists: true, $not: { $size: 0 } },
  };

  const search = searchParams.get("search");
  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { fullName: searchRegex },
      { organizationName: searchRegex },
      { "contact.email": searchRegex },
      { "contact.phoneNumber": searchRegex },
    ];
  }

  const documentType = searchParams.get("documentType");
  if (documentType) {
    query["verificationDocuments.documentType"] = documentType;
  }

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (startDate || endDate) {
    query.updatedAt = {};
    if (startDate) query.updatedAt.$gte = new Date(startDate);
    if (endDate) query.updatedAt.$lte = new Date(endDate);
  }

  const accountType = searchParams.get("accountType");
  if (accountType && ["individual", "organization"].includes(accountType)) {
    query.accountType = accountType;
  }

  const state = searchParams.get("state");
  if (state) query["location.state"] = new RegExp(state, "i");

  const city = searchParams.get("city");
  if (city) query["location.city"] = new RegExp(city, "i");

  const organizationType = searchParams.get("organizationType");
  if (organizationType) query.organizationType = organizationType;

  return query;
}

export async function GET(req: Request) {
  await connectDB();

  const loggedInUser = await requireAuth();

  if (!loggedInUser) {
    return NextResponse.json({ error: "Unauthorized, Login!!" }, { status: 401 });
  }

  if (!["admin", "super_admin"].includes(loggedInUser.role)) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const profileQuery = buildPendingVerificationQuery(searchParams);

    const [profiles, total, stats] = await Promise.all([
      Profile.find(profileQuery)
        .select(
          "_id fullName displayName accountType " +
          // Organization fields — only relevant for org accounts
          "organizationName organizationType " +
          // Location — state + city enough for list view
          "location.state location.city " +
          // Contact — email for display; phone omitted (detail view)
          "contact.email " +
          // Avatar for list row avatar
          "profilePicture.secure_url " +
          // Only document types needed, not URLs (detail view has those)
          "verificationDocuments.documentType " +
          // Submission timing
          "updatedAt"
        )
        .populate({ path: "userId", model: User, select: "email role" })
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),

      Profile.countDocuments(profileQuery),

      Profile.aggregate([
        {
          $match: {
            verificationStatus: "pending",
            verificationDocuments: { $exists: true, $not: { $size: 0 } },
          },
        },
        {
          $group: {
            _id: null,
            totalPending: { $sum: 1 },
            withIdCard: {
              $sum: { $cond: [{ $in: ["id_card", "$verificationDocuments.documentType"] }, 1, 0] },
            },
            withPassport: {
              $sum: { $cond: [{ $in: ["passport", "$verificationDocuments.documentType"] }, 1, 0] },
            },
            withDriversLicense: {
              $sum: { $cond: [{ $in: ["drivers_license", "$verificationDocuments.documentType"] }, 1, 0] },
            },
            withCacDocument: {
              $sum: { $cond: [{ $in: ["cac_document", "$verificationDocuments.documentType"] }, 1, 0] },
            },
            withProofOfAddress: {
              $sum: { $cond: [{ $in: ["proof_of_address", "$verificationDocuments.documentType"] }, 1, 0] },
            },
            individualAccounts: {
              $sum: { $cond: [{ $eq: ["$accountType", "individual"] }, 1, 0] },
            },
            organizationAccounts: {
              $sum: { $cond: [{ $eq: ["$accountType", "organization"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const data = profiles.map((p: any) => ({
      _id: p._id,

      // Identity
      fullName: p.fullName,
      displayName: p.displayName ?? null,
      accountType: p.accountType,

      // Organization-specific (null for individuals)
      organizationName: p.accountType === "organization" ? (p.organizationName ?? null) : null,
      organizationType: p.accountType === "organization" ? (p.organizationType ?? null) : null,

      // Contact
      email: p.contact?.email ?? p.userId?.email ?? "—",
      role: p.userId?.role ?? "user",

      // Location — state + city for quick regional context
      state: p.location?.state ?? null,
      city: p.location?.city ?? null,

      // Avatar
      avatar: p.profilePicture?.secure_url ?? null,

      // Documents summary — types only, not URLs
      documentTypes: [...new Set(p.verificationDocuments?.map((d: any) => d.documentType) ?? [])],
      documentsCount: p.verificationDocuments?.length ?? 0,

      // Timing
      submittedAt: p.updatedAt,
      daysPending: Math.floor(
        (Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      stats: stats[0] || {
        totalPending: 0,
        withIdCard: 0,
        withPassport: 0,
        withDriversLicense: 0,
        withCacDocument: 0,
        withProofOfAddress: 0,
        individualAccounts: 0,
        organizationAccounts: 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching pending verification profiles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pending verification profiles" },
      { status: 500 }
    );
  }
}