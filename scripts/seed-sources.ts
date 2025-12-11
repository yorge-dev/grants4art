import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GRANT_SOURCES = [
  {
    name: "Future Front Texas",
    url: "https://futurefronttexas.org/grants"
  },
  {
    name: "Austin Center for Manufacturing and Innovation (ACME)",
    url: "https://www.austintexas.gov/acme/grants-funding"
  },
  {
    name: "Houston Arts Alliance",
    url: "https://houstonartsalliance.com/grants/"
  },
  {
    name: "Nasher Sculpture Center",
    url: "https://www.nashersculpturecenter.org/programs-events/nasher-artist-grants"
  },
];

async function main() {
  console.log('Seeding grant sources...');

  for (const source of GRANT_SOURCES) {
    const existing = await prisma.grantSource.findUnique({
      where: { url: source.url }
    });

    if (existing) {
      console.log(`Source already exists: ${source.name}`);
    } else {
      await prisma.grantSource.create({
        data: {
          name: source.name,
          url: source.url,
          isActive: true
        }
      });
      console.log(`Created source: ${source.name}`);
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error seeding grant sources:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

