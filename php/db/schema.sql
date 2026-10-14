-- TripVision — structure de la base MariaDB (hébergement Nuxit). État final des migrations 001 à 034 de la version Node/PostgreSQL.
-- À importer une seule fois dans phpMyAdmin (onglet « Importer ») sur une base vide, en UTF-8.
-- Compatible MariaDB 10.4 et plus récent. Les dates sont en UTC.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name TEXT NOT NULL,
  role ENUM('it', 'admin', 'manager', 'partner', 'client') NOT NULL,
  password_hash TEXT NOT NULL,
  must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  permissions JSON NOT NULL DEFAULT '{}',
  reset_requested_at DATETIME(3) NULL,
  deleted_at DATETIME(3) NULL,
  first_name TEXT NULL,
  last_name TEXT NULL,
  phone TEXT NULL,
  last_activity_at DATETIME(3) NULL,
  email_verified_at DATETIME(3) NULL,
  email_active VARCHAR(255) AS (IF(deleted_at IS NULL, email, NULL)) PERSISTENT,
  UNIQUE KEY users_email_active_idx (email_active),
  KEY users_email_idx (email),
  CONSTRAINT users_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE partners (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NULL,
  status ENUM('pending', 'approved', 'inactive') NOT NULL DEFAULT 'pending',
  legal_name TEXT NOT NULL,
  trade_name TEXT NOT NULL,
  head_office TEXT NULL,
  agencies TEXT NULL,
  siret TEXT NULL,
  booking_email TEXT NOT NULL,
  contact_email TEXT NULL,
  manager_name TEXT NOT NULL,
  kbis_name TEXT NULL,
  login_id TEXT NULL,
  phone TEXT NULL,
  city TEXT NULL,
  deleted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY partners_status_idx (status),
  CONSTRAINT partners_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE vehicles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  partner_id CHAR(36) NULL,
  status ENUM('pending', 'approved', 'inactive') NOT NULL DEFAULT 'pending',
  model TEXT NOT NULL,
  category VARCHAR(255) NOT NULL,
  pickup_address TEXT NOT NULL,
  price_day DECIMAL(10,2) NOT NULL,
  price_week DECIMAL(10,2) NULL,
  price_month DECIMAL(10,2) NULL,
  details JSON NOT NULL DEFAULT '{}',
  deleted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  publish_at DATETIME(3) NULL,
  KEY vehicles_search_idx (status, category),
  KEY vehicles_partner_idx (partner_id),
  CONSTRAINT vehicles_partner_fk FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE offers (
  id CHAR(36) NOT NULL PRIMARY KEY,
  type ENUM('flight', 'pack') NOT NULL,
  title TEXT NOT NULL,
  from_city TEXT NULL,
  to_city TEXT NOT NULL,
  country TEXT NULL,
  badge TEXT NULL,
  price DECIMAL(10,2) NOT NULL,
  old_price DECIMAL(10,2) NULL,
  partner_name TEXT NULL,
  image TEXT NULL,
  description TEXT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  publish_at DATETIME(3) NULL,
  deleted_at DATETIME(3) NULL,
  hotel_name TEXT NULL,
  hotel_stars SMALLINT NULL,
  hotel_nights SMALLINT NULL,
  hotel_board TEXT NULL,
  details JSON NOT NULL DEFAULT '{}',
  KEY offers_status_idx (status, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE bookings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  vehicle_id CHAR(36) NULL,
  customer_name TEXT NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone TEXT NULL,
  pickup_address TEXT NULL,
  return_address TEXT NULL,
  start_date DATE NULL,
  start_time TEXT NULL,
  end_date DATE NULL,
  end_time TEXT NULL,
  driver_age INT NULL,
  message TEXT NULL,
  status ENUM('pending', 'confirmed', 'inactive') NOT NULL DEFAULT 'pending',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  status_changed_at DATETIME(3) NULL,
  staff_seen_at DATETIME(3) NULL,
  partner_seen_at DATETIME(3) NULL,
  client_seen_at DATETIME(3) NULL,
  extras JSON NOT NULL DEFAULT '[]',
  conditions_snapshot JSON NULL,
  conditions_accepted_at DATETIME(3) NULL,
  total_estimate DECIMAL(10,2) NULL,
  payment_status ENUM('none', 'awaiting', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'none',
  stripe_session_id VARCHAR(255) COLLATE utf8mb4_bin NULL,
  stripe_payment_intent VARCHAR(255) COLLATE utf8mb4_bin NULL,
  paid_amount DECIMAL(10,2) NULL,
  paid_at DATETIME(3) NULL,
  cancel_token VARCHAR(255) COLLATE utf8mb4_bin NULL,
  commission_amount DECIMAL(10,2) NULL,
  cancel_fee DECIMAL(10,2) NULL,
  refunded_amount DECIMAL(10,2) NULL,
  cancelled_at DATETIME(3) NULL,
  cancel_session_id VARCHAR(255) COLLATE utf8mb4_bin NULL,
  KEY bookings_vehicle_idx (vehicle_id),
  KEY bookings_email_idx (customer_email),
  KEY bookings_stripe_session_idx (stripe_session_id),
  KEY bookings_payment_idx (payment_status, created_at),
  CONSTRAINT bookings_vehicle_fk FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE audit_logs (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_id CHAR(36) NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NULL,
  ip_address TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY audit_logs_created_idx (created_at),
  CONSTRAINT audit_logs_actor_fk FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE login_attempts (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(64) NOT NULL,
  email VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY login_attempts_window_idx (created_at),
  KEY login_attempts_email_idx (email, created_at),
  KEY login_attempts_ip_idx (ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE login_history (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY login_history_user_idx (user_id, created_at),
  CONSTRAINT login_history_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE auth_tokens (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  purpose ENUM('invite', 'reset', 'verify') NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY auth_tokens_hash_idx (token_hash),
  KEY auth_tokens_user_idx (user_id),
  CONSTRAINT auth_tokens_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Images et pièces jointes importées (stockées dans la base, comme avant ; tailles limitées côté serveur).
CREATE TABLE files (
  id CHAR(36) NOT NULL PRIMARY KEY,
  mime VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  data LONGBLOB NOT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT files_user_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE contact_messages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  handled_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  subject TEXT NULL,
  KEY contact_messages_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE newsletter_subscribers (
  email VARCHAR(255) NOT NULL PRIMARY KEY,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE partner_applications (
  id CHAR(36) NOT NULL PRIMARY KEY,
  legal_name TEXT NOT NULL,
  trade_name TEXT NOT NULL,
  head_office TEXT NOT NULL,
  agencies TEXT NOT NULL,
  siret TEXT NOT NULL,
  booking_email TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  kbis_name TEXT NULL,
  phone TEXT NULL,
  city TEXT NULL,
  login_email TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY partner_applications_status_idx (status, created_at),
  CONSTRAINT partner_applications_user_fk FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE chat_threads (
  id CHAR(36) NOT NULL PRIMARY KEY,
  partner_user_id CHAR(36) NOT NULL,
  partner_name TEXT NOT NULL,
  partner_email VARCHAR(255) NOT NULL,
  unread_admin INT NOT NULL DEFAULT 0,
  unread_partner INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  kind ENUM('partner', 'client') NOT NULL DEFAULT 'partner',
  subject TEXT NOT NULL,
  status ENUM('open', 'pending', 'closed') NOT NULL DEFAULT 'open',
  closed_at DATETIME(3) NULL,
  closed_by TEXT NULL,
  assigned_to CHAR(36) NULL,
  assigned_name TEXT NULL,
  first_response_at DATETIME(3) NULL,
  rating SMALLINT NULL,
  rating_comment TEXT NULL,
  auto_closed TINYINT(1) NOT NULL DEFAULT 0,
  KEY chat_threads_user_idx (partner_user_id, updated_at),
  CONSTRAINT chat_threads_user_fk FOREIGN KEY (partner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chat_threads_assigned_fk FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chat_threads_rating_chk CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE chat_messages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  thread_id CHAR(36) NOT NULL,
  sender ENUM('partner', 'admin', 'system', 'note') NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  author TEXT NULL,
  attachments JSON NOT NULL DEFAULT '[]',
  KEY chat_messages_thread_idx (thread_id, created_at),
  CONSTRAINT chat_messages_thread_fk FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE chat_canned (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE offer_requests (
  id CHAR(36) NOT NULL PRIMARY KEY,
  offer_id CHAR(36) NULL,
  offer_type VARCHAR(20) NOT NULL,
  offer_title TEXT NOT NULL,
  summary TEXT NULL,
  customer_name TEXT NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone TEXT NULL,
  travelers INT NOT NULL DEFAULT 1,
  total DECIMAL(10,2) NULL,
  message TEXT NULL,
  status ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  status_changed_at DATETIME(3) NULL,
  staff_seen_at DATETIME(3) NULL,
  client_seen_at DATETIME(3) NULL,
  trip_type ENUM('roundtrip', 'oneway') NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'none',
  stripe_session_id VARCHAR(255) COLLATE utf8mb4_bin NULL,
  stripe_payment_intent VARCHAR(255) COLLATE utf8mb4_bin NULL,
  paid_amount DECIMAL(10,2) NULL,
  paid_at DATETIME(3) NULL,
  cancel_token VARCHAR(255) COLLATE utf8mb4_bin NULL,
  partner_name TEXT NULL,
  KEY offer_requests_email_idx (customer_email),
  KEY offer_requests_status_idx (status, created_at),
  KEY offer_requests_session_idx (stripe_session_id),
  CONSTRAINT offer_requests_offer_fk FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE notifications (
  id CHAR(36) NOT NULL PRIMARY KEY,
  audience ENUM('staff', 'user') NOT NULL,
  user_id CHAR(36) NULL,
  kind VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NULL,
  link TEXT NULL,
  ref_id VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  read_at DATETIME(3) NULL,
  read_by CHAR(36) NULL,
  KEY notifications_user_idx (user_id, read_at, created_at),
  KEY notifications_staff_idx (audience, read_at, created_at),
  CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT notifications_readby_fk FOREIGN KEY (read_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE vehicle_blocks (
  id CHAR(36) NOT NULL PRIMARY KEY,
  vehicle_id CHAR(36) NOT NULL,
  start_at DATETIME(3) NOT NULL,
  end_at DATETIME(3) NOT NULL,
  reason TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY vehicle_blocks_idx (vehicle_id, start_at, end_at),
  CONSTRAINT vehicle_blocks_vehicle_fk FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT vehicle_blocks_chk CHECK (end_at > start_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE contacts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name TEXT NULL,
  phone TEXT NULL,
  sources JSON NOT NULL DEFAULT '[]',
  consent TINYINT(1) NOT NULL DEFAULT 0,
  consent_at DATETIME(3) NULL,
  unsubscribed_at DATETIME(3) NULL,
  requests_count INT NOT NULL DEFAULT 0,
  unsub_token VARCHAR(64) COLLATE utf8mb4_bin NOT NULL DEFAULT (REPLACE(UUID(), '-', '')),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY contacts_email_idx (email),
  UNIQUE KEY contacts_unsub_idx (unsub_token),
  KEY contacts_seen_idx (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE vehicle_categories (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image TEXT NULL,
  position INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY vehicle_categories_name_idx (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE site_events (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  kind VARCHAR(64) NOT NULL,
  `key` VARCHAR(255) NOT NULL,
  city TEXT NULL,
  country TEXT NULL,
  label TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY site_events_kind_idx (kind, created_at),
  KEY site_events_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE site_settings (
  `key` VARCHAR(190) NOT NULL PRIMARY KEY,
  value JSON NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_by TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE flight_leads (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  offer_id CHAR(36) NULL,
  airline TEXT NULL,
  route TEXT NULL,
  email VARCHAR(255) NOT NULL,
  consent TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY flight_leads_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE price_alerts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  from_city TEXT NULL,
  to_city TEXT NOT NULL,
  max_price DECIMAL(10,2) NULL,
  trip_type ENUM('any', 'roundtrip', 'oneway') NOT NULL DEFAULT 'any',
  direct_only TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  hits INT NOT NULL DEFAULT 0,
  last_hit_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY price_alerts_user_idx (user_id),
  CONSTRAINT price_alerts_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE price_alert_hits (
  alert_id CHAR(36) NOT NULL,
  offer_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (alert_id, offer_id),
  CONSTRAINT price_alert_hits_alert_fk FOREIGN KEY (alert_id) REFERENCES price_alerts(id) ON DELETE CASCADE,
  CONSTRAINT price_alert_hits_offer_fk FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE job_runs (
  name VARCHAR(100) NOT NULL PRIMARY KEY,
  last_run_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_created INT NOT NULL DEFAULT 0,
  last_replaced INT NOT NULL DEFAULT 0,
  last_by TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE schema_migrations (
  name VARCHAR(190) NOT NULL PRIMARY KEY,
  applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Données de départ.
INSERT INTO vehicle_categories (id, name, image, position) VALUES
  (UUID(), 'Mini (A)', '/assets/cat/mini.jpg', 1), (UUID(), 'Économique (B)', '/assets/cat/economique.jpg', 2),
  (UUID(), 'Compacte (C)', '/assets/cat/compacte.jpg', 3), (UUID(), 'Intermédiaire (D)', '/assets/cat/intermediaire.jpg', 4),
  (UUID(), 'Routière (E)', '/assets/cat/routiere.jpg', 5), (UUID(), 'SUV et Break', '/assets/cat/suv.jpg', 6),
  (UUID(), 'Monospace ou Minibus', '/assets/cat/monospace.jpg', 7), (UUID(), 'Utilitaire / Van', '/assets/cat/utilitaire.jpg', 8);
INSERT INTO site_settings (`key`, value) VALUES ('franchise_protection_per_day', '7');
INSERT INTO job_runs (name) VALUES ('auto_drafts');
INSERT INTO chat_canned (id, title, body, created_by, created_at) VALUES
  (UUID(), 'Prise en charge', 'Bonjour, merci pour votre message. Nous prenons votre demande en charge et revenons vers vous très vite.', 'TripVision', UTC_TIMESTAMP(3) - INTERVAL 3 SECOND),
  (UUID(), 'Précisions demandées', 'Bonjour, pour avancer pouvez-vous nous préciser la référence de la réservation concernée et ce que vous avez constaté ?', 'TripVision', UTC_TIMESTAMP(3) - INTERVAL 2 SECOND),
  (UUID(), 'Problème résolu', 'Bonjour, le point est réglé de notre côté. N’hésitez pas à nous écrire si besoin, bonne continuation !', 'TripVision', UTC_TIMESTAMP(3) - INTERVAL 1 SECOND);
