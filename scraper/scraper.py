#!/usr/bin/env python3
"""
Texas Art Grants Web Scraper

This script scrapes grant information from Texas arts organizations
and submits them to the Texas Art Grants API for review.
"""

import os
import sys
import requests
from typing import Optional, Dict, List
from datetime import datetime
import json

# Grant sources to scrape
GRANT_SOURCES = [
    "https://futurefronttexas.org/grants",
    "https://www.austintexas.gov/acme/grants-funding",
    "https://houstonartsalliance.com/grants/",
    "https://www.nashersculpturecenter.org/programs-events/nasher-artist-grants",
]


def scrape_url(url: str, api_url: str) -> Optional[Dict]:
    """
    Scrape a URL and submit to the API.
    
    Args:
        url: URL to scrape
        api_url: Base URL of the Texas Art Grants API
        
    Returns:
        Response from API if successful, None otherwise
    """
    try:
        print(f"Scraping: {url}")
        
        # Call the scrape API endpoint
        response = requests.post(
            f"{api_url}/api/scrape",
            json={"sourceUrl": url},
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                grant = result.get("grant", {})
                print(f"✓ Discovered grant: {grant.get('title', 'Unknown')}")
                return result
            else:
                print(f"✗ No grant found: {result.get('message', 'Unknown error')}")
                return None
        else:
            print(f"✗ Error: HTTP {response.status_code}")
            return None
            
    except requests.RequestException as e:
        print(f"✗ Request failed: {e}")
        return None
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return None


def main():
    """Main scraper function."""
    # Get API URL from environment or use default
    api_url = os.getenv("API_URL", "http://localhost:3000")
    
    print(f"Texas Art Grants Scraper")
    print(f"API URL: {api_url}")
    print(f"Time: {datetime.now().isoformat()}")
    print("-" * 60)
    
    # Track results
    total = len(GRANT_SOURCES)
    successful = 0
    failed = 0
    
    # Scrape each source
    for url in GRANT_SOURCES:
        result = scrape_url(url, api_url)
        if result and result.get("success"):
            successful += 1
        else:
            failed += 1
        print()  # Blank line between sources
    
    # Print summary
    print("-" * 60)
    print(f"Summary:")
    print(f"  Total URLs: {total}")
    print(f"  Successful: {successful}")
    print(f"  Failed: {failed}")
    print("-" * 60)
    
    # Exit with error code if any failures
    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()







