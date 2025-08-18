const { mysqlConnection } = require('../config/mysql');
const { v4: uuidv4 } = require('uuid');

class InvoiceItem {
  constructor(itemData) {
    this.id = itemData.id || uuidv4();
    this.invoice_id = itemData.invoice_id;
    this.description = itemData.description;
    this.quantity = itemData.quantity;
    this.rate = itemData.rate;
    this.amount = itemData.amount;
    this.created_at = itemData.created_at || new Date();
  }

  async save() {
    const query = `
      INSERT INTO invoice_items (
        id, invoice_id, description, quantity, rate, amount, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      this.id,
      this.invoice_id,
      this.description,
      this.quantity,
      this.rate,
      this.amount,
      this.created_at
    ];

    await mysqlConnection.query(query, params);
    return this;
  }

  static async findByInvoiceId(invoice_id) {
    const query = 'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY created_at ASC';
    const [items] = await mysqlConnection.query(query, [invoice_id]);
    return items.map(item => new InvoiceItem(item));
  }

  static async deleteByInvoiceId(invoice_id) {
    const query = 'DELETE FROM invoice_items WHERE invoice_id = ?';
    await mysqlConnection.query(query, [invoice_id]);
  }
}

module.exports = InvoiceItem;
