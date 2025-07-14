-- Remove banner_type check constraint from banners table
-- This allows any value to be inserted into banner_type column

-- Drop the existing check constraint
ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_banner_type_check;

-- The banner_type column will now accept any VARCHAR(50) value
-- without the restriction to specific values 