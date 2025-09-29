const validator = require('validator');

class ValidationUtils {
  // Validate email format
  static isValidEmail(email) {
    return validator.isEmail(email);
  }

  // Validate phone number (flexible format)
  static isValidPhone(phone) {
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's between 10-15 digits (international format)
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  // Validate password strength
  static validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate name (first name, last name)
  static isValidName(name) {
    if (!name || typeof name !== 'string') {
      return false;
    }
    
    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']{1,50}$/;
    return nameRegex.test(name.trim());
  }

  // Validate date format and reasonable range
  static isValidDate(dateString) {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return false;
    }
    
    // Check if date is not in the future (for birth dates)
    if (date > now) {
      return false;
    }
    
    // Check if date is not too far in the past (reasonable birth date)
    const minDate = new Date();
    minDate.setFullYear(now.getFullYear() - 150);
    
    return date >= minDate;
  }

  // Validate birth date and calculate age
  static validateBirthDate(birthDate) {
    if (!this.isValidDate(birthDate)) {
      return {
        isValid: false,
        error: 'Invalid birth date'
      };
    }
    
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
      ? age - 1 
      : age;
    
    if (adjustedAge < 0 || adjustedAge > 150) {
      return {
        isValid: false,
        error: 'Age must be between 0 and 150 years'
      };
    }
    
    return {
      isValid: true,
      age: adjustedAge
    };
  }

  // Validate appointment date (current date and future dates allowed)
  static isValidAppointmentDate(dateString) {
    if (!dateString) return false;
    
    const appointmentDate = new Date(dateString);
    const today = new Date();
    
    // Check if date is valid
    if (isNaN(appointmentDate.getTime())) {
      return false;
    }
    
    // Set both dates to start of day for proper comparison
    appointmentDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    // Check if date is today or in the future
    return appointmentDate >= today;
  }

  // Validate medical license number
  static isValidLicenseNumber(licenseNumber) {
    if (!licenseNumber || typeof licenseNumber !== 'string') {
      return false;
    }
    
    // Basic validation - alphanumeric, 6-20 characters
    const licenseRegex = /^[A-Z0-9]{6,20}$/;
    return licenseRegex.test(licenseNumber.toUpperCase());
  }

  // Validate specialization
  static isValidSpecialization(specialization) {
    const validSpecializations = [
      'Cardiology',
      'Dermatology',
      'Endocrinology',
      'Gastroenterology',
      'Hematology',
      'Nephrology',
      'Neurology',
      'Oncology',
      'Orthopedics',
      'Pediatrics',
      'Psychiatry',
      'Pulmonology',
      'Radiology',
      'Surgery',
      'Urology',
      'General Medicine',
      'Family Medicine',
      'Internal Medicine',
      'Emergency Medicine',
      'Anesthesiology',
      'Pathology',
      'Ophthalmology',
      'Otolaryngology',
      'Plastic Surgery',
      'Rheumatology'
    ];
    
    return validSpecializations.includes(specialization);
  }

  // Validate blood type
  static isValidBloodType(bloodType) {
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    return validBloodTypes.includes(bloodType);
  }

  // Validate insurance policy number
  static isValidInsurancePolicyNumber(policyNumber) {
    if (!policyNumber || typeof policyNumber !== 'string') {
      return false;
    }
    
    // Basic validation - alphanumeric, 5-30 characters
    const policyRegex = /^[A-Z0-9\-]{5,30}$/;
    return policyRegex.test(policyNumber.toUpperCase());
  }

  // Validate medical history format
  static isValidMedicalHistory(history) {
    if (!history) return true; // Optional field
    
    if (typeof history !== 'string') {
      return false;
    }
    
    // Check length (max 5000 characters)
    return history.length <= 5000;
  }

  // Validate allergies format
  static isValidAllergies(allergies) {
    if (!allergies) return true; // Optional field
    
    if (typeof allergies !== 'string') {
      return false;
    }
    
    // Check length (max 2000 characters)
    return allergies.length <= 2000;
  }

  // Validate medications format
  static isValidMedications(medications) {
    if (!medications) return true; // Optional field
    
    if (typeof medications !== 'string') {
      return false;
    }
    
    // Check length (max 3000 characters)
    return medications.length <= 3000;
  }

  // Validate consultation fee
  static isValidConsultationFee(fee) {
    if (typeof fee !== 'number') {
      return false;
    }
    
    // Fee should be between $10 and $1000
    return fee >= 10 && fee <= 1000;
  }

  // Validate years of experience
  static isValidYearsOfExperience(years) {
    if (typeof years !== 'number') {
      return false;
    }
    
    // Experience should be between 0 and 70 years
    return years >= 0 && years <= 70;
  }

  // Validate height (in cm)
  static isValidHeight(height) {
    if (typeof height !== 'number') {
      return false;
    }
    
    // Height should be between 30cm and 300cm
    return height >= 30 && height <= 300;
  }

  // Validate weight (in kg)
  static isValidWeight(weight) {
    if (typeof weight !== 'number') {
      return false;
    }
    
    // Weight should be between 1kg and 1000kg
    return weight >= 1 && weight <= 1000;
  }

  // Validate blood pressure format (e.g., "120/80")
  static isValidBloodPressure(bloodPressure) {
    if (!bloodPressure || typeof bloodPressure !== 'string') {
      return false;
    }
    
    const bpRegex = /^\d{2,3}\/\d{2,3}$/;
    if (!bpRegex.test(bloodPressure)) {
      return false;
    }
    
    const [systolic, diastolic] = bloodPressure.split('/').map(Number);
    
    // Validate reasonable blood pressure ranges
    return systolic >= 60 && systolic <= 300 && 
           diastolic >= 40 && diastolic <= 200 &&
           systolic > diastolic;
  }

  // Validate heart rate (beats per minute)
  static isValidHeartRate(heartRate) {
    if (typeof heartRate !== 'number') {
      return false;
    }
    
    // Heart rate should be between 30 and 220 bpm
    return heartRate >= 30 && heartRate <= 220;
  }

  // Validate temperature (in Celsius)
  static isValidTemperature(temperature) {
    if (typeof temperature !== 'number') {
      return false;
    }
    
    // Temperature should be between 30°C and 45°C
    return temperature >= 30 && temperature <= 45;
  }

  // Validate appointment duration (in minutes)
  static isValidAppointmentDuration(duration) {
    if (typeof duration !== 'number') {
      return false;
    }
    
    // Duration should be between 15 and 240 minutes (4 hours)
    return duration >= 15 && duration <= 240;
  }

  // Validate appointment status
  static isValidAppointmentStatus(status) {
    const validStatuses = [
      'pending',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
      'no_show'
    ];
    
    return validStatuses.includes(status);
  }

  // Validate report type
  static isValidReportType(reportType) {
    const validTypes = [
      'lab_report',
      'radiology',
      'prescription',
      'medical_certificate',
      'referral',
      'discharge_summary',
      'progress_note',
      'consultation_note',
      'other'
    ];
    
    return validTypes.includes(reportType);
  }

  // Sanitize string input (remove potentially harmful characters)
  static sanitizeString(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    return validator.escape(input.trim());
  }

  // Validate and sanitize user input
  static validateAndSanitizeUser(userData) {
    const errors = [];
    const sanitized = {};

    // Email validation
    if (!userData.email || !this.isValidEmail(userData.email)) {
      errors.push('Valid email is required');
    } else {
      sanitized.email = userData.email.toLowerCase().trim();
    }

    // Password validation
    if (userData.password) {
      const passwordValidation = this.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      } else {
        sanitized.password = userData.password;
      }
    }

    // Name validation
    if (!userData.first_name || !this.isValidName(userData.first_name)) {
      errors.push('Valid first name is required');
    } else {
      sanitized.first_name = this.sanitizeString(userData.first_name);
    }

    if (!userData.last_name || !this.isValidName(userData.last_name)) {
      errors.push('Valid last name is required');
    } else {
      sanitized.last_name = this.sanitizeString(userData.last_name);
    }

    // Phone validation (optional)
    if (userData.phone) {
      if (!this.isValidPhone(userData.phone)) {
        errors.push('Valid phone number is required');
      } else {
        sanitized.phone = userData.phone.trim();
      }
    }

    // Birth date validation (optional)
    if (userData.birth_date) {
      const birthDateValidation = this.validateBirthDate(userData.birth_date);
      if (!birthDateValidation.isValid) {
        errors.push(birthDateValidation.error);
      } else {
        sanitized.birth_date = userData.birth_date;
        sanitized.age = birthDateValidation.age;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitized
    };
  }

  // Comprehensive validation for appointment data
  static validateAppointmentData(appointmentData) {
    const errors = [];
    const sanitized = {};

    // Appointment date validation
    if (!appointmentData.appointment_datetime || !this.isValidAppointmentDate(appointmentData.appointment_datetime)) {
      errors.push('Valid future appointment date and time is required');
    } else {
      sanitized.appointment_datetime = appointmentData.appointment_datetime;
    }

    // Duration validation (optional, default to 30 minutes)
    if (appointmentData.duration) {
      if (!this.isValidAppointmentDuration(appointmentData.duration)) {
        errors.push('Appointment duration must be between 15 and 240 minutes');
      } else {
        sanitized.duration = appointmentData.duration;
      }
    }

    // Reason validation (optional)
    if (appointmentData.reason) {
      if (typeof appointmentData.reason !== 'string' || appointmentData.reason.length > 500) {
        errors.push('Appointment reason must be a string with maximum 500 characters');
      } else {
        sanitized.reason = this.sanitizeString(appointmentData.reason);
      }
    }

    // Notes validation (optional)
    if (appointmentData.notes) {
      if (typeof appointmentData.notes !== 'string' || appointmentData.notes.length > 1000) {
        errors.push('Notes must be a string with maximum 1000 characters');
      } else {
        sanitized.notes = this.sanitizeString(appointmentData.notes);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitized
    };
  }
}

module.exports = ValidationUtils;
