import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getProcurementContracts = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, ['contract_number']);
    let filters = '';
    if (req.query.status) { filters += ' AND sc.status = ?'; params.push(req.query.status); }
    if (req.query.supplier_id) { filters += ' AND sc.supplier_id = ?'; params.push(req.query.supplier_id); }
    const countQuery = `SELECT COUNT(*) as total FROM supplier_contracts sc WHERE sc.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);
    const dataQuery = `SELECT sc.*, s.supplier_name as supplier FROM supplier_contracts sc LEFT JOIN suppliers s ON sc.supplier_id = s.id WHERE sc.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createProcurementContract = async (req: AuthRequest, res: Response) => {
  try {
    const { contract_number, supplier_id, start_date, end_date, terms, total_value } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO supplier_contracts (contract_number, supplier_id, start_date, end_date, terms, total_value, status) VALUES (?,?,?,?,?,?,?)',
      [contract_number, supplier_id, start_date, end_date, terms, total_value, 'active']
    );
    return created(res, { id: result.insertId }, 'Contract created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateProcurementContract = async (req: AuthRequest, res: Response) => {
  try {
    const { contract_number, start_date, end_date, terms, total_value, status } = req.body;
    const [old]: any = await pool.query('SELECT * FROM supplier_contracts WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Contract not found', 404);
    await pool.query(
      'UPDATE supplier_contracts SET contract_number=?, start_date=?, end_date=?, terms=?, total_value=?, status=? WHERE id=?',
      [contract_number, start_date, end_date, terms, total_value, status, req.params.id]
    );
    return success(res, null, 'Contract updated');
  } catch (err: any) { return error(res, err.message); }
};

export const getExpiringProcurementContracts = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT sc.*, s.supplier_name as supplier FROM supplier_contracts sc LEFT JOIN suppliers s ON sc.supplier_id = s.id WHERE sc.status = ? AND sc.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) ORDER BY sc.end_date',
      ['active']
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};
