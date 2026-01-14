const { mysqlConnection } = require('./config/mysql');

async function debugHealthPredictions() {
    try {
        console.log('=== DEBUGGING HEALTH PREDICTIONS DATA ===\n');
        
        // Check if connection exists
        if (!mysqlConnection.pool) {
            await mysqlConnection.connect();
        }
        
        console.log('1. Checking raw diabetes_predictions table...');
        const rawQuery = 'SELECT id, patient_id, status, created_at FROM diabetes_predictions ORDER BY created_at DESC LIMIT 10';
        const rawData = await mysqlConnection.query(rawQuery);
        console.log(`   Found ${rawData.length} records in diabetes_predictions table:`);
        rawData.forEach((row, index) => {
            console.log(`   ${index + 1}. ID: ${row.id}, Patient: ${row.patient_id}, Status: ${row.status}, Created: ${row.created_at}`);
        });
        
        console.log('\n2. Checking patient ID types...');
        const patientIdQuery = 'SELECT DISTINCT patient_id, LENGTH(patient_id) as id_length FROM diabetes_predictions';
        const patientIds = await mysqlConnection.query(patientIdQuery);
        console.log('   Patient ID formats:');
        patientIds.forEach((row, index) => {
            console.log(`   ${index + 1}. "${row.patient_id}" (length: ${row.id_length})`);
        });
        
        console.log('\n3. Checking patients table...');
        const patientsQuery = 'SELECT id, patient_id, user_id FROM patients LIMIT 5';
        const patients = await mysqlConnection.query(patientsQuery);
        console.log(`   Found ${patients.length} records in patients table:`);
        patients.forEach((row, index) => {
            console.log(`   ${index + 1}. ID: ${row.id}, Patient_ID: ${row.patient_id}, User_ID: ${row.user_id}`);
        });
        
        console.log('\n4. Checking users table for patients...');
        const usersQuery = 'SELECT id, name, email, role FROM users WHERE role = ? LIMIT 5';
        const users = await mysqlConnection.query(usersQuery, ['patient']);
        console.log(`   Found ${users.length} patient users:`);
        users.forEach((row, index) => {
            console.log(`   ${index + 1}. ID: ${row.id}, Name: ${row.name}, Email: ${row.email}`);
        });
        
        console.log('\n5. Testing the admin query with current JOIN logic...');
        const adminQuery = `
            SELECT 
              dp.id,
              dp.patient_id,
              dp.status,
              dp.created_at,
              COALESCE(u.name, u2.name) as patient_name,
              COALESCE(u.email, u2.email) as patient_email,
              u.id as user_via_patients,
              u2.id as user_direct
            FROM diabetes_predictions dp
            -- First try: Join by patient_code (for cases like 'P001')
            LEFT JOIN patients p ON dp.patient_id = p.patient_id
            LEFT JOIN users u ON p.user_id = u.id
            -- Second try: Join by user_id (for UUID cases)
            LEFT JOIN users u2 ON dp.patient_id = u2.id
            WHERE (u.id IS NOT NULL OR u2.id IS NOT NULL)
            ORDER BY dp.created_at DESC
            LIMIT 10
        `;
        const adminResults = await mysqlConnection.query(adminQuery);
        console.log(`   Admin query returns ${adminResults.length} records:`);
        adminResults.forEach((row, index) => {
            console.log(`   ${index + 1}. ID: ${row.id}, Patient: ${row.patient_name || 'No Name'}, Status: ${row.status}, User1: ${row.user_via_patients}, User2: ${row.user_direct}`);
        });
        
        console.log('\n6. Testing admin query WITHOUT the WHERE clause...');
        const noWhereQuery = `
            SELECT 
              dp.id,
              dp.patient_id,
              dp.status,
              dp.created_at,
              COALESCE(u.name, u2.name) as patient_name,
              u.id as user_via_patients,
              u2.id as user_direct
            FROM diabetes_predictions dp
            LEFT JOIN patients p ON dp.patient_id = p.patient_id
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN users u2 ON dp.patient_id = u2.id
            ORDER BY dp.created_at DESC
            LIMIT 10
        `;
        const noWhereResults = await mysqlConnection.query(noWhereQuery);
        console.log(`   Query without WHERE returns ${noWhereResults.length} records:`);
        noWhereResults.forEach((row, index) => {
            console.log(`   ${index + 1}. ID: ${row.id}, Patient: ${row.patient_name || 'No Name'}, Status: ${row.status}, User1: ${row.user_via_patients || 'NULL'}, User2: ${row.user_direct || 'NULL'}`);
        });
        
        console.log('\n7. Checking for pending submissions specifically...');
        const pendingQuery = 'SELECT COUNT(*) as pending_count FROM diabetes_predictions WHERE status = "pending"';
        const pendingResult = await mysqlConnection.query(pendingQuery);
        console.log(`   Total pending submissions: ${pendingResult[0].pending_count}`);
        
        if (pendingResult[0].pending_count > 0) {
            const pendingDetailsQuery = 'SELECT id, patient_id, status, created_at FROM diabetes_predictions WHERE status = "pending" ORDER BY created_at DESC LIMIT 5';
            const pendingDetails = await mysqlConnection.query(pendingDetailsQuery);
            console.log('   Pending submissions details:');
            pendingDetails.forEach((row, index) => {
                console.log(`   ${index + 1}. ID: ${row.id}, Patient: ${row.patient_id}, Created: ${row.created_at}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Debug error:', error.message);
        console.error('Stack:', error.stack);
    }
}

debugHealthPredictions().then(() => {
    console.log('\n✅ Debug completed!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
});