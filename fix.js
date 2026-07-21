const fs = require('fs');
let c = fs.readFileSync('backend/src/routes/index.ts', 'utf8');
const replacement = `router.delete('/sales/invoices/:id', authenticate, authorize(['sales_invoices.delete']), async (req, res) => {
  const pool = (await import('../config/database')).default;
  try {
    const [old]: any = await pool.query('SELECT * FROM sales_invoices WHERE id = ?', [req.params.id]);
    if (old.length === 0) return (await import('../utils/response')).error(res, 'Invoice not found', 404);
    await pool.query('UPDATE sales_invoices SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return (await import('../utils/response')).success(res, null, 'Invoice deleted');
  } catch (err: any) { return (await import('../utils/response')).error(res, err.message); }
});
router.post('/sales/invoices/:id/pay', authenticate, authorize(['sales_invoices.update']), recordCustomerPayment);

// Sales - Reports
router.get('/sales/reports', authenticate, authorize(['sales.view']), async (req, res) => {
  const pool = (await import('../config/database')).default;
  try {
    const [rows_monthSales]: any = await pool.query("SELECT COALESCE(SUM(total_amount),0) as c FROM sales_orders WHERE MONTH(order_date)=MONTH(CURDATE()) AND YEAR(order_date)=YEAR(CURDATE()) AND status='completed' AND deleted_at IS NULL");
    const monthSales = rows_monthSales[0].c;
    const [rows_totalC]: any = await pool.query("SELECT COUNT(*) as c FROM customers WHERE deleted_at IS NULL");
    const totalC = rows_totalC[0].c;
    const [rows_activeC]: any = await pool.query("SELECT COUNT(*) as c FROM customers WHERE deleted_at IS NULL AND (status IS NULL OR status='active')");
    const activeC = rows_activeC[0].c;
    const [topProducts] = await pool.query("SELECT p.id, p.name, SUM(soi.quantity) as sold, SUM(soi.total_price) as revenue FROM sales_order_items soi JOIN products p ON soi.product_id = p.id JOIN sales_orders so ON soi.order_id = so.id WHERE so.deleted_at IS NULL AND p.deleted_at IS NULL GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10");
    const { success } = await import('../utils/response');
    return success(res, { monthSales, customerStats: { total: totalC, active: activeC }, topProducts });
  } catch (err: any) { const { error } = await import('../utils/response'); return error(res, err.message); }
});

// Veterinary - Health
router.get('/veterinary/health'`;

c = c.replace(/router\.delete\('\/sales\/invoices\/:id', authenticate, authorize\(\['sales_invoices\.delete'\]\), async \(req, res\) => \{\n\s*const pool = \(await import\('\.\.\/config\/database'\)\)\.default;\n\}\);\n\nrouter\.get\('\/veterinary\/health'/, replacement);

fs.writeFileSync('backend/src/routes/index.ts', c);
