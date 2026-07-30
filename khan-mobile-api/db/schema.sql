-- Khan Mobile Shop — MySQL schema

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password      VARCHAR(255) NULL,            -- NULL for Google-only accounts
  reset_token_hash     VARCHAR(64) NULL,
  reset_token_expires  DATETIME NULL,
  email_verified       TINYINT(1) NOT NULL DEFAULT 0,
  verify_token_hash    VARCHAR(64) NULL,
  verify_token_expires DATETIME NULL,
  google_id     VARCHAR(64) NULL UNIQUE,
  avatar_url    VARCHAR(500) NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  phone         VARCHAR(30) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(200) NOT NULL,
  slug               VARCHAR(220) NOT NULL UNIQUE,
  description        TEXT NULL,
  price              DECIMAL(10,2) NOT NULL,
  compare_at_price   DECIMAL(10,2) NULL,
  category           VARCHAR(60) NOT NULL,
  brand              VARCHAR(80) NOT NULL,
  rating             DECIMAL(2,1) NOT NULL DEFAULT 0,
  review_count       INT NOT NULL DEFAULT 0,
  badge              ENUM('New','Hot','Sale','Bestseller') NULL,
  image_url          VARCHAR(500) NULL,
  bg_gradient        VARCHAR(200) NULL,
  compatible_models  JSON NULL,
  stock              INT NOT NULL DEFAULT 0,
  is_active          TINYINT(1) NOT NULL DEFAULT 1,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_active (is_active),
  FULLTEXT INDEX ft_search (name, brand, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_number    VARCHAR(20) NOT NULL UNIQUE,
  user_id         INT NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  discount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee    DECIMAL(10,2) NOT NULL DEFAULT 0,
  total           DECIMAL(10,2) NOT NULL,
  promo_code      VARCHAR(30) NULL,
  full_name       VARCHAR(120) NOT NULL,
  email           VARCHAR(190) NOT NULL,
  phone           VARCHAR(30) NOT NULL,
  address         TEXT NOT NULL,
  landmark        VARCHAR(200) NULL,
  city            VARCHAR(80) NOT NULL,
  payment_method  VARCHAR(30) NOT NULL DEFAULT 'cod',
  status          ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  product_id  INT NULL,
  name        VARCHAR(200) NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  quantity    INT NOT NULL,
  image_url   VARCHAR(500) NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

CREATE TABLE IF NOT EXISTS product_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  image_url   VARCHAR(500) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
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
