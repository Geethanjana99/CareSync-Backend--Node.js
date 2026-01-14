/**
 * Appointment Booking Flow - E2E Tests
 * Tests complete user journey from registration through appointment booking
 * ======================================================================
 */

const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Appointment = require('../../../src/models/Appointment');
const Doctor = require('../../../src/models/Doctor');
const { cleanupDatabase } = require('../../helpers');

describe('Appointment Booking Flow - E2E Tests', () => {
  let patientToken;
  let doctorToken;
  let patientId;
  let doctorId;

  beforeAll(async () => {
    await cleanupDatabase();

    // Register and login patient
    const patientReg = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'patient@example.com',
        password: 'SecurePass123!',
        name: 'John Patient',
        role: 'patient'
      });

    patientToken = patientReg.body.accessToken;
    patientId = patientReg.body.user.id;

    // Register and login doctor
    const doctorReg = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'doctor@example.com',
        password: 'SecurePass123!',
        name: 'Dr. Jane Smith',
        role: 'doctor',
        specialization: 'Cardiology',
        licenseNumber: 'LIC123456'
      });

    doctorToken = doctorReg.body.accessToken;
    doctorId = doctorReg.body.user.id;

    // Create doctor profile
    await request(app)
      .post('/api/doctors/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        specialization: 'Cardiology',
        experienceYears: 10,
        consultationFee: 5000,
        qualifications: ['MBBS', 'MD Cardiology']
      });
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe('Complete Appointment Booking Journey', () => {
    it('should allow patient to book appointment with doctor', async () => {
      // Step 1: Patient views available doctors
      const doctorsResponse = await request(app)
        .get('/api/doctors/search')
        .query({ specialization: 'Cardiology' })
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(doctorsResponse.body.doctors).toBeDefined();
      expect(doctorsResponse.body.doctors.length).toBeGreaterThan(0);

      const doctor = doctorsResponse.body.doctors[0];
      expect(doctor).toHaveProperty('id');
      expect(doctor).toHaveProperty('consultationFee');

      // Step 2: Patient views doctor's available slots
      const slotsResponse = await request(app)
        .get(`/api/doctors/${doctor.id}/availability`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(slotsResponse.body.slots).toBeDefined();
      expect(slotsResponse.body.slots.length).toBeGreaterThan(0);

      const slot = slotsResponse.body.slots[0];

      // Step 3: Patient creates appointment
      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctor.id,
          appointmentDate: slot.date,
          appointmentTime: slot.time,
          reason: 'Heart checkup',
          notes: 'Regular checkup'
        })
        .expect(201);

      expect(appointmentResponse.body).toHaveProperty('id');
      expect(appointmentResponse.body.status).toBe('pending');
      expect(appointmentResponse.body.doctorId).toBe(doctor.id);

      const appointmentId = appointmentResponse.body.id;

      // Step 4: Verify appointment in patient's list
      const patientAppointmentsResponse = await request(app)
        .get('/api/patients/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(patientAppointmentsResponse.body.appointments).toBeDefined();
      const bookingFound = patientAppointmentsResponse.body.appointments
        .find(apt => apt.id === appointmentId);
      expect(bookingFound).toBeDefined();

      // Step 5: Doctor views and confirms appointment
      const doctorAppointmentsResponse = await request(app)
        .get('/api/doctors/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const doctorBookingFound = doctorAppointmentsResponse.body.appointments
        .find(apt => apt.id === appointmentId);
      expect(doctorBookingFound).toBeDefined();

      // Step 6: Doctor confirms appointment
      const confirmResponse = await request(app)
        .patch(`/api/appointments/${appointmentId}/confirm`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(confirmResponse.body.status).toBe('confirmed');

      // Step 7: Verify appointment is now confirmed
      const finalStatusResponse = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(finalStatusResponse.body.status).toBe('confirmed');
      expect(finalStatusResponse.body.patientId).toBe(patientId);
      expect(finalStatusResponse.body.doctorId).toBe(doctorId);
    });

    it('should handle payment and confirm appointment', async () => {
      // Book appointment first
      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctorId,
          appointmentDate: '2026-01-25',
          appointmentTime: '10:00 AM',
          reason: 'Consultation',
          notes: 'Payment test'
        })
        .expect(201);

      const appointmentId = appointmentResponse.body.id;
      const fee = appointmentResponse.body.consultationFee;

      // Step 1: Get payment details
      const paymentDetailsResponse = await request(app)
        .get(`/api/appointments/${appointmentId}/payment-details`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(paymentDetailsResponse.body).toHaveProperty('amount', fee);
      expect(paymentDetailsResponse.body).toHaveProperty('orderId');

      // Step 2: Process payment
      const paymentResponse = await request(app)
        .post(`/api/appointments/${appointmentId}/pay`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          amount: fee,
          paymentMethod: 'credit_card',
          cardToken: 'tok_visa'
        })
        .expect(200);

      expect(paymentResponse.body).toHaveProperty('transactionId');
      expect(paymentResponse.body.status).toBe('completed');

      // Step 3: Verify appointment is confirmed after payment
      const appointmentStatusResponse = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(appointmentStatusResponse.body.paymentStatus).toBe('paid');
      expect(appointmentStatusResponse.body.status).toBe('confirmed');
    });

    it('should handle appointment rescheduling', async () => {
      // Book initial appointment
      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctorId,
          appointmentDate: '2026-01-25',
          appointmentTime: '10:00 AM',
          reason: 'Checkup'
        })
        .expect(201);

      const appointmentId = appointmentResponse.body.id;

      // Reschedule appointment
      const rescheduleResponse = await request(app)
        .patch(`/api/appointments/${appointmentId}/reschedule`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          newDate: '2026-02-01',
          newTime: '02:00 PM'
        })
        .expect(200);

      expect(rescheduleResponse.body.appointmentDate).toBe('2026-02-01');
      expect(rescheduleResponse.body.appointmentTime).toBe('02:00 PM');

      // Verify doctor sees updated appointment
      const doctorViewResponse = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(doctorViewResponse.body.appointmentDate).toBe('2026-02-01');
    });

    it('should handle appointment cancellation', async () => {
      // Book appointment
      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctorId,
          appointmentDate: '2026-01-26',
          appointmentTime: '11:00 AM',
          reason: 'Checkup'
        })
        .expect(201);

      const appointmentId = appointmentResponse.body.id;

      // Confirm appointment
      await request(app)
        .patch(`/api/appointments/${appointmentId}/confirm`)
        .set('Authorization', `Bearer ${doctorToken}`);

      // Cancel appointment
      const cancelResponse = await request(app)
        .patch(`/api/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          reason: 'Cannot make it'
        })
        .expect(200);

      expect(cancelResponse.body.status).toBe('cancelled');

      // Verify appointment is cancelled
      const statusResponse = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(statusResponse.body.status).toBe('cancelled');

      // Verify slot is now available again for doctor
      const doctorSlotsResponse = await request(app)
        .get(`/api/doctors/${doctorId}/availability`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      const cancelledSlot = doctorSlotsResponse.body.slots
        .find(s => s.date === '2026-01-26' && s.time === '11:00 AM');
      expect(cancelledSlot).toBeDefined();
      expect(cancelledSlot.available).toBe(true);
    });

    it('should enforce business rules for appointments', async () => {
      // Try to book appointment in the past
      const pastDateResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctorId,
          appointmentDate: '2025-01-01',
          appointmentTime: '10:00 AM',
          reason: 'Checkup'
        })
        .expect(400);

      expect(pastDateResponse.body.error).toContain('past');

      // Try to book appointment outside working hours
      const invalidTimeResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctorId,
          appointmentDate: '2026-02-10',
          appointmentTime: '11:00 PM',
          reason: 'Checkup'
        })
        .expect(400);

      expect(invalidTimeResponse.body.error).toContain('working hours');
    });
  });

  describe('Appointment History and Analytics', () => {
    beforeEach(async () => {
      // Create multiple appointments
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            doctorId: doctorId,
            appointmentDate: `2026-02-${10 + i}`,
            appointmentTime: '10:00 AM',
            reason: 'Checkup'
          });
      }
    });

    it('should retrieve patient appointment history', async () => {
      const response = await request(app)
        .get('/api/patients/appointments/history')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.appointments).toBeDefined();
      expect(response.body.appointments.length).toBeGreaterThanOrEqual(3);
      expect(response.body).toHaveProperty('totalAppointments');
      expect(response.body).toHaveProperty('completedAppointments');
      expect(response.body).toHaveProperty('cancelledAppointments');
    });

    it('should retrieve doctor appointment statistics', async () => {
      const response = await request(app)
        .get('/api/doctors/statistics')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalAppointments');
      expect(response.body).toHaveProperty('completedAppointments');
      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('totalEarnings');
    });
  });
});
