import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";
import path from "path";
import { CURRICULUM } from "../lib/curriculum/config";

config({ path: path.resolve(process.cwd(), ".env.local") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding curriculum…");

  for (const stage of CURRICULUM) {
    const { units, difficulty: _d, ...stageData } = stage;

    const createdStage = await prisma.stage.upsert({
      where: { slug: stageData.slug },
      update: stageData,
      create: stageData,
    });

    for (const unit of units) {
      const { lessons, ...unitData } = unit;

      const createdUnit = await prisma.unit.upsert({
        where: { slug: unitData.slug },
        update: { ...unitData, stageId: createdStage.id },
        create: { ...unitData, stageId: createdStage.id },
      });

      for (const lesson of lessons) {
        const lessonData = { ...lesson, unitId: createdUnit.id, exerciseConfig: lesson.exerciseConfig as never };
        await prisma.lesson.upsert({
          where: { slug: lesson.slug },
          update: lessonData,
          create: lessonData,
        });
      }

      console.log(`  ✓ ${createdStage.title} › ${unitData.title} (${lessons.length} lessons)`);
    }
  }

  const totalLessons = CURRICULUM.reduce(
    (sum, s) => sum + s.units.reduce((u, unit) => u + unit.lessons.length, 0),
    0
  );
  console.log(`\nSeed complete — ${CURRICULUM.length} sections, ${CURRICULUM.reduce((s, st) => s + st.units.length, 0)} units, ${totalLessons} lessons.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
