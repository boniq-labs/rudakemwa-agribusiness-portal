import pool from '../../config/database';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';
export const getSupplierCategories = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM supplier_categories WHERE deleted_at IS NULL');
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createSupplierCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const [result] = await pool.query('INSERT INTO supplier_categories (name, description) VALUES (?,?)', [name, description]);
        return created(res, { id: result.insertId }, 'Category created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateSupplierCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        await pool.query('UPDATE supplier_categories SET name=?, description=? WHERE id=?', [name, description, req.params.id]);
        return success(res, null, 'Category updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getSuppliers = async (req, res) => {
    try {
        const pag = getPagination(req);
        const { where, params } = buildWhereClause(pag.filters, pag.search, ['supplier_name', 'email', 'phone']);
        const countQuery = `SELECT COUNT(*) as total FROM suppliers WHERE deleted_at IS NULL ${where}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `SELECT s.*, sc.name as category_name FROM suppliers s LEFT JOIN supplier_categories sc ON s.category_id = sc.id WHERE s.deleted_at IS NULL ${where} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createSupplier = async (req, res) => {
    try {
        const supplier_name = req.body.supplier_name || req.body.name || '';
        const { email, phone, address, category_id, contact_person } = req.body;
        const [result] = await pool.query('INSERT INTO suppliers (supplier_name, email, phone, address, category_id, contact_person) VALUES (?,?,?,?,?,?)', [supplier_name, email, phone, address, category_id, contact_person || null]);
        await logAudit(req, createAuditEntry(req, 'Create Supplier', 'Suppliers', `Supplier ${supplier_name} created`));
        return created(res, { id: result.insertId }, 'Supplier created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateSupplier = async (req, res) => {
    try {
        const supplier_name = req.body.supplier_name || req.body.name || '';
        const { email, phone, address, category_id, contact_person } = req.body;
        const [old] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Supplier not found', 404);
        await pool.query('UPDATE suppliers SET supplier_name=?, email=?, phone=?, address=?, category_id=?, contact_person=? WHERE id=?', [supplier_name, email, phone, address, category_id, contact_person || null, req.params.id]);
        return success(res, null, 'Supplier updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deleteSupplier = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Supplier not found', 404);
        await pool.query('UPDATE suppliers SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        return success(res, null, 'Supplier deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const rateSupplier = async (req, res) => {
    try {
        const { product_quality, delivery_time, price, reliability, comments } = req.body;
        await pool.query('INSERT INTO supplier_ratings (supplier_id, product_quality, delivery_time, price, reliability, comments, rated_by) VALUES (?,?,?,?,?,?,?)', [req.params.id, product_quality, delivery_time, price, reliability, comments, req.user?.id]);
        return success(res, null, 'Supplier rated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=supplierController.js.map