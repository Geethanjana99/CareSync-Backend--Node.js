const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const logger = require('../config/logger');

// Generate JWT token
const generateToken = (userId) => {
  console.log('🔍 generateToken called with userId:', userId);
  console.log('🔍 JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('🔍 JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'N/A');
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { name, email, password, role, phone, profileData } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

      // Create user
      const userData = {
        name,
        email,
        password_hash: hashedPassword,
        role,
        phone
      };

      const user = new User(userData);
      await user.save();      // Create role-specific profile
      if (role === 'patient') {
        // Create basic patient profile with minimal data
        const patientData = {
          user_id: user.id,
          gender: profileData?.gender || null,
          date_of_birth: profileData?.date_of_birth || null,
          address: profileData?.address || null,
          emergency_contact_name: profileData?.emergency_contact_name || null,
          emergency_contact_phone: profileData?.emergency_contact_phone || null,
          preferred_language: profileData?.preferred_language || 'English'
        };
        const patient = new Patient(patientData);
        await patient.save();
        logger.info(`Patient profile created for user: ${user.id}`);      } else if (role === 'doctor' && profileData) {
        console.log('ProfileData received:', JSON.stringify(profileData, null, 2)); // Debug log
        console.log('specialization value:', profileData.specialization);
        console.log('specialty value:', profileData.specialty);
        
        const specialty = profileData.specialization || profileData.specialty;
        console.log('Final specialty value:', specialty);
        
        if (!specialty) {
          return res.status(400).json({
            success: false,
            message: 'Specialty is required for doctor registration'
          });
        }
        
        const doctorData = {
          user_id: user.id,
          specialty: specialty,
          license_number: profileData.license_number,
          years_of_experience: profileData.experience_years || profileData.years_of_experience,
          education: profileData.education,
          certifications: profileData.certifications,
          consultation_fee: profileData.consultation_fee,
          languages_spoken: profileData.languages_spoken,
          office_address: profileData.office_address,
          bio: profileData.bio,
          working_hours: profileData.working_hours
        };
        console.log('DoctorData being saved:', JSON.stringify(doctorData, null, 2)); // Debug log
        const doctor = new Doctor(doctorData);
        await doctor.save();
        logger.info(`Doctor profile created for user: ${user.id}`);
      }      // Don't generate tokens on registration - user must login explicitly
      logger.info(`New user registered: ${email} with role: ${role}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please login to continue.',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
          },
          requiresLogin: true
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check password
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }      // Update last login
      await user.updateLastLogin();

      // Get user with profile information
      const userWithProfile = await User.findWithProfile(user.id);

      // Clean up the user data for frontend response
      const cleanUserData = {
        id: userWithProfile.id,
        name: userWithProfile.name,
        email: userWithProfile.email,
        role: userWithProfile.role,
        phone: userWithProfile.phone,
        avatar_url: userWithProfile.avatar_url,
        is_active: userWithProfile.is_active,
        email_verified: userWithProfile.email_verified,
        last_login: userWithProfile.last_login,
        created_at: userWithProfile.created_at,
        updated_at: userWithProfile.updated_at,
        // Include profile data if available
        profile: {
          patient_id: userWithProfile.patient_id,
          doctor_id: userWithProfile.doctor_id,
          specialty: userWithProfile.specialty,
          // Add other relevant profile fields as needed
        }
      };

      // Generate tokens
      const token = generateToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: cleanUserData,
          token,
          refreshToken
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new tokens
      const newToken = generateToken(user.id);
      const newRefreshToken = generateRefreshToken(user.id);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          refreshToken: newRefreshToken
        }
      });

    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const userWithProfile = await User.findWithProfile(req.user.id);
      
      if (!userWithProfile) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
      }

      // Format user data consistently with login response
      const userData = {
        id: userWithProfile.id,
        name: userWithProfile.name,
        email: userWithProfile.email,
        role: userWithProfile.role,
        phone: userWithProfile.phone,
        avatar_url: userWithProfile.avatar_url,
        is_active: userWithProfile.is_active,
        email_verified: userWithProfile.email_verified,
        last_login: userWithProfile.last_login,
        created_at: userWithProfile.created_at,
        updated_at: userWithProfile.updated_at,
        // Include profile data if available
        profile: {
          patient_id: userWithProfile.patient_id,
          doctor_id: userWithProfile.doctor_id,
          specialty: userWithProfile.specialty,
          // Add other relevant profile fields as needed
        }
      };

      res.json({
        success: true,
        data: {
          user: userData
        }
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const { name, phone, avatar_url, profileData } = req.body;

      // Update user basic information
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({ name, phone, avatar_url });

      // Update role-specific profile
      if (req.user.role === 'patient' && profileData) {
        const patient = await Patient.findByUserId(req.user.id);
        if (patient) {
          await patient.update(profileData);
        }
      } else if (req.user.role === 'doctor' && profileData) {
        const doctor = await Doctor.findByUserId(req.user.id);
        if (doctor) {
          await doctor.update(profileData);
        }
      }

      // Get updated profile
      const updatedProfile = await User.findWithProfile(req.user.id);

      logger.info(`Profile updated for user: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedProfile
        }
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await user.updatePassword(newPassword);

      logger.info(`Password changed for user: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Reset password
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // TODO: Implement password reset logic with token verification
      // This would typically involve:
      // 1. Verify the reset token
      // 2. Find the user associated with the token
      // 3. Update the password
      // 4. Invalidate the reset token

      res.json({
        success: true,
        message: 'Password reset feature coming soon'
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed'
      });
    }
  }

  // Logout (mainly for logging purposes)
  static async logout(req, res) {
    try {
      logger.info(`User logged out: ${req.user.email}`);
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  // Verify email (placeholder for future implementation)
  static async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      
      // TODO: Implement email verification logic
      // This would typically involve verifying a token sent via email
      
      res.json({
        success: true,
        message: 'Email verification feature coming soon'
      });

    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed'
      });
    }
  }

  // Forgot password (placeholder for future implementation)
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      // TODO: Implement forgot password logic
      // This would typically involve sending a reset token via email
      
      res.json({
        success: true,
        message: 'Password reset feature coming soon'
      });

    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Forgot password failed'
      });
    }
  }
}

module.exports = AuthController;
