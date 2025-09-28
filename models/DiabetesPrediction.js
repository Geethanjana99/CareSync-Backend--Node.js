const { mysqlConnection: mysql } = require('../config/mysql');
const { v4: uuidv4 } = require('uuid');

/**
 * Diabetes Prediction Model (MySQL)
 * Stores essential diabetes risk assessment inputs and predictions made by admin
 */
class DiabetesPrediction {
  constructor(data = {}) {
    this.id = data.id || null;
    this.patientId = data.patient_id || data.patientId || null;
    this.adminId = data.admin_id || data.adminId || null;
    this.pregnancies = data.pregnancies || 0;
    this.glucose = data.glucose || null;
    this.bmi = data.bmi || null;
    this.age = data.age || null;
    this.insulin = data.insulin || 0;
    this.predictionResult = data.prediction_result || data.predictionResult || null;
    this.predictionProbability = data.prediction_probability || data.predictionProbability || null;
    this.riskLevel = data.risk_level || data.riskLevel || null;
    this.status = data.status || 'pending';
    this.notes = data.notes || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.processedAt = data.processed_at || data.processedAt || null;
  }

  // Instance methods
  async callPredictionModel() {
    const { pregnancies, glucose, bmi, age, insulin } = this;
    
    try {
      // Prepare data for the prediction model
      const inputData = {
        pregnancies: pregnancies || 0,
        glucose: parseFloat(glucose),
        bmi: parseFloat(bmi),
        age: parseInt(age),
        insulin: parseFloat(insulin) || 0
      };
      
      // Call the Python prediction service
      const predictionService = require('../services/diabetesPredictionService');
      const result = await predictionService.predict(inputData);
      
      // Determine risk level based on probability
      let riskLevel = 'low';
      if (result.probability > 0.7) {
        riskLevel = 'high';
      } else if (result.probability > 0.4) {
        riskLevel = 'medium';
      }
      
      return {
        prediction: result.prediction, // 0 or 1
        probability: result.probability, // 0-1
        riskLevel
      };
    } catch (error) {
      console.error('Error calling prediction model:', error);
      throw new Error('Failed to get diabetes prediction');
    }
  }

  generateRecommendations() {
    const { predictionResult, predictionProbability, riskLevel } = this;
    const recommendations = [];
    
    if (predictionResult === 1) { // Has diabetes
      recommendations.push('Immediate consultation with endocrinologist required');
      recommendations.push('Start diabetes management plan');
      recommendations.push('Regular blood glucose monitoring');
      recommendations.push('Strict dietary modifications');
      recommendations.push('Regular exercise as per doctor advice');
    } else if (riskLevel === 'high') {
      recommendations.push('High risk detected - consultation with healthcare provider recommended');
      recommendations.push('Lifestyle modifications to prevent diabetes');
      recommendations.push('Regular health screenings');
      recommendations.push('Weight management if applicable');
    } else if (riskLevel === 'medium') {
      recommendations.push('Moderate risk - maintain healthy lifestyle');
      recommendations.push('Regular check-ups with primary care physician');
      recommendations.push('Monitor diet and exercise regularly');
    } else {
      recommendations.push('Low risk - continue healthy habits');
      recommendations.push('Annual health screenings recommended');
      recommendations.push('Maintain balanced diet and regular exercise');
    }
    
    return recommendations;
  }

  getResultSummary() {
    return {
      prediction: this.predictionResult === 1 ? 'Diabetes Detected' : 'No Diabetes',
      probability: `${(this.predictionProbability * 100).toFixed(1)}%`,
      riskLevel: this.riskLevel,
      recommendations: this.generateRecommendations()
    };
  }

  toJSON() {
    return {
      id: this.id,
      patientId: this.patientId,
      adminId: this.adminId,
      pregnancies: this.pregnancies,
      glucose: this.glucose,
      bmi: this.bmi,
      age: this.age,
      insulin: this.insulin,
      predictionResult: this.predictionResult,
      predictionProbability: this.predictionProbability,
      riskLevel: this.riskLevel,
      status: this.status,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      processedAt: this.processedAt
    };
  }

  // Static methods
  static async create(data) {
    const id = uuidv4();
    const now = new Date();
    
    const query = `
      INSERT INTO diabetes_predictions (
        id, patient_id, admin_id, pregnancies, glucose, bmi, age, insulin, 
        status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      id,
      data.patientId,
      data.adminId,
      data.pregnancies || 0,
      data.glucose,
      data.bmi,
      data.age,
      data.insulin || 0,
      data.status || 'pending',
      data.notes || null,
      now,
      now
    ];

    await mysql.query(query, params);
    
    // Return the created record
    return await this.findByPk(id);
  }

  static async findByPk(id) {
    const query = `
      SELECT dp.*, 
             u.name as admin_name, u.email as admin_email,
             p.patient_id as patient_code,
             pu.name as patient_name, pu.email as patient_email
      FROM diabetes_predictions dp
      LEFT JOIN users u ON dp.admin_id = u.id
      LEFT JOIN patients p ON dp.patient_id = p.id  
      LEFT JOIN users pu ON p.user_id = pu.id
      WHERE dp.id = ?
    `;
    
    const results = await mysql.query(query, [id]);
    if (results.length === 0) return null;
    
    const row = results[0];
    const prediction = new DiabetesPrediction(row);
    
    // Add related data
    prediction.admin = {
      name: row.admin_name,
      email: row.admin_email
    };
    prediction.patient = {
      patientId: row.patient_code,
      user: {
        name: row.patient_name,
        email: row.patient_email
      }
    };
    
    return prediction;
  }

  static async findAll(options = {}) {
    let query = `
      SELECT dp.*, 
             u.name as admin_name, u.email as admin_email,
             p.patient_id as patient_code,
             pu.name as patient_name, pu.email as patient_email
      FROM diabetes_predictions dp
      LEFT JOIN users u ON dp.admin_id = u.id
      LEFT JOIN patients p ON dp.patient_id = p.id  
      LEFT JOIN users pu ON p.user_id = pu.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (options.where) {
      Object.keys(options.where).forEach(key => {
        conditions.push(`dp.${key} = ?`);
        params.push(options.where[key]);
      });
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    if (options.order) {
      const [field, direction] = options.order[0];
      query += ` ORDER BY dp.${field} ${direction}`;
    } else {
      query += ` ORDER BY dp.created_at DESC`;
    }
    
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
      if (options.offset) {
        query += ` OFFSET ${options.offset}`;
      }
    }
    
    const results = await mysql.query(query, params);
    
    return results.map(row => {
      const prediction = new DiabetesPrediction(row);
      prediction.admin = {
        name: row.admin_name,
        email: row.admin_email
      };
      prediction.patient = {
        patientId: row.patient_code,
        user: {
          name: row.patient_name,
          email: row.patient_email
        }
      };
      return prediction;
    });
  }

  static async findAndCountAll(options = {}) {
    const predictions = await this.findAll(options);
    
    // Get total count without limit/offset
    let countQuery = `
      SELECT COUNT(*) as total
      FROM diabetes_predictions dp
    `;
    
    const params = [];
    const conditions = [];
    
    if (options.where) {
      Object.keys(options.where).forEach(key => {
        conditions.push(`dp.${key} = ?`);
        params.push(options.where[key]);
      });
    }
    
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countResult = await mysql.query(countQuery, params);
    const count = countResult[0].total;
    
    return {
      rows: predictions,
      count: count
    };
  }

  static async update(id, data) {
    const updates = [];
    const params = [];
    
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
    
    if (updates.length === 0) return null;
    
    updates.push('updated_at = ?');
    params.push(new Date());
    params.push(id);
    
    const query = `UPDATE diabetes_predictions SET ${updates.join(', ')} WHERE id = ?`;
    await mysql.query(query, params);
    
    // Return the updated record
    return await this.findByPk(id);
  }

  static async findById(id) {
    return await this.findByPk(id);
  }

  async update(data) {
    const updates = [];
    const params = [];
    
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
    
    if (updates.length === 0) return this;
    
    updates.push('updated_at = ?');
    params.push(new Date());
    params.push(this.id);
    
    const query = `UPDATE diabetes_predictions SET ${updates.join(', ')} WHERE id = ?`;
    await mysql.query(query, params);
    
    // Reload the record
    const updated = await DiabetesPrediction.findByPk(this.id);
    Object.assign(this, updated);
    return this;
  }

  async reload() {
    const updated = await DiabetesPrediction.findByPk(this.id);
    if (updated) {
      Object.assign(this, updated);
    }
    return this;
  }

  static async getByPatientId(patientId, options = {}) {
    return await this.findAll({
      where: { patient_id: patientId },
      ...options
    });
  }

  static async getStatistics(dateRange = {}) {
    let query = `
      SELECT 
        risk_level,
        prediction_result,
        COUNT(*) as count
      FROM diabetes_predictions
    `;
    
    const params = [];
    
    if (dateRange.startDate && dateRange.endDate) {
      query += ` WHERE created_at BETWEEN ? AND ?`;
      params.push(dateRange.startDate, dateRange.endDate);
    }
    
    query += ` GROUP BY risk_level, prediction_result`;
    
    const results = await mysql.query(query, params);
    
    const riskLevels = { low: 0, medium: 0, high: 0 };
    const predictions = { diabetes: 0, no_diabetes: 0 };
    let total = 0;
    
    results.forEach(row => {
      const count = parseInt(row.count);
      total += count;
      
      if (row.risk_level) {
        riskLevels[row.risk_level] = (riskLevels[row.risk_level] || 0) + count;
      }
      
      if (row.prediction_result !== null) {
        const key = row.prediction_result === 1 ? 'diabetes' : 'no_diabetes';
        predictions[key] += count;
      }
    });
    
    return { riskLevels, predictions, total };
  }
}

module.exports = DiabetesPrediction;
