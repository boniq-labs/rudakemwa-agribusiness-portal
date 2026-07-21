import pool from '../../config/database';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
export const getSalesInvoices = async (req, res) => {
    try {
        const { customer_id, status, start_date, end_date, startDate, endDate } = req.query;
        const sd = start_date || startDate || '';
        const ed = end_date || endDate || '';
        let where = 'WHERE 1=1';
        const params = [];
        if (customer_id) {
            where += ' AND si.customer_id = ?';
            params.push(customer_id);
        }
        if (status) {
            where += ' AND si.status = ?';
            params.push(status);
        }
        if (sd) {
            where += ' AND si.invoice_date >= ?';
            params.push(sd);
        }
        if (ed) {
            where += ' AND si.invoice_date <= ?';
            params.push(ed);
        }
        const [rows] = await pool.query(`SELECT si.*, CONCAT(c.first_name, ' ', c.last_name) as customer_name, c.company_name
       FROM sales_invoices si LEFT JOIN customers c ON si.customer_id = c.id
       ${where} ORDER BY si.created_at DESC`, params);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createSalesInvoice = async (req, res) => {
    try {
        const b = req.body;
        let customer_id = b.customer_id;
        let order_id = b.order_id;
        if (!customer_id && order_id) {
            const [ord] = await pool.query('SELECT customer_id FROM sales_orders WHERE id = ?', [order_id]);
            if (ord.length > 0)
                customer_id = ord[0].customer_id;
        }
        const items = b.items || [];
        const subtotal = items.length ? items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) : 0;
        const taxAmount = Number(b.tax) || 0;
        const total_amount = b.total_amount || (subtotal + taxAmount);
        const invoiceNumber = b.invoice_number || `INV-${Date.now()}`;
        const invoice_date = b.invoice_date || new Date().toISOString().split('T')[0];
        const [result] = await pool.query(`INSERT INTO sales_invoices (invoice_number, customer_id, order_id, subtotal, tax, total_amount, due_date, invoice_date, notes) VALUES (?,?,?,?,?,?,?,?,?)`, [invoiceNumber, customer_id || null, order_id || null, subtotal || null, taxAmount, total_amount, b.due_date || null, invoice_date, b.notes || null]);
        for (const item of items) {
            await pool.query(`INSERT INTO sales_invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price) VALUES (?,?,?,?,?,?)`, [result.insertId, item.product_id, item.description || null, item.quantity, item.unit_price, item.quantity * item.unit_price]);
        }
        if (order_id) {
            await pool.query('UPDATE sales_orders SET status = ? WHERE id = ?', ['invoiced', order_id]);
        }
        await logAudit(req, createAuditEntry(req, 'Create Sales Invoice', 'Sales', `Sales invoice ${invoiceNumber} created`, req.body));
        return created(res, { id: result.insertId, invoice_number: invoiceNumber }, 'Sales invoice created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const recordCustomerPayment = async (req, res) => {
    try {
        const invoice_id = req.params.id || req.body.invoice_id;
        if (!invoice_id)
            return error(res, 'Invoice ID is required', 400);
        const { amount, payment_method, reference_number } = req.body;
        const [inv] = await pool.query('SELECT * FROM sales_invoices WHERE id = ?', [invoice_id]);
        if (inv.length === 0)
            return error(res, 'Invoice not found', 404);
        const [result] = await pool.query(`INSERT INTO customer_payments (invoice_id, amount, payment_method, reference_number) VALUES (?,?,?,?)`, [invoice_id, amount, payment_method || null, reference_number || null]);
        const paidTotal = await pool.query('SELECT SUM(amount) as paid FROM customer_payments WHERE invoice_id = ?', [invoice_id]);
        const paid = paidTotal[0][0]?.paid || 0;
        if (paid >= inv[0].total_amount) {
            await pool.query('UPDATE sales_invoices SET status = ? WHERE id = ?', ['paid', invoice_id]);
        }
        else {
            await pool.query('UPDATE sales_invoices SET status = ? WHERE id = ?', ['partial', invoice_id]);
        }
        await logAudit(req, createAuditEntry(req, 'Record Customer Payment', 'Sales', `Payment of ${amount} recorded for invoice #${invoice_id}`, req.body));
        return created(res, { id: result.insertId }, 'Payment recorded');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=invoiceController.js.map