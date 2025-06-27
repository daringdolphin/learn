#!/usr/bin/env tsx

import { seedDatabaseAction, getDatabaseStatsAction } from "../actions/db/seed-actions"

async function main() {
  console.log("🌱 Starting database seeding process...")
  
  try {
    // Show current stats
    console.log("\n📊 Current database stats:")
    const statsResult = await getDatabaseStatsAction()
    if (statsResult.isSuccess) {
      console.log(`   Questions: ${statsResult.data.questionCount}`)
      console.log(`   Images: ${statsResult.data.imageCount}`)
    }

    // Seed the database
    console.log("\n🚀 Seeding database...")
    const seedResult = await seedDatabaseAction()
    
    if (seedResult.isSuccess) {
      console.log("✅ Success:", seedResult.message)
      console.log(`   Questions seeded: ${seedResult.data.questionsSeeded}`)
      console.log(`   Images uploaded: ${seedResult.data.imagesUploaded}`)
    } else {
      console.error("❌ Error:", seedResult.message)
      process.exit(1)
    }

    // Show final stats
    console.log("\n📊 Final database stats:")
    const finalStatsResult = await getDatabaseStatsAction()
    if (finalStatsResult.isSuccess) {
      console.log(`   Questions: ${finalStatsResult.data.questionCount}`)
      console.log(`   Images: ${finalStatsResult.data.imageCount}`)
    }

    console.log("\n🎉 Database seeding completed successfully!")
    
  } catch (error) {
    console.error("💥 Fatal error during seeding:", error)
    process.exit(1)
  }
}

main() 