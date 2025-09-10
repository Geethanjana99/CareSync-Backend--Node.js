#!/usr/bin/env node
/**
 * Create a test doctor token and test the AI predictions API
 */

const jwt = require('jsonwebtoken');
const { mysqlConnection } = require('./config/mysql');
const http = require('http');

// Load environment variables
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_make_it_very_long_and_secure_development_key_2025';

async function createTestTokenAndTestAPI() {
  try {
    console.log('🔑 Creating test doctor token...\n');
    
    // Initialize connection
    await mysqlConnection.connect();
    
    // Find a doctor user
    const doctorQuery = `
      SELECT u.id, u.email, u.name, u.role, d.doctor_id
      FROM users u
      JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor'
      LIMIT 1
    `;
    
    const doctors = await mysqlConnection.query(doctorQuery);
    
    if (doctors.length === 0) {
      console.log('❌ No doctor users found in database');
      return;
    }
    
    const doctor = doctors[0];
    console.log(`👨‍⚕️ Found doctor: ${doctor.name} (${doctor.email})`);
    
    // Create token
    const doctorPayload = {
      id: doctor.id,
      email: doctor.email,
      role: doctor.role,
      name: doctor.name
    };
    
    const token = jwt.sign(doctorPayload, JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ Token created successfully\n');
    
    // Now test the API with this token
    console.log('🧪 Testing AI Predictions API...\n');
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/doctors/ai-predictions',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Status Code: ${res.statusCode}`);
        
        try {
          const jsonData = JSON.parse(data);
          
          if (res.statusCode === 200 && jsonData.success) {
            console.log('✅ API Response successful!');
            console.log(`📈 Total predictions: ${jsonData.data.predictions.length}`);
            
            // Check status distribution
            const statuses = {};
            jsonData.data.predictions.forEach(p => {
              statuses[p.status] = (statuses[p.status] || 0) + 1;
            });
            
            console.log('\n📊 Status distribution in API response:');
            Object.entries(statuses).forEach(([status, count]) => {
              console.log(`  - ${status}: ${count} records`);
            });
            
            // Check isReviewed field
            const withIsReviewed = jsonData.data.predictions.filter(p => p.hasOwnProperty('isReviewed'));
            console.log(`\n✅ Records with isReviewed field: ${withIsReviewed.length}`);
            
            const reviewedItems = jsonData.data.predictions.filter(p => p.isReviewed === true);
            console.log(`✅ Records marked as reviewed (isReviewed=true): ${reviewedItems.length}`);
            
            // Show sample records
            console.log('\n📋 Sample records:');
            jsonData.data.predictions.slice(0, 5).forEach((p, index) => {
              console.log(`  ${index + 1}. ID: ${p.id.substring(0, 8)}..., Status: ${p.status}, isReviewed: ${p.isReviewed}, Patient: ${p.patientName}`);
            });
            
            // Verify that both processed and reviewed are included
            const processedCount = jsonData.data.predictions.filter(p => p.status === 'processed').length;
            const reviewedCount = jsonData.data.predictions.filter(p => p.status === 'reviewed').length;
            
            console.log('\n🎯 Verification:');
            console.log(`  - Processed records: ${processedCount}`);
            console.log(`  - Reviewed records: ${reviewedCount}`);
            
            if (processedCount > 0 && reviewedCount > 0) {
              console.log('✅ SUCCESS: Both processed and reviewed records are returned!');
            } else if (processedCount > 0) {
              console.log('⚠️  Only processed records found');
            } else if (reviewedCount > 0) {
              console.log('⚠️  Only reviewed records found');
            } else {
              console.log('❌ No processed or reviewed records found');
            }
            
          } else {
            console.log('❌ API Response failed:');
            console.log(JSON.stringify(jsonData, null, 2));
          }
        } catch (parseError) {
          console.log('❌ Failed to parse response as JSON:');
          console.log(data);
        }
        
        process.exit(0);
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      process.exit(1);
    });
    
    req.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  createTestTokenAndTestAPI();
}
