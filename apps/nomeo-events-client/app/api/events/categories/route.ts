// app/api/events/categories/route.ts
import { connectDB } from "@/lib/mongoose";
import { Event, EventCategory, EventStatus } from "@/models/event";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await connectDB();
  
  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get('upcoming') === 'true';
  
  try {
    const categories = Object.values(EventCategory);
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        let query: any = { category, status: EventStatus.PUBLISHED };
        
        if (upcoming) {
          query.startDate = { $gte: new Date() };
        }
        
        const count = await Event.countDocuments(query);
        
        // Get featured events in this category
        const featuredEvents = await Event.find({
          category,
          status: EventStatus.PUBLISHED,
          featured: true,
          ...(upcoming && { startDate: { $gte: new Date() } })
        })
          .populate('organizerId', 'name email image')
          .sort({ startDate: 1 })
          .limit(3);
        
        return {
          category,
          displayName: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count,
          featuredEvents
        };
      })
    );
    
    return NextResponse.json({ 
      success: true, 
      data: categoriesWithCounts.filter(c => c.count > 0)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}