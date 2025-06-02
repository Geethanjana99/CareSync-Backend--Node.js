const nodemailer = require('nodemailer');
const twilio = require('twilio');
const logger = require('../config/logger');

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.smsClient = null;
    this.initializeServices();
  }

  // Initialize email and SMS services
  async initializeServices() {
    try {
      // Initialize email transporter
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        this.emailTransporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT || 587,
          secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        // Verify email configuration
        await this.emailTransporter.verify();
        logger.info('Email service initialized successfully');
      } else {
        logger.warn('Email service not configured - missing environment variables');
      }

      // Initialize SMS client
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.smsClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        logger.info('SMS service initialized successfully');
      } else {
        logger.warn('SMS service not configured - missing Twilio credentials');
      }
    } catch (error) {
      logger.error('Error initializing notification services:', error);
    }
  }

  // Send email notification
  async sendEmail({ to, subject, html, text }) {
    try {
      if (!this.emailTransporter) {
        throw new Error('Email service not configured');
      }

      const mailOptions = {
        from: `"${process.env.APP_NAME || 'Clinical Appointment System'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}:`, result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error(`Error sending email to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send SMS notification
  async sendSMS({ to, message }) {
    try {
      if (!this.smsClient) {
        throw new Error('SMS service not configured');
      }

      const result = await this.smsClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });

      logger.info(`SMS sent successfully to ${to}:`, result.sid);
      return { success: true, messageId: result.sid };
    } catch (error) {
      logger.error(`Error sending SMS to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send appointment confirmation notification
  async sendAppointmentConfirmation(appointment, patient, doctor) {
    const appointmentDate = new Date(appointment.appointment_datetime);
    const formattedDate = appointmentDate.toLocaleDateString();
    const formattedTime = appointmentDate.toLocaleTimeString();

    const emailSubject = 'Appointment Confirmation';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5aa0;">Appointment Confirmed</h2>
        <p>Dear ${patient.first_name} ${patient.last_name},</p>
        <p>Your appointment has been confirmed with the following details:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c5aa0;">Appointment Details</h3>
          <p><strong>Doctor:</strong> Dr. ${doctor.first_name} ${doctor.last_name}</p>
          <p><strong>Specialization:</strong> ${doctor.specialization}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
          <p><strong>Appointment ID:</strong> ${appointment.id}</p>
          <p><strong>Consultation Fee:</strong> $${appointment.consultation_fee}</p>
        </div>

        <h3 style="color: #2c5aa0;">What to Bring:</h3>
        <ul>
          <li>Valid ID</li>
          <li>Insurance card (if applicable)</li>
          <li>List of current medications</li>
          <li>Any relevant medical records</li>
        </ul>

        <p style="color: #6c757d; font-size: 14px;">
          Please arrive 15 minutes before your scheduled appointment time.
          If you need to reschedule or cancel, please contact us at least 24 hours in advance.
        </p>

        <p>Best regards,<br>Clinical Appointment Scheduling Team</p>
      </div>
    `;

    const smsMessage = `Appointment confirmed! Dr. ${doctor.first_name} ${doctor.last_name} - ${formattedDate} at ${formattedTime}. ID: ${appointment.id}`;

    const results = await Promise.allSettled([
      this.sendEmail({
        to: patient.email,
        subject: emailSubject,
        html: emailHtml
      }),
      patient.phone ? this.sendSMS({
        to: patient.phone,
        message: smsMessage
      }) : Promise.resolve({ success: true, skipped: 'No phone number' })
    ]);

    return {
      email: results[0].value || results[0].reason,
      sms: results[1].value || results[1].reason
    };
  }

  // Send appointment reminder notification
  async sendAppointmentReminder(appointment, patient, doctor) {
    const appointmentDate = new Date(appointment.appointment_datetime);
    const formattedDate = appointmentDate.toLocaleDateString();
    const formattedTime = appointmentDate.toLocaleTimeString();

    const emailSubject = 'Appointment Reminder';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5aa0;">Appointment Reminder</h2>
        <p>Dear ${patient.first_name} ${patient.last_name},</p>
        <p>This is a reminder for your upcoming appointment:</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #856404;">Appointment Tomorrow</h3>
          <p><strong>Doctor:</strong> Dr. ${doctor.first_name} ${doctor.last_name}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
          <p><strong>Appointment ID:</strong> ${appointment.id}</p>
        </div>

        <p>Please remember to arrive 15 minutes early and bring your ID and insurance card.</p>
        <p>If you need to reschedule, please contact us as soon as possible.</p>

        <p>Best regards,<br>Clinical Appointment Scheduling Team</p>
      </div>
    `;

    const smsMessage = `Reminder: Appointment tomorrow with Dr. ${doctor.first_name} ${doctor.last_name} at ${formattedTime}. Please arrive 15 min early.`;

    const results = await Promise.allSettled([
      this.sendEmail({
        to: patient.email,
        subject: emailSubject,
        html: emailHtml
      }),
      patient.phone ? this.sendSMS({
        to: patient.phone,
        message: smsMessage
      }) : Promise.resolve({ success: true, skipped: 'No phone number' })
    ]);

    return {
      email: results[0].value || results[0].reason,
      sms: results[1].value || results[1].reason
    };
  }

  // Send appointment cancellation notification
  async sendAppointmentCancellation(appointment, patient, doctor, reason) {
    const appointmentDate = new Date(appointment.appointment_datetime);
    const formattedDate = appointmentDate.toLocaleDateString();
    const formattedTime = appointmentDate.toLocaleTimeString();

    const emailSubject = 'Appointment Cancelled';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Appointment Cancelled</h2>
        <p>Dear ${patient.first_name} ${patient.last_name},</p>
        <p>Your appointment has been cancelled:</p>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0; color: #721c24;">Cancelled Appointment</h3>
          <p><strong>Doctor:</strong> Dr. ${doctor.first_name} ${doctor.last_name}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
          <p><strong>Appointment ID:</strong> ${appointment.id}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>

        <p>If you would like to reschedule, please contact us or book a new appointment through our system.</p>
        <p>We apologize for any inconvenience this may cause.</p>

        <p>Best regards,<br>Clinical Appointment Scheduling Team</p>
      </div>
    `;

    const smsMessage = `Appointment cancelled: Dr. ${doctor.first_name} ${doctor.last_name} - ${formattedDate} at ${formattedTime}. Contact us to reschedule.`;

    const results = await Promise.allSettled([
      this.sendEmail({
        to: patient.email,
        subject: emailSubject,
        html: emailHtml
      }),
      patient.phone ? this.sendSMS({
        to: patient.phone,
        message: smsMessage
      }) : Promise.resolve({ success: true, skipped: 'No phone number' })
    ]);

    return {
      email: results[0].value || results[0].reason,
      sms: results[1].value || results[1].reason
    };
  }

  // Send password reset notification
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const emailSubject = 'Password Reset Request';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5aa0;">Password Reset Request</h2>
        <p>Dear ${user.first_name} ${user.last_name},</p>
        <p>We received a request to reset your password. Click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2c5aa0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>

        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6c757d;">${resetUrl}</p>

        <p><strong>This link will expire in 1 hour.</strong></p>
        
        <p>If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.</p>

        <p>Best regards,<br>Clinical Appointment Scheduling Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: emailSubject,
      html: emailHtml
    });
  }

  // Send welcome email for new registrations
  async sendWelcomeEmail(user) {
    const emailSubject = 'Welcome to Clinical Appointment Scheduling System';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5aa0;">Welcome to Clinical Appointment Scheduling!</h2>
        <p>Dear ${user.first_name} ${user.last_name},</p>
        <p>Welcome to our Clinical Appointment Scheduling System! We're excited to have you on board.</p>
        
        <div style="background-color: #d1ecf1; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8;">
          <h3 style="margin-top: 0; color: #0c5460;">Getting Started</h3>
          ${user.role === 'patient' ? `
            <p>As a patient, you can:</p>
            <ul>
              <li>Search and book appointments with doctors</li>
              <li>View your appointment history</li>
              <li>Upload and manage medical reports</li>
              <li>Track your health metrics</li>
              <li>Receive appointment reminders</li>
            </ul>
          ` : user.role === 'doctor' ? `
            <p>As a doctor, you can:</p>
            <ul>
              <li>Manage your availability and schedule</li>
              <li>View and manage patient appointments</li>
              <li>Access patient medical history</li>
              <li>Add medical notes and prescriptions</li>
              <li>Track your earnings and statistics</li>
            </ul>
            <p><strong>Note:</strong> Your account will be activated once approved by our admin team.</p>
          ` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/login" style="background-color: #2c5aa0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Login to Your Account
          </a>
        </div>

        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

        <p>Best regards,<br>Clinical Appointment Scheduling Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: emailSubject,
      html: emailHtml
    });
  }
}

module.exports = new NotificationService();
