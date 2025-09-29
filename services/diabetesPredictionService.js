const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * Diabetes Prediction Service
 * Interfaces with the Python diabetes prediction model
 */
class DiabetesPredictionService {
  constructor() {
  this.modelPath = path.join(__dirname, '..', '..', 'Diabetes-Prediction');
  this.scriptPath = path.join(this.modelPath, 'predict_api.py');
  }

  /**
   * Predict diabetes risk using the trained model
   * @param {Object} inputData - { pregnancies, glucose, bmi, age, insulin }
   * @returns {Promise<Object>} - { prediction: 0|1, probability: number }
   */
  async predict(inputData) {
    try {
      // Validate inputs
      this.validateInputs(inputData);
      
      // Check if Python script exists, if not create it
      await this.ensurePredictionScript();
      
      // Call Python prediction model with retry logic
      const result = await this.callPythonModelWithRetry(inputData);
      
      return {
        prediction: result.prediction,
        probability: result.probability
      };
      
    } catch (error) {
      console.error('Diabetes prediction error:', error);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }

  /**
   * Call Python model with retry logic
   */
  async callPythonModelWithRetry(inputData, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Diabetes prediction attempt ${attempt}/${maxRetries}`);
        const result = await this.callPythonModel(inputData);
        console.log(`Diabetes prediction successful on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error;
        console.error(`Diabetes prediction attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Validate input data
   */
  validateInputs(data) {
    const required = ['pregnancies', 'glucose', 'bmi', 'age'];
    const missing = required.filter(field => data[field] === undefined || data[field] === null);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate ranges
    if (data.pregnancies < 0 || data.pregnancies > 20) {
      throw new Error('Pregnancies must be between 0 and 20');
    }
    if (data.glucose < 0 || data.glucose > 300) {
      throw new Error('Glucose must be between 0 and 300 mg/dL');
    }
    if (data.bmi < 10 || data.bmi > 70) {
      throw new Error('BMI must be between 10 and 70');
    }
    if (data.age < 1 || data.age > 120) {
      throw new Error('Age must be between 1 and 120 years');
    }
    if (data.insulin && (data.insulin < 0 || data.insulin > 1000)) {
      throw new Error('Insulin must be between 0 and 1000 μU/mL');
    }
  }

  /**
   * Create Python prediction script if it doesn't exist
   */
  async ensurePredictionScript() {
    try {
      await fs.access(this.scriptPath);
    } catch {
      // Script doesn't exist, create it
    const scriptContent = `#!/usr/bin/env python3
"""
Diabetes Prediction API Script
Loads the actual CareSync Streamlit pipeline model (model.pkl) and predicts.
Inputs: pregnancies, glucose, bmi, age, insulin
Outputs: JSON { prediction: 0|1, probability: float }
"""
import sys
import json
import numpy as np
import os
from pathlib import Path

def load_model():
  try:
    import joblib
    # model.pkl is stored at the project root of Diabetes-Prediction
    model_path = Path(__file__).parent / 'model.pkl'
    if not model_path.exists():
      raise FileNotFoundError(f"Model file not found: {model_path}")
    model = joblib.load(str(model_path))
    return model
  except Exception as e:
    print(f"Error loading model.pkl: {e}", file=sys.stderr)
    return None

def predict_diabetes(pregnancies, glucose, bmi, age, insulin=0.0):
  try:
    import pandas as pd
    model = load_model()
    if model is None:
      raise Exception("Failed to load model.pkl")

    # The saved pipeline expects a DataFrame with these columns
    df = pd.DataFrame([[pregnancies, glucose, insulin, bmi, age]],
              columns=['Pregnancies','Glucose','Insulin','BMI','Age'])

    proba = float(model.predict_proba(df)[:, 1][0])
    pred = int(1 if proba >= 0.32 else 0)  # Use same threshold as Streamlit config

    return { 'prediction': pred, 'probability': proba }
  except Exception as e:
    return { 'error': str(e), 'prediction': 0, 'probability': 0.0 }

def main():
  try:
    if len(sys.argv) != 6:
      print("Usage: python predict_api.py <pregnancies> <glucose> <bmi> <age> <insulin>", file=sys.stderr)
      sys.exit(1)

    pregnancies = int(float(sys.argv[1]))
    glucose = float(sys.argv[2])
    bmi = float(sys.argv[3])
    age = int(float(sys.argv[4]))
    insulin = float(sys.argv[5])

    result = predict_diabetes(pregnancies, glucose, bmi, age, insulin)
    print(json.dumps(result))
  except Exception as e:
    print(json.dumps({ 'error': str(e), 'prediction': 0, 'probability': 0.0 }))
    sys.exit(1)

if __name__ == '__main__':
  main()
`;

      await fs.writeFile(this.scriptPath, scriptContent);
      console.log('Created diabetes prediction script:', this.scriptPath);
    }
  }

  /**
   * Call the Python model with input data
   */
  async callPythonModel(inputData) {
    return new Promise((resolve, reject) => {
      const { pregnancies, glucose, bmi, age, insulin = 0 } = inputData;
      
      const pythonProcess = spawn('python', [
        this.scriptPath,
        pregnancies.toString(),
        glucose.toString(),
        bmi.toString(),
        age.toString(),
        insulin.toString()
      ], {
        cwd: this.modelPath, // Ensure we're in the correct directory
        env: { 
          ...process.env,
          PYTHONWARNINGS: 'ignore::UserWarning:sklearn' // Suppress sklearn version warnings
        }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Filter out sklearn version warnings from stderr
        const filteredStderr = stderr
          .split('\n')
          .filter(line => !line.includes('InconsistentVersionWarning') && 
                         !line.includes('sklearn.base.py') &&
                         !line.includes('model_persistence.html') &&
                         line.trim() !== '')
          .join('\n');

        if (code !== 0 && filteredStderr) {
          return reject(new Error(`Python script failed: ${filteredStderr || 'Unknown error'}`));
        }

        try {
          const result = JSON.parse(stdout.trim());
          
          if (result.error) {
            return reject(new Error(result.error));
          }
          
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse prediction result: ${parseError.message}. Output: ${stdout}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  /**
   * Batch prediction for multiple patients
   */
  async batchPredict(inputDataArray) {
    const results = [];
    
    for (const inputData of inputDataArray) {
      try {
        const result = await this.predict(inputData);
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Get model information and statistics
   */
  async getModelInfo() {
    return {
      modelPath: this.modelPath,
      scriptPath: this.scriptPath,
      features: ['pregnancies', 'glucose', 'bmi', 'age', 'insulin'],
      description: 'Diabetes risk prediction based on clinical parameters',
      version: '1.0.0'
    };
  }
}

// Export singleton instance
module.exports = new DiabetesPredictionService();
