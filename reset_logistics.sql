-- =============================================
-- RESET LOGISTICS DATA
-- Clears all records from logistics tables
-- Resets AUTO_INCREMENT counters
-- Respects foreign key relationships
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

-- Delete child tables first
DELETE FROM delivery_items;
DELETE FROM deliveries;
DELETE FROM fuel_records;
DELETE FROM vehicle_maintenance;
DELETE FROM trips;
DELETE FROM transport_approvals;
DELETE FROM transport_requests;
DELETE FROM drivers;
DELETE FROM vehicles;
DELETE FROM vehicle_types;

ALTER TABLE delivery_items AUTO_INCREMENT = 1;
ALTER TABLE deliveries AUTO_INCREMENT = 1;
ALTER TABLE fuel_records AUTO_INCREMENT = 1;
ALTER TABLE vehicle_maintenance AUTO_INCREMENT = 1;
ALTER TABLE trips AUTO_INCREMENT = 1;
ALTER TABLE transport_approvals AUTO_INCREMENT = 1;
ALTER TABLE transport_requests AUTO_INCREMENT = 1;
ALTER TABLE drivers AUTO_INCREMENT = 1;
ALTER TABLE vehicles AUTO_INCREMENT = 1;
ALTER TABLE vehicle_types AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Logistics data cleared successfully' as result;
