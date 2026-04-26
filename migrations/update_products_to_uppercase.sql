-- Barcha mahsulot nomlarini UPPERCASE ga o'zgartirish
-- Sana: 2026-04-26

BEGIN;

-- Mahsulot nomlarini katta harfga o'zgartirish
UPDATE products 
SET name = UPPER(name)
WHERE name != UPPER(name);

-- Nechta qator o'zgarganini ko'rsatish
SELECT COUNT(*) as updated_count 
FROM products 
WHERE name = UPPER(name);

COMMIT;

-- Tasdiq: Birinchi 20 ta mahsulotni ko'rish
SELECT id, name FROM products LIMIT 20;
