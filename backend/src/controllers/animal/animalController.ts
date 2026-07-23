import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';

export const getAnimalCategories = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const { where, params } = buildWhereClause(pag.filters, pag.search, ['name']);

    const countQuery = `SELECT COUNT(*) as total FROM animal_categories WHERE deleted_at IS NULL ${where}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `SELECT * FROM animal_categories WHERE deleted_at IS NULL ${where} ORDER BY ${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createAnimalCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    const [existing]: any = await pool.query('SELECT id FROM animal_categories WHERE name = ?', [name]);
    if (existing.length > 0) return error(res, 'Category already exists', 400);

    const [result]: any = await pool.query(
      'INSERT INTO animal_categories (name, description) VALUES (?,?)',
      [name, description]
    );

    await logAudit(req, createAuditEntry(req, 'Create Animal Category', 'AnimalCategories', `Created category ${name}`, { name, description }));
    return created(res, { id: result.insertId }, 'Category created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateAnimalCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    const [old]: any = await pool.query('SELECT * FROM animal_categories WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Category not found', 404);

    await pool.query(
      'UPDATE animal_categories SET name=?, description=? WHERE id=?',
      [name, description, req.params.id]
    );

    await logAudit(req, createAuditEntry(req, 'Update Animal Category', 'AnimalCategories', `Updated category ${name}`, req.body, old[0]));
    return success(res, null, 'Category updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteAnimalCategory = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM animal_categories WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Category not found', 404);
    await pool.query('UPDATE animal_categories SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Animal Category', 'AnimalCategories', `Deleted category ${old[0].name}`, {}, old[0]));
    return success(res, null, 'Category deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getBreeds = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.category_id;
    const { where, params } = buildWhereClause(ff, pag.search, ['name']);

    let filterQuery = '';
    if (req.query.category_id) {
      filterQuery = ' AND category_id = ?';
      params.push(req.query.category_id);
    }

    const countQuery = `SELECT COUNT(*) as total FROM breeds WHERE deleted_at IS NULL ${where} ${filterQuery}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `SELECT b.*, ac.name as category_name FROM breeds b JOIN animal_categories ac ON b.category_id = ac.id WHERE b.deleted_at IS NULL ${where} ${filterQuery} ORDER BY b.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const createBreed = async (req: AuthRequest, res: Response) => {
  try {
    const { category_id, name, description } = req.body;

    const [result]: any = await pool.query(
      'INSERT INTO breeds (category_id, name, description) VALUES (?,?,?)',
      [category_id, name, description]
    );

    await logAudit(req, createAuditEntry(req, 'Create Breed', 'Breeds', `Created breed ${name}`, { category_id, name, description }));
    return created(res, { id: result.insertId }, 'Breed created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateBreed = async (req: AuthRequest, res: Response) => {
  try {
    const { category_id, name, description } = req.body;

    const [old]: any = await pool.query('SELECT * FROM breeds WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Breed not found', 404);

    await pool.query(
      'UPDATE breeds SET category_id=?, name=?, description=? WHERE id=?',
      [category_id, name, description, req.params.id]
    );

    await logAudit(req, createAuditEntry(req, 'Update Breed', 'Breeds', `Updated breed ${name}`, req.body, old[0]));
    return success(res, null, 'Breed updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteBreed = async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE breeds SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await logAudit(req, createAuditEntry(req, 'Delete Breed', 'Breeds', `Breed ${req.params.id} deleted`));
    return success(res, null, 'Breed deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getAnimals = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.category_id; delete ff.breed_id; delete ff.status; delete ff.gender; delete ff.is_dairy;
    const { where, params } = buildWhereClause(ff, pag.search, ['a.tag_number', 'a.name']);

    let filters = '';
    if (req.query.category_id) { filters += ' AND a.animal_category_id = ?'; params.push(req.query.category_id); }
    if (req.query.breed_id) { filters += ' AND a.breed_id = ?'; params.push(req.query.breed_id); }
    if (req.query.status) { filters += ' AND a.status = ?'; params.push(req.query.status); }
    if (req.query.gender) { filters += ' AND a.gender = ?'; params.push(req.query.gender); }
    if (req.query.is_dairy) { filters += ' AND a.is_dairy = ?'; params.push(req.query.is_dairy); }

    const countQuery = `SELECT COUNT(*) as total FROM animals a WHERE a.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT a.*, ac.name as category_name, b.name as breed_name, l.name as location_name
      FROM animals a
      JOIN animal_categories ac ON a.animal_category_id = ac.id
      LEFT JOIN breeds b ON a.breed_id = b.id
      LEFT JOIN animal_locations l ON a.location_id = l.id
      WHERE a.deleted_at IS NULL ${where} ${filters}
      ORDER BY a.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    return paginated(res, rows, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

export const getAnimalProfile = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT a.*, ac.name as category_name, b.name as breed_name, l.name as location_name,
              (SELECT weight FROM weight_records WHERE animal_id = a.id ORDER BY date DESC LIMIT 1) as latest_weight
       FROM animals a
       JOIN animal_categories ac ON a.animal_category_id = ac.id
       LEFT JOIN breeds b ON a.breed_id = b.id
       LEFT JOIN animal_locations l ON a.location_id = l.id
       WHERE a.id = ? AND a.deleted_at IS NULL`,
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Animal not found', 404);

    return success(res, rows[0]);
  } catch (err: any) { return error(res, err.message); }
};

export const createAnimal = async (req: AuthRequest, res: Response) => {
  try {
    const { tag_number, name, animal_category_id, breed_id, gender, color, date_of_birth, weight, height, source, purchase_price, is_dairy, location_id, group_id, photo, feed_type, animal_status } = req.body;

    const [existing]: any = await pool.query('SELECT id FROM animals WHERE tag_number = ?', [tag_number]);
    if (existing.length > 0) return error(res, 'Tag number already exists', 400);

    const [result]: any = await pool.query(
      `INSERT INTO animals (tag_number, name, animal_category_id, breed_id, gender, color, date_of_birth, weight, height, source, purchase_price, is_dairy, location_id, group_id, photo, feed_type, animal_status, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [tag_number, name, animal_category_id, breed_id || null, gender, color, date_of_birth, weight, height, source, purchase_price, is_dairy ?? false, location_id || null, group_id || null, photo || null, feed_type || null, animal_status || null, 'active']
    );

    await logAudit(req, createAuditEntry(req, 'Create Animal', 'Animals', `Created animal ${tag_number}`, { tag_number, name, animal_category_id, breed_id, gender }));
    return created(res, { id: result.insertId }, 'Animal created');
  } catch (err: any) { return error(res, err.message); }
};

export const updateAnimal = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM animals WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Animal not found', 404);

    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['name', 'animal_category_id', 'breed_id', 'gender', 'color', 'date_of_birth', 'weight', 'height', 'source', 'purchase_price', 'is_dairy', 'location_id', 'status', 'photo', 'feed_type', 'animal_status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key}=?`);
        values.push(req.body[key]);
      }
    }

    if (fields.length === 0) return error(res, 'No fields to update', 400);

    values.push(req.params.id);
    await pool.query(`UPDATE animals SET ${fields.join(', ')} WHERE id=?`, values);

    await logAudit(req, createAuditEntry(req, 'Update Animal', 'Animals', `Updated animal ${old[0].tag_number}`, req.body, old[0]));
    return success(res, null, 'Animal updated');
  } catch (err: any) { return error(res, err.message); }
};

export const deleteAnimal = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM animals WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Animal not found', 404);

    await pool.query('UPDATE animals SET deleted_at = NOW() WHERE id = ?', [req.params.id]);

    await logAudit(req, createAuditEntry(req, 'Delete Animal', 'Animals', `Deleted animal ${old[0].tag_number}`, null, old[0]));
    return success(res, null, 'Animal deleted');
  } catch (err: any) { return error(res, err.message); }
};

export const getAnimalsForSelect = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT a.id, a.tag_number, a.name, b.name as breed, a.gender, ac.name as species
       FROM animals a
       LEFT JOIN breeds b ON a.breed_id = b.id
       LEFT JOIN animal_categories ac ON a.animal_category_id = ac.id
       WHERE a.deleted_at IS NULL AND a.status NOT IN ('dead', 'sold')
       ORDER BY a.tag_number`
    );
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const getAnimalLocations = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT id, name, type, capacity FROM animal_locations');
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};

export const getAnimalGroups = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT id, name, description FROM animal_groups WHERE deleted_at IS NULL');
    return success(res, rows);
  } catch (err: any) { return error(res, err.message); }
};
