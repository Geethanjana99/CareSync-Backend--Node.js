const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Function to get patient token
async function getPatientToken() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'patient1@gmail.com',
            password: 'Password@123'
        });
        
        if (response.data.success && response.data.data && response.data.data.token) {
            return response.data.data.token;
        }
        throw new Error('Failed to get patient token');
    } catch (error) {
        console.error('Patient login error:', error.message);
        throw error;
    }
}

// Function to get admin token
async function getAdminToken() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@gmail.com',
            password: 'admin123'
        });
        
        if (response.data.success && response.data.data && response.data.data.token) {
            return response.data.data.token;
        }
        throw new Error('Failed to get admin token');
    } catch (error) {
        console.error('Admin login error:', error.message);
        throw error;
    }
}

async function testDiabetesPredictionFlow() {
    try {
        console.log('=== TESTING DIABETES PREDICTION SUBMISSION FLOW ===\n');
        
        // Step 1: Patient submits health data
        console.log('1. Patient submitting health data...');
        const patientToken = await getPatientToken();
        axios.defaults.headers.common['Authorization'] = `Bearer ${patientToken}`;
        
        const healthData = {
            pregnancies: 2,
            glucose: 140,
            bmi: 28.5,
            age: 35,
            insulin: 125,
            notes: "Feeling tired lately, family history of diabetes"
        };
        
        console.log('   Submitting data:', healthData);
        
        const submitResponse = await axios.post(`${BASE_URL}/patient/health-predictions`, healthData);
        
        if (submitResponse.data.success) {
            console.log('   ✅ Patient submission successful!');
            console.log('   Submission ID:', submitResponse.data.data.submission.id);
            console.log('   Status:', submitResponse.data.data.submission.status);
        } else {
            console.log('   ❌ Patient submission failed:', submitResponse.data.message);
            return;
        }
        
        // Step 2: Admin checks for pending submissions
        console.log('\n2. Admin checking for pending submissions...');
        const adminToken = await getAdminToken();
        axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
        
        const adminResponse = await axios.get(`${BASE_URL}/admin/health-predictions?status=pending`);
        
        if (adminResponse.data.success) {
            console.log('   ✅ Admin can access submissions!');
            console.log(`   Found ${adminResponse.data.data.submissions.length} pending submissions`);
            
            if (adminResponse.data.data.submissions.length > 0) {
                const submission = adminResponse.data.data.submissions[0];
                console.log('   Latest submission:');
                console.log(`     ID: ${submission.id}`);
                console.log(`     Patient: ${submission.patient_name || 'Unknown'}`);
                console.log(`     Status: ${submission.status}`);
                console.log(`     Glucose: ${submission.glucose}`);
                console.log(`     BMI: ${submission.bmi}`);
                console.log(`     Created: ${submission.created_at}`);
            } else {
                console.log('   ⚠️  No pending submissions found - this might be the issue!');
            }
        } else {
            console.log('   ❌ Admin cannot access submissions:', adminResponse.data.message);
        }
        
        // Step 3: Check all submissions regardless of status
        console.log('\n3. Admin checking ALL submissions...');
        const allSubmissionsResponse = await axios.get(`${BASE_URL}/admin/health-predictions?status=all`);
        
        if (allSubmissionsResponse.data.success) {
            console.log(`   Found ${allSubmissionsResponse.data.data.submissions.length} total submissions`);
            
            if (allSubmissionsResponse.data.data.submissions.length > 0) {
                console.log('   Recent submissions:');
                allSubmissionsResponse.data.data.submissions.slice(0, 3).forEach((submission, index) => {
                    console.log(`     ${index + 1}. ID: ${submission.id}, Patient: ${submission.patient_name || 'Unknown'}, Status: ${submission.status}, Created: ${submission.created_at}`);
                });
            } else {
                console.log('   ❌ NO SUBMISSIONS FOUND AT ALL - This is the problem!');
            }
        } else {
            console.log('   ❌ Failed to get all submissions:', allSubmissionsResponse.data.message);
        }
        
        // Step 4: Check patient's own submissions
        console.log('\n4. Patient checking their own submissions...');
        axios.defaults.headers.common['Authorization'] = `Bearer ${patientToken}`;
        
        const patientSubmissionsResponse = await axios.get(`${BASE_URL}/patient/health-predictions`);
        
        if (patientSubmissionsResponse.data.success) {
            console.log(`   Patient can see ${patientSubmissionsResponse.data.data.submissions.length} of their own submissions`);
            
            if (patientSubmissionsResponse.data.data.submissions.length > 0) {
                const submission = patientSubmissionsResponse.data.data.submissions[0];
                console.log(`   Latest: ID ${submission.id}, Status: ${submission.status}`);
            }
        } else {
            console.log('   ❌ Patient cannot see their submissions:', patientSubmissionsResponse.data.message);
        }
        
    } catch (error) {
        console.error('❌ Error in diabetes prediction flow:', error.message);
        if (error.response && error.response.data) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testDiabetesPredictionFlow().then(() => {
    console.log('\n✅ Testing completed!');
}).catch(error => {
    console.error('❌ Test failed:', error);
});