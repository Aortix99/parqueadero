-- Parquin — Esquema relacional normalizado (3FN)
-- Ejecutar: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS parquin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE parquin;

DROP TABLE IF EXISTS parking_sessions;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS tariff_rates;
DROP TABLE IF EXISTS vehicle_types;

CREATE TABLE vehicle_types (
  id         TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code       VARCHAR(20)      NOT NULL,
  name       VARCHAR(50)      NOT NULL,
  is_active  TINYINT(1)       NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vehicle_types_code (code)
) ENGINE=InnoDB;

CREATE TABLE clients (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(120)     NULL,
  email      VARCHAR(255)     NULL,
  phone      VARCHAR(20)      NULL,
  created_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_clients_email (email)
) ENGINE=InnoDB;

CREATE TABLE tariff_rates (
  id                TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  description       VARCHAR(255)     NOT NULL,
  price_per_minute  DECIMAL(10, 2)   NOT NULL,
  is_active         TINYINT(1)       NOT NULL DEFAULT 0,
  created_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_tariff_price_positive CHECK (price_per_minute > 0)
) ENGINE=InnoDB;

CREATE TABLE parking_sessions (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_id         BIGINT UNSIGNED NULL,
  vehicle_type_id   TINYINT UNSIGNED NOT NULL,
  plate             VARCHAR(10)      NOT NULL,
  rate_per_minute   DECIMAL(10, 2)   NULL,
  entry_at          DATETIME(3)      NOT NULL,
  exit_at           DATETIME(3)      NULL,
  duration_minutes  INT UNSIGNED     NULL,
  total_amount      DECIMAL(12, 2)   NULL,
  status            ENUM('ACTIVE', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  email_sent        TINYINT(1)       NOT NULL DEFAULT 0,
  email_sent_at     DATETIME(3)      NULL,
  created_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_sessions_client
    FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE SET NULL,
  CONSTRAINT fk_sessions_vehicle_type
    FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types (id),
  INDEX idx_sessions_plate (plate),
  INDEX idx_sessions_status (status),
  INDEX idx_sessions_entry_at (entry_at),
  INDEX idx_sessions_active_plate (plate, status)
) ENGINE=InnoDB;

CREATE UNIQUE INDEX uq_sessions_plate_active
  ON parking_sessions ((CASE WHEN status = 'ACTIVE' THEN plate END));
