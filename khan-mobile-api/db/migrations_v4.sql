ALTER TABLE users
ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE users
ADD COLUMN verify_token_hash VARCHAR(64) NULL;

ALTER TABLE users
ADD COLUMN verify_token_expires DATETIME NULL;

UPDATE users
SET email_verified = 1
WHERE email_verified = 0;