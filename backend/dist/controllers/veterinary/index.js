import pool from '../../config/database';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';
// ========== HEALTH RECORDS ==========
export const getVeterinaryHealth = async (req, res) => {
    try {
        const pag = getPagination(req);
        const { where, params } = buildWhereClause(pag.filters, pag.search, []);
        let filters = '';
        if (req.query.animal_id) {
            filters += ' AND hr.animal_id = ?';
            params.push(req.query.animal_id);
        }
        const countQuery = `SELECT COUNT(*) as total FROM animal_health_records hr WHERE hr.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `SELECT hr.*, a.tag_number, a.name as animal_name FROM animal_health_records hr JOIN animals a ON hr.animal_id = a.id WHERE hr.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createVeterinaryHealth = async (req, res) => {
    try {
        const b = req.body;
        const checkup_date = b.date || b.checkup_date || b.record_date || new Date().toISOString().split('T')[0];
        const diagnosis = b.diagnosis || '';
        const notes = [b.symptoms ? `Symptoms: ${b.symptoms}` : '', b.notes || ''].filter(Boolean).join('\n') || null;
        const [result] = await pool.query('INSERT INTO animal_health_records (animal_id, checkup_date, diagnosis, prescription, notes, status) VALUES (?,?,?,?,?,?)', [b.animal_id, checkup_date, diagnosis, b.treatment || null, notes, b.status || 'open']);
        await logAudit(req, createAuditEntry(req, 'Create Health Record', 'HealthRecords', `Health record for animal ${b.animal_id}`));
        return created(res, { id: result.insertId }, 'Health record created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateVeterinaryHealth = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM animal_health_records WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Health record not found', 404);
        const b = req.body;
        const checkup_date = b.date || b.checkup_date || b.record_date || old[0].checkup_date;
        const diagnosis = b.diagnosis || old[0].diagnosis || '';
        const notes = [b.symptoms ? `Symptoms: ${b.symptoms}` : '', b.notes || ''].filter(Boolean).join('\n') || old[0].notes;
        await pool.query('UPDATE animal_health_records SET animal_id=?, checkup_date=?, diagnosis=?, prescription=?, notes=?, status=? WHERE id=?', [b.animal_id || old[0].animal_id, checkup_date, diagnosis, b.treatment || old[0].prescription, notes, b.status || old[0].status, req.params.id]);
        return success(res, null, 'Health record updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deleteVeterinaryHealth = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM animal_health_records WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Health record not found', 404);
        await pool.query('UPDATE animal_health_records SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        return success(res, null, 'Health record deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
// ========== VACCINATION SCHEDULE ==========
export const getVaccinationSchedule = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vaccination_schedule ORDER BY vaccine_name');
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createVaccinationSchedule = async (req, res) => {
    try {
        const { vaccine_name, description, frequency_days, animal_category_id } = req.body;
        const [result] = await pool.query('INSERT INTO vaccination_schedule (vaccine_name, description, frequency_days, animal_category_id) VALUES (?,?,?,?)', [vaccine_name, description, frequency_days, animal_category_id]);
        return created(res, { id: result.insertId }, 'Vaccination schedule created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
// ========== VACCINATION RECORDS ==========
export const getVetVaccinations = async (req, res) => {
    try {
        const pag = getPagination(req);
        const { where, params } = buildWhereClause(pag.filters, pag.search, []);
        let filters = '';
        if (req.query.animal_id) {
            filters += ' AND vr.animal_id = ?';
            params.push(req.query.animal_id);
        }
        const countQuery = `SELECT COUNT(*) as total FROM vaccination_records vr WHERE vr.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `SELECT vr.*, a.tag_number, a.name as animal_name FROM vaccination_records vr JOIN animals a ON vr.animal_id = a.id WHERE vr.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createVetVaccination = async (req, res) => {
    try {
        const b = req.body;
        const vaccine_name = b.vaccine_name || b.vaccine || '';
        const veterinarian = b.veterinarian || b.administered_by || null;
        const [result] = await pool.query('INSERT INTO vaccination_records (animal_id, vaccination_date, next_due_date, veterinarian, batch_number, cost, notes) VALUES (?,?,?,?,?,?,?)', [b.animal_id, b.vaccination_date, b.next_due_date || null, veterinarian, b.batch_number || null, b.cost || null, b.notes || null]);
        return created(res, { id: result.insertId }, 'Vaccination record created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateVetVaccination = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM vaccination_records WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Vaccination record not found', 404);
        const b = req.body;
        const veterinarian = b.veterinarian || b.administered_by || old[0].veterinarian;
        await pool.query('UPDATE vaccination_records SET animal_id=?, vaccination_date=?, next_due_date=?, veterinarian=?, batch_number=?, cost=?, notes=? WHERE id=?', [b.animal_id || old[0].animal_id, b.vaccination_date || old[0].vaccination_date, b.next_due_date ?? old[0].next_due_date, veterinarian, b.batch_number ?? old[0].batch_number, b.cost ?? old[0].cost, b.notes ?? old[0].notes, req.params.id]);
        return success(res, null, 'Vaccination record updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deleteVetVaccination = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM vaccination_records WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Vaccination record not found', 404);
        await pool.query('UPDATE vaccination_records SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        return success(res, null, 'Vaccination record deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getDueVaccinations = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT vr.*, a.tag_number, a.name as animal_name FROM vaccination_records vr JOIN animals a ON vr.animal_id = a.id WHERE vr.next_due_date IS NOT NULL AND vr.next_due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) ORDER BY vr.next_due_date');
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
// ========== PRESCRIPTIONS ==========
export const getPrescriptions = async (req, res) => {
    try {
        const pag = getPagination(req);
        const { where, params } = buildWhereClause(pag.filters, pag.search, []);
        let filters = '';
        if (req.query.animal_id) {
            filters += ' AND p.animal_id = ?';
            params.push(req.query.animal_id);
        }
        const countQuery = `SELECT COUNT(*) as total FROM prescriptions p WHERE p.deleted_at IS NULL ${where} ${filters}`;
        const [[{ total }]] = await pool.query(countQuery, params);
        const dataQuery = `SELECT p.*, a.tag_number, a.name as animal_name FROM prescriptions p JOIN animals a ON p.animal_id = a.id WHERE p.deleted_at IS NULL ${where} ${filters} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);
        return paginated(res, rows, total, pag.page, pag.limit);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createPrescription = async (req, res) => {
    try {
        const b = req.body;
        const medicine = b.medicine || b.medication || '';
        const [result] = await pool.query('INSERT INTO prescriptions (animal_id, medicine, dosage, duration, frequency, start_date, end_date, veterinarian, notes) VALUES (?,?,?,?,?,?,?,?,?)', [b.animal_id, medicine, b.dosage || null, b.duration || null, b.frequency || null, b.start_date || null, b.end_date || null, b.veterinarian || null, b.notes || null]);
        return created(res, { id: result.insertId }, 'Prescription created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updatePrescription = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM prescriptions WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Prescription not found', 404);
        const b = req.body;
        const medicine = b.medicine || b.medication || old[0].medicine;
        await pool.query('UPDATE prescriptions SET animal_id=?, medicine=?, dosage=?, duration=?, frequency=?, start_date=?, end_date=?, veterinarian=?, notes=? WHERE id=?', [b.animal_id || old[0].animal_id, medicine, b.dosage ?? old[0].dosage, b.duration ?? old[0].duration, b.frequency ?? old[0].frequency, b.start_date ?? old[0].start_date, b.end_date ?? old[0].end_date, b.veterinarian ?? old[0].veterinarian, b.notes ?? old[0].notes, req.params.id]);
        return success(res, null, 'Prescription updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const deletePrescription = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM prescriptions WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Prescription not found', 404);
        await pool.query('UPDATE prescriptions SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        return success(res, null, 'Prescription deleted');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=index.js.map