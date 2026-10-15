import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

interface GrantData {
  title: string;
  organization: string;
  amount: string;
  amountMin: number | null;
  amountMax: number | null;
  deadline: string | null;
  location: string;
  eligibility: string;
  description: string;
  applicationUrl: string | null;
  discoveredAt: string;
  category: string;
  tags: string[];
}

// Parse deadline string to Date (handles ISO format YYYY-MM-DD)
function parseDeadline(deadlineStr: string | null): Date | null {
  if (!deadlineStr) {
    return null;
  }
  
  // Try ISO format (YYYY-MM-DD)
  const date = new Date(deadlineStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
}

const grantsData: GrantData[] = [
  {
    "title": "Elevate",
    "organization": "Austin Arts, Culture, Music and Entertainment",
    "amount": "Grants awarded in tiers based on applicant category and operating budget, up to $80,000",
    "amountMin": null,
    "amountMax": 80000,
    "deadline": "2024-12-04",
    "location": "Austin MSA",
    "eligibility": "Eligible: 501(c)(3) Arts Nonprofits, Arts Groups including State of Texas Designated Arts Nonprofits, Individual Artists (may apply with Fiscal Sponsor). Requirements: 501(c)(3) Nonprofits no budget restrictions; Arts Groups and Individual Artists max $500,000 annual operating budget; creative mission in arts and culture production; at least two years of creative production history in Austin; events open to residents, visitors, tourists; headquartered in Austin MSA with over half production in Austin City Council Districts or Extraterritorial Jurisdiction. Ineligible: non-arts mission organizations, other 501(c) Nonprofits, budgets over $500,000 for Groups/Artists, outside Austin MSA, less than two years history, production outside Austin areas, City employees, AACME employees.",
    "description": "Invests in cultural organizations, groups, and individual artists to create vibrant, publicly accessible artistic experiences, sustaining and strengthening Austin's creative ecosystem by supporting production, operations, and administration of culturally rich programming for residents, visitors, and tourists.",
    "applicationUrl": "https://thelongcenter.submittable.com/submit",
    "discoveredAt": "2025-11-21T00:00:00.000Z",
    "category": "government",
    "tags": ["visual-artists", "performing-artists", "musicians", "nonprofit"]
  },
  {
    "title": "Thrive",
    "organization": "Austin Arts, Culture, Music and Entertainment",
    "amount": "Up to $250,000 total over 2 years for 501(c)(3) Arts Nonprofit with Creative Space; Up to $170,000 total over 2 years for 501(c)(3) Arts Nonprofit without Creative Space",
    "amountMin": null,
    "amountMax": 250000,
    "deadline": null,
    "location": "City of Austin / MSA, with majority of activities in Austin City Council districts or ETJ",
    "eligibility": "501(c)(3) Arts Nonprofit with at least five years operating in Austin MSA, over half of creative production in Austin, annual operating budget of $60,000 or higher; ineligible if primary mission not rooted in arts and culture, individuals, groups, headquartered outside Austin MSA, less than one year history, or City employees",
    "description": "Focused investment to sustain and grow local arts nonprofit organizations rooted in Austin's diverse cultures",
    "applicationUrl": null,
    "discoveredAt": "2025-11-21T00:00:00.000Z",
    "category": "government",
    "tags": ["visual-artists", "performing-artists", "musicians", "nonprofit", "creative-space"]
  },
  {
    "title": "Heritage Preservation Grant",
    "organization": "AACME",
    "amount": "Up to $250,000",
    "amountMin": null,
    "amountMax": 250000,
    "deadline": "2024-12-04",
    "location": "Austin MSA",
    "eligibility": "For-Profit Business, 501(c)(3) Nonprofit; two years minimum operating in the City of Austin / MSA; leaseholder or owner for historic designated properties; applicants may qualify for one grant per funding cycle",
    "description": "Promotes tourism through historic preservation projects and activities rooted in local history and heritage; supports capital projects or heritage events that expand access to historic places and heritage resources and market the site's history to engage new audiences and tourists; all capital projects require a historic designation",
    "applicationUrl": "https://thelongcenter.submittable.com/submit",
    "discoveredAt": "2025-11-21T00:00:00.000Z",
    "category": "public",
    "tags": ["creative-space", "venue"]
  },
  {
    "title": "Creative Space Assistance Program",
    "organization": "AACME",
    "amount": "$60,000 with 12-month Grant Agreement",
    "amountMin": 60000,
    "amountMax": 60000,
    "deadline": "2026-12-15",
    "location": "Austin Council District or its Extraterritorial Jurisdiction",
    "eligibility": "Creative spaces must be Live Music Venue, Performance Venue / Theatre, Museum / Art Gallery, or Multi-Use; provide previous year's operating budget or profit & loss statement showing at least $60,000; evidence of commercial property site control including executed lease or lease offer; zoned appropriately for commercial creative use; not City/State/Federally-run/owned, not owned by applicant, not festivals without permanent space, not office/practice/private studios, not temporary rental spaces, not new unoccupied spaces unless displaced in last 3 months; not Austin Arts, Culture, Music and Entertainment Employees.",
    "description": "Supports creative commercial spaces facing displacement or unaffordable leases; funds for revenue-generating space improvements, rent (up to 30% of base, not exceeding $60,000 over 12 months), general liability insurance, property tax reimbursements, and other space-related needs like permitting, facility improvements, environmental enhancements, displacement expenses.",
    "applicationUrl": "https://thelongcenter.submittable.com/submit",
    "discoveredAt": "2025-11-21T00:00:00.000Z",
    "category": "public",
    "tags": ["creative-space", "venue", "visual-artists", "musicians"]
  },
  {
    "title": "Austin Live Music Fund",
    "organization": "City of Austin",
    "amount": "$5,000 with 12-month Grant Agreement, $20,000 with 24-month Grant Agreement, $70,000 with 12-month Grant Agreement",
    "amountMin": 5000,
    "amountMax": 70000,
    "deadline": "2026-11-20",
    "location": "City of Austin Council District or Extraterritorial Jurisdiction (ETJ)",
    "eligibility": "Professional Musicians: at least 2 years of live performances or 6 released recordings or 6 music videos; Independent Promoters: no more than 3 staff, 2 years promoting shows, not tied to one venue; Live Music Venues: principal function is live music, at least $60,000 operating budget, meets 5+ criteria including performance space, equipment, staff, admission fees, marketing, hours, and 5 nights/week programming. All: one application per lead applicant, 51% performers live in MSA, activities in Austin areas, paid at City musician rate, no consecutive $20,000 awards in two fiscal years. Ineligible: nonprofits, government agencies, employees.",
    "description": "Encourages, promotes, improves, and showcases Austin's diverse music industry through supporting live and online events, studio/video/merchandise production, promotional tours, broadcasting, and marketing campaigns to boost cultural tourism, revenue for musicians/promoters/venues, new jobs, and artist development.",
    "applicationUrl": "https://thelongcenter.submittable.com/submit",
    "discoveredAt": "2025-11-21T00:00:00.000Z",
    "category": "government",
    "tags": ["musicians", "venue"]
  },
  {
    "title": "Individual Artist Project Grant",
    "organization": "Austin Creative Alliance",
    "amount": "$2,500 to $7,500",
    "amountMin": 2500,
    "amountMax": 7500,
    "deadline": "2026-11-15",
    "location": "Austin, TX",
    "eligibility": "Individual visual artists living in the Austin MSA with a public presentation planned within 12 months. Students enrolled full time are ineligible.",
    "description": "Supports new visual art projects, including materials, studio rental, and documentation for a public exhibition or installation in Austin.",
    "applicationUrl": "https://austincreativealliance.org",
    "discoveredAt": "2026-10-01T00:00:00.000Z",
    "category": "private",
    "tags": ["visual-artists"]
  },
  {
    "title": "Touring Performance Fund",
    "organization": "Texas Commission on the Arts",
    "amount": "Up to $12,000",
    "amountMin": null,
    "amountMax": 12000,
    "deadline": "2027-02-01",
    "location": "Texas",
    "eligibility": "Performing artists and small companies based in Texas with at least two confirmed public performances outside their home county.",
    "description": "Helps performers cover travel, fees, and production costs for touring dance, theater, and multidisciplinary work to Texas communities.",
    "applicationUrl": "https://www.arts.texas.gov",
    "discoveredAt": "2026-10-01T00:00:00.000Z",
    "category": "government",
    "tags": ["performing-artists"]
  },
  {
    "title": "Manuscript Development Award",
    "organization": "Writers' League of Texas",
    "amount": "$3,000",
    "amountMin": 3000,
    "amountMax": 3000,
    "deadline": "2027-01-15",
    "location": "Austin, TX",
    "eligibility": "Writers age 18 or older living in Texas. The manuscript must be unpublished and the applicant must be the sole author.",
    "description": "A project award for fiction, nonfiction, or poetry manuscripts, with funds for editing, research travel, and a public reading.",
    "applicationUrl": "https://writersleague.org",
    "discoveredAt": "2026-10-01T00:00:00.000Z",
    "category": "private",
    "tags": ["writers"]
  },
  {
    "title": "Austin Film Society Artist Grant",
    "organization": "Austin Film Society",
    "amount": "$5,000 to $15,000",
    "amountMin": 5000,
    "amountMax": 15000,
    "deadline": "2026-12-20",
    "location": "Austin, TX",
    "eligibility": "Filmmakers residing in Texas who retain creative control of a short or feature in development or production.",
    "description": "Production and finishing funds for independent film and video projects with a clear plan to screen the work in Austin.",
    "applicationUrl": "https://www.austinfilm.org",
    "discoveredAt": "2026-10-01T00:00:00.000Z",
    "category": "public",
    "tags": ["filmmakers"]
  },
  {
    "title": "Design for Public Space Fellowship",
    "organization": "Atelier Civic",
    "amount": "$8,000 stipend",
    "amountMin": 8000,
    "amountMax": 8000,
    "deadline": "2025-09-01",
    "location": "Austin, TX",
    "eligibility": "Designers with a portfolio of public-facing work. The 2025 cycle is closed.",
    "description": "A past fellowship for designers creating wayfinding, exhibition, or environmental graphics with a city cultural partner.",
    "applicationUrl": "https://example.com/design-fellowship",
    "discoveredAt": "2026-10-01T00:00:00.000Z",
    "category": "corporate",
    "tags": ["designers"]
  },
  {
    "title": "Cultural Venue Accessibility Grant",
    "organization": "City of Austin",
    "amount": "Up to $40,000",
    "amountMin": null,
    "amountMax": 40000,
    "deadline": "2027-03-01",
    "location": "Austin, TX",
    "eligibility": "Venues and creative spaces open to the public in Austin. Funds must be used for accessibility improvements.",
    "description": "Capital support for ramps, captioning, listening systems, and restroom access at cultural venues.",
    "applicationUrl": "https://www.austintexas.gov",
    "discoveredAt": "2026-10-01T00:00:00.000Z",
    "category": "government",
    "tags": ["venue", "creative-space"]
  },
  {
    "title": "Arts Nonprofit Capacity Grant",
    "organization": "Austin Community Foundation",
    "amount": "$10,000",
    "amountMin": 10000,
    "amountMax": 10000,
    "deadline": "2025-04-30",
    "location": "Austin MSA",
    "eligibility": "501(c)(3) arts nonprofits with annual budgets under $750,000. The spring 2025 round is closed.",
    "description": "Operating support for arts nonprofits to cover staff time, financial systems, and board development. This cycle has ended.",
    "applicationUrl": "https://www.austincf.org",
    "discoveredAt": "2026-10-01T00:00:00.000Z",
    "category": "public",
    "tags": ["nonprofit"]
  }
];

async function main() {
  const { prisma } = await import("../lib/db");
  console.log(`🗑️  Clearing existing grants...\n`);
  
  // Delete all existing grants (this will cascade delete tag relations)
  const deleteResult = await prisma.grant.deleteMany({});
  console.log(`   Deleted ${deleteResult.count} existing grants\n`);

  console.log(`📥 Importing ${grantsData.length} grants...\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const grantData of grantsData) {
    try {
      // Parse deadline
      const deadline = parseDeadline(grantData.deadline);

      // Parse discoveredAt date
      const discoveredAt = grantData.discoveredAt ? new Date(grantData.discoveredAt) : new Date();

      // Create grant with category and tags
      const grant = await prisma.grant.create({
        data: {
          title: grantData.title,
          organization: grantData.organization,
          amount: grantData.amount,
          amountMin: grantData.amountMin,
          amountMax: grantData.amountMax,
          deadline: deadline,
          location: grantData.location,
          eligibility: grantData.eligibility,
          description: grantData.description,
          applicationUrl: grantData.applicationUrl,
          discoveredAt: discoveredAt,
          category: grantData.category,
          tags: {
            create: grantData.tags.map(tagSlug => ({
              tag: {
                connectOrCreate: {
                  where: { slug: tagSlug },
                  create: {
                    name: tagSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                    slug: tagSlug
                  }
                }
              }
            }))
          }
        }
      });

      console.log(`✅ Imported: ${grant.title} (${grant.category})`);
      imported++;
    } catch (error: any) {
      console.error(`❌ Error importing ${grantData.title}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`\n🎉 Import complete!`);
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });
