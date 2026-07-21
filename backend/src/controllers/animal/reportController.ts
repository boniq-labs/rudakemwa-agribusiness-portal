import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, error } from '../../utils/response';

export const getAnimalReports = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date, animal_id } = req.query;
    const animalFilter = animal_id ? ' AND a.id = ?' : '';
    const animalParams: any[] = animal_id ? [animal_id] : [];
    const dateFilter = (field: string) => {
      let sql = '';
      const params: any[] = [];
      if (start_date) { sql += ` AND ${field} >= ?`; params.push(start_date); }
      if (end_date) { sql += ` AND ${field} <= ?`; params.push(end_date); }
      return { sql, params };
    };

    const [[{ total_animals }]]: any = await pool.query(
      "SELECT COUNT(*) as total_animals FROM animals WHERE deleted_at IS NULL AND status = 'active'"
    );

    const [[{ total_births }]]: any = await pool.query(
      `SELECT COUNT(*) as total_births FROM birth_records WHERE deleted_at IS NULL`
    );

    const [[{ total_vaccinations }]]: any = await pool.query(
      `SELECT COUNT(*) as total_vaccinations FROM vaccinations WHERE deleted_at IS NULL`
    );
    const [[{ total_diseases }]]: any = await pool.query(
      `SELECT COUNT(*) as total_diseases FROM diseases WHERE deleted_at IS NULL`
    );
    const [[{ total_treatments }]]: any = await pool.query(
      `SELECT COUNT(*) as total_treatments FROM treatments WHERE deleted_at IS NULL`
    );
    const [[{ total_weights }]]: any = await pool.query(
      `SELECT COUNT(*) as total_weights FROM weight_records WHERE deleted_at IS NULL`
    );
    const [[{ total_feedings }]]: any = await pool.query(
      `SELECT COUNT(*) as total_feedings FROM feeding_records WHERE deleted_at IS NULL`
    );
    const [[{ total_sales }]]: any = await pool.query(
      `SELECT COUNT(*) as total_sales FROM animal_sales WHERE deleted_at IS NULL`
    );
    const [[{ total_deaths }]]: any = await pool.query(
      `SELECT COUNT(*) as total_deaths FROM animal_deaths WHERE deleted_at IS NULL`
    );
    const [[{ sick_animals }]]: any = await pool.query(
      `SELECT COUNT(DISTINCT t.animal_id) as sick_animals FROM treatments t WHERE t.deleted_at IS NULL`
    );
    const [[{ total_pregnancies }]]: any = await pool.query(
      `SELECT COUNT(*) as total_pregnancies FROM pregnancies WHERE deleted_at IS NULL AND status = 'Pregnant'`
    );

    const d = dateFilter('br.birth_date');
    const [births]: any = await pool.query(
      `SELECT br.*, a.tag_number, a.name as offspring_name, m.tag_number as mother_tag
       FROM birth_records br
       LEFT JOIN animals a ON br.animal_id = a.id
       LEFT JOIN animals m ON br.mother_id = m.id
       WHERE br.deleted_at IS NULL ${d.sql} ORDER BY br.birth_date DESC LIMIT 20`,
      d.params
    );

    const dv = dateFilter('v.date');
    const [vaccinations]: any = await pool.query(
      `SELECT v.*, a.tag_number, a.name as animal_name
       FROM vaccinations v JOIN animals a ON v.animal_id = a.id
       WHERE v.deleted_at IS NULL ${dv.sql} ORDER BY v.date DESC LIMIT 20`,
      dv.params
    );

    const dd = dateFilter('d.date');
    const [diseases]: any = await pool.query(
      `SELECT d.*, a.tag_number, a.name as animal_name
       FROM diseases d JOIN animals a ON d.animal_id = a.id
       WHERE d.deleted_at IS NULL ${dd.sql} ORDER BY d.date DESC LIMIT 20`,
      dd.params
    );

    const dt = dateFilter('t.treatment_date');
    const [treatments]: any = await pool.query(
      `SELECT t.*, a.tag_number, a.name as animal_name, dis.disease_name
       FROM treatments t
       JOIN animals a ON t.animal_id = a.id
       LEFT JOIN diseases dis ON t.disease_id = dis.id
       WHERE t.deleted_at IS NULL ${dt.sql} ORDER BY t.created_at DESC LIMIT 20`,
      dt.params
    );

    const dw = dateFilter('w.date');
    const [weights]: any = await pool.query(
      `SELECT w.*, a.tag_number, a.name as animal_name
       FROM weight_records w JOIN animals a ON w.animal_id = a.id
       WHERE w.deleted_at IS NULL ${dw.sql} ORDER BY w.date DESC LIMIT 20`,
      dw.params
    );

    const [feedings]: any = await pool.query(
      `SELECT f.*, a.tag_number, a.name as animal_name
       FROM feeding_records f JOIN animals a ON f.animal_id = a.id
       WHERE f.deleted_at IS NULL ORDER BY f.created_at DESC LIMIT 20`
    );

    const [sales]: any = await pool.query(
      `SELECT s.*, a.tag_number, a.name as animal_name
       FROM animal_sales s JOIN animals a ON s.animal_id = a.id
       WHERE s.deleted_at IS NULL ORDER BY s.created_at DESC LIMIT 20`
    );

    const [deaths]: any = await pool.query(
      `SELECT d.*, a.tag_number, a.name as animal_name
       FROM animal_deaths d JOIN animals a ON d.animal_id = a.id
       WHERE d.deleted_at IS NULL ORDER BY d.created_at DESC LIMIT 20`
    );

    return success(res, {
      total_animals, total_births, total_vaccinations, total_diseases,
      total_treatments, total_weights, total_feedings, total_sales,
      total_deaths, total_pregnancies,
      births, vaccinations, diseases, treatments, weights, feedings, sales, deaths,
    });
  } catch (err: any) { return error(res, err.message); }
};
