-- Hosting mijozlari jadvali
CREATE TABLE IF NOT EXISTS hosting_clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    status_token VARCHAR(64) UNIQUE NOT NULL,
    
    -- To'lov ma'lumotlari
    monthly_price_uzs DECIMAL(15, 2) NOT NULL DEFAULT 0,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    payment_day INTEGER DEFAULT 1,
    
    -- Holat
    is_active BOOLEAN DEFAULT TRUE,
    server_status VARCHAR(20) DEFAULT 'active',
    
    -- Server ma'lumotlari
    server_ip VARCHAR(50),
    droplet_name VARCHAR(200),
    
    -- Vaqtlar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Hosting to'lovlar jadvali
CREATE TABLE IF NOT EXISTS hosting_payments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES hosting_clients(id) ON DELETE CASCADE,
    amount_uzs DECIMAL(15, 2) NOT NULL,
    months_paid INTEGER DEFAULT 1,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    period_start DATE,
    period_end DATE,
    confirmed_by VARCHAR(100) DEFAULT 'admin',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_hosting_clients_token ON hosting_clients(status_token);
CREATE INDEX IF NOT EXISTS idx_hosting_payments_client ON hosting_payments(client_id);

-- Test mijoz qo'shish
INSERT INTO hosting_clients (name, phone, status_token, monthly_price_uzs, balance, payment_day, server_ip, droplet_name)
VALUES ('Test Mijoz', '+998901234567', '97ab1e2fd81d19db8764e8853b905888', 150000, 300000, 1, '206.81.17.211', 'alisher-server')
ON CONFLICT (status_token) DO NOTHING;
