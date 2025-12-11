# Texas Art Grants Scraper

A Python script for automated grant discovery from Texas arts organizations.

## Overview

This scraper visits known grant sources, extracts grant information using the API's AI-powered extraction, and submits grants for admin review.

## Setup

### Prerequisites

- Python 3.8+
- Texas Art Grants API running (locally or deployed)

### Installation

```bash
cd scraper
pip install -r requirements.txt
```

## Usage

### Run Locally

```bash
# Against local development server
python scraper.py

# Against production API
API_URL=https://your-domain.vercel.app python scraper.py
```

### Add New Grant Sources

Edit `scraper.py` and add URLs to the `GRANT_SOURCES` list:

```python
GRANT_SOURCES = [
    "https://example.com/grants",
    "https://another-org.com/funding",
    # Add more URLs here
]
```

### Schedule with Cron

Add to your crontab to run daily at 9 AM:

```bash
# Edit crontab
crontab -e

# Add this line (adjust paths as needed)
0 9 * * * cd /path/to/txartgrants/scraper && /usr/bin/python3 scraper.py >> /var/log/grant-scraper.log 2>&1
```

### Run with GitHub Actions

Create `.github/workflows/scrape.yml`:

```yaml
name: Daily Grant Scraper

on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily
  workflow_dispatch:  # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd scraper
          pip install -r requirements.txt
      
      - name: Run scraper
        env:
          API_URL: ${{ secrets.API_URL }}
        run: |
          cd scraper
          python scraper.py
```

Then add `API_URL` secret in your GitHub repository settings.

## How It Works

1. **Read Sources**: The script reads URLs from `GRANT_SOURCES`
2. **Call API**: For each URL, it calls `/api/scrape` endpoint
3. **AI Extraction**: The API uses Google Gemini to extract grant details
4. **Store as Pending**: Grants are saved with PENDING status
5. **Admin Review**: Admin reviews and approves/rejects in dashboard

## Monitoring

### Check Logs

```bash
# View recent logs
tail -f /var/log/grant-scraper.log

# Search for errors
grep "Error" /var/log/grant-scraper.log
```

### Success Rate

The script prints a summary after each run:

```
Summary:
  Total URLs: 4
  Successful: 3
  Failed: 1
```

## Customization

### Timeout

Adjust request timeout in `scraper.py`:

```python
response = requests.post(
    f"{api_url}/api/scrape",
    json={"sourceUrl": url},
    timeout=120  # Increase to 120 seconds
)
```

### Retry Logic

Add retry logic for failed requests:

```python
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

session = requests.Session()
retry = Retry(total=3, backoff_factor=1)
adapter = HTTPAdapter(max_retries=retry)
session.mount('http://', adapter)
session.mount('https://', adapter)
```

### Notifications

Add email/Slack notifications on failure:

```python
import smtplib
from email.message import EmailMessage

def send_alert(message):
    msg = EmailMessage()
    msg.set_content(message)
    msg['Subject'] = 'Grant Scraper Alert'
    msg['From'] = 'scraper@example.com'
    msg['To'] = 'admin@example.com'
    
    with smtplib.SMTP('localhost') as s:
        s.send_message(msg)
```

## Troubleshooting

### Connection Refused

- Verify API is running: `curl http://localhost:3000/api/grants`
- Check API_URL environment variable
- Ensure no firewall blocking requests

### Timeout Errors

- Increase timeout value
- Check API server resources
- Verify database connection

### No Grants Found

- Check if URLs have changed
- Verify grant pages still exist
- Review AI extraction prompts in API

## Alternative: Direct Database

For advanced users, you can write directly to the database:

```python
import psycopg2

# Connect to database
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

# Insert grant
cur.execute("""
    INSERT INTO "Grant" (id, title, organization, location, description, eligibility, status)
    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, 'PENDING')
""", (title, org, location, desc, eligibility))

conn.commit()
```

Note: Using the API is recommended as it includes validation and AI extraction.

## Support

For issues or questions:
- Check API logs: Vercel dashboard
- Review scraper output: `/var/log/grant-scraper.log`
- Open GitHub issue







