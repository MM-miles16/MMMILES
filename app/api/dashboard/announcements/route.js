import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    // For now, return static announcements data
    // In a real implementation, this would fetch from a announcements table
    const announcements = [
      {
        id: 1,
        date: "12/12/2024",
        title: "Welcome to MM Miles",
        desc: "Thank you for choosing MM Miles for your car rental needs. We're here to provide you with the best service.",
        time: "10:30 PM, Monday",
        color: "#f3f1dcff",
      },
      {
        id: 2,
        date: "13/12/2024",
        title: "Service Update",
        desc: "All our vehicles are regularly sanitized and serviced to ensure your safety and comfort. Book with confidence!",
        time: "10:30 PM, Tuesday",
        color: "#f5d4d4ff",
      },
      {
        id: 3,
        date: "14/12/2024",
        title: "Special Offers",
        desc: "Check out our latest offers and discounts on car rentals across major cities in India.",
        time: "09:20 PM, Wednesday",
        color: "#cde3efff",
      },
      {
        id: 4,
        date: "15/12/2024",
        title: "24/7 Support",
        desc: "Our customer support team is available round the clock to assist you with any queries.",
        time: "11:15 AM, Thursday",
        color: "#eafcdeff",
      },
      {
        id: 5,
        date: "16/12/2024",
        title: "New Cities Added",
        desc: "We're excited to announce car rental services now available in 5 new cities across India.",
        time: "02:45 PM, Friday",
        color: "#fae3c8ff",
      }
    ];

    return NextResponse.json(announcements);

  } catch (error) {
    console.error('Dashboard announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, color = "#C7E9B0" } = body;
    
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // In a real implementation, you would save this to a database
    const newAnnouncement = {
      id: Date.now(), // Simple ID generation
      date: new Date().toLocaleDateString(),
      title,
      desc: description,
      time: new Date().toLocaleTimeString(),
      color
    };

    return NextResponse.json(newAnnouncement);

  } catch (error) {
    console.error('Dashboard announcements create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}