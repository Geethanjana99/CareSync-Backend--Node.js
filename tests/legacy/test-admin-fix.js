const axios = require('axios');

async function testAdminHealthPredictions() {
    try {
        console.log('=== TESTING ADMIN HEALTH PREDICTIONS FIX ===\n');
        
        // Get admin token
        console.log('1. Getting admin token...');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@gmail.com',
            password: 'Admin@123'
        });
        
        if (!response.data.success) {
            throw new Error('Admin login failed');
        }
        
        const adminToken = response.data.data.token;
        console.log('   ✅ Admin logged in successfully');
        
        // Set authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
        
        // Test getting all submissions
        console.log('\n2. Getting ALL health predictions...');
        const allResponse = await axios.get('http://localhost:5000/api/admin/health-predictions?status=all');
        
        if (!response.data.success) {
            throw new Error('Admin login failed');
        }
        
        const adminToken = response.data.data.token;
        console.log('   ✅ Admin logged in successfully');
        
        // Set authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
        
        // Test getting all submissions
        console.log('\n2. Getting ALL health predictions...');
        const allResponse = await axios.get('http://localhost:5000/api/admin/health-predictions?status=all');
        
        if (allResponse.data.success) {
            const submissions = allResponse.data.data.submissions;
            console.log(`   ✅ Found ${submissions.length} total submissions`);
            
            submissions.forEach((submission, index) => {
                console.log(`   ${index + 1}. ID: ${submission.id.substring(0, 8)}...`);
                console.log(`      Patient: ${submission.patientInfo.name}`);
                console.log(`      Status: ${submission.status}`);
                console.log(`      Created: ${new Date(submission.createdAt).toLocaleDateString()}`);
                console.log(`      Glucose: ${submission.healthData.glucose}, BMI: ${submission.healthData.bmi}`);
            });
        } else {
            console.log('   ❌ Failed to get all submissions:', allResponse.data.message);
        }
        
        // Test getting pending submissions
        console.log('\n3. Getting PENDING health predictions...');
        const pendingResponse = await axios.get('http://localhost:5000/api/admin/health-predictions?status=pending');
        
        if (pendingResponse.data.success) {
            const submissions = pendingResponse.data.data.submissions;
            console.log(`   ✅ Found ${submissions.length} pending submissions`);
            
            if (submissions.length > 0) {
                console.log('   Pending submissions ready for processing:');
                submissions.forEach((submission, index) => {
                    console.log(`   ${index + 1}. ID: ${submission.id.substring(0, 8)}...`);
                    console.log(`      Patient: ${submission.patientInfo.name}`);
                    console.log(`      Health Data: Glucose ${submission.healthData.glucose}, BMI ${submission.healthData.bmi}, Age ${submission.healthData.age}`);
                    console.log(`      Created: ${new Date(submission.createdAt).toLocaleString()}`);
                });
            } else {
                console.log('   ⚠️  No pending submissions found');
            }
        } else {
            console.log('   ❌ Failed to get pending submissions:', pendingResponse.data.message);
        }
        
        // Test getting reviewed submissions
        console.log('\n4. Getting REVIEWED health predictions...');
        const reviewedResponse = await axios.get('http://localhost:5000/api/admin/health-predictions?status=reviewed');
        
        if (reviewedResponse.data.success) {
            const submissions = reviewedResponse.data.data.submissions;
            console.log(`   ✅ Found ${submissions.length} reviewed submissions`);
            
            submissions.forEach((submission, index) => {
                console.log(`   ${index + 1}. ID: ${submission.id.substring(0, 8)}... - ${submission.patientInfo.name} (${submission.status})`);
            });
        } else {
            console.log('   ❌ Failed to get reviewed submissions:', reviewedResponse.data.message);
        }
        
        // Test pagination
        console.log('\n5. Testing pagination...');
        const paginationResponse = await axios.get('http://localhost:5000/api/admin/health-predictions?page=1&limit=3');
        
        if (paginationResponse.data.success) {
            const data = paginationResponse.data.data;
            console.log(`   ✅ Pagination working: Page ${data.pagination.currentPage} of ${data.pagination.totalPages}`);
            console.log(`   Total items: ${data.pagination.totalItems}, Items per page: ${data.pagination.itemsPerPage}`);
        }
        
    } catch (error) {
        console.error('❌ Error testing admin health predictions:', error.message);
        if (error.response && error.response.data) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testAdminHealthPredictions().then(() => {
    console.log('\n✅ Testing completed!');
}).catch(error => {
    console.error('❌ Test failed:', error);
});