-- =============================================
-- RESET ACCOUNTING DATA
-- Clears all records from accounting tables
-- Resets AUTO_INCREMENT counters
-- Respects foreign key relationships
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

-- Delete child tables first
DELETE FROM budget_items;
DELETE FROM budgets;
DELETE FROM payroll_items;
DELETE FROM payroll_records;
DELETE FROM salary_records;
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM receipts;
DELETE FROM payments;
DELETE FROM expense_records;
DELETE FROM income_records;
DELETE FROM transactions;
DELETE FROM tax_records;
DELETE FROM customer_payments;

ALTER TABLE budget_items AUTO_INCREMENT = 1;
ALTER TABLE budgets AUTO_INCREMENT = 1;
ALTER TABLE payroll_items AUTO_INCREMENT = 1;
ALTER TABLE payroll_records AUTO_INCREMENT = 1;
ALTER TABLE salary_records AUTO_INCREMENT = 1;
ALTER TABLE invoice_items AUTO_INCREMENT = 1;
ALTER TABLE invoices AUTO_INCREMENT = 1;
ALTER TABLE receipts AUTO_INCREMENT = 1;
ALTER TABLE payments AUTO_INCREMENT = 1;
ALTER TABLE expense_records AUTO_INCREMENT = 1;
ALTER TABLE income_records AUTO_INCREMENT = 1;
ALTER TABLE transactions AUTO_INCREMENT = 1;
ALTER TABLE tax_records AUTO_INCREMENT = 1;
ALTER TABLE customer_payments AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Accounting data cleared successfully' as result;
