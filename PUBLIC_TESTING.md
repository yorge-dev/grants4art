# Public site testing

Anonymous visitors can browse, filter, and save grants without an account. The public pages do not call the admin Gemini routes (`/api/grants/generate-tags`, `/api/scrape`).

## Browser storage

Saves and the selected persona stay on this device. The app uses `localStorage` and falls back to a cookie when storage is blocked.

| Key | Value |
| --- | --- |
| `grants4art.persona` | A discipline slug such as `visual-artists`, or removed when cleared |
| `grants4art.savedGrants` | JSON array of saved grant summaries (title, funder, amount, deadline, location, apply link) |

## Load demo grants

`npm run db:import` replaces every grant in the database with the demo set in `scripts/import-grants.ts`. That set mixes open deadlines, closed deadlines, and one grant with no deadline. Run it only against the database you intend to use for testing.

## Tester flow

1. Open the home page.
2. Choose a persona under "I am a". The list should show grants with that tag. Refresh and confirm the persona is still selected. Use "Clear persona" to see every grant again.
3. Search by title or organization, toggle funding sources, and switch Deadline between All, Open, and Closed. The grant and funding counts should follow those filters.
4. Open "Show details" on a card and confirm eligibility and the full description. Closed grants are dimmed and labeled "Applications Closed".
5. Bookmark a grant. Confirm the toast and the Saved count. Open Saved, check the title, funder, deadline, and amount, then remove the grant.
6. On a narrow window, confirm the persona choices, filters, and cards stack and remain usable.
