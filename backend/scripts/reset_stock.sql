-- Clear stock-related data and reset AUTO_INCREMENT
-- Run with: mysql -u root -p efms < scripts/reset_stock.sql

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE stock_audit_items;
TRUNCATE TABLE stock_audits;
TRUNCATE TABLE stock_adjustments;
TRUNCATE TABLE stock_transfers;
TRUNCATE TABLE stock_issue_items;
TRUNCATE TABLE stock_issues;
TRUNCATE TABLE stock_transactions;
TRUNCATE TABLE feed_consumption;
TRUNCATE TABLE equipment_maintenance;
TRUNCATE TABLE goods_receipt_items;
TRUNCATE TABLE goods_receipts;
TRUNCATE TABLE feed_items;
TRUNCATE TABLE medicine_items;
TRUNCATE TABLE equipment;
TRUNCATE TABLE inventory_items;

ALTER TABLE stock_audit_items AUTO_INCREMENT = 1;
ALTER TABLE stock_audits AUTO_INCREMENT = 1;
ALTER TABLE stock_adjustments AUTO_INCREMENT = 1;
ALTER TABLE stock_transfers AUTO_INCREMENT = 1;
ALTER TABLE stock_issue_items AUTO_INCREMENT = 1;
ALTER TABLE stock_issues AUTO_INCREMENT = 1;
ALTER TABLE stock_transactions AUTO_INCREMENT = 1;
ALTER TABLE feed_consumption AUTO_INCREMENT = 1;
ALTER TABLE equipment_maintenance AUTO_INCREMENT = 1;
ALTER TABLE goods_receipt_items AUTO_INCREMENT = 1;
ALTER TABLE goods_receipts AUTO_INCREMENT = 1;
ALTER TABLE feed_items AUTO_INCREMENT = 1;
ALTER TABLE medicine_items AUTO_INCREMENT = 1;
ALTER TABLE equipment AUTO_INCREMENT = 1;
ALTER TABLE inventory_items AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;
