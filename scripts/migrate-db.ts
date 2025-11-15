/**
 * Database Migration Script
 * Run with: npm run migrate
 */

import "dotenv/config"
import { Pool } from "pg"
import fs from "fs"
import path from "path"

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.error("❌ DATABASE_URL not configured in .env")
    console.log("\n💡 To use database storage:")
    console.log("1. Get a PostgreSQL database (Railway, Supabase, Neon, etc.)")
    console.log("2. Add DATABASE_URL to your .env file")
    console.log("3. Run: npm run migrate")
    process.exit(1)
  }

  console.log("🔄 Running database migration...")

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  })

  try {
    // Test connection
    await pool.query("SELECT 1")
    console.log("✅ Database connection successful")

    // Read schema file
    const schemaPath = path.join(__dirname, "../src/db/schema.sql")
    const schema = fs.readFileSync(schemaPath, "utf-8")

    // Run migrations
    await pool.query(schema)
    console.log("✅ Database schema created/updated")

    // Check if table exists
    const result = await pool.query(`
      SELECT COUNT(*) FROM nft_certificates
    `)
    console.log(`✅ nft_certificates table has ${result.rows[0].count} records`)

    console.log("\n🎉 Migration completed successfully!")
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()

