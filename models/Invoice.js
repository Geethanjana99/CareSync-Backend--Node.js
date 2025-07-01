const { mysqlConnection } = require('../config/mysql');
const { v4: uuidv4 } = require('uuid');

class Invoice {  constructor(invoiceData) {
    this.id = invoiceData.id || uuidv4();
    this.invoice_number = invoiceData.invoice_number;
    this.patient_name = invoiceData.patient_name;
    this.appointment_date = invoiceData.appointment_date;
    this.due_date = invoiceData.due_date;
    this.total_amount = invoiceData.total_amount;
    this.status = invoiceData.status || 'pending';
    this.notes = invoiceData.notes;
    this.generated_date = invoiceData.generated_date;
    this.created_at = invoiceData.created_at || new Date();
    this.updated_at = invoiceData.updated_at || new Date();
  }
  async save() {
    const query = `
      INSERT INTO invoices (
        id, invoice_number, patient_name, appointment_date,
        due_date, total_amount, status, notes, generated_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      this.id,
      this.invoice_number,
      this.patient_name,
      this.appointment_date,
      this.due_date,
      this.total_amount,
      this.status,
      this.notes,
      this.generated_date,
      this.created_at,
      this.updated_at
    ];

    await mysqlConnection.query(query, params);
    return this;
  }
  static async findById(id) {
    const query = 'SELECT * FROM invoices WHERE id = ?';
    const invoices = await mysqlConnection.query(query, [id]);
    return invoices.length > 0 ? new Invoice(invoices[0]) : null;
  }  static async findByInvoiceNumber(invoice_number) {
    const query = 'SELECT * FROM invoices WHERE invoice_number = ?';
    const invoices = await mysqlConnection.query(query, [invoice_number]);
    return invoices.length > 0 ? new Invoice(invoices[0]) : null;
  }
  static async findByPatientName(patient_name) {
    const query = 'SELECT * FROM invoices WHERE patient_name LIKE ? ORDER BY created_at DESC';
    const invoices = await mysqlConnection.query(query, [`%${patient_name}%`]);
    return invoices.map(invoice => new Invoice(invoice));
  }
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM invoices WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.patient_name) {
      query += ' AND patient_name LIKE ?';
      params.push(`%${filters.patient_name}%`);
    }

    if (filters.start_date) {
      query += ' AND generated_date >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND generated_date <= ?';
      params.push(filters.end_date);
    }

    query += ' ORDER BY created_at DESC';    if (filters.limit) {
      const limitValue = parseInt(filters.limit);
      query += ` LIMIT ${limitValue}`;
    }const invoices = await mysqlConnection.query(query, params);
    return invoices.map(invoice => new Invoice(invoice));
  }

  async updateStatus(status) {
    const query = 'UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?';
    await mysqlConnection.query(query, [status, new Date(), this.id]);
    this.status = status;
    this.updated_at = new Date();
    return this;
  }
}

module.exports = Invoice;
