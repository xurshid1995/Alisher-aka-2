-- Hosting Widget uchun minimal jadvallar
-- Faqat mijozlar uchun widget ma'lumotlari

-- Hosting mijozlar jadvali
CREATE TABLE IF NOT EXISTS hosting_clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    status_token VARCHAR(64) UNIQUE NOT NULL,
    monthly_price_uzs DECIMAL(15,2) NOT NULL DEFAULT 0,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    server_status VARCHAR(20) DEFAULT 'active',
    next_payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- To'lovlar jadvali
CREATE TABLE IF NOT EXISTS hosting_payments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES hosting_clients(id) ON DELETE CASCADE,
    amount_uzs DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Indexlar
CREATE INDEX IF NOT EXISTS idx_hosting_clients_token ON hosting_clients(status_token);
CREATE INDEX IF NOT EXISTS idx_hosting_payments_client ON hosting_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_hosting_payments_date ON hosting_payments(payment_date DESC);

-- Test mijoz (rasmda ko'rsatilgan ma'lumotlar)
INSERT INTO hosting_clients (name, status_token, monthly_price_uzs, balance, server_status, next_payment_date)
VALUES ('Test Mijoz', 'e88d2356c61bcb30a2212493f506b6d4', 360000, 373140000, 'active', '2025-06-15')
ON CONFLICT (status_token) DO NOTHING;

-- Test to'lov
INSERT INTO hosting_payments (client_id, amount_uzs, payment_date, notes)
VALUES (
    (SELECT id FROM hosting_clients WHERE status_token = 'e88d2356c61bcb30a2212493f506b6d4'),
    31095000,
    CURRENT_TIMESTAMP,
    'Test to''lov'
) ON CONFLICT DO NOTHING;
