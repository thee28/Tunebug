import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stages = [
  {
    slug: "beginner",
    title: "Beginner",
    description: "Learn note names and basic pitch matching",
    order: 0,
    icon: "🌱",
    lessons: [
      {
        slug: "beginner-note-c",
        title: "The Note C",
        order: 0,
        exerciseType: "EAR_SINGLE" as const,
        exerciseConfig: {
          targetNote: "C4",
          choices: ["C", "D", "E", "F"],
          correctAnswer: "C",
        },
        xpReward: 10,
      },
      {
        slug: "beginner-note-d-e",
        title: "Notes D and E",
        order: 1,
        exerciseType: "EAR_SINGLE" as const,
        exerciseConfig: {
          targetNote: "D4",
          choices: ["C", "D", "E", "F"],
          correctAnswer: "D",
        },
        xpReward: 10,
      },
      {
        slug: "beginner-sight-c",
        title: "Sight Read: C",
        order: 2,
        exerciseType: "SIGHT_READ_PIANO" as const,
        exerciseConfig: {
          targetNote: "C4",
          vexKey: "c/4",
          octaveRange: [3, 5],
        },
        xpReward: 15,
      },
      {
        slug: "beginner-pitch-c",
        title: "Sing the Note C",
        order: 3,
        exerciseType: "PITCH_MATCH" as const,
        exerciseConfig: {
          targetNote: "C4",
          displayNote: "C",
          confidenceThreshold: 0.8,
          timeoutSeconds: 10,
        },
        xpReward: 15,
      },
    ],
  },
  {
    slug: "elementary",
    title: "Elementary",
    description: "Major scale notes and simple sight reading",
    order: 1,
    icon: "🎵",
    lessons: [
      {
        slug: "elementary-c-major-scale",
        title: "C Major Scale",
        order: 0,
        exerciseType: "EAR_SINGLE" as const,
        exerciseConfig: {
          targetNote: "G4",
          choices: ["E", "F", "G", "A"],
          correctAnswer: "G",
        },
        xpReward: 15,
      },
      {
        slug: "elementary-sight-e",
        title: "Sight Read: E and G",
        order: 1,
        exerciseType: "SIGHT_READ_PIANO" as const,
        exerciseConfig: {
          targetNote: "E4",
          vexKey: "e/4",
          octaveRange: [3, 5],
        },
        xpReward: 15,
      },
      {
        slug: "elementary-ear-chord",
        title: "Hear a Chord",
        order: 2,
        exerciseType: "EAR_MULTI" as const,
        exerciseConfig: {
          targetNotes: ["C4", "E4", "G4"],
          choices: ["C", "D", "E", "F", "G", "A", "B"],
          correctAnswers: ["C", "E", "G"],
        },
        xpReward: 20,
      },
      {
        slug: "elementary-pitch-g",
        title: "Sing the Note G",
        order: 3,
        exerciseType: "PITCH_MATCH" as const,
        exerciseConfig: {
          targetNote: "G4",
          displayNote: "G",
          confidenceThreshold: 0.82,
          timeoutSeconds: 10,
        },
        xpReward: 20,
      },
    ],
  },
  {
    slug: "intermediate",
    title: "Intermediate",
    description: "Intervals and multi-note ear training",
    order: 2,
    icon: "🎸",
    lessons: [
      {
        slug: "intermediate-perfect-fifth",
        title: "Perfect Fifth",
        order: 0,
        exerciseType: "INTERVAL_ID" as const,
        exerciseConfig: {
          noteA: "C4",
          noteB: "G4",
          choices: ["Major 3rd", "Perfect 4th", "Perfect 5th", "Octave"],
          correctAnswer: "Perfect 5th",
        },
        xpReward: 20,
      },
      {
        slug: "intermediate-major-third",
        title: "Major Third",
        order: 1,
        exerciseType: "INTERVAL_ID" as const,
        exerciseConfig: {
          noteA: "C4",
          noteB: "E4",
          choices: ["Minor 3rd", "Major 3rd", "Perfect 4th", "Perfect 5th"],
          correctAnswer: "Major 3rd",
        },
        xpReward: 20,
      },
      {
        slug: "intermediate-ear-multi",
        title: "Two-Note Chord",
        order: 2,
        exerciseType: "EAR_MULTI" as const,
        exerciseConfig: {
          targetNotes: ["C4", "G4"],
          choices: ["C", "D", "E", "F", "G", "A", "B"],
          correctAnswers: ["C", "G"],
        },
        xpReward: 25,
      },
      {
        slug: "intermediate-pitch-e",
        title: "Sing the Note E",
        order: 3,
        exerciseType: "PITCH_MATCH" as const,
        exerciseConfig: {
          targetNote: "E4",
          displayNote: "E",
          confidenceThreshold: 0.85,
          timeoutSeconds: 10,
        },
        xpReward: 25,
      },
    ],
  },
  {
    slug: "upper-intermediate",
    title: "Upper Intermediate",
    description: "Complex intervals and sight reading",
    order: 3,
    icon: "🎹",
    lessons: [
      {
        slug: "upper-sight-read-g",
        title: "Sight Read in Treble Clef",
        order: 0,
        exerciseType: "SIGHT_READ_PIANO" as const,
        exerciseConfig: {
          targetNote: "G4",
          vexKey: "g/4",
          octaveRange: [3, 5],
        },
        xpReward: 25,
      },
      {
        slug: "upper-octave",
        title: "Octave Leap",
        order: 1,
        exerciseType: "INTERVAL_ID" as const,
        exerciseConfig: {
          noteA: "C4",
          noteB: "C5",
          choices: ["Perfect 5th", "Major 6th", "Major 7th", "Octave"],
          correctAnswer: "Octave",
        },
        xpReward: 25,
      },
      {
        slug: "upper-ear-triad",
        title: "Identify the Triad",
        order: 2,
        exerciseType: "EAR_MULTI" as const,
        exerciseConfig: {
          targetNotes: ["E4", "G#4", "B4"],
          choices: ["C", "D", "E", "F", "G", "A", "B"],
          correctAnswers: ["E", "G", "B"],
        },
        xpReward: 30,
      },
      {
        slug: "upper-pitch-a",
        title: "Sing the Note A",
        order: 3,
        exerciseType: "PITCH_MATCH" as const,
        exerciseConfig: {
          targetNote: "A4",
          displayNote: "A",
          confidenceThreshold: 0.85,
          timeoutSeconds: 10,
        },
        xpReward: 30,
      },
    ],
  },
  {
    slug: "advanced",
    title: "Advanced",
    description: "Complex chords, fast ear training, and intervals",
    order: 4,
    icon: "🏆",
    lessons: [
      {
        slug: "advanced-tritone",
        title: "The Tritone",
        order: 0,
        exerciseType: "INTERVAL_ID" as const,
        exerciseConfig: {
          noteA: "C4",
          noteB: "F#4",
          choices: ["Perfect 4th", "Tritone", "Perfect 5th", "Major 6th"],
          correctAnswer: "Tritone",
        },
        xpReward: 30,
      },
      {
        slug: "advanced-ear-seventh",
        title: "Seventh Chord",
        order: 1,
        exerciseType: "EAR_MULTI" as const,
        exerciseConfig: {
          targetNotes: ["C4", "E4", "G4", "B4"],
          choices: ["C", "D", "E", "F", "G", "A", "B"],
          correctAnswers: ["C", "E", "G", "B"],
        },
        xpReward: 35,
      },
      {
        slug: "advanced-sight-complex",
        title: "Advanced Sight Reading",
        order: 2,
        exerciseType: "SIGHT_READ_PIANO" as const,
        exerciseConfig: {
          targetNote: "B4",
          vexKey: "b/4",
          octaveRange: [3, 6],
        },
        xpReward: 35,
      },
      {
        slug: "advanced-pitch-high",
        title: "Pitch Control",
        order: 3,
        exerciseType: "PITCH_MATCH" as const,
        exerciseConfig: {
          targetNote: "E5",
          displayNote: "E",
          confidenceThreshold: 0.88,
          timeoutSeconds: 12,
        },
        xpReward: 40,
      },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  for (const stage of stages) {
    const { lessons, ...stageData } = stage;
    const createdStage = await prisma.stage.upsert({
      where: { slug: stageData.slug },
      update: stageData,
      create: stageData,
    });

    for (const lesson of lessons) {
      await prisma.lesson.upsert({
        where: { slug: lesson.slug },
        update: { ...lesson, stageId: createdStage.id },
        create: { ...lesson, stageId: createdStage.id },
      });
    }

    console.log(`  ✓ Stage: ${stageData.title} (${lessons.length} lessons)`);
  }

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
