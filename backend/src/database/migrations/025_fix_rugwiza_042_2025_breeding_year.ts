import { Connection } from 'mysql2/promise';

export const name = '025_fix_rugwiza_042_2025_breeding_year';

/**
 * Migration 025 — targeted data repair for erroneous year in existing records.
 *
 * Shifts breeding/insemination/pregnancy dates from 2025 -> 2026 ONLY for the
 * identified erroneous animal (ear tag '042' — Rugwiza), preserving month/day.
 * Then recomputes that animal's open pregnancies' expected delivery from the
 * corrected insemination date using the species-specific gestation rule
 * (pig 114d, cattle 283d). All other records are untouched. Idempotent: a
 * second run finds no remaining 2025 rows for this animal.
 */
export async function up(conn: Connection): Promise<void> {
  try {
    // 1) breeding_records dates for mother with tag '042'
    await conn.query(
      `UPDATE breeding_records br
       JOIN animals a ON br.mother_id = a.id
       SET br.breeding_date = DATE_ADD(br.breeding_date, INTERVAL 1 YEAR)
       WHERE a.tag_number = '042'
         AND br.deleted_at IS NULL
         AND YEAR(br.breeding_date) = 2025`
    );
    await conn.query(
      `UPDATE breeding_records br
       JOIN animals a ON br.mother_id = a.id
       SET br.insemination_date = DATE_ADD(br.insemination_date, INTERVAL 1 YEAR)
       WHERE a.tag_number = '042'
         AND br.deleted_at IS NULL
         AND br.insemination_date IS NOT NULL
         AND YEAR(br.insemination_date) = 2025`
    );

    // 2) pregnancies Day-0 date for the same animal
    await conn.query(
      `UPDATE pregnancies p
       JOIN animals a ON p.animal_id = a.id
       SET p.pregnancy_date = DATE_ADD(p.pregnancy_date, INTERVAL 1 YEAR)
       WHERE a.tag_number = '042'
         AND p.deleted_at IS NULL
         AND YEAR(p.pregnancy_date) = 2025`
    );

    // 3) Recompute expected delivery from the corrected insemination date
    //    using species-specific gestation (category NAME based; pig=114 cattle=283).
    await conn.query(
      `UPDATE pregnancies p
       JOIN animals a ON p.animal_id = a.id
       LEFT JOIN animal_categories ac ON a.animal_category_id = ac.id
       SET p.expected_delivery_date =
             CASE LOWER(TRIM(ac.name))
               WHEN 'pigs'   THEN DATE_ADD(COALESCE(p.pregnancy_date, p.created_at), INTERVAL 114 DAY)
               WHEN 'pig'    THEN DATE_ADD(COALESCE(p.pregnancy_date, p.created_at), INTERVAL 114 DAY)
               WHEN 'cattle' THEN DATE_ADD(COALESCE(p.pregnancy_date, p.created_at), INTERVAL 283 DAY)
               WHEN 'cows'   THEN DATE_ADD(COALESCE(p.pregnancy_date, p.created_at), INTERVAL 283 DAY)
               ELSE p.expected_delivery_date
             END
       WHERE a.tag_number = '042' AND p.deleted_at IS NULL`
    );
    console.log('[m025] Rugwiza (042) 2025->2026 date repair applied');
  } catch (e: any) {
    // Fail-safe policy: log and continue boot; enrichment recomputes display values anyway.
    console.error(`[m025] skipped: ${e?.message}`);
  }
}

export async function down(conn: Connection): Promise<void> {
  void conn;
}
