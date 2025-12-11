import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  const totalGrants = await prisma.grant.count();
  const totalTags = await prisma.grantTag.count();
  
  const grants = await prisma.grant.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  });

  console.log("\n📊 Database Summary:\n");
  console.log(`   Total Grants: ${totalGrants}`);
  console.log(`   🏷️  Tags: ${totalTags}`);
  
  console.log("\n📋 Recent Grants:\n");
  grants.forEach((grant, i) => {
    const tags = grant.tags.map(rel => rel.tag.name).join(", ");
    const deadline = grant.deadline ? new Date(grant.deadline).toLocaleDateString() : "N/A";
    console.log(`   ${i + 1}. ${grant.title}`);
    console.log(`      Organization: ${grant.organization}`);
    console.log(`      Amount: ${grant.amount || "N/A"}`);
    console.log(`      Deadline: ${deadline}`);
    console.log(`      Tags: ${tags || "None"}`);
    console.log("");
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

