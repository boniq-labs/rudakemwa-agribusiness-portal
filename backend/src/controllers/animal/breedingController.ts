import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';
import { createNotification } from '../notificationController';

export const getBreedingRecords = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.animal_id; delete ff.status;
    const { where, params } = buildWhereClause(ff, pag.search, []);

    let filters = '';
    if (req.query.animal_id) { filters += ' AND (mother_id = ? OR father_id = ?)'; params.push(req.query.animal_id, req.query.animal_id); }
    if (req.query.status) { filters += ' AND br.status = ?'; params.push(req.query.status); }

    const countQuery = `SELECT COUNT(*) as total FROM breeding_records br WHERE br.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT br.*, m.tag_number as mother_tag, m.name as mother_name, f.tag_number as father_tag, f.name as father_name
      FROM breeding_records br
      LEFT JOIN animals m ON br.mother_id = m.id
      LEFT JOIN animals f ON br.father_id = f.id
      WHERE br.deleted_at IS NULL ${where} ${filters}
      ORDER BY br.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createBreedingRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { mother_id, father_id, breeding_date, method, notes } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO breeding_records (mother_id, father_id, breeding_date, method, notes) VALUES (?,?,?,?,?)`,
      [mother_id, father_id || null, breeding_date || null, method, notes]
    );

    await logAudit(req, createAuditEntry(req, 'Create Breeding Record', 'BreedingRecords', `Created breeding record`, { mother_id, father_id, breeding_date, method }));
    return created(res, { id: result.insertId }, 'Breeding record created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateBreedingRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM breeding_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Breeding record not found', 404);

    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['mother_id', 'father_id', 'breeding_date', 'method', 'result', 'notes'];
    const dateFields = new Set(['breeding_date']);
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key}=?`);
        const val = req.body[key];
        values.push(key === 'father_id' && !val ? null : dateFields.has(key) && val === '' ? null : val);
      }
    }

    if (fields.length === 0) return error(res, 'No fields to update', 400);

    values.push(req.params.id);
    await pool.query(`UPDATE breeding_records SET ${fields.join(', ')} WHERE id=?`, values);

    await logAudit(req, createAuditEntry(req, 'Update Breeding Record', 'BreedingRecords', `Updated breeding record ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Breeding record updated');
  } catch (err: any) { return error(res, err.message); }
};

export const getPregnancies = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.animal_id; delete ff.status;
    const { where, params } = buildWhereClause(ff, pag.search, []);

    let filters = '';
    if (req.query.animal_id) { filters += ' AND p.animal_id = ?'; params.push(req.query.animal_id); }
    if (req.query.status) { filters += ' AND p.status = ?'; params.push(req.query.status); }

    const countQuery = `SELECT COUNT(*) as total FROM pregnancies p WHERE p.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT p.*, a.tag_number, a.name as animal_name, br.breeding_date
      FROM pregnancies p
      JOIN animals a ON p.animal_id = a.id
      LEFT JOIN breeding_records br ON p.breeding_record_id = br.id
      WHERE p.deleted_at IS NULL ${where} ${filters}
      ORDER BY p.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createPregnancy = async (req: AuthRequest, res: Response) => {
  try {
    const { animal_id, breeding_record_id, pregnancy_date, expected_delivery_date, sire_name, status, notes } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO pregnancies (animal_id, breeding_record_id, pregnancy_date, expected_delivery_date, sire_name, status, notes) VALUES (?,?,?,?,?,?,?)`,
      [animal_id, breeding_record_id || null, pregnancy_date || null, expected_delivery_date || null, sire_name || null, status || 'Pregnant', notes || null]
    );

    if (breeding_record_id) {
      await pool.query('UPDATE breeding_records SET status = ? WHERE id = ?', ['confirmed', breeding_record_id]);
    }

    await logAudit(req, createAuditEntry(req, 'Create Pregnancy', 'Pregnancies', `Created pregnancy for animal ${animal_id}`, { animal_id, breeding_record_id, pregnancy_date, expected_delivery_date }));
    return created(res, { id: result.insertId }, 'Pregnancy created');
  } catch (err: any) { return error(res, err.message); }
};

export const updatePregnancy = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM pregnancies WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Pregnancy not found', 404);

    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['animal_id', 'pregnancy_date', 'expected_delivery_date', 'sire_name', 'status', 'notes'];
    const dateFields = new Set(['pregnancy_date', 'expected_delivery_date']);
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key}=?`);
        values.push(dateFields.has(key) && req.body[key] === '' ? null : req.body[key]);
      }
    }

    if (fields.length === 0) return error(res, 'No fields to update', 400);

    values.push(req.params.id);
    await pool.query(`UPDATE pregnancies SET ${fields.join(', ')} WHERE id=?`, values);

    await logAudit(req, createAuditEntry(req, 'Update Pregnancy', 'Pregnancies', `Updated pregnancy ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Pregnancy updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deletePregnancy = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM pregnancies WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Pregnancy not found', 404);

    await pool.query('UPDATE pregnancies SET deleted_at = NOW() WHERE id = ?', [req.params.id]);

    await logAudit(req, createAuditEntry(req, 'Delete Pregnancy', 'Pregnancies', `Deleted pregnancy ${req.params.id}`, {}, old[0]));
    return success(res, null, 'Pregnancy deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteBreedingRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM breeding_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Breeding record not found', 404);
    await pool.query('UPDATE breeding_records SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Breeding Record', 'BreedingRecords', `Deleted breeding record ${req.params.id}`, {}, old[0]));
    return success(res, null, 'Breeding record deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getBirthRecords = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.mother_id; delete ff.start_date; delete ff.end_date;
    const { where, params } = buildWhereClause(ff, pag.search, []);

    let filters = '';
    if (req.query.mother_id) { filters += ' AND br.mother_id = ?'; params.push(req.query.mother_id); }
    if (req.query.start_date) { filters += ' AND br.birth_date >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { filters += ' AND br.birth_date <= ?'; params.push(req.query.end_date); }

    const countQuery = `SELECT COUNT(*) as total FROM birth_records br WHERE br.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT br.*, m.tag_number as mother_tag, m.name as mother_name, f.tag_number as father_tag, f.name as father_name,
             a.id as animal_id, a.tag_number, a.name, a.color, a.animal_category_id as category_id,
             ac.name as category_name, br.animal_name as child_name
      FROM birth_records br
      LEFT JOIN animals m ON br.mother_id = m.id
      LEFT JOIN animals f ON br.father_id = f.id
      LEFT JOIN animals a ON br.animal_id = a.id
      LEFT JOIN animal_categories ac ON a.animal_category_id = ac.id
      WHERE br.deleted_at IS NULL ${where} ${filters}
      ORDER BY br.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createBirthRecord = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { mother_id, birth_date, weight, health_status, notes, photo, animal_name, tag_number, type, color, category_id } = req.body;

    const [mother]: any = await connection.query('SELECT tag_number, animal_category_id FROM animals WHERE id = ?', [mother_id]);
    const motherTag = mother[0]?.tag_number || 'UNKNOWN';
    const catId = category_id || mother[0]?.animal_category_id || null;

    const tagNum = tag_number || `${motherTag}-B${Date.now().toString().slice(-4)}`;
    const MALE_TYPES = ['Bull', 'Male', 'Boar', 'Ram', 'Buck', 'Stallion', 'Rooster', 'Tom', 'Jack'];
    const gender = MALE_TYPES.includes(type) ? 'male' : 'female';

    const [animalResult]: any = await connection.query(
      `INSERT INTO animals (tag_number, name, animal_category_id, gender, date_of_birth, weight, color, status, source, photo)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [tagNum, animal_name || `Offspring of ${motherTag}`, catId, gender, birth_date || null, weight, color || null, 'active', 'born', photo || null]
    );

    const animalId = animalResult.insertId;

    const [result]: any = await connection.query(
      `INSERT INTO birth_records (mother_id, animal_id, birth_date, gender, weight, health_status, notes, photo, tag_number, animal_name, type) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [mother_id, animalId, birth_date || null, gender, weight, health_status, notes || null, photo || null, tagNum, animal_name || null, type || null]
    );

    await connection.query("UPDATE pregnancies SET status = 'Delivered' WHERE animal_id = ? AND status = 'Pregnant'", [mother_id]);

    await connection.commit();

    await logAudit(req, createAuditEntry(req, 'Create Birth Record', 'BirthRecords', `Birth recorded for ${motherTag}`, { mother_id, birth_date, gender, weight, tag_number: tagNum }));
    try { await createNotification(req.user!.id, 'success', 'Birth Recorded', `New birth: ${animal_name || tagNum} from ${motherTag}`); } catch {}
    return created(res, { id: result.insertId, animalId }, 'Birth record created');
  } catch (err: any) {
    await connection.rollback();
    return error(res, err.message);
  } finally {
    connection.release();
  }
};

export const updateBirthRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM birth_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Birth record not found', 404);
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['mother_id', 'birth_date', 'gender', 'weight', 'health_status', 'notes', 'tag_number', 'animal_name', 'type', 'photo', 'color', 'animal_id'];
    const dateFields = new Set(['birth_date']);
    for (const key of allowed)
      if (req.body[key] !== undefined) { fields.push(`${key}=?`); values.push(dateFields.has(key) && req.body[key] === '' ? null : req.body[key]); }
    if (fields.length === 0) return error(res, 'No fields to update', 400);
    values.push(req.params.id);
    await pool.query(`UPDATE birth_records SET ${fields.join(', ')} WHERE id=?`, values);
    await logAudit(req, createAuditEntry(req, 'Update Birth Record', 'BirthRecords', `Updated birth record ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Birth record updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteBirthRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM birth_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Birth record not found', 404);
    await pool.query('UPDATE birth_records SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Birth Record', 'BirthRecords', `Deleted birth record ${req.params.id}`, {}, old[0]));
    return success(res, null, 'Birth record deleted');
  } catch (err: any) { return error(res, err.message); }
};
