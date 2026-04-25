// test-terminal.js
import { createClient } from '@supabase/supabase-js'

// Use actual Supabase credentials for terminal testing
const supabaseUrl = 'https://qruqxvfczdvbshzvjcii.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXF4dmZjemR2YnNoenZqY2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDY2MjksImV4cCI6MjA5MDk4MjYyOX0.pAZ2gMZ7rlKcippl_YobUxDsqVZsD5Xm8hDAJuVhdl0'
const supabase = createClient(supabaseUrl, supabaseKey)

async function runQuickTest() {
    console.log('🚀 Testing Supabase Connection...')
    
    try {
        // Test basic connection by checking users table
        const { data, error } = await supabase.from('users').select('*').limit(1)
        
        if (error) {
            console.log("❌ Connection Failed:", error.message)
            console.log("Error details:", error)
        } else {
            console.log("✅ Success! Supabase connection is working!")
            console.log("Data returned:", data.length, "user(s) found")
            
            // Test a few more tables
            await testTable('hotels')
            await testTable('bookings')
            await testTable('bundles')
            
            console.log("🎉 All tests completed successfully!")
        }
    } catch (err) {
        console.log("❌ Unexpected error:", err.message)
    }
}

async function testTable(tableName) {
    try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1)
        if (error) {
            console.log(`⚠️  ${tableName} table:`, error.message)
        } else {
            console.log(`✅ ${tableName} table: OK (${data.length} records)`)
        }
    } catch (err) {
        console.log(`❌ ${tableName} table error:`, err.message)
    }
}

// Run the test
runQuickTest()
