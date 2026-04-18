CREATE TABLE IF NOT EXISTS banners (
  id            serial PRIMARY KEY,
  title         varchar(255) NOT NULL DEFAULT '',
  subtitle      varchar(255) NOT NULL DEFAULT '',
  image         varchar(512) NOT NULL DEFAULT '',
  href          varchar(512) NOT NULL DEFAULT '/#products',
  priority      integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Default banners
INSERT INTO banners (title, subtitle, image, href, priority) VALUES
  ('ChatGPT Plus', 'Nâng cấp chính chủ - Giao ngay', '/api/logos/chatgpt.jpg', '/san-pham/chatgpt', 10),
  ('Netflix Premium', 'Xem phim 4K không giới hạn', '/api/logos/netflix.jpg', '/san-pham/netflix', 9),
  ('Spotify Premium', 'Nghe nhạc không quảng cáo', '/api/logos/spotify.jpg', '/san-pham/spotify', 8);
