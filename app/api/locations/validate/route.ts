import { NextRequest, NextResponse } from "next/server";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "your-google-maps-api-key-here") {
  console.warn("GOOGLE_MAPS_API_KEY is not set. Location validation will fall back to basic validation.");
}

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

/**
 * Validates a location using Google Maps Geocoding API
 * Returns normalized location data if valid
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location } = body;

    if (!location || typeof location !== 'string') {
      return NextResponse.json(
        { error: 'Location is required', valid: false },
        { status: 400 }
      );
    }

    // If API key is not configured, do basic validation
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "your-google-maps-api-key-here") {
      // Basic fallback: accept any non-empty string
      const trimmed = location.trim();
      if (trimmed.length === 0) {
        return NextResponse.json(
          { error: 'Location cannot be empty', valid: false },
          { status: 400 }
        );
      }
      return NextResponse.json({
        valid: true,
        normalizedLocation: trimmed,
        city: null,
        state: null,
        country: null,
        formattedAddress: trimmed
      });
    }

    // Use Google Maps Geocoding API
    const encodedLocation = encodeURIComponent(location.trim());
    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(geocodingUrl);
    const data: GeocodingResponse = await response.json();

    if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json(
        { error: 'Location not found. Please enter a valid city or location.', valid: false },
        { status: 400 }
      );
    }

    if (data.status !== 'OK') {
      console.error('Google Maps Geocoding API error:', data.status);
      // Fallback to basic validation on API errors
      const trimmed = location.trim();
      return NextResponse.json({
        valid: true,
        normalizedLocation: trimmed,
        city: null,
        state: null,
        country: null,
        formattedAddress: trimmed,
        warning: 'Location validation temporarily unavailable'
      });
    }

    const result = data.results[0];
    
    // Extract city, state, and country from address components
    let city: string | null = null;
    let state: string | null = null;
    let country: string | null = null;

    for (const component of result.address_components) {
      if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      if (component.types.includes('country')) {
        country = component.long_name;
      }
    }

    // Prefer city name, fallback to formatted address
    const normalizedLocation = city || result.formatted_address.split(',')[0].trim();

    return NextResponse.json({
      valid: true,
      normalizedLocation,
      city,
      state,
      country,
      formattedAddress: result.formatted_address,
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      }
    });
  } catch (error: any) {
    console.error('Error validating location:', error);
    
    // Fallback to basic validation on errors
    const body = await request.json().catch(() => ({ location: '' }));
    const trimmed = body.location?.trim() || '';
    
    if (trimmed.length === 0) {
      return NextResponse.json(
        { error: 'Location is required', valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      normalizedLocation: trimmed,
      city: null,
      state: null,
      country: null,
      formattedAddress: trimmed,
      warning: 'Location validation temporarily unavailable'
    });
  }
}









