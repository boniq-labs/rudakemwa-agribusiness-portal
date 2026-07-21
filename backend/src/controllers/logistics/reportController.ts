import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, error } from '../../utils/response';

export const getLogisticsReports = async (req: AuthRequest, res: Response) => {
  try {
    const dateFrom = (req.query.date_from as string) || '';
    const dateTo = (req.query.date_to as string) || '';
    let dateFilter = '';
    const params: any[] = [];
    if (dateFrom && dateTo) { dateFilter = ' WHERE t.start_time BETWEEN ? AND ?'; params.push(dateFrom, dateTo); }

    const [[{ total_trips }]]: any = await pool.query(`SELECT COUNT(*) as total_trips FROM trips t WHERE t.deleted_at IS NULL${dateFilter}`, params);
    const [[{ completed_trips }]]: any = await pool.query(`SELECT COUNT(*) as completed_trips FROM trips t WHERE t.status='completed' AND t.deleted_at IS NULL${dateFilter.replace('t.start_time','t.start_time')}`, params.length ? params : []);
    const [[{ in_progress_trips }]]: any = await pool.query("SELECT COUNT(*) as in_progress_trips FROM trips WHERE status='in_progress' AND deleted_at IS NULL");
    const [[{ scheduled_trips }]]: any = await pool.query("SELECT COUNT(*) as scheduled_trips FROM trips WHERE status='scheduled' AND deleted_at IS NULL");

    const fuelDateFilter = dateFrom && dateTo ? ' WHERE date BETWEEN ? AND ?' : '';
    const fuelParams = dateFrom && dateTo ? [dateFrom, dateTo] : [];
    const [[{ fuel_consumption }]]: any = await pool.query(`SELECT COALESCE(SUM(quantity),0) as fuel_consumption FROM fuel_records${fuelDateFilter}`, fuelParams);
    const [[{ fuel_cost }]]: any = await pool.query(`SELECT COALESCE(SUM(cost),0) as fuel_cost FROM fuel_records${fuelDateFilter}`, fuelParams);
    const [[{ fuel_records }]]: any = await pool.query(`SELECT COUNT(*) as fuel_records FROM fuel_records${fuelDateFilter}`, fuelParams);

    const delDateFilter = dateFrom && dateTo ? ` WHERE delivery_date BETWEEN ? AND ?` : '';
    const delParams = dateFrom && dateTo ? [dateFrom, dateTo] : [];
    const [[{ delivered }]]: any = await pool.query(`SELECT COUNT(*) as delivered FROM deliveries WHERE status='delivered'${delDateFilter}`, delParams);
    const [[{ failed_deliveries }]]: any = await pool.query(`SELECT COUNT(*) as failed_deliveries FROM deliveries WHERE status='failed'${delDateFilter}`, delParams);
    const [[{ pending_deliveries }]]: any = await pool.query(`SELECT COUNT(*) as pending_deliveries FROM deliveries WHERE status='pending'${delDateFilter}`, delParams);

    const [vehicleStatusRows]: any = await pool.query("SELECT status as name, COUNT(*) as value FROM vehicles WHERE deleted_at IS NULL GROUP BY status");
    const vehicle_status = vehicleStatusRows.length ? vehicleStatusRows : [];

    return success(res, {
      total_trips, completed_trips, in_progress_trips, scheduled_trips,
      fuel_consumption, fuel_cost, fuel_records,
      delivered, failed_deliveries, pending_deliveries,
      vehicle_status,
    });
  } catch (err: any) { return error(res, err.message); }
};
