-- Qarz eslatmalari jadvali
-- User (admin/kassir) har bir mijoz uchun eslatma vaqtini belgilaydi

CREATE TABLE IF NOT EXISTS debt_reminders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    reminder_time TIME NOT NULL DEFAULT '10:00',
    message TEXT,
    is_sent BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    UNIQUE(customer_id, reminder_date, reminder_time)
);

CREATE INDEX IF NOT EXISTS idx_debt_reminders_customer ON debt_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_debt_reminders_date ON debt_reminders(reminder_date, reminder_time);
CREATE INDEX IF NOT EXISTS idx_debt_reminders_active ON debt_reminders(is_active, is_sent);
