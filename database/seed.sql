USE parquin;

INSERT INTO vehicle_types (code, name, is_active) VALUES
  ('CAR', 'Carro', 1),
  ('MOTORCYCLE', 'Moto', 1),
  ('BICYCLE', 'Bicicleta', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  is_active = VALUES(is_active);

UPDATE tariff_rates SET is_active = 0 WHERE is_active = 1;

INSERT INTO tariff_rates (description, price_per_minute, is_active) VALUES
  ('Cobro por minuto de permanencia', 50.00, 1);
