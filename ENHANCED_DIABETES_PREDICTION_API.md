# Enhanced Diabetes Prediction API - Frontend Integration Guide

## Overview
The diabetes prediction API has been enhanced to provide immediate results with a "View Details" button that opens the Streamlit analysis page with pre-filled parameters.

## API Response Structure

### Successful Prediction Response
```json
{
  "success": true,
  "message": "Diabetes prediction created successfully",
  "data": {
    "prediction": {
      "id": "uuid",
      "pregnancies": 2,
      "glucose": 140,
      "bmi": 28.1,
      "age": 35,
      "insulin": 150,
      "predictionResult": 0,
      "predictionProbability": 0.3163,
      "riskLevel": "low",
      "status": "processed"
    },
    "summary": {
      "prediction": "No Diabetes",
      "probability": "31.6%",
      "riskLevel": "low",
      "recommendations": [
        "Low risk - continue healthy habits",
        "Annual health screenings recommended",
        "Maintain balanced diet and regular exercise"
      ]
    },
    "streamlitUrl": "http://localhost:8502/?pregnancies=2&glucose=140&bmi=28.1&age=35&insulin=150&auto_predict=true",
    "actions": {
      "viewDetails": {
        "url": "http://localhost:8502/?pregnancies=2&glucose=140&bmi=28.1&age=35&insulin=150&auto_predict=true",
        "label": "View Detailed Analysis",
        "description": "Open interactive analysis in Streamlit with your input parameters"
      },
      "retryPrediction": {
        "endpoint": "/api/admin/reports/diabetes-predictions/{id}/retry",
        "method": "POST",
        "label": "Retry Prediction",
        "description": "Retry prediction processing if needed"
      }
    }
  }
}
```

### Failed Prediction Response
```json
{
  "success": true,
  "message": "Diabetes prediction record created, but model prediction failed. Please retry processing.",
  "data": {
    "prediction": {
      "id": "uuid",
      "status": "pending",
      // ... other fields
    },
    "error": "Prediction model temporarily unavailable",
    "streamlitUrl": "http://localhost:8502/?pregnancies=2&glucose=140&bmi=28.1&age=35&insulin=150&auto_predict=true",
    "actions": {
      "viewDetails": {
        "url": "http://localhost:8502/?pregnancies=2&glucose=140&bmi=28.1&age=35&insulin=150&auto_predict=true",
        "label": "View Manual Analysis",
        "description": "Open Streamlit for manual analysis with your input parameters"
      },
      "retryPrediction": {
        "endpoint": "/api/admin/reports/diabetes-predictions/{id}/retry",
        "method": "POST",
        "label": "Retry Prediction",
        "description": "Retry automatic prediction processing"
      }
    }
  }
}
```

## Frontend Implementation

### 1. Display Results Window
After successful prediction creation, show a results modal/window with:

```jsx
function DiabetesResultsModal({ data, onClose }) {
  const { prediction, summary, streamlitUrl, actions } = data;
  
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Diabetes Risk Assessment Results</h2>
        
        {/* Risk Level Display */}
        <div className={`risk-card ${summary.riskLevel}`}>
          <h3>{summary.prediction}</h3>
          <p>Probability: {summary.probability}</p>
          <p>Risk Level: {summary.riskLevel.toUpperCase()}</p>
        </div>
        
        {/* Recommendations */}
        <div className="recommendations">
          <h4>Clinical Recommendations:</h4>
          <ul>
            {summary.recommendations?.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
        
        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={() => window.open(actions.viewDetails.url, '_blank')}
          >
            {actions.viewDetails.label}
          </button>
          
          {prediction.status === 'pending' && (
            <button 
              className="btn-secondary"
              onClick={() => retryPrediction(actions.retryPrediction)}
            >
              {actions.retryPrediction.label}
            </button>
          )}
          
          <button className="btn-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2. Handle Streamlit Navigation
```javascript
function openStreamlitAnalysis(streamlitUrl) {
  // Open Streamlit in a new tab/window
  const streamlitWindow = window.open(streamlitUrl, '_blank');
  
  // Optional: Focus the new window
  if (streamlitWindow) {
    streamlitWindow.focus();
  }
}
```

### 3. Retry Failed Predictions
```javascript
async function retryPrediction(retryAction) {
  try {
    const response = await fetch(retryAction.endpoint, {
      method: retryAction.method,
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Show updated results
      showPredictionResults(result.data);
    } else {
      // Show error message
      showError(result.message);
    }
  } catch (error) {
    showError('Failed to retry prediction');
  }
}
```

## Streamlit Integration

### URL Parameters
The Streamlit app now accepts these URL parameters:
- `pregnancies`: Number of pregnancies
- `glucose`: Glucose level (mg/dL)
- `bmi`: Body Mass Index
- `age`: Age in years
- `insulin`: Insulin level (μU/mL)
- `auto_predict`: Set to 'true' to show notification

### Auto-Fill Behavior
1. When URL contains parameters, Streamlit will:
   - Pre-fill all input fields with provided values
   - Show a notification: "Parameters loaded from CareSync Admin Panel"
   - Automatically run the prediction with the provided data

### Example Streamlit URL
```
http://localhost:8502/?pregnancies=2&glucose=140&bmi=28.1&age=35&insulin=150&auto_predict=true
```

## Configuration

### Environment Variables
Add to your backend `.env` file:
```
STREAMLIT_BASE_URL=http://localhost:8502
```

For production:
```
STREAMLIT_BASE_URL=https://your-streamlit-domain.com
```

## Testing

### Manual Testing
1. Create a diabetes prediction via the admin API
2. Verify the response contains `streamlitUrl` and `actions`
3. Copy the `streamlitUrl` and open in browser
4. Confirm parameters are pre-filled in Streamlit
5. Verify the notification appears

### Automated Testing
Run the test script:
```bash
cd backend
node test-enhanced-api.js
```

## Benefits

1. **Immediate Results**: Users see prediction results immediately after submission
2. **Detailed Analysis**: "View Details" button provides access to comprehensive Streamlit analysis
3. **Pre-filled Parameters**: No need to re-enter data in Streamlit
4. **Seamless Integration**: Smooth workflow from admin panel to detailed analysis
5. **Error Handling**: Clear actions for failed predictions with retry capability

## UI/UX Recommendations

1. **Results Modal**: Show results in a modal overlay for immediate feedback
2. **Risk Visualization**: Use color coding (red/yellow/green) for risk levels
3. **Action Buttons**: Make "View Details" button prominent and clearly labeled
4. **Loading States**: Show loading spinners during prediction processing
5. **Error Messages**: Clear error messages with retry options
6. **Responsive Design**: Ensure the results window works on mobile devices
