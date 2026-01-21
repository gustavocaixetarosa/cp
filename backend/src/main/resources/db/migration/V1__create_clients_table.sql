CREATE TABLE clients (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    document VARCHAR(14) NOT NULL UNIQUE,
    bank VARCHAR(100),
    late_fee_rate DECIMAL(10,4),
    monthly_interest_rate DECIMAL(10,4)
);
