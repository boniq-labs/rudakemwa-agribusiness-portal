import mysql from 'mysql2/promise';
import { addColumnIfNotExists, modifyColumn } from '../migrationHelpers';

export const name = '008_alter_birth_vaccination_milk_customer';

export async function up(conn: mysql.Connection): Promise<void> {

  // birth_records extra columns
  await addColumnIfNotExists(
    conn,
    'birth_records',
    'animal_id',
    `INT NULL AFTER \`mother_id\``
  );

  await addColumnIfNotExists(
    conn,
    'birth_records',
    'photo',
    `LONGTEXT NULL AFTER \`notes\``
  );

  await addColumnIfNotExists(
    conn,
    'birth_records',
    'tag_number',
    `VARCHAR(50) NULL AFTER \`photo\``
  );

  await addColumnIfNotExists(
    conn,
    'birth_records',
    'animal_name',
    `VARCHAR(100) NULL AFTER \`tag_number\``
  );

  await addColumnIfNotExists(
    conn,
    'birth_records',
    'type',
    `VARCHAR(50) NULL AFTER \`animal_name\``
  );


  // vaccination_records additions
  await addColumnIfNotExists(
    conn,
    'vaccination_records',
    'deleted_at',
    `TIMESTAMP NULL AFTER \`created_at\``
  );

  await addColumnIfNotExists(
    conn,
    'vaccination_records',
    'vaccine_name',
    `VARCHAR(200) AFTER \`animal_id\``
  );


  // DO NOT change veterinarian type
  // It is linked with users.id foreign key.
  // Keep compatible datatype.
  //
  // Removed:
  // await modifyColumn(conn,'vaccination_records','veterinarian','VARCHAR(100)');


  // milk_collections
  await addColumnIfNotExists(
    conn,
    'milk_collections',
    'collector_name',
    `VARCHAR(255) AFTER \`collector_id\``
  );

  await addColumnIfNotExists(
    conn,
    'milk_collections',
    'deleted_at',
    `TIMESTAMP NULL AFTER \`notes\``
  );


  // customer_payments
  await addColumnIfNotExists(
    conn,
    'customer_payments',
    'customer_id',
    `INT AFTER \`id\``
  );
}