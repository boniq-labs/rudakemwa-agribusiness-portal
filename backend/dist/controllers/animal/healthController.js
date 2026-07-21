import pool from '../../config/database';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';
export const getVaccinations = async (req, res) => {
    try {
        const pag = getPagination(req);
        const ff = { ...pag.filters };
        delete ff.animal_id;
        delete ff.start_date;
        delete ff.end_date;
        const { where, params } = buildWhereClause(ff, pag.search, []);
        let filters = '';
        if (req.query.animal_id) {
            filters += ' AND v.animal_id = ?';
            params.push(req.query.animal_id);
        }
        if (req.query.start_date) {
            filters += ' AND v.date >= ?';
            params.push(req.query.start_date);
        }
        if (req.query.end_date) {
            filters += ' AND v.date <= ?';
            params.push(req.query.end_date);
        }
        const countQuery = `SELECT COUNT(*) as total FROM vaccinations v WHERE v.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `
      SELECT v.*, a.tag_number, a.name as animal_name
      FROM vaccinations v
      JOIN animals a ON v.animal_id = a.id
      WHERE v.deleted_at IS NULL ${where} ${filters}
      ORDER BY v.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createVaccination = async (req, res) => {
    try {
        const { animal_id, vaccine_name, vaccination_date, next_due_date, veterinarian, batch_no } = req.body;
        const [result] = await pool.query(`INSERT INTO vaccinations (animal_id, vaccine_name, date, next_due_date, veterinarian, batch_number) VALUES (?,?,?,?,?,?)`, [animal_id, vaccine_name, vaccination_date, next_due_date, veterinarian, batch_no]);
        await logAudit(req, createAuditEntry(req, 'Create Vaccination', 'Vaccinations', `Vaccination ${vaccine_name} for animal ${animal_id}`, { animal_id, vaccine_name, vaccination_date }));
        return created(res, { id: result.insertId }, 'Vaccination created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateVaccination = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM vaccinations WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Vaccination not found', 404);
        const fields = [];
        const values = [];
        const allowed = ['animal_id', 'vaccine_name', 'vaccination_date', 'next_due_date', 'veterinarian', 'batch_number'];
        for (const key of allowed)
            if (req.body[key] !== undefined) {
                fields.push(`${key}=?`);
                values.push(req.body[key]);
            }
        if (fields.length === 0)
            return error(res, 'No fields to update', 400);
        values.push(req.params.id);
        await pool.query(`UPDATE vaccinations SET ${fields.join(', ')} WHERE id=?`, values);
        await logAudit(req, createAuditEntry(req, 'Update Vaccination', 'Vaccinations', `Updated vaccination ${req.params.id}`, req.body, old[0]));
        return success(res, null, 'Vaccination updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deleteVaccination = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM vaccinations WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Vaccination not found', 404);
        await pool.query('UPDATE vaccinations SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Delete Vaccination', 'Vaccinations', `Deleted vaccination ${req.params.id}`, {}, old[0]));
        return success(res, null, 'Vaccination deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getDiseases = async (req, res) => {
    try {
        const pag = getPagination(req);
        const ff = { ...pag.filters };
        delete ff.animal_id;
        delete ff.status;
        const { where, params } = buildWhereClause(ff, pag.search, []);
        let filters = '';
        if (req.query.animal_id) {
            filters += ' AND d.animal_id = ?';
            params.push(req.query.animal_id);
        }
        if (req.query.status) {
            filters += ' AND d.status = ?';
            params.push(req.query.status);
        }
        const countQuery = `SELECT COUNT(*) as total FROM diseases d WHERE d.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `
      SELECT d.*, a.tag_number, a.name as animal_name
      FROM diseases d
      JOIN animals a ON d.animal_id = a.id
      WHERE d.deleted_at IS NULL ${where} ${filters}
      ORDER BY d.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createDisease = async (req, res) => {
    try {
        const { animal_id, disease_name, symptoms, severity, date, notes } = req.body;
        const [result] = await pool.query(`INSERT INTO diseases (animal_id, disease_name, symptoms, severity, date, notes) VALUES (?,?,?,?,?,?)`, [animal_id, disease_name, symptoms, severity, date, notes]);
        await logAudit(req, createAuditEntry(req, 'Create Disease', 'Diseases', `Disease ${disease_name} for animal ${animal_id}`, { animal_id, disease_name, severity }));
        return created(res, { id: result.insertId }, 'Disease record created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateDiseaseStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const [old] = await pool.query('SELECT * FROM diseases WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Disease record not found', 404);
        await pool.query('UPDATE diseases SET status = ? WHERE id = ?', [status, req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Update Disease Status', 'Diseases', `Updated disease ${req.params.id} status to ${status}`, req.body, old[0]));
        return success(res, null, 'Disease status updated');
    }
    catch (err) {
        return error(res, err.message);
    }
    ;
};
export const updateDisease = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM diseases WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Disease record not found', 404);
        const fields = [];
        const values = [];
        const allowed = ['animal_id', 'disease_name', 'symptoms', 'severity', 'date', 'status', 'notes'];
        for (const key of allowed)
            if (req.body[key] !== undefined) {
                fields.push(`${key}=?`);
                values.push(req.body[key]);
            }
        if (fields.length === 0)
            return error(res, 'No fields to update', 400);
        values.push(req.params.id);
        await pool.query(`UPDATE diseases SET ${fields.join(', ')} WHERE id=?`, values);
        await logAudit(req, createAuditEntry(req, 'Update Disease', 'Diseases', `Updated disease ${req.params.id}`, req.body, old[0]));
        return success(res, null, 'Disease updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deleteDisease = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM diseases WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Disease record not found', 404);
        await pool.query('UPDATE diseases SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Delete Disease', 'Diseases', `Deleted disease ${req.params.id}`, {}, old[0]));
        return success(res, null, 'Disease deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getTreatments = async (req, res) => {
    try {
        const pag = getPagination(req);
        const ff = { ...pag.filters };
        delete ff.animal_id;
        const { where, params } = buildWhereClause(ff, pag.search, []);
        let filters = '';
        if (req.query.animal_id) {
            filters += ' AND t.animal_id = ?';
            params.push(req.query.animal_id);
        }
        const countQuery = `SELECT COUNT(*) as total FROM treatments t WHERE t.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `
      SELECT t.*, a.tag_number, a.name as animal_name, d.disease_name
      FROM treatments t
      JOIN animals a ON t.animal_id = a.id
      LEFT JOIN diseases d ON t.disease_id = d.id
      WHERE t.deleted_at IS NULL ${where} ${filters}
      ORDER BY t.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createTreatment = async (req, res) => {
    try {
        const { animal_id, disease_id, medicine, treatment_description, treatment_date, dosage, duration, veterinarian, cost, notes } = req.body;
        const [result] = await pool.query(`INSERT INTO treatments (animal_id, disease_id, medicine, treatment_description, treatment_date, dosage, duration, veterinarian, cost, notes) VALUES (?,?,?,?,?,?,?,?,?,?)`, [animal_id, disease_id || null, medicine, treatment_description || null, treatment_date || null, dosage, duration, veterinarian, cost, notes]);
        await logAudit(req, createAuditEntry(req, 'Create Treatment', 'Treatments', `Treatment ${medicine} for animal ${animal_id}`, { animal_id, disease_id, medicine, dosage }));
        return created(res, { id: result.insertId }, 'Treatment created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateTreatment = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM treatments WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Treatment not found', 404);
        const fields = [];
        const values = [];
        const allowed = ['animal_id', 'disease_id', 'medicine', 'treatment_description', 'treatment_date', 'dosage', 'duration', 'veterinarian', 'cost', 'notes'];
        for (const key of allowed)
            if (req.body[key] !== undefined) {
                fields.push(`${key}=?`);
                values.push(req.body[key]);
            }
        if (fields.length === 0)
            return error(res, 'No fields to update', 400);
        values.push(req.params.id);
        await pool.query(`UPDATE treatments SET ${fields.join(', ')} WHERE id=?`, values);
        await logAudit(req, createAuditEntry(req, 'Update Treatment', 'Treatments', `Updated treatment ${req.params.id}`, req.body, old[0]));
        return success(res, null, 'Treatment updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deleteTreatment = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM treatments WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Treatment not found', 404);
        await pool.query('UPDATE treatments SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Delete Treatment', 'Treatments', `Deleted treatment ${req.params.id}`, {}, old[0]));
        return success(res, null, 'Treatment deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=healthController.js.map