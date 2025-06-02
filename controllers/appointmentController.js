const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const logger = require('../config/logger');

const appointmentController = {
  // Create new appointment
  create: async (req, res) => {
    try {
      const {
        doctorId,
        appointmentDate,
        appointmentTime,
        appointmentType,
        reasonForVisit,
        symptoms,
        priority
      } = req.body;

      let patientId;

      // Get patient ID based on user role
      if (req.user.role === 'patient') {
        const patient = await Patient.findByUserId(req.user.id);
        if (!patient) {
          return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
          });
        }
        patientId = patient.id;
      } else {
        // Admin or other roles can specify patient ID
        patientId = req.body.patientId;
        if (!patientId) {
          return res.status(400).json({
            success: false,
            message: 'Patient ID is required'
          });
        }
      }

      // Verify doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      // Check if slot is available
      const isSlotAvailable = await Appointment.isSlotAvailable(
        doctorId,
        appointmentDate,
        appointmentTime
      );

      if (!isSlotAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Selected time slot is not available'
        });
      }

      // Create appointment
      const appointmentData = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        appointment_type: appointmentType,
        reason_for_visit: reasonForVisit,
        symptoms,
        priority: priority || 'medium',
        consultation_fee: doctor.consultation_fee
      };

      const appointment = new Appointment(appointmentData);
      await appointment.save();

      // Get appointment with details
      const appointmentWithDetails = await Appointment.findWithDetails(appointment.id);

      logger.info(`New appointment created: ${appointment.appointment_id}`);

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: {
          appointment: appointmentWithDetails
        }
      });

    } catch (error) {
      logger.error('Create appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create appointment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get appointments
  getAppointments: async (req, res) => {
    try {
      const {
        status,
        date_from,
        date_to,
        appointment_type,
        priority,
        limit = 50,
        offset = 0
      } = req.query;

      let filters = {
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      // Add role-based filtering
      if (req.user.role === 'patient') {
        const patient = await Patient.findByUserId(req.user.id);
        if (!patient) {
          return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
          });
        }
        filters.patient_id = patient.id;
      } else if (req.user.role === 'doctor') {
        const doctor = await Doctor.findByUserId(req.user.id);
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: 'Doctor profile not found'
          });
        }
        filters.doctor_id = doctor.id;
      }

      // Add query filters
      if (status) {
        filters.status = status.includes(',') ? status.split(',') : status;
      }
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;
      if (appointment_type) filters.appointment_type = appointment_type;
      if (priority) filters.priority = priority;

      const appointments = await Appointment.findAll(filters);

      res.json({
        success: true,
        data: {
          appointments,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: appointments.length
          }
        }
      });

    } catch (error) {
      logger.error('Get appointments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get appointments',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get single appointment
  getAppointment: async (req, res) => {
    try {
      const { appointmentId } = req.params;

      const appointment = await Appointment.findWithDetails(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check authorization
      if (req.user.role === 'patient') {
        const patient = await Patient.findByUserId(req.user.id);
        if (appointment.patient_id !== patient?.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      } else if (req.user.role === 'doctor') {
        const doctor = await Doctor.findByUserId(req.user.id);
        if (appointment.doctor_id !== doctor?.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      res.json({
        success: true,
        data: {
          appointment
        }
      });

    } catch (error) {
      logger.error('Get appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get appointment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Update appointment
  update: async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const updateData = req.body;

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check authorization
      if (req.user.role === 'patient') {
        const patient = await Patient.findByUserId(req.user.id);
        if (appointment.patient_id !== patient?.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
        // Patients can only update limited fields
        const allowedFields = ['reason_for_visit', 'symptoms'];
        updateData = Object.keys(updateData)
          .filter(key => allowedFields.includes(key))
          .reduce((obj, key) => {
            obj[key] = updateData[key];
            return obj;
          }, {});
      } else if (req.user.role === 'doctor') {
        const doctor = await Doctor.findByUserId(req.user.id);
        if (appointment.doctor_id !== doctor?.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // If reschedule, check availability
      if (updateData.appointment_date || updateData.appointment_time) {
        const newDate = updateData.appointment_date || appointment.appointment_date;
        const newTime = updateData.appointment_time || appointment.appointment_time;
        
        const isSlotAvailable = await Appointment.isSlotAvailable(
          appointment.doctor_id,
          newDate,
          newTime,
          appointmentId
        );

        if (!isSlotAvailable) {
          return res.status(400).json({
            success: false,
            message: 'Selected time slot is not available'
          });
        }
      }

      await appointment.update(updateData);

      const updatedAppointment = await Appointment.findWithDetails(appointmentId);

      logger.info(`Appointment updated: ${appointment.appointment_id}`);

      res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: {
          appointment: updatedAppointment
        }
      });

    } catch (error) {
      logger.error('Update appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update appointment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Cancel appointment
  cancel: async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { reason } = req.body;

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check authorization
      if (req.user.role === 'patient') {
        const patient = await Patient.findByUserId(req.user.id);
        if (appointment.patient_id !== patient?.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      } else if (req.user.role === 'doctor') {
        const doctor = await Doctor.findByUserId(req.user.id);
        if (appointment.doctor_id !== doctor?.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      await appointment.cancel(req.user.id, reason);

      logger.info(`Appointment cancelled: ${appointment.appointment_id}`);

      res.json({
        success: true,
        message: 'Appointment cancelled successfully'
      });

    } catch (error) {
      logger.error('Cancel appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel appointment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get available slots
  getAvailableSlots: async (req, res) => {
    try {
      const { doctorId, date } = req.query;

      if (!doctorId || !date) {
        return res.status(400).json({
          success: false,
          message: 'Doctor ID and date are required'
        });
      }

      const availableSlots = await Appointment.getAvailableSlots(doctorId, date);

      res.json({
        success: true,
        data: {
          date,
          slots: availableSlots
        }
      });

    } catch (error) {
      logger.error('Get available slots error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available slots',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Confirm appointment (for doctors)
  confirm: async (req, res) => {
    try {
      const { appointmentId } = req.params;

      if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only doctors can confirm appointments'
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check if doctor owns the appointment
      if (req.user.role === 'doctor') {
        const doctor = await Doctor.findByUserId(req.user.id);
        if (appointment.doctor_id !== doctor?.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      await appointment.confirm();

      logger.info(`Appointment confirmed: ${appointment.appointment_id}`);

      res.json({
        success: true,
        message: 'Appointment confirmed successfully'
      });

    } catch (error) {
      logger.error('Confirm appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm appointment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Complete appointment (for doctors)
  complete: async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { actualWaitTime } = req.body;

      if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only doctors can complete appointments'
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check if doctor owns the appointment
      if (req.user.role === 'doctor') {
        const doctor = await Doctor.findByUserId(req.user.id);
        if (appointment.doctor_id !== doctor?.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      await appointment.complete(actualWaitTime);

      logger.info(`Appointment completed: ${appointment.appointment_id}`);

      res.json({
        success: true,
        message: 'Appointment completed successfully'
      });

    } catch (error) {
      logger.error('Complete appointment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete appointment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get appointment statistics
  getStatistics: async (req, res) => {
    try {
      const { date_from, date_to } = req.query;
      
      let filters = {};
      
      // Add role-based filtering
      if (req.user.role === 'doctor') {
        const doctor = await Doctor.findByUserId(req.user.id);
        if (doctor) {
          filters.doctor_id = doctor.id;
        }
      }

      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      const statistics = await Appointment.getStatistics(filters);

      res.json({
        success: true,
        data: {
          statistics
        }
      });

    } catch (error) {
      logger.error('Get appointment statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get appointment statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = appointmentController;
