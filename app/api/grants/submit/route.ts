import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GRANT_CATEGORIES } from "@/lib/constants";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

interface GeocodingResult {
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
}

interface GeocodingResponse {
  results: GeocodingResult[];
  status: string;
}

async function validateAndNormalizeLocation(location: string): Promise<{ valid: boolean; normalized: string; error?: string }> {
  if (!location || typeof location !== 'string' || location.trim().length === 0) {
    return { valid: false, normalized: '', error: 'Location is required' };
  }

  const trimmed = location.trim();

  // If API key is not configured, do basic validation
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "your-google-maps-api-key-here") {
    return { valid: true, normalized: trimmed };
  }

  try {
    // Use Google Maps Geocoding API
    const encodedLocation = encodeURIComponent(trimmed);
    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(geocodingUrl);
    const data: GeocodingResponse = await response.json();

    if (data.status === 'ZERO_RESULTS') {
      return { valid: false, normalized: '', error: 'Location not found. Please enter a valid city or location.' };
    }

    if (data.status !== 'OK') {
      console.error('Google Maps Geocoding API error:', data.status);
      // Fallback to basic validation on API errors
      return { valid: true, normalized: trimmed };
    }

    const result = data.results[0];
    
    // Extract city from address components, fallback to formatted address
    let city: string | null = null;
    for (const component of result.address_components) {
      if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
        city = component.long_name;
        break;
      }
    }

    const normalizedLocation = city || result.formatted_address.split(',')[0].trim();
    return { valid: true, normalized: normalizedLocation };
  } catch (error) {
    console.error('Error validating location:', error);
    // Fallback to basic validation on errors
    return { valid: true, normalized: trimmed };
  }
}

// Simple in-memory rate limiting (for production, use Redis or database)
const submissionRateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_SUBMISSIONS_PER_HOUR = 3;

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of submissionRateLimit.entries()) {
    const filtered = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (filtered.length === 0) {
      submissionRateLimit.delete(ip);
    } else {
      submissionRateLimit.set(ip, filtered);
    }
  }
}, 10 * 60 * 1000);

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = submissionRateLimit.get(ip) || [];
  
  // Filter out timestamps outside the rate limit window
  const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  
  if (recentTimestamps.length >= MAX_SUBMISSIONS_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }
  
  // Add current timestamp
  recentTimestamps.push(now);
  submissionRateLimit.set(ip, recentTimestamps);
  
  return { allowed: true, remaining: MAX_SUBMISSIONS_PER_HOUR - recentTimestamps.length };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientIP = getClientIP(request);

    // Bot protection: Check honeypot field (should not be present or empty)
    if (body.honeypot) {
      return NextResponse.json(
        { error: 'Invalid submission' },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitCheck = checkRateLimit(clientIP);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate required fields
    if (!body.title || !body.organization || !body.location || !body.description || !body.eligibility) {
      return NextResponse.json(
        { error: 'Missing required fields: title, organization, location, description, and eligibility are required' },
        { status: 400 }
      );
    }

    // Validate and normalize location using Google Maps
    const locationValidation = await validateAndNormalizeLocation(body.location);
    if (!locationValidation.valid) {
      return NextResponse.json(
        { error: locationValidation.error || 'Invalid location' },
        { status: 400 }
      );
    }
    const normalizedLocation = locationValidation.normalized;

    // Validate category if provided
    if (body.category) {
      const validCategories = GRANT_CATEGORIES.map(c => c.slug);
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
      }
    }

    // Validate amount fields
    if (body.amountMin && (isNaN(parseInt(body.amountMin)) || parseInt(body.amountMin) < 0)) {
      return NextResponse.json(
        { error: 'Invalid minimum amount' },
        { status: 400 }
      );
    }

    if (body.amountMax && (isNaN(parseInt(body.amountMax)) || parseInt(body.amountMax) < 0)) {
      return NextResponse.json(
        { error: 'Invalid maximum amount' },
        { status: 400 }
      );
    }

    if (body.amountMin && body.amountMax && parseInt(body.amountMin) > parseInt(body.amountMax)) {
      return NextResponse.json(
        { error: 'Minimum amount cannot be greater than maximum amount' },
        { status: 400 }
      );
    }

    // Validate deadline if provided
    let deadlineDate: Date | null = null;
    if (body.deadline) {
      deadlineDate = new Date(body.deadline);
      if (isNaN(deadlineDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid deadline date' },
          { status: 400 }
        );
      }
    }

    // Validate application URL if provided
    if (body.applicationUrl) {
      try {
        new URL(body.applicationUrl);
      } catch {
        return NextResponse.json(
          { error: 'Invalid application URL' },
          { status: 400 }
        );
      }
    }

    // Create grant with PENDING status (approvedAt = null, scrapeJobId = null)
    const grant = await prisma.grant.create({
      data: {
        title: body.title.trim(),
        organization: body.organization.trim(),
        amount: body.amount ? body.amount.trim() : null,
        amountMin: body.amountMin ? parseInt(body.amountMin) : null,
        amountMax: body.amountMax ? parseInt(body.amountMax) : null,
        deadline: deadlineDate,
        location: normalizedLocation,
        eligibility: body.eligibility.trim(),
        description: body.description.trim(),
        applicationUrl: body.applicationUrl ? body.applicationUrl.trim() : null,
        category: body.category || null,
        // PENDING status: approvedAt remains null
        // User submission: scrapeJobId remains null
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    return NextResponse.json(
      { 
        success: true,
        grant,
        message: 'Grant submitted successfully. It will be reviewed by an admin.'
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error submitting grant:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A grant with similar information already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to submit grant: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

