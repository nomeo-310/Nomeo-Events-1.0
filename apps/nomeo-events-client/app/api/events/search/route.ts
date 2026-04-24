// app/api/events/search/route.ts
import { connectDB } from "@/lib/mongoose";
import { Event, EventStatus } from "@/models/event";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await connectDB();
  
  const { searchParams } = new URL(req.url);
  
  const category = searchParams.get('category');
  const type = searchParams.get('type');
  const status = searchParams.get('status') || EventStatus.PUBLISHED;
  const upcoming = searchParams.get('upcoming') === 'true';
  const featured = searchParams.get('featured') === 'true';
  const search = searchParams.get('search');
  const city = searchParams.get('city');
  const country = searchParams.get('country');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const sortBy = searchParams.get('sortBy') || 'startDate';
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  try {
    let query: any = { status };
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Type filter
    if (type) {
      query.type = type;
    }
    
    // Featured filter
    if (featured) {
      query.featured = true;
    }
    
    // Upcoming filter
    if (upcoming) {
      query.startDate = { $gte: new Date() };
    }
    
    // Date range filter
    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.startDate = { $lte: new Date(endDate) };
    }
    
    // Location filters
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }
    
    if (country) {
      query['location.country'] = country;
    }
    
    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Price filter (check plans)
    if (minPrice || maxPrice) {
      query['plans'] = {
        $elemMatch: {
          ...(minPrice && { price: { $gte: parseInt(minPrice) } }),
          ...(maxPrice && { price: { $lte: parseInt(maxPrice) } })
        }
      };
    }
    
    // Sorting
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const [events, totalCount] = await Promise.all([
      Event.find(query)
        .populate('organizerId', 'name email image')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Event.countDocuments(query)
    ]);
    
    return NextResponse.json({ 
      success: true, 
      data: events,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}