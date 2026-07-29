import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getAnimalTransfers = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.animal_id; delete ff.start_date; delete ff.end_date;
    const { where, params } = buildWhereClause(ff, pag.search, []);

    let filters = '';
    if (req.query.animal_id) { filters += ' AND t.animal_id = ?'; params.push(req.query.animal_id); }
    if (req.query.start_date) { filters += ' AND t.date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND t.date <= ?'; params.push(req.query.end_date); }

    const countQuery = `SELECT COUNT(*) as total FROM animal_transfers t WHERE t.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT t.*, a.tag_number, a.name as animal_name
      FROM animal_transfers t
      JOIN animals a ON t.animal_id = a.id
      WHERE t.deleted_at IS NULL ${where} ${filters}
      ORDER BY t.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createAnimalTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { animal_id, from_location, to_location, date, reason } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO animal_transfers (animal_id, from_location, to_location, date, reason) VALUES (?,?,?,?,?)`,
      [animal_id, from_location, to_location, date || null, reason]
    );

    await logAudit(req, createAuditEntry(req, 'Create Animal Transfer', 'AnimalTransfers', `Transferred animal ${animal_id} to location ${to_location}`, { animal_id, from_location, to_location, date }));
    return created(res, { id: result.insertId }, 'Animal transfer created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateAnimalTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM animal_transfers WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Transfer record not found', 404);
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['animal_id', 'from_location', 'to_location', 'date', 'reason', 'approved_by'];
    const dateFields = new Set(['date']);
    for (const key of allowed)
      if (req.body[key] !== undefined) { fields.push(`${key}=?`); values.push(dateFields.has(key) && req.body[key] === '' ? null : req.body[key]); }
    if (fields.length === 0) return error(res, 'No fields to update', 400);
    values.push(req.params.id);
    await pool.query(`UPDATE animal_transfers SET ${fields.join(', ')} WHERE id=?`, values);
    await logAudit(req, createAuditEntry(req, 'Update Animal Transfer', 'AnimalTransfers', `Updated transfer ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Transfer updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteAnimalTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM animal_transfers WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Transfer record not found', 404);
    await pool.query('UPDATE animal_transfers SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Animal Transfer', 'AnimalTransfers', `Deleted transfer ${req.params.id}`, {}, old[0]));
    return success(res, null, 'Transfer deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getAnimalPurchases = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.start_date; delete ff.end_date;
    const { where, params } = buildWhereClause(ff, pag.search, []);

    let filters = '';
    if (req.query.start_date) { filters += ' AND p.purchase_date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND p.purchase_date <= ?'; params.push(req.query.end_date); }

    const countQuery = `SELECT COUNT(*) as total FROM animal_purchases p WHERE p.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT p.*, a.tag_number, a.name as animal_name
      FROM animal_purchases p
      JOIN animals a ON p.animal_id = a.id
      WHERE p.deleted_at IS NULL ${where} ${filters}
      ORDER BY p.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createAnimalPurchase = async (req: AuthRequest, res: Response) => {
  try {
    const { animal_id, supplier_name, purchase_date, cost } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO animal_purchases (animal_id, supplier_name, purchase_date, cost) VALUES (?,?,?,?)`,
      [animal_id, supplier_name, purchase_date || null, cost]
    );

    await pool.query("UPDATE animals SET source = 'purchased' WHERE id = ?", [animal_id]);

    await logAudit(req, createAuditEntry(req, 'Create Animal Purchase', 'AnimalPurchases', `Purchased animal ${animal_id} from ${supplier_name}`, { animal_id, supplier_name, purchase_date, cost }));
    return created(res, { id: result.insertId }, 'Animal purchase created');
  } catch (err: any) { return error(res, err.message); }
};

export const getAnimalSales = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.start_date; delete ff.end_date;
    const { where, params } = buildWhereClause(ff, pag.search, []);

    let filters = '';
    if (req.query.start_date) { filters += ' AND s.sale_date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND s.sale_date <= ?'; params.push(req.query.end_date); }

    const countQuery = `SELECT COUNT(*) as total FROM animal_sales s WHERE s.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT s.*, a.tag_number, a.name as animal_name
      FROM animal_sales s
      JOIN animals a ON s.animal_id = a.id
      WHERE s.deleted_at IS NULL ${where} ${filters}
      ORDER BY s.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createAnimalSale = async (req: AuthRequest, res: Response) => {
  try {
    const { animal_id, customer_name, sale_date, price, payment_status } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO animal_sales (animal_id, customer_name, sale_date, price, payment_status) VALUES (?,?,?,?,?)`,
      [animal_id, customer_name, sale_date || null, price, payment_status]
    );

    await pool.query("UPDATE animals SET status = 'sold' WHERE id = ?", [animal_id]);

    await logAudit(req, createAuditEntry(req, 'Create Animal Sale', 'AnimalSales', `Sold animal ${animal_id} to ${customer_name}`, { animal_id, customer_name, sale_date, price }));
    return created(res, { id: result.insertId }, 'Animal sale created');
  } catch (err: any) { return error(res, err.message); }
};

export const getAnimalDeaths = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.start_date; delete ff.end_date;
    const { where, params } = buildWhereClause(ff, pag.search, []);

    let filters = '';
    if (req.query.start_date) { filters += ' AND d.date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND d.date <= ?'; params.push(req.query.end_date); }

    const countQuery = `SELECT COUNT(*) as total FROM animal_deaths d WHERE d.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT d.*, a.tag_number, a.name as animal_name
      FROM animal_deaths d
      JOIN animals a ON d.animal_id = a.id
      WHERE d.deleted_at IS NULL ${where} ${filters}
      ORDER BY d.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createAnimalDeath = async (req: AuthRequest, res: Response) => {
  try {
    const { animal_id, date, cause, notes } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO animal_deaths (animal_id, date, cause, notes) VALUES (?,?,?,?)`,
      [animal_id, date || null, cause, notes]
    );

    await pool.query("UPDATE animals SET status = 'dead' WHERE id = ?", [animal_id]);

    await logAudit(req, createAuditEntry(req, 'Create Animal Death', 'AnimalDeaths', `Death recorded for animal ${animal_id}`, { animal_id, date, cause }));
    return created(res, { id: result.insertId }, 'Animal death recorded');
  } catch (err: any) { return error(res, err.message); }
};

export const getWeightRecords = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.animal_id; delete ff.start_date; delete ff.end_date;
    const { where, params } = buildWhereClause(ff, pag.search, []);

    let filters = '';
    if (req.query.animal_id) { filters += ' AND w.animal_id = ?'; params.push(req.query.animal_id); }
    if (req.query.start_date) { filters += ' AND w.date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND w.date <= ?'; params.push(req.query.end_date); }

    const countQuery = `SELECT COUNT(*) as total FROM weight_records w WHERE w.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT w.*, a.tag_number, a.name as animal_name,
        (SELECT wr2.weight FROM weight_records wr2 WHERE wr2.animal_id = w.animal_id AND wr2.date < w.date AND wr2.deleted_at IS NULL ORDER BY wr2.date DESC LIMIT 1) as old_weight,
        (SELECT wr2.date FROM weight_records wr2 WHERE wr2.animal_id = w.animal_id AND wr2.date < w.date AND wr2.deleted_at IS NULL ORDER BY wr2.date DESC LIMIT 1) as previous_date
      FROM weight_records w
      JOIN animals a ON w.animal_id = a.id
      WHERE w.deleted_at IS NULL ${where} ${filters}
      ORDER BY w.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    const result = rows.map((r: any) => ({
      ...r,
      old_weight: r.old_weight ?? null,
      difference: r.old_weight != null ? Number(r.weight) - Number(r.old_weight) : null,
    }));

    return paginated(res, result, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createWeightRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { animal_id, weight_date: date, weight, notes } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO weight_records (animal_id, date, weight, notes) VALUES (?,?,?,?)`,
      [animal_id, date || null, weight, notes || null]
    );

    await pool.query('UPDATE animals SET weight = ? WHERE id = ?', [weight, animal_id]);

    await logAudit(req, createAuditEntry(req, 'Create Weight Record', 'WeightRecords', `Weight recorded for animal ${animal_id}`, { animal_id, date, weight }));
    return created(res, { id: result.insertId }, 'Weight record created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateWeightRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM weight_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Weight record not found', 404);
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['animal_id', 'weight', 'weight_date', 'notes'];
    const dateFields = new Set(['weight_date']);
    for (const key of allowed)
      if (req.body[key] !== undefined) { fields.push(`${key === 'weight_date' ? 'date' : key}=?`); values.push(dateFields.has(key) && req.body[key] === '' ? null : req.body[key]); }
    if (fields.length === 0) return error(res, 'No fields to update', 400);
    values.push(req.params.id);
    await pool.query(`UPDATE weight_records SET ${fields.join(', ')} WHERE id=?`, values);
    await logAudit(req, createAuditEntry(req, 'Update Weight Record', 'WeightRecords', `Updated weight record ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Weight record updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteWeightRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM weight_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Weight record not found', 404);
    await pool.query('UPDATE weight_records SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Weight Record', 'WeightRecords', `Deleted weight record ${req.params.id}`, {}, old[0]));
    return success(res, null, 'Weight record deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const updateAnimalSale = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM animal_sales WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Sale record not found', 404);
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['animal_id', 'customer_name', 'sale_date', 'price', 'payment_status'];
    const dateFields = new Set(['sale_date']);
    for (const key of allowed)
      if (req.body[key] !== undefined) { fields.push(`${key}=?`); values.push(dateFields.has(key) && req.body[key] === '' ? null : req.body[key]); }
    if (fields.length === 0) return error(res, 'No fields to update', 400);
    values.push(req.params.id);
    await pool.query(`UPDATE animal_sales SET ${fields.join(', ')} WHERE id=?`, values);
    await logAudit(req, createAuditEntry(req, 'Update Animal Sale', 'AnimalSales', `Updated sale ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Sale updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteAnimalSale = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM animal_sales WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Sale record not found', 404);
    await pool.query('UPDATE animal_sales SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Animal Sale', 'AnimalSales', `Deleted sale ${req.params.id}`, {}, old[0]));
    return success(res, null, 'Sale deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const updateAnimalDeath = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM animal_deaths WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Death record not found', 404);
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['animal_id', 'date', 'cause', 'notes'];
    const dateFields = new Set(['date']);
    for (const key of allowed)
      if (req.body[key] !== undefined) { fields.push(`${key}=?`); values.push(dateFields.has(key) && req.body[key] === '' ? null : req.body[key]); }
    if (fields.length === 0) return error(res, 'No fields to update', 400);
    values.push(req.params.id);
    await pool.query(`UPDATE animal_deaths SET ${fields.join(', ')} WHERE id=?`, values);
    await logAudit(req, createAuditEntry(req, 'Update Animal Death', 'AnimalDeaths', `Updated death record ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Death record updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteAnimalDeath = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM animal_deaths WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Death record not found', 404);
    await pool.query('UPDATE animal_deaths SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await pool.query("UPDATE animals SET status = 'active' WHERE id = ?", [old[0].animal_id]);
    await logAudit(req, createAuditEntry(req, 'Delete Animal Death', 'AnimalDeaths', `Deleted death record ${req.params.id} and restored animal`, {}, old[0]));
    return success(res, null, 'Death record deleted, animal restored');
  } catch (err: any) { return error(res, err.message); }
};
