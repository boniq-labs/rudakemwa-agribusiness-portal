import { Connection } from 'mysql2/promise';

export const name = '023_extend_breeding_pregnancy_enums_workflow';

/**
 * Migration 023 — Breeding & Reproduction workflow enum support.
 * Extends (never shrinks) the ENUM columns so every workflow state persists:
 *  - breeding_records.result : + inseminated, pregnant, returned_heat, rebred, delivered
 *  - pregnancies.status      : + 'Returned Heat', 'Rebred'
 * All pre-existing enum values are kept FIRST so current data remains valid.
 */
export async function up(conn: Connection): Promise<void> {
  await conn.query(
    "ALTER TABLE `breeding_records` MODIFY COLUMN `result` ENUM('successful','failed','pending','inseminated','pregnant','returned_heat','rebred','delivered') DEFAULT 'pending'"
  );
  await conn.query(
    "ALTER TABLE `pregnancies` MODIFY COLUMN `status` ENUM('Pregnant','Delivered','Failed','Aborted','Under Observation','confirmed','monitoring','delivered','failed','Returned Heat','Rebred') DEFAULT 'confirmed'"
  );
}

export async function down(conn: Connection): Promise<void> {
  // Restore original enums (workflow rows would violate these; kept for completeness)
  await conn.query(
    "ALTER TABLE `pregnancies` MODIFY COLUMN `status` ENUM('Pregnant','Delivered','Failed','Aborted','Under Observation','confirmed','monitoring','delivered','failed') DEFAULT 'confirmed'"
  );
  await conn.query(
    "ALTER TABLE `breeding_records` MODIFY COLUMN `result` ENUM('successful','failed','pending') DEFAULT 'pending'"
  );
}
