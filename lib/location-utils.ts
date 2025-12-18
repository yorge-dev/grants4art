/**
 * Validates a location using Google Maps Geocoding API
 * This function calls the API endpoint for validation
 * @param location - The location string to validate
 * @returns Promise with validation result
 */
export async function validateLocation(location: string): Promise<{
  valid: boolean;
  normalizedLocation?: string;
  error?: string;
}> {
  if (!location || typeof location !== 'string' || location.trim().length === 0) {
    return { valid: false, error: 'Location is required' };
  }

  try {
    const response = await fetch('/api/locations/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: location.trim() })
    });

    const data = await response.json();

    if (!data.valid) {
      return { valid: false, error: data.error || 'Invalid location' };
    }

    return {
      valid: true,
      normalizedLocation: data.normalizedLocation || location.trim()
    };
  } catch (error) {
    // Fallback: accept any non-empty string if API fails
    console.error('Location validation error:', error);
    return {
      valid: true,
      normalizedLocation: location.trim()
    };
  }
}

/**
 * Normalizes a location string (client-side helper)
 * For server-side normalization, use the API endpoint
 * @param location - The location string to normalize
 * @returns string - Normalized location
 */
export function normalizeLocation(location: string): string {
  if (!location || typeof location !== 'string') {
    return location;
  }
  return location.trim();
}











