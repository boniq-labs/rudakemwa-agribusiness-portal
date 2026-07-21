import pool from '../../config/database';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
export const getHealthRecords = async (req, res) => {
    try {
        const { animal_id, startDate, endDate } = req.query;
        let where = 'WHERE 1=1';
        const params = [];
        if (animal_id) {
            where += ' AND hr.animal_id = ?';
            params.push(animal_id);
        }
        if (startDate) {
            where += ' AND hr.checkup_date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            where += ' AND hr.checkup_date <= ?';
            params.push(endDate);
        }
        const [rows] = await pool.query(`SELECT hr.*, a.name as animal_name, a.tag_number
       FROM health_records hr LEFT JOIN animals a ON hr.animal_id = a.id
       ${where} ORDER BY hr.checkup_date DESC`, params);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createHealthRecord = async (req, res) => {
    try {
        const { animal_id, checkup_date, diagnosis, prescription, notes } = req.body;
        const [result] = await pool.query(`INSERT INTO health_records (animal_id, checkup_date, diagnosis, prescription, notes) VALUES (?,?,?,?,?)`, [animal_id, checkup_date, diagnosis, prescription, notes]);
        await logAudit(req, createAuditEntry(req, 'Create Health Record', 'Veterinary', `Health record created for animal #${animal_id}`, req.body));
        return created(res, { id: result.insertId }, 'Health record created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getVaccinationSchedule = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vaccination_schedule ORDER BY due_days');
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createVaccinationSchedule = async (req, res) => {
    try {
        const { name, description, due_days, notes } = req.body;
        const [result] = await pool.query(`INSERT INTO vaccination_schedule (name, description, due_days, notes) VALUES (?,?,?,?)`, [name, description, due_days, notes]);
        await logAudit(req, createAuditEntry(req, 'Create Vaccination Schedule', 'Veterinary', `Vaccination schedule ${name} created`, req.body));
        return created(res, { id: result.insertId }, 'Vaccination schedule created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getVaccinationRecords = async (req, res) => {
    try {
        const { animal_id, due } = req.query;
        let where = 'WHERE 1=1';
        const params = [];
        if (animal_id) {
            where += ' AND vr.animal_id = ?';
            params.push(animal_id);
        }
        if (due === 'true') {
            where += ' AND vr.next_due_date <= CURDATE()';
        }
        const [rows] = await pool.query(`SELECT vr.*, a.name as animal_name, a.tag_number, vs.name as vaccine_name
       FROM vaccination_records vr
       LEFT JOIN animals a ON vr.animal_id = a.id
       LEFT JOIN vaccination_schedule vs ON vr.schedule_id = vs.id
       ${where} ORDER BY vr.vaccination_date DESC`, params);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createVaccinationRecord = async (req, res) => {
    try {
        const { animal_id, schedule_id, vaccination_date, next_due_date, batch_number, cost, notes } = req.body;
        const [result] = await pool.query(`INSERT INTO vaccination_records (animal_id, schedule_id, vaccination_date, next_due_date, batch_number, cost, notes) VALUES (?,?,?,?,?,?,?)`, [animal_id, schedule_id, vaccination_date, next_due_date, batch_number, cost, notes]);
        await logAudit(req, createAuditEntry(req, 'Create Vaccination Record', 'Veterinary', `Vaccination record created for animal #${animal_id}`, req.body));
        return created(res, { id: result.insertId }, 'Vaccination record created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getDueVaccinations = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT a.id as animal_id, a.name as animal_name, a.tag_number,
              vs.name as vaccine_name, vs.due_days,
              MAX(vr.next_due_date) as last_due_date
       FROM animals a
       CROSS JOIN vaccination_schedule vs
       LEFT JOIN vaccination_records vr ON a.id = vr.animal_id AND vs.id = vr.schedule_id
       WHERE a.deleted_at IS NULL
       GROUP BY a.id, vs.id
       HAVING last_due_date IS NULL OR last_due_date <= CURDATE()
       ORDER BY a.name`);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getTreatmentPrescriptions = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT tp.*, mi.name as medicine_name, mi.dosage_form
       FROM treatment_prescriptions tp
       LEFT JOIN medicine_items mi ON tp.medicine_item_id = mi.id
       WHERE tp.treatment_id = ?
       ORDER BY tp.created_at`, [req.params.treatment_id]);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createTreatmentPrescription = async (req, res) => {
    try {
        const { treatment_id, medicine_item_id, dosage, duration, notes } = req.body;
        const [result] = await pool.query(`INSERT INTO treatment_prescriptions (treatment_id, medicine_item_id, dosage, duration, notes) VALUES (?,?,?,?,?)`, [treatment_id, medicine_item_id, dosage, duration, notes]);
        await logAudit(req, createAuditEntry(req, 'Create Treatment Prescription', 'Veterinary', `Prescription created for treatment #${treatment_id}`, req.body));
        return created(res, { id: result.insertId }, 'Treatment prescription created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=healthController.js.map