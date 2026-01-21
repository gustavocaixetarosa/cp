CREATE TABLE payment_groups (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    group_name VARCHAR(100),
    payer_document VARCHAR(20) NOT NULL,
    total_installments INTEGER NOT NULL,
    late_fee_rate DECIMAL(10,4),
    monthly_interest_rate DECIMAL(10,4),
    creation_date DATE DEFAULT CURRENT_DATE,
    observation VARCHAR(400),

    CONSTRAINT fk_group_client
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
