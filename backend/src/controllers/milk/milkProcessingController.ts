import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getProcessingRecords = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, []);

    let filters = '';
    if (req.query.collection_id) { filters += ' AND pr.collection_id = ?'; params.push(req.query.collection_id); }
    if (req.query.product_id) { filters += ' AND pr.product_id = ?'; params.push(req.query.product_id); }
    if (req.query.start_date) { filters += ' AND pr.processing_date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND pr.processing_date <= ?'; params.push(req.query.end_date); }

    const countQuery = `SELECT COUNT(*) as total FROM milk_processing_records pr WHERE pr.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT pr.*, mp.name as product_name, mc.collection_date
      FROM milk_processing_records pr
      JOIN milk_products mp ON pr.product_id = mp.id
      LEFT JOIN milk_collections mc ON pr.collection_id = mc.id
      WHERE pr.deleted_at IS NULL ${where} ${filters}
      ORDER BY pr.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createProcessingRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { collection_id, product_id, input_quantity, output_quantity, processing_date } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO milk_processing_records (collection_id, product_id, input_quantity, output_quantity, processing_date) VALUES (?,?,?,?,?)`,
      [collection_id, product_id, input_quantity, output_quantity, processing_date]
    );

    await logAudit(req, createAuditEntry(req, 'Create Processing Record', 'MilkProcessing', `Processed ${input_quantity}L into product ${product_id}`, { collection_id, product_id, input_quantity, output_quantity }));
    return created(res, { id: result.insertId }, 'Processing record created');
  } catch (err: any) { return error(res, err.message); }
};

export const getMilkProducts = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, ['name', 'code']);

    const countQuery = `SELECT COUNT(*) as total FROM milk_products WHERE deleted_at IS NULL ${where}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `SELECT * FROM milk_products WHERE deleted_at IS NULL ${where} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createMilkProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, description, unit, price, category } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO milk_products (name, code, description, unit, price, category) VALUES (?,?,?,?,?,?)`,
      [name, code, description, unit, price, category]
    );

    await logAudit(req, createAuditEntry(req, 'Create Milk Product', 'MilkProducts', `Product ${name} created`, { name, code, price }));
    return created(res, { id: result.insertId }, 'Milk product created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateMilkProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, description, unit, price, category } = req.body;

    const [old]: any = await pool.query('SELECT * FROM milk_products WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Milk product not found', 404);

    await pool.query(
      `UPDATE milk_products SET name=?, code=?, description=?, unit=?, price=?, category=? WHERE id=?`,
      [name, code, description, unit, price, category, req.params.id]
    );

    await logAudit(req, createAuditEntry(req, 'Update Milk Product', 'MilkProducts', `Updated product ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Milk product updated');
  } catch (err: any) { return error(res, err.message); }
};

export const updateProcessingRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { collection_id, product_id, input_quantity, output_quantity, processing_date, notes } = req.body;

    const [old]: any = await pool.query('SELECT * FROM milk_processing_records WHERE id = ?', [id]);
    if (old.length === 0) return error(res, 'Processing record not found', 404);

    await pool.query(
      `UPDATE milk_processing_records SET collection_id=?, product_id=?, input_quantity=?, output_quantity=?, processing_date=?, notes=?, updated_at=NOW() WHERE id=?`,
      [collection_id, product_id, input_quantity, output_quantity, processing_date, notes, id]
    );

    const [updated]: any = await pool.query('SELECT * FROM milk_processing_records WHERE id = ?', [id]);

    await logAudit(req, createAuditEntry(req, 'Update Processing Record', 'MilkProcessing', `Updated processing record ${id}`, req.body, old[0]));
    return success(res, updated[0]);
  } catch (err: any) { return error(res, err.message); }
};

export const deleteProcessingRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [old]: any = await pool.query('SELECT * FROM milk_processing_records WHERE id = ?', [id]);
    if (old.length === 0) return error(res, 'Processing record not found', 404);

    await pool.query('UPDATE milk_processing_records SET deleted_at = NOW() WHERE id = ?', [id]);

    await logAudit(req, createAuditEntry(req, 'Delete Processing Record', 'MilkProcessing', `Deleted processing record ${id}`, null, old[0]));
    return success(res, { message: 'Processing record deleted' });
  } catch (err: any) { return error(res, err.message); }
};

export const deleteMilkProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [old]: any = await pool.query('SELECT * FROM milk_products WHERE id = ?', [id]);
    if (old.length === 0) return error(res, 'Milk product not found', 404);

    await pool.query('UPDATE milk_products SET deleted_at = NOW() WHERE id = ?', [id]);

    await logAudit(req, createAuditEntry(req, 'Delete Milk Product', 'MilkProducts', `Deleted milk product ${id}`, null, old[0]));
    return success(res, { message: 'Milk product deleted' });
  } catch (err: any) { return error(res, err.message); }
};
