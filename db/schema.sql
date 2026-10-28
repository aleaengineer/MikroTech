CREATE DATABASE IF NOT EXISTS mikrotech
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mikrotech;

CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(80) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY admins_username_unique (username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS app_settings (
  id TINYINT UNSIGNED NOT NULL,
  site_name VARCHAR(60) NOT NULL,
  site_tagline VARCHAR(120) NOT NULL,
  site_description VARCHAR(300) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  subject VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY contact_messages_read_created_index (is_read, created_at)
) ENGINE=InnoDB;

INSERT IGNORE INTO app_settings (id, site_name, site_tagline, site_description) VALUES
  (1, 'MikroTech', 'Belajar MikroTik, langkah demi langkah.', 'Panduan MikroTik yang praktis dan mudah dipahami.');

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY categories_name_unique (name),
  UNIQUE KEY categories_slug_unique (slug)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS articles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  summary VARCHAR(300) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  image_url VARCHAR(2048) NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY articles_slug_unique (slug),
  KEY articles_status_published_at_index (status, published_at),
  KEY articles_category_id_index (category_id),
  CONSTRAINT articles_category_fk
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT IGNORE INTO categories (name, slug) VALUES
  ('Dasar MikroTik', 'dasar-mikrotik'),
  ('Routing dan Jaringan', 'routing-dan-jaringan'),
  ('Firewall dan Keamanan', 'firewall-dan-keamanan'),
  ('Hotspot, DHCP, dan Wi-Fi', 'hotspot-dhcp-dan-wi-fi'),
  ('Troubleshooting', 'troubleshooting');
