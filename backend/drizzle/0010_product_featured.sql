ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_priority integer NOT NULL DEFAULT 0;

-- Set featured priority for top groups (higher = more prominent)
UPDATE products SET featured_priority = 10 WHERE group_key = 'chatgpt';
UPDATE products SET featured_priority = 9  WHERE group_key = 'netflix';
UPDATE products SET featured_priority = 8  WHERE group_key = 'spotify';
UPDATE products SET featured_priority = 7  WHERE group_key = 'youtube';
UPDATE products SET featured_priority = 6  WHERE group_key = 'canva';
UPDATE products SET featured_priority = 5  WHERE group_key = 'claude';
UPDATE products SET featured_priority = 4  WHERE group_key = 'notion';
UPDATE products SET featured_priority = 3  WHERE group_key = 'figma';
UPDATE products SET featured_priority = 2  WHERE group_key = 'nordvpn';
UPDATE products SET featured_priority = 1  WHERE group_key = 'cursor';
