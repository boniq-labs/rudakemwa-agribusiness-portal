import pool from '../../config/database';
import { success, created, error } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
export const getJobs = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `SELECT j.*, p.name as position_title FROM recruitment_jobs j LEFT JOIN positions p ON j.position_id = p.id WHERE 1=1`;
        const params = [];
        if (status) {
            query += ` AND j.status = ?`;
            params.push(status);
        }
        query += ` ORDER BY j.created_at DESC`;
        const [rows] = await pool.query(query, params);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createJob = async (req, res) => {
    try {
        const { title, position_id, description, requirements, closing_date, status } = req.body;
        // position_id is NOT NULL in DB; create a default position if not provided
        let posId = position_id || null;
        if (!posId && title) {
            // Check if a position with this title already exists
            const [existing] = await pool.query('SELECT id FROM positions WHERE name = ?', [title]);
            if (existing.length > 0) {
                posId = existing[0].id;
            }
            else {
                // Create a default position (department_id=1 = Management as fallback)
                const [newPos] = await pool.query('INSERT INTO positions (name, department_id, description) VALUES (?,?,?)', [title, 1, description || 'Auto-created for recruitment']);
                posId = newPos.insertId;
            }
        }
        const [result] = await pool.query(`INSERT INTO recruitment_jobs (title, position_id, description, requirements, closing_date, status)
       VALUES (?,?,?,?,?,?)`, [title, posId, description || null, requirements || null, closing_date || null, status || 'open']);
        await logAudit(req, createAuditEntry(req, 'Create Job', 'HR', `Created job ${title}`, req.body));
        return created(res, { id: result.insertId }, 'Job created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateJob = async (req, res) => {
    try {
        const { title, position_id, description, requirements, closing_date, status } = req.body;
        const [old] = await pool.query('SELECT * FROM recruitment_jobs WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Job not found', 404);
        let posId = position_id || old[0].position_id;
        if (!posId && title && title !== old[0].title) {
            const [existing] = await pool.query('SELECT id FROM positions WHERE name = ?', [title]);
            if (existing.length > 0) {
                posId = existing[0].id;
            }
            else {
                const [newPos] = await pool.query('INSERT INTO positions (name, department_id) VALUES (?,?)', [title, 1]);
                posId = newPos.insertId;
            }
        }
        await pool.query(`UPDATE recruitment_jobs SET title=?, position_id=?, description=?, requirements=?, closing_date=?, status=? WHERE id=?`, [title, posId || old[0].position_id, description || null, requirements || null, closing_date || null, status, req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Update Job', 'HR', `Updated job ${title}`, req.body, old[0]));
        return success(res, null, 'Job updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const closeJob = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM recruitment_jobs WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Job not found', 404);
        await pool.query('UPDATE recruitment_jobs SET status=? WHERE id=?', ['closed', req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Close Job', 'HR', `Closed job ${old[0].title}`));
        return success(res, null, 'Job closed');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const getApplicants = async (req, res) => {
    try {
        const { job_id } = req.query;
        let query = `SELECT a.*, j.title as job_title FROM applicants a JOIN recruitment_jobs j ON a.job_id = j.id WHERE 1=1`;
        const params = [];
        if (job_id) {
            query += ` AND a.job_id = ?`;
            params.push(job_id);
        }
        query += ` ORDER BY a.created_at DESC`;
        const [rows] = await pool.query(query, params);
        return success(res, rows);
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const createApplicant = async (req, res) => {
    try {
        const { job_id, first_name, last_name, email, phone, resume_url, cover_letter } = req.body;
        const [result] = await pool.query(`INSERT INTO applicants (job_id, first_name, last_name, email, phone, resume_url, cover_letter, status)
       VALUES (?,?,?,?,?,?,?,'new')`, [job_id, first_name, last_name, email, phone || null, resume_url || null, cover_letter || null]);
        await logAudit(req, createAuditEntry(req, 'Create Applicant', 'HR', `Applicant ${first_name} ${last_name} applied for job ${job_id}`));
        return created(res, { id: result.insertId }, 'Applicant created');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const updateApplicantStatus = async (req, res) => {
    try {
        const { status, interview_date, interview_notes } = req.body;
        const [old] = await pool.query('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
        if (old.length === 0)
            return error(res, 'Applicant not found', 404);
        await pool.query(`UPDATE applicants SET status=?, interview_date=?, interview_notes=? WHERE id=?`, [status, interview_date || null, interview_notes || null, req.params.id]);
        await logAudit(req, createAuditEntry(req, 'Update Applicant Status', 'HR', `Updated applicant ${req.params.id} status to ${status}`, req.body, old[0]));
        return success(res, null, 'Applicant status updated');
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=recruitmentController.js.map