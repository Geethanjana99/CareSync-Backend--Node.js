# Database Column Mapping Fix

## Issue
Error: `"notes": "\n\nPrediction Error: Unknown column 'predictionResult' in 'field list'"`

## Root Cause
The `DiabetesPrediction` model's `update()` method was using camelCase property names directly as database column names, but the database schema uses snake_case column names.

**Database Schema (snake_case):**
- `prediction_result`
- `prediction_probability` 
- `risk_level`
- `patient_id`
- `admin_id`
- `created_at`
- `updated_at`
- `processed_at`

**Model Properties (camelCase):**
- `predictionResult`
- `predictionProbability`
- `riskLevel`
- `patientId`
- `adminId`
- `createdAt`
- `updatedAt`
- `processedAt`

## Solution
Added a column mapping mechanism in the `DiabetesPrediction.update()` method:

```javascript
// Map camelCase to snake_case for database columns
const columnMapping = {
  'predictionResult': 'prediction_result',
  'predictionProbability': 'prediction_probability',
  'riskLevel': 'risk_level',
  'patientId': 'patient_id',
  'adminId': 'admin_id',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'processedAt': 'processed_at'
};

Object.keys(data).forEach(key => {
  if (data[key] !== undefined) {
    // Use the mapped column name if available, otherwise use the key as-is
    const columnName = columnMapping[key] || key;
    updates.push(`${columnName} = ?`);
    params.push(data[key]);
  }
});
```

## Verification
✅ **Database Schema Confirmed**: Checked actual database columns using `DESCRIBE diabetes_predictions`
✅ **Column Mapping Tested**: Verified that camelCase properties correctly map to snake_case columns
✅ **Update Operation Tested**: Confirmed database updates work with the new mapping

## Files Modified
- `backend/models/DiabetesPrediction.js` - Added column mapping in `update()` method

## Impact
- Fixes the "Unknown column 'predictionResult'" error
- Allows diabetes prediction processing to complete successfully
- Maintains consistency between JavaScript camelCase and SQL snake_case conventions
- No breaking changes to existing code

## Testing
Run the test to verify the fix:
```bash
cd backend
node test-column-mapping-simple.js
```

Expected output: Column mapping verification completed successfully.
