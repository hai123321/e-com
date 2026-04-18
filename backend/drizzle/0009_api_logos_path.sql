-- Migrate image paths from /logos/ to /api/logos/ so reverse proxies
-- treat them as dynamic routes instead of cached static assets.
UPDATE products
SET image = REPLACE(image, '/logos/', '/api/logos/')
WHERE image LIKE '/logos/%';
