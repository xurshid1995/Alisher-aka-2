-- Tugallanmagan mahsulot qo'shish sessiyalari jadvali
CREATE TABLE IF NOT EXISTS pending_product_batches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_product_batches_user_id ON pending_product_batches(user_id);
