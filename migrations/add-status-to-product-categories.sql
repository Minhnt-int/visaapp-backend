-- Add status column to product_categories table
ALTER TABLE product_categories ADD COLUMN status ENUM('active', 'deleted') NOT NULL DEFAULT 'active';

-- Update existing records to have 'active' status
UPDATE product_categories SET status = 'active' WHERE status IS NULL; 