-- Khan Mobile Shop — v3 migration
-- Adds: password reset tokens, product image gallery
-- Safe to run more than once — each statement checks before applying.

ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(64) NULL AFTER password;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME NULL AFTER reset_token_hash;

CREATE TABLE IF NOT EXISTS product_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  image_url   VARCHAR(500) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
