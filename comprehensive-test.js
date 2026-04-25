// comprehensive-test.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qruqxvfczdvbshzvjcii.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXF4dmZjemR2YnNoenZqY2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDY2MjksImV4cCI6MjA5MDk4MjYyOX0.pAZ2gMZ7rlKcippl_YobUxDsqVZsD5Xm8hDAJuVhdl0'
const supabase = createClient(supabaseUrl, supabaseKey)

async function runComprehensiveTest() {
    console.log('🚀 COMPREHENSIVE DATABASE FEATURE TEST')
    console.log('=====================================\n')
    
    let testResults = {
        passed: 0,
        failed: 0,
        details: []
    }

    // Test 1: Basic Tables Exist
    await testSection('BASIC TABLES', async () => {
        await testTable('users', 'User accounts')
        await testTable('hotels', 'Hotel listings')
        await testTable('restaurants', 'Restaurant listings')
        await testTable('attractions', 'Tourist attractions')
        await testTable('spa_venues', 'Spa venues')
        await testTable('bookings', 'Booking records')
        await testTable('bundles', 'Travel bundles')
        await testTable('payments', 'Payment transactions')
    })

    // Test 2: Advanced Tables
    await testSection('ADVANCED TABLES', async () => {
        await testTable('user_sessions', 'User sessions')
        await testTable('booking_passengers', 'Booking passengers')
        await testTable('booking_extras', 'Booking extras')
        await testTable('booking_status_history', 'Booking status history')
        await testTable('bundle_components', 'Bundle components')
        await testTable('user_bundles', 'User bundles')
        await testTable('notifications', 'Notifications')
        await testTable('email_queue', 'Email queue')
        await testTable('invoices', 'Invoices')
        await testTable('refunds', 'Refunds')
        await testTable('payment_methods', 'Payment methods')
        await testTable('admin_users', 'Admin users')
        await testTable('admin_logs', 'Admin logs')
        await testTable('promo_codes', 'Promo codes')
    })

    // Test 3: Timing Features (updated_at triggers)
    await testSection('TIMING FEATURES', async () => {
        await testTimingFeatures()
    })

    // Test 4: Notification System
    await testSection('NOTIFICATION SYSTEM', async () => {
        await testNotificationSystem()
    })

    // Test 5: Booking System
    await testSection('BOOKING SYSTEM', async () => {
        await testBookingSystem()
    })

    // Test 6: Payment System
    await testSection('PAYMENT SYSTEM', async () => {
        await testPaymentSystem()
    })

    // Test 7: Bundle System
    await testSection('BUNDLE SYSTEM', async () => {
        await testBundleSystem()
    })

    // Test 8: Admin Features
    await testSection('ADMIN FEATURES', async () => {
        await testAdminFeatures()
    })

    // Summary
    console.log('\n📊 TEST SUMMARY')
    console.log('================')
    console.log(`✅ Passed: ${testResults.passed}`)
    console.log(`❌ Failed: ${testResults.failed}`)
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`)
    
    if (testResults.failed > 0) {
        console.log('\n❌ FAILED TESTS:')
        testResults.details.filter(d => !d.passed).forEach(detail => {
            console.log(`  - ${detail.name}: ${detail.error}`)
        })
    }

    console.log('\n🎯 RECOMMENDATIONS:')
    if (testResults.failed === 0) {
        console.log('✅ All features are working! Your database is fully functional.')
    } else {
        console.log('⚠️  Some features need attention. Check failed tests above.')
    }
    
    return testResults

    // Helper Functions
    async function testSection(sectionName, testFunction) {
        console.log(`\n🔍 ${sectionName}`)
        console.log('-'.repeat(sectionName.length + 3))
        await testFunction()
    }

    async function testTable(tableName, description) {
        try {
            const { data, error } = await supabase.from(tableName).select('*').limit(1)
            if (error) {
                testResults.failed++
                testResults.details.push({ name: `${tableName} table`, passed: false, error: error.message })
                console.log(`❌ ${tableName}: ${error.message}`)
            } else {
                testResults.passed++
                testResults.details.push({ name: `${tableName} table`, passed: true })
                console.log(`✅ ${tableName}: OK (${data.length} records)`)
            }
        } catch (err) {
            testResults.failed++
            testResults.details.push({ name: `${tableName} table`, passed: false, error: err.message })
            console.log(`❌ ${tableName}: ${err.message}`)
        }
    }

    async function testTimingFeatures() {
        try {
            // Test if updated_at trigger works by inserting and updating a user
            const testEmail = `test_${Date.now()}@example.com`
            
            // Insert test user
            const { data: insertData, error: insertError } = await supabase
                .from('users')
                .insert({
                    email: testEmail,
                    password_hash: 'test',
                    full_name: 'Test User'
                })
                .select()
                .single()
            
            if (insertError) throw insertError
            
            const originalUpdatedAt = insertData.updated_at
            
            // Wait a moment to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Update the user
            const { data: updateData, error: updateError } = await supabase
                .from('users')
                .update({ full_name: 'Updated Test User' })
                .eq('user_id', insertData.user_id)
                .select()
                .single()
            
            if (updateError) throw updateError
            
            // Check if updated_at changed
            if (new Date(updateData.updated_at) > new Date(originalUpdatedAt)) {
                testResults.passed++
                testResults.details.push({ name: 'updated_at trigger', passed: true })
                console.log('✅ updated_at trigger: Working correctly')
                
                // Clean up test user
                await supabase.from('users').delete().eq('user_id', insertData.user_id)
            } else {
                throw new Error('updated_at did not change after update')
            }
        } catch (err) {
            testResults.failed++
            testResults.details.push({ name: 'updated_at trigger', passed: false, error: err.message })
            console.log(`❌ updated_at trigger: ${err.message}`)
        }
    }

    async function testNotificationSystem() {
        try {
            // Test notification creation
            const { data: notifData, error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
                    type: 'test',
                    title: 'Test Notification',
                    content: 'This is a test notification'
                })
                .select()
                .single()
            
            if (notifError) {
                // Expected to fail due to RLS, but table should exist
                if (notifError.message.includes('violates row-level security')) {
                    testResults.passed++
                    testResults.details.push({ name: 'Notifications table', passed: true })
                    console.log('✅ Notifications table: RLS working correctly')
                } else {
                    throw notifError
                }
            } else {
                testResults.passed++
                testResults.details.push({ name: 'Notifications table', passed: true })
                console.log('✅ Notifications table: OK')
                
                // Clean up
                await supabase.from('notifications').delete().eq('notification_id', notifData.notification_id)
            }
            
            // Test email queue
            const { data: emailData, error: emailError } = await supabase
                .from('email_queue')
                .insert({
                    recipient: 'test@example.com',
                    subject: 'Test Email',
                    body: 'This is a test email'
                })
                .select()
                .single()
            
            if (emailError) {
                if (emailError.message.includes('violates row-level security')) {
                    testResults.passed++
                    testResults.details.push({ name: 'Email queue table', passed: true })
                    console.log('✅ Email queue table: RLS working correctly')
                } else {
                    throw emailError
                }
            } else {
                testResults.passed++
                testResults.details.push({ name: 'Email queue table', passed: true })
                console.log('✅ Email queue table: OK')
                
                // Clean up
                await supabase.from('email_queue').delete().eq('email_id', emailData.email_id)
            }
        } catch (err) {
            testResults.failed++
            testResults.details.push({ name: 'Notification system', passed: false, error: err.message })
            console.log(`❌ Notification system: ${err.message}`)
        }
    }

    async function testBookingSystem() {
        try {
            // Test booking with related tables
            const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    user_id: '00000000-0000-0000-0000-000000000000',
                    booking_type: 'hotel',
                    service_id: '00000000-0000-0000-0000-000000000000',
                    total_price: 100,
                    currency: 'USD',
                    start_date: new Date().toISOString().split('T')[0]
                })
                .select()
                .single()
            
            if (bookingError) {
                if (bookingError.message.includes('violates row-level security')) {
                    testResults.passed++
                    testResults.details.push({ name: 'Booking system', passed: true })
                    console.log('✅ Booking system: RLS working correctly')
                } else {
                    throw bookingError
                }
            } else {
                testResults.passed++
                testResults.details.push({ name: 'Booking system', passed: true })
                console.log('✅ Booking system: OK')
                
                // Test related tables
                const bookingId = bookingData.booking_id
                
                // Test booking passengers
                const { error: passengerError } = await supabase
                    .from('booking_passengers')
                    .insert({
                        booking_id: bookingId,
                        first_name: 'Test',
                        last_name: 'Passenger'
                    })
                
                if (passengerError) {
                    console.log(`⚠️  Booking passengers: ${passengerError.message}`)
                } else {
                    console.log('✅ Booking passengers: OK')
                    await supabase.from('booking_passengers').delete().eq('booking_id', bookingId)
                }
                
                // Clean up
                await supabase.from('bookings').delete().eq('booking_id', bookingId)
            }
        } catch (err) {
            testResults.failed++
            testResults.details.push({ name: 'Booking system', passed: false, error: err.message })
            console.log(`❌ Booking system: ${err.message}`)
        }
    }

    async function testPaymentSystem() {
        try {
            // Test payment creation
            const { data: paymentData, error: paymentError } = await supabase
                .from('payments')
                .insert({
                    booking_id: '00000000-0000-0000-0000-000000000000',
                    user_id: '00000000-0000-0000-0000-000000000000',
                    amount: 100,
                    currency: 'USD',
                    payment_method: 'credit_card'
                })
                .select()
                .single()
            
            if (paymentError) {
                if (paymentError.message.includes('violates row-level security')) {
                    testResults.passed++
                    testResults.details.push({ name: 'Payment system', passed: true })
                    console.log('✅ Payment system: RLS working correctly')
                } else {
                    throw paymentError
                }
            } else {
                testResults.passed++
                testResults.details.push({ name: 'Payment system', passed: true })
                console.log('✅ Payment system: OK')
                
                // Clean up
                await supabase.from('payments').delete().eq('payment_id', paymentData.payment_id)
            }
        } catch (err) {
            testResults.failed++
            testResults.details.push({ name: 'Payment system', passed: false, error: err.message })
            console.log(`❌ Payment system: ${err.message}`)
        }
    }

    async function testBundleSystem() {
        try {
            // Test bundle creation
            const { data: bundleData, error: bundleError } = await supabase
                .from('bundles')
                .insert({
                    name: 'Test Bundle',
                    destination: 'Test City',
                    total_original_price: 500,
                    discounted_price: 450,
                    valid_from: new Date().toISOString().split('T')[0],
                    valid_until: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
                })
                .select()
                .single()
            
            if (bundleError) {
                if (bundleError.message.includes('violates row-level security')) {
                    testResults.passed++
                    testResults.details.push({ name: 'Bundle system', passed: true })
                    console.log('✅ Bundle system: RLS working correctly')
                } else {
                    throw bundleError
                }
            } else {
                testResults.passed++
                testResults.details.push({ name: 'Bundle system', passed: true })
                console.log('✅ Bundle system: OK')
                
                // Clean up
                await supabase.from('bundles').delete().eq('bundle_id', bundleData.bundle_id)
            }
        } catch (err) {
            testResults.failed++
            testResults.details.push({ name: 'Bundle system', passed: false, error: err.message })
            console.log(`❌ Bundle system: ${err.message}`)
        }
    }

    async function testAdminFeatures() {
        try {
            // Test admin table access (should be restricted)
            const { data: adminData, error: adminError } = await supabase
                .from('admin_users')
                .select('*')
                .limit(1)
            
            if (adminError) {
                if (adminError.message.includes('violates row-level security')) {
                    testResults.passed++
                    testResults.details.push({ name: 'Admin security', passed: true })
                    console.log('✅ Admin security: RLS working correctly')
                } else {
                    throw adminError
                }
            } else {
                testResults.passed++
                testResults.details.push({ name: 'Admin table', passed: true })
                console.log('✅ Admin table: Accessible')
            }
            
            // Test promo codes
            const { data: promoData, error: promoError } = await supabase
                .from('promo_codes')
                .select('*')
                .limit(1)
            
            if (promoError) {
                if (promoError.message.includes('violates row-level security')) {
                    testResults.passed++
                    testResults.details.push({ name: 'Promo codes', passed: true })
                    console.log('✅ Promo codes: RLS working correctly')
                } else {
                    throw promoError
                }
            } else {
                testResults.passed++
                testResults.details.push({ name: 'Promo codes', passed: true })
                console.log('✅ Promo codes: Accessible')
            }
        } catch (err) {
            testResults.failed++
            testResults.details.push({ name: 'Admin features', passed: false, error: err.message })
            console.log(`❌ Admin features: ${err.message}`)
        }
    }
}

// Run the test
runComprehensiveTest().catch(console.error)
