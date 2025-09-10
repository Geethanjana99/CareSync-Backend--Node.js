#!/usr/bin/env node
/**
 * Test the enhanced AI Predictions with search and filter functionality
 */

const { mysqlConnection } = require('./config/mysql');

async function testSearchAndFilterData() {
  try {
    console.log('🧪 Testing Search and Filter Data Preparation...\n');
    
    // Initialize connection
    await mysqlConnection.connect();
    
    // Check current predictions and their details
    console.log('📊 Current predictions in database:');
    const query = `
      SELECT 
        dp.id,
        dp.patient_id,
        dp.status,
        dp.created_at,
        u.name as patient_name,
        u.email as patient_email
      FROM diabetes_predictions dp
      LEFT JOIN patients p ON dp.patient_id = p.patient_id
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY dp.created_at DESC
    `;
    
    const predictions = await mysqlConnection.query(query);
    
    predictions.forEach((record, index) => {
      console.log(`  ${index + 1}. ID: ${record.id.substring(0, 8)}...`);
      console.log(`     Patient: ${record.patient_name || 'Unknown'}`);
      console.log(`     Patient ID: ${record.patient_id.substring(0, 8)}...`);
      console.log(`     Email: ${record.patient_email || 'N/A'}`);
      console.log(`     Status: ${record.status}`);
      console.log('');
    });
    
    console.log('📈 Status breakdown:');
    const statuses = {};
    predictions.forEach(p => {
      statuses[p.status] = (statuses[p.status] || 0) + 1;
    });
    
    Object.entries(statuses).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} records`);
    });
    
    // Test search scenarios
    console.log('\n🔍 Testing search scenarios:');
    
    // Test 1: Search by partial name
    const searchName = 'geeth';
    const nameMatches = predictions.filter(p => 
      p.patient_name && p.patient_name.toLowerCase().includes(searchName.toLowerCase())
    );
    console.log(`  Search "${searchName}": ${nameMatches.length} matches`);
    nameMatches.forEach(match => {
      console.log(`    - ${match.patient_name} (${match.status})`);
    });
    
    // Test 2: Search by patient ID partial
    const searchId = 'a5c553f5';
    const idMatches = predictions.filter(p => 
      p.patient_id.toLowerCase().includes(searchId.toLowerCase()) ||
      p.id.toLowerCase().includes(searchId.toLowerCase())
    );
    console.log(`  Search "${searchId}": ${idMatches.length} matches`);
    
    // Test 3: Filter by status
    const processedOnly = predictions.filter(p => p.status === 'processed');
    const reviewedOnly = predictions.filter(p => p.status === 'reviewed');
    
    console.log(`  Processed only: ${processedOnly.length} records`);
    console.log(`  Reviewed only: ${reviewedOnly.length} records`);
    console.log(`  All records: ${predictions.length} records`);
    
    // Simulate frontend filter logic
    console.log('\n🎯 Frontend filter simulation:');
    
    // Scenario 1: Show only processed (checkbox unchecked)
    const showReviewed = false;
    const searchTerm = '';
    
    let filtered = predictions.filter(prediction => {
      const matchesSearch = searchTerm === '' || 
        (prediction.patient_name && prediction.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        prediction.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prediction.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = showReviewed || prediction.status === 'processed';
      
      return matchesSearch && matchesStatus;
    });
    
    console.log(`  Scenario 1 (showReviewed=false, search=""): ${filtered.length} records`);
    
    // Scenario 2: Show all (checkbox checked)
    const showReviewed2 = true;
    
    filtered = predictions.filter(prediction => {
      const matchesSearch = searchTerm === '' || 
        (prediction.patient_name && prediction.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        prediction.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prediction.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = showReviewed2 || prediction.status === 'processed';
      
      return matchesSearch && matchesStatus;
    });
    
    console.log(`  Scenario 2 (showReviewed=true, search=""): ${filtered.length} records`);
    
    // Scenario 3: Search with name + show all
    const searchTerm3 = 'geeth';
    
    filtered = predictions.filter(prediction => {
      const matchesSearch = searchTerm3 === '' || 
        (prediction.patient_name && prediction.patient_name.toLowerCase().includes(searchTerm3.toLowerCase())) ||
        prediction.patient_id.toLowerCase().includes(searchTerm3.toLowerCase()) ||
        prediction.id.toLowerCase().includes(searchTerm3.toLowerCase());
      
      const matchesStatus = showReviewed2 || prediction.status === 'processed';
      
      return matchesSearch && matchesStatus;
    });
    
    console.log(`  Scenario 3 (showReviewed=true, search="geeth"): ${filtered.length} records`);
    
    console.log('\n✅ Search and filter test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  testSearchAndFilterData();
}
