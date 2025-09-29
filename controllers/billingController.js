const { mysqlConnection } = require('../config/mysql');
const logger = require('../config/logger');
const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');

class BillingController {
  // Get patient names for billing/invoice purposes
  static async getPatientNames(req, res, next) {
    try {
      // Create connection to database
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: 'caresyncdb-caresync.e.aivencloud.com',
        port: 16006,
        user: 'avnadmin',
        password: 'AVNS_6xeaVpCVApextDTAKfU',
        database: 'caresync',
        ssl: { rejectUnauthorized: false }
      });

      // Query for active patients with complete profiles
      const query = `
        SELECT u.id, u.name, u.email, p.patient_id as patient_code
        FROM users u
        INNER JOIN patients p ON u.id = p.user_id
        WHERE u.role = 'patient' 
          AND u.is_active = true 
          AND p.status = 'active'
        ORDER BY u.name
      `;
      
      const [patients] = await connection.execute(query);
      await connection.end();
      
      const patientList = patients.map(patient => ({
        id: patient.id,
        name: patient.name || patient.email,
        email: patient.email,
        patientCode: patient.patient_code
      }));

      logger.info(`Billing: Loaded ${patientList.length} patients for billing`);

      res.json({
        success: true,
        data: patientList,
        message: `Found ${patientList.length} active patients`
      });
    } catch (error) {
      logger.error('Error fetching patient names for billing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load patients for billing',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  // Create a new invoice
  static async createInvoice(req, res, next) {
    try {
      const {
        patientName,
        appointmentDate,
        dueDate,
        notes,
        items,
        totalAmount,
        invoiceNumber
      } = req.body;

      // Validate required fields
      if (!patientName || !dueDate || !items || !totalAmount || !invoiceNumber) {
        return res.status(400).json({
          success: false,
          message: 'Missing required invoice data'
        });
      }

      // Create invoice
      const invoice = new Invoice({
        invoice_number: invoiceNumber,
        patient_name: patientName,
        appointment_date: appointmentDate,
        due_date: dueDate,
        total_amount: totalAmount,
        notes: notes,
        generated_date: new Date().toISOString().split('T')[0]
      });

      await invoice.save();

      // Create invoice items
      const invoiceItems = [];
      for (const item of items) {
        const invoiceItem = new InvoiceItem({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        });
        await invoiceItem.save();
        invoiceItems.push(invoiceItem);
      }

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: {
          invoice: invoice,
          items: invoiceItems
        }
      });

      logger.info(`Invoice created: ${invoice.invoice_number} for patient: ${patientName}`);
    } catch (error) {
      logger.error('Error creating invoice:', error);
      next(error);
    }
  }

  // Get all invoices
  static async getInvoices(req, res, next) {
    try {      const {
        status,
        patient_name,
        start_date,
        end_date,
        limit = 50
      } = req.query;

      const filters = {
        status,
        patient_name,
        start_date,
        end_date,
        limit
      };

      const invoices = await Invoice.findAll(filters);

      res.json({
        success: true,
        data: invoices
      });
    } catch (error) {
      logger.error('Error fetching invoices:', error);
      next(error);
    }
  }

  // Get invoice by ID with items
  static async getInvoiceById(req, res, next) {
    try {
      const { invoiceId } = req.params;

      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      const items = await InvoiceItem.findByInvoiceId(invoiceId);

      res.json({
        success: true,
        data: {
          invoice,
          items
        }
      });
    } catch (error) {
      logger.error('Error fetching invoice:', error);
      next(error);
    }
  }

  // Update invoice status
  static async updateInvoiceStatus(req, res, next) {
    try {
      const { invoiceId } = req.params;
      const { status } = req.body;

      if (!['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }

      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      await invoice.updateStatus(status);

      res.json({
        success: true,
        message: 'Invoice status updated successfully',
        data: invoice
      });

      logger.info(`Invoice status updated: ${invoice.invoice_number} to ${status}`);
    } catch (error) {
      logger.error('Error updating invoice status:', error);
      next(error);
    }
  }
}

module.exports = BillingController;
