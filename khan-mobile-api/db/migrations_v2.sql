-- Khan Mobile Shop — v2 migration
-- Adds: sale pricing, landmark field, reviews, contact messages
-- Safe to run more than once — every statement checks before applying.
-- Each column addition is its own statement (some MariaDB versions don't
-- reliably apply IF NOT EXISTS when multiple ADD COLUMN clauses are combined
-- into a single ALTER TABLE).

ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2) NULL AFTER price;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INT NOT NULL DEFAULT 0 AFTER rating;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS landmark VARCHAR(200) NULL AFTER address;

CREATE TABLE IF NOT EXISTS reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  user_id     INT NOT NULL,
  order_id    INT NOT NULL,
  rating      TINYINT NOT NULL,
  comment     TEXT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review_per_product_per_user (product_id, user_id),
  CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contact_messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(190) NOT NULL,
  subject     VARCHAR(200) NULL,
  message     TEXT NOT NULL,
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
