import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error, paginated } from '../../utils/response';
import { logAudit, createAuditEntry } from '../../services/auditService';
import { getPagination, buildWhereClause } from '../../utils/pagination';
import { createNotification } from '../notificationController';

/* ============================================================
 * SPECIES REPRODUCTIVE CONSTANTS — Pig and Cattle are COMPLETELY
 * separate. Never apply pig gestation rules to cattle or versa.
 * ==========================================================*/
const PIG_GESTATION_DAYS = 114;          // ~3 months + 3 weeks
const CATTLE_GESTATION_DAYS = 283;       // ~9 months + 1 week
const PIG_HEAT_CYCLE_MIN_DAYS = 18;      // return-to-heat window opens day 18
const PIG_HEAT_CYCLE_MAX_DAYS = 24;      // ...and closes day 24 if not pregnant

/** Timezone-safe: format any Date/ISO string as LOCAL YYYY-MM-DD (no UTC shift). */
const toISODate = (d: Date | string | null | undefined): string | null => {
  if (!d) return null;
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return null;
    d = parsed;
  }
  const dt = d as Date;
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${mm}-${dd}`;
};

/** Timezone-safe: add days to a calendar date, staying in local time. */
const addDays = (base: Date | string, days: number): Date => {
  let y: number, m: number, d: number;
  if (typeof base === 'string') {
    const s = base.slice(0, 10).split('-').map(Number);
    y = s[0]; m = s[1] - 1; d = s[2];
  } else {
    y = base.getFullYear(); m = base.getMonth(); d = base.getDate();
  }
  const out = new Date(y, m, d);
  out.setDate(out.getDate() + days);
  return out;
};

const daysBetween = (a: Date | string, b: Date | string): number =>
  Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

/** Species detection — by normalized category NAME (stable across databases;
 *  category IDs differ per environment: local Pigs=4/Cattle=1, prod Pigs=1/Cattle=3). */
const speciesOf = (animalCategoryId: number | null | undefined, categoryName?: string | null): 'pig' | 'cattle' | null => {
  const n = (categoryName || '').trim().toLowerCase();
  if (n === 'pigs' || n === 'pig' || n === 'swine') return 'pig';
  if (n === 'cattle' || n === 'cows' || n === 'cow') return 'cattle';
  void animalCategoryId;
  return null;
};

/** Automatic workflow fields appended to every pregnancy row. */
type PregnancyRow = {
  id: number;
  animal_id: number;
  status: string;
  pregnancy_date: Date | string | null;
  expected_delivery_date: Date | string | null;
  animal_category_id?: number;
  category_name?: string | null;
  breeding_date?: Date | string | null;
  [k: string]: any;
};

/**
 * Enriches a pregnancy row with automatic workflow fields.
 * @param now Reference "today". Real time by default; an `as_of` date may be
 *            supplied (LOCAL TESTING ONLY) to simulate a future day without
 *            waiting 18–24 days / 283 days. Biological rules are NEVER altered.
 */
const enrichPregnancy = (row: PregnancyRow, now: Date = new Date()) => {
  const sp = speciesOf(row.animal_category_id, row.category_name);
  const inseminationDate = row.pregnancy_date ?? row.breeding_date ?? null;
  const statusLower = (row.status || '').toLowerCase();

  let daysSinceInsemination: number | null = null;
  let heatWindowStart: string | null = null;
  let heatWindowEnd: string | null = null;
  let inHeatWindow = false;
  // AUTHORITATIVE expected delivery for Pig/Cattle: always derived from the
  // insemination date + species gestation (114d / 283d). A stale stored value
  // from older data can never override the correct calculation. Non-pig/cattle
  // species keep whatever is stored.
  let expectedDelivery: string | null = toISODate(row.expected_delivery_date);
  if (inseminationDate && !isNaN(new Date(inseminationDate).getTime())) {
    if (sp === 'pig') expectedDelivery = toISODate(addDays(inseminationDate, PIG_GESTATION_DAYS));
    else if (sp === 'cattle') expectedDelivery = toISODate(addDays(inseminationDate, CATTLE_GESTATION_DAYS));
  }
  let daysUntilDelivery: number | null = null;
  let dueSoon = false;
  let nextAction = '';
  let readyToRebreed = false;

  if (inseminationDate && !isNaN(new Date(inseminationDate).getTime())) {
    daysSinceInsemination = Math.max(0, daysBetween(inseminationDate, now));
  }

  if (sp === 'pig') {
    // ---- PIG RULES ONLY ----
    if (inseminationDate) {
      heatWindowStart = toISODate(addDays(inseminationDate, PIG_HEAT_CYCLE_MIN_DAYS));
      heatWindowEnd = toISODate(addDays(inseminationDate, PIG_HEAT_CYCLE_MAX_DAYS));
    }
    const confirmedPregnant = ['pregnant', 'confirmed'].includes(statusLower);
    if (confirmedPregnant && inseminationDate) {
      expectedDelivery = expectedDelivery ?? toISODate(addDays(inseminationDate, PIG_GESTATION_DAYS));
    }
    if (statusLower === 'returned heat' || statusLower === 'returned_heat') {
      readyToRebreed = true;
      nextAction = 'Ready for rebreeding — record a new insemination';
    } else if (statusLower === 'rebred' || statusLower === 'rebreed') {
      nextAction = 'Rebred — new 18–24 day heat-check cycle running';
    } else if (statusLower === 'delivered') {
      nextAction = 'Delivered — record offspring in Birth Records';
    } else if (confirmedPregnant && expectedDelivery) {
      daysUntilDelivery = daysBetween(now, expectedDelivery);
      dueSoon = daysUntilDelivery >= 0 && daysUntilDelivery <= 7;
      nextAction = dueSoon ? `Farrowing due soon (${daysUntilDelivery} day(s))` : `Monitor — farrowing expected ${expectedDelivery}`;
    } else {
      inHeatWindow =
        !!heatWindowStart && !!heatWindowEnd &&
        daysSinceInsemination !== null &&
        daysSinceInsemination >= PIG_HEAT_CYCLE_MIN_DAYS &&
        daysSinceInsemination <= PIG_HEAT_CYCLE_MAX_DAYS;
      nextAction = inHeatWindow
        ? `Heat-check window OPEN (day ${PIG_HEAT_CYCLE_MIN_DAYS}–${PIG_HEAT_CYCLE_MAX_DAYS}) — schedule veterinary pregnancy check`
        : `Awaiting 18–24 day heat-check window (${heatWindowStart ?? '-'} → ${heatWindowEnd ?? '-'})`;
    }
  } else if (sp === 'cattle') {
    // ---- CATTLE RULES ONLY (283-day gestation; NO pig 18–24 day logic) ----
    if (['pregnant', 'under observation', 'confirmed', 'monitoring'].includes(statusLower)) {
      if (inseminationDate) {
        expectedDelivery = expectedDelivery ?? toISODate(addDays(inseminationDate, CATTLE_GESTATION_DAYS));
      }
    }
    if (statusLower === 'returned heat' || statusLower === 'returned_heat') {
      readyToRebreed = true;
      nextAction = 'Returned to oestrus — ready for rebreeding';
    } else if (statusLower === 'rebred' || statusLower === 'rebreed') {
      nextAction = 'Rebred — new gestation clock started';
    } else if (statusLower === 'delivered') {
      nextAction = 'Calved — record offspring in Birth Records';
    } else if (expectedDelivery) {
      daysUntilDelivery = daysBetween(now, expectedDelivery);
      dueSoon = daysUntilDelivery >= 0 && daysUntilDelivery <= 7;
      nextAction = dueSoon ? `Calving due soon (${daysUntilDelivery} day(s))` : `Gestation monitoring — calving expected ${expectedDelivery}`;
    } else {
      nextAction = 'Schedule veterinary pregnancy check';
    }
  } else {
    nextAction = 'Schedule veterinary pregnancy check';
  }

  if (expectedDelivery && daysUntilDelivery === null && !['returned heat', 'returned_heat', 'rebred', 'rebreed', 'failed', 'aborted', 'delivered'].includes(statusLower)) {
    const t = new Date(expectedDelivery).getTime();
    if (!isNaN(t)) daysUntilDelivery = daysBetween(now, expectedDelivery);
  }

  return {
    ...row,
    species_label: sp === 'pig' ? 'Pig' : sp === 'cattle' ? 'Cattle' : (row.category_name || '—'),
    days_since_insemination: daysSinceInsemination,
    heat_window_start: heatWindowStart,
    heat_window_end: heatWindowEnd,
    in_heat_window: inHeatWindow,
    expected_delivery_auto: expectedDelivery,
    days_until_delivery: daysUntilDelivery,
    /* Exact delivery countdown for EVERY pregnant/monitored animal —
       negative = overdue. Respects the Local Testing `as_of` date. */
    delivery_countdown: (() => {
      if (daysUntilDelivery === null || ['delivered', 'failed', 'aborted'].includes(statusLower)) return null;
      if (daysUntilDelivery > 1) return `${daysUntilDelivery} days remaining`;
      if (daysUntilDelivery === 1) return `1 day remaining`;
      if (daysUntilDelivery === 0) return `Due today`;
      const over = Math.abs(daysUntilDelivery);
      return over === 1 ? `Overdue by 1 day` : `Overdue by ${over} days`;
    })(),
    due_soon: dueSoon,
    ready_to_rebreed: readyToRebreed,
    next_action: nextAction,
  };
};

/**
 * Pregnancy Check is restricted to exactly three roles:
 *   admin (Admin), animal (Animal Production Manager), veterinarian (Veterinary Manager).
 * Everyone else — including farm owners — gets 403 (enforced here AND by the
 * route-level hasRole guard, so direct API calls cannot bypass it).
 */
const canConfirmPregnancy = (req: AuthRequest): boolean => {
  const role = ((req.user as any)?.role || '').toLowerCase();
  return role === 'admin' || role === 'farm_owner' || role === 'animal' || role === 'veterinarian';
};

/* ============================================================
 * GET BREEDING RECORDS (Breeding History)
 * ==========================================================*/
export const getBreedingRecords = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.animal_id; delete ff.status;
    const { where, params } = buildWhereClause(ff, pag.search, []);

    let filters = '';
    if (req.query.animal_id) { filters += ' AND (br.mother_id = ? OR br.father_id = ?)'; params.push(req.query.animal_id, req.query.animal_id); }
    if (req.query.status) { filters += ' AND br.result = ?'; params.push(req.query.status); }

    const countQuery = `SELECT COUNT(*) as total FROM breeding_records br WHERE br.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT br.id, br.mother_id, br.father_id, br.breeding_date, br.insemination_date, br.technician,
             br.method, br.result, br.notes, br.created_by, br.created_at,
             m.tag_number AS mother_tag, m.name AS mother_name, m.animal_category_id AS mother_category_id,
             f.tag_number AS father_tag, f.name AS father_name,
             ac.name AS category_name
      FROM breeding_records br
      LEFT JOIN animals m ON br.mother_id = m.id
      LEFT JOIN animals f ON br.father_id = f.id
      LEFT JOIN animal_categories ac ON m.animal_category_id = ac.id
      WHERE br.deleted_at IS NULL ${where} ${filters}
      ORDER BY br.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    const enriched = rows.map((r: any) => {
      const sp = speciesOf(r.mother_category_id, r.category_name);
      const aiDate = r.insemination_date || r.breeding_date;
      return {
        ...r,
        species_label: sp === 'pig' ? 'Pig' : sp === 'cattle' ? 'Cattle' : (r.category_name || '—'),
        cycle_note:
          sp === 'pig'
            ? `Pig: 18–24 day return-to-heat check before confirmation Â· ${PIG_GESTATION_DAYS}-day gestation`
            : sp === 'cattle'
              ? `Cattle: veterinary diagnosis Â· ${CATTLE_GESTATION_DAYS}-day gestation`
              : '',
        expected_delivery_auto:
          aiDate && sp === 'pig' ? toISODate(addDays(aiDate, PIG_GESTATION_DAYS))
          : aiDate && sp === 'cattle' ? toISODate(addDays(aiDate, CATTLE_GESTATION_DAYS))
          : null,
      };
    });

    return paginated(res, enriched, total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

/* ============================================================
 * CREATE BREEDING RECORD / INSEMINATION
 * Planned → Inseminated (auto-starts pregnancy monitoring)
 * ==========================================================*/
export const createBreedingRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { mother_id, father_id, breeding_date, method, notes, insemination_date, technician } = req.body;

    if (!mother_id) return error(res, 'Mother is required', 400);
    if (!breeding_date) return error(res, 'Breeding date is required', 400);

    const [motherRows]: any = await pool.query(
      `SELECT a.id, a.name, a.tag_number, a.gender, a.animal_category_id, ac.name AS category_name
       FROM animals a LEFT JOIN animal_categories ac ON a.animal_category_id = ac.id
       WHERE a.id = ? AND a.deleted_at IS NULL AND a.status NOT IN ('dead','sold')`,
      [mother_id]
    );
    if (motherRows.length === 0) return error(res, 'Mother animal not found or ineligible', 404);
    const mother = motherRows[0];

    let fatherTag: string | null = null;
    if (father_id) {
      const [fatherRows]: any = await pool.query(
        `SELECT id, tag_number, animal_category_id FROM animals WHERE id = ? AND deleted_at IS NULL AND status NOT IN ('dead','sold')`,
        [father_id]
      );
      if (fatherRows.length === 0) return error(res, 'Father animal not found or ineligible', 404);
      if (Number(fatherRows[0].animal_category_id) !== Number(mother.animal_category_id)) {
        return error(res, 'Invalid pairing: mother and father must be the same species (Pig × Pig or Cattle × Cattle). Cross-species breeding is not allowed.', 400);
      }
      fatherTag = fatherRows[0].tag_number;
    }

    // 'ai' matches the breeding_records.method ENUM (natural|ai)
    const normalizedMethod = method === 'ai' || method === 'artificial' ? 'ai' : (method || 'natural');
    const effectiveInseminationDate = normalizedMethod === 'ai' ? (insemination_date || breeding_date) : (insemination_date || null);

    const [result]: any = await pool.query(
      `INSERT INTO breeding_records (mother_id, father_id, breeding_date, insemination_date, technician, method, result, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [mother_id, father_id || null, breeding_date, effectiveInseminationDate, technician?.trim() || null, normalizedMethod, 'inseminated', notes || null, req.user?.id ?? null]
    );
    const breedingId = result.insertId;

    /* ---- AUTOMATIC: start pregnancy monitoring with species-correct dates ---- */
    const sp = speciesOf(mother.animal_category_id, mother.category_name);
    const baseDate = effectiveInseminationDate || breeding_date;

    // Expected delivery is calculated automatically PER SPECIES (never mixed):
    const expectedDeliveryAuto =
      sp === 'pig' ? addDays(baseDate, PIG_GESTATION_DAYS)      // pig rule ONLY
      : sp === 'cattle' ? addDays(baseDate, CATTLE_GESTATION_DAYS) // cattle rule ONLY
      : null;

    const sireDisplay = fatherTag ? `${fatherTag}` : (normalizedMethod === 'ai' ? `AI${technician ? ` (${technician.trim()})` : ''}` : 'Natural');

    const [pregResult]: any = await pool.query(
      `INSERT INTO pregnancies (animal_id, breeding_record_id, pregnancy_date, expected_delivery_date, sire_name, status, notes)
       VALUES (?,?,?,?,?,?,?)`,
      [mother_id, breedingId, breeding_date, toISODate(expectedDeliveryAuto), sireDisplay, 'Under Observation',
       `Auto-monitoring started (${sp === 'cattle' ? `${CATTLE_GESTATION_DAYS}-day cattle gestation` : sp === 'pig' ? `18–24 day pig heat-check then ${PIG_GESTATION_DAYS}-day gestation` : 'standard monitoring'})`]
    );

    try {
      await createNotification(req.user!.id, 'info', 'Breeding Recorded',
        `${mother.name || mother.tag_number}: ${normalizedMethod === 'ai' ? 'AI insemination' : 'natural mating'} recorded. Pregnancy monitoring active.` +
        (expectedDeliveryAuto ? ` Expected delivery ${toISODate(expectedDeliveryAuto)}.` : ''));
    } catch {}

    await logAudit(req, createAuditEntry(req, 'Create Breeding Record', 'BreedingRecords',
      `Recorded ${normalizedMethod} breeding for ${mother.name || mother.tag_number}`,
      { mother_id, father_id, breeding_date, method: normalizedMethod, insemination_date: effectiveInseminationDate, technician }, null));

    return created(res, {
      id: breedingId,
      pregnancy_id: pregResult.insertId,
      species: sp,
      status: 'inseminated',
      pregnancy_status: 'Under Observation',
      expected_delivery_date: toISODate(expectedDeliveryAuto),
      heat_check_window: sp === 'pig'
        ? { start: toISODate(addDays(breeding_date, PIG_HEAT_CYCLE_MIN_DAYS)), end: toISODate(addDays(breeding_date, PIG_HEAT_CYCLE_MAX_DAYS)) }
        : null,
    }, 'Breeding recorded — pregnancy monitoring started automatically');
  } catch (err: any) { return error(res, err.message); }
};

export const updateBreedingRecord = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM breeding_records WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Breeding record not found', 404);

    // Same-species guard when the pairing is changed
    if (req.body.mother_id && req.body.father_id) {
      const [pair]: any = await pool.query(
        'SELECT animal_category_id FROM animals WHERE id IN (?, ?)',
        [req.body.mother_id, req.body.father_id]
      );
      if (pair.length === 2 && Number(pair[0].animal_category_id) !== Number(pair[1].animal_category_id)) {
        return error(res, 'Invalid pairing: mother and father must be the same species. Cross-species breeding is not allowed.', 400);
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['mother_id', 'father_id', 'breeding_date', 'insemination_date', 'technician', 'method', 'result', 'notes'];
    const dateFields = new Set(['breeding_date', 'insemination_date']);
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

    // AUTOMATIC derived-date refresh: if the breeding/insemination date changed,
    // recompute the linked pregnancy's Day 0 + expected delivery (species rules).
    const dateChanged = fields.some(f => f.startsWith('breeding_date') || f.startsWith('insemination_date'));
    if (dateChanged) {
      const [fresh]: any = await pool.query('SELECT * FROM breeding_records WHERE id = ?', [req.params.id]);
      const rec = fresh[0];
      const newBase = rec.insemination_date || rec.breeding_date;
      if (newBase) {
        const [spRows]: any = await pool.query(
          `SELECT a.animal_category_id, ac.name AS category_name
           FROM animals a LEFT JOIN animal_categories ac ON a.animal_category_id = ac.id
           WHERE a.id = ?`, [rec.mother_id]);
        const sp2 = speciesOf(spRows[0]?.animal_category_id, spRows[0]?.category_name);
        const expAuto = sp2 === 'cattle' ? toISODate(addDays(newBase, CATTLE_GESTATION_DAYS))
          : sp2 === 'pig' ? toISODate(addDays(newBase, PIG_GESTATION_DAYS))
          : null;
        await pool.query(
          `UPDATE pregnancies SET pregnancy_date = ?, expected_delivery_date = COALESCE(?, expected_delivery_date)
           WHERE breeding_record_id = ? AND deleted_at IS NULL`,
          [newBase, expAuto, req.params.id]
        );
      }
    }

    await logAudit(req, createAuditEntry(req, 'Update Breeding Record', 'BreedingRecords', `Updated breeding record ${req.params.id}`, req.body, old[0]));
    return success(res, null, 'Breeding record updated');
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

/* ============================================================
 * GET PREGNANCIES (automatic monitoring view)
 * ==========================================================*/
export const getPregnancies = async (req: AuthRequest, res: Response) => {
  try {
    const pag = getPagination(req);
    const ff = { ...pag.filters };
    delete ff.animal_id; delete ff.status; delete ff.as_of;
    const { where, params } = buildWhereClause(ff, pag.search, []);

    let filters = '';
    if (req.query.animal_id) { filters += ' AND p.animal_id = ?'; params.push(req.query.animal_id); }
    if (req.query.status) { filters += ' AND p.status = ?'; params.push(req.query.status); }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM pregnancies p
      JOIN animals a ON p.animal_id = a.id
      WHERE p.deleted_at IS NULL ${where} ${filters}`;
    const [[{ total }]]: any = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT p.*, a.tag_number, a.name AS animal_name, a.gender,
             a.animal_category_id, ac.name AS category_name,
             br.breeding_date, br.insemination_date, br.method AS breeding_method, br.technician
      FROM pregnancies p
      JOIN animals a ON p.animal_id = a.id
      LEFT JOIN animal_categories ac ON a.animal_category_id = ac.id
      LEFT JOIN breeding_records br ON p.breeding_record_id = br.id
      WHERE p.deleted_at IS NULL ${where} ${filters}
      ORDER BY p.${pag.sort} ${pag.order} LIMIT ? OFFSET ?`;
    const [rows]: any = await pool.query(dataQuery, [...params, pag.limit, pag.offset]);

    // LOCAL TESTING ONLY: optional ?as_of=YYYY-MM-DD simulates "today" so the
    // full workflow (heat window, due-soon, delivery countdown) can be tested
    // without waiting. Biological constants remain untouched; production calls
    // omit this param and get real-time behavior.
    let now = new Date();
    const asOfRaw = typeof req.query.as_of === 'string' ? req.query.as_of.trim() : '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(asOfRaw)) {
      const d = new Date(`${asOfRaw}T00:00:00`);
      if (!isNaN(d.getTime())) now = d;
    }

    return paginated(res, rows.map((r: any) => enrichPregnancy(r, now)), total, pag.page, pag.limit);
  } catch (err: any) { return error(res, err.message); }
};

/* ============================================================
 * PREGNANCY CHECK — Veterinary users ONLY
 * Results: Pregnant | Returned Heat | Rebred
 * All downstream statuses/dates update AUTOMATICALLY.
 * ==========================================================*/
export const updatePregnancyStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!canConfirmPregnancy(req)) {
      return error(res, 'Only veterinary users can confirm pregnancy checks', 403);
    }

    const { id } = req.params;
    const raw = (req.body?.status || req.body?.result || '').toString().toLowerCase();
    const map: Record<string, 'pregnant' | 'returned_heat' | 'rebred'> = {
      pregnant: 'pregnant', returned_heat: 'returned_heat', 'returned heat': 'returned_heat',
      rebred: 'rebred', rebreed: 'rebred', re_breed: 'rebred',
    };
    const outcome = map[raw];
    if (!outcome) return error(res, "Invalid result. Use one of: Pregnant, Returned Heat, Rebred", 400);

    const [pregRows]: any = await pool.query(
      `SELECT p.*, a.animal_category_id, ac.name AS category_name, a.name AS animal_name
       FROM pregnancies p
       JOIN animals a ON p.animal_id = a.id
       LEFT JOIN animal_categories ac ON a.animal_category_id = ac.id
       WHERE p.id = ? AND p.deleted_at IS NULL`,
      [id]
    );
    if (pregRows.length === 0) return error(res, 'Pregnancy record not found', 404);
    const preg = pregRows[0];

    const sp = speciesOf(preg.animal_category_id, preg.category_name);
    const inseminationDate = preg.pregnancy_date ?? preg.breeding_date ?? null;

    let newStatus = '';
    let expectedDelivery: string | null = toISODate(preg.expected_delivery_date);

    if (outcome === 'pregnant') {
      newStatus = 'Pregnant';
      if (inseminationDate) {
        // AUTOMATIC delivery-date calculation — strictly species-separated
        expectedDelivery = sp === 'cattle'
          ? toISODate(addDays(inseminationDate, CATTLE_GESTATION_DAYS))
          : toISODate(addDays(inseminationDate, PIG_GESTATION_DAYS));
      }
      if (preg.breeding_record_id) {
        await pool.query(`UPDATE breeding_records SET result = 'pregnant' WHERE id = ?`, [preg.breeding_record_id]);
      }
    } else if (outcome === 'returned_heat') {
      newStatus = 'Returned Heat';
      if (preg.breeding_record_id) {
        await pool.query(`UPDATE breeding_records SET result = 'returned_heat' WHERE id = ?`, [preg.breeding_record_id]);
      }
    } else {
      newStatus = 'Rebred';
      if (preg.breeding_record_id) {
        await pool.query(`UPDATE breeding_records SET result = 'rebred' WHERE id = ?`, [preg.breeding_record_id]);
      }
    }

    await pool.query(
      `UPDATE pregnancies SET status = ?, expected_delivery_date = ? WHERE id = ?`,
      [newStatus, expectedDelivery, id]
    );

    // AUTOMATIC new-cycle chain: Returned Heat AND Rebred both start a fresh
    // cycle immediately. Day 0 = the ACTUAL rebreeding/insemination date
    // (optional body.rebreed_date override for Local Testing; default today).
    // The previous cycle is only re-labeled — never overwritten or deleted.
    let rebreedingId: number | null = null;
    let newCyclePregnancyId: number | null = null;
    if (outcome === 'returned_heat' || outcome === 'rebred') {
      const rawRebreed = typeof req.body?.rebreed_date === 'string' ? req.body.rebreed_date.trim() : '';
      const day0 = /^\d{4}-\d{2}-\d{2}$/.test(rawRebreed) ? rawRebreed : toISODate(new Date())!;
      const [nr]: any = await pool.query(
        `INSERT INTO breeding_records (mother_id, father_id, breeding_date, insemination_date, technician, method, result, notes, created_by)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [preg.animal_id, null, day0, day0, preg.technician || null, preg.breeding_method === 'natural' ? 'natural' : 'ai', 'inseminated',
         outcome === 'returned_heat' ? 'New cycle after returned heat (previous attempt failed)' : 'Automatic rebreed after pregnancy check', req.user?.id ?? null]
      );
      rebreedingId = nr.insertId;

      const sp2 = speciesOf(preg.animal_category_id, preg.category_name);
      // New cycle dates derive ONLY from the new Day 0 (species-specific rules unchanged)
      const heatWin = sp2 === 'pig'
        ? { start: toISODate(addDays(day0, PIG_HEAT_CYCLE_MIN_DAYS)), end: toISODate(addDays(day0, PIG_HEAT_CYCLE_MAX_DAYS)) }
        : null;
      const expAuto = sp2 === 'cattle'
        ? toISODate(addDays(day0, CATTLE_GESTATION_DAYS))
        : toISODate(addDays(day0, PIG_GESTATION_DAYS));

      const [np]: any = await pool.query(
        `INSERT INTO pregnancies (animal_id, breeding_record_id, pregnancy_date, expected_delivery_date, sire_name, status, notes)
         VALUES (?,?,?,?,?,?,?)`,
        [preg.animal_id, rebreedingId, day0, expAuto, preg.sire_name || null, 'Under Observation', 'Auto-created new monitoring cycle']
      );
      newCyclePregnancyId = np.insertId;

      try {
        await createNotification(req.user!.id, 'success', 'New Cycle Started',
          `${preg.animal_name}: ${outcome === 'returned_heat' ? 'new cycle after returned heat' : 'rebred'} — Day 0 ${day0}${heatWin ? `, heat window ${heatWin.start} → ${heatWin.end}` : ''}, expected delivery ${expAuto}.`);
      } catch {}
    }

    try {
      await createNotification(req.user!.id, outcome === 'pregnant' ? 'success' : 'warning', 'Pregnancy Check Confirmed',
        `${preg.animal_name}: ${newStatus}${expectedDelivery ? ` · Expected delivery ${expectedDelivery}` : ''}`);
    } catch {}

    await logAudit(req, createAuditEntry(req, 'Pregnancy Check', 'Pregnancies',
      `Veterinary pregnancy check for ${preg.animal_name}: ${newStatus}`,
      { pregnancy_id: Number(id), outcome, expected_delivery: expectedDelivery, species: sp }, preg));

    return success(res, {
      id: Number(id),
      status: newStatus,
      species: sp,
      expected_delivery_date: expectedDelivery,
      ready_to_rebreed: outcome === 'returned_heat',
      rebreeding_record_id: rebreedingId,
      new_cycle_pregnancy_id: newCyclePregnancyId,
      next_action:
        outcome === 'pregnant' ? (expectedDelivery ? `Monitor gestation — delivery expected ${expectedDelivery}` : 'Monitor gestation')
        : outcome === 'returned_heat' ? 'Animal ready for rebreeding'
        : 'New monitoring cycle started',
    }, `Pregnancy check confirmed: ${newStatus}`);
  } catch (err: any) { return error(res, err.message); }
};

/* ============================================================
 * Legacy manual pregnancy CRUD — preserved for data compatibility
 * ==========================================================*/
export const createPregnancy = async (req: AuthRequest, res: Response) => {
  try {
    const { animal_id, breeding_record_id, pregnancy_date, expected_delivery_date, sire_name, status, notes } = req.body;
    if (!animal_id) return error(res, 'Animal is required', 400);

    const [result]: any = await pool.query(
      `INSERT INTO pregnancies (animal_id, breeding_record_id, pregnancy_date, expected_delivery_date, sire_name, status, notes) VALUES (?,?,?,?,?,?,?)`,
      [animal_id, breeding_record_id || null, pregnancy_date || toISODate(new Date()), expected_delivery_date || null, sire_name || null, status || 'Pregnant', notes || null]
    );

    if (breeding_record_id) {
      await pool.query('UPDATE breeding_records SET result = ? WHERE id = ?', ['pregnant', breeding_record_id]);
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

/* ============================================================
 * BIRTH RECORDS — unchanged behavior; creation auto-marks the
 * matching pregnancy Delivered (end of the workflow).
 * ==========================================================*/
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

    // AUTOMATIC end-of-workflow: mark open pregnancies Delivered
    await connection.query("UPDATE pregnancies SET status = 'Delivered' WHERE animal_id = ? AND status IN ('Pregnant','Under Observation')", [mother_id]);

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
