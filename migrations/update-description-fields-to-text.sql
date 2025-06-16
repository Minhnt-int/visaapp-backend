-- Update description fields from VARCHAR to TEXT
-- Run this script to update all description fields to support unlimited characters

-- 1. Update ProductCategory description
ALTER TABLE product_categories 
MODIFY COLUMN description TEXT;

-- 2. Update Product description  
ALTER TABLE products 
MODIFY COLUMN description TEXT;

-- 3. Update Product metaDescription
ALTER TABLE products 
MODIFY COLUMN metaDescription TEXT;

-- 4. Update BlogPost metaDescription
ALTER TABLE blog_posts 
MODIFY COLUMN metaDescription TEXT;

-- 5. Update MetaSEO description
ALTER TABLE meta_seo 
MODIFY COLUMN description TEXT;

-- 6. Update MetaSEO og_description
ALTER TABLE meta_seo 
MODIFY COLUMN og_description TEXT;

-- Verify changes
DESCRIBE product_categories;
DESCRIBE products;
DESCRIBE blog_posts;
DESCRIBE meta_seo; 