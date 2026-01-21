CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    payment_group BIGINT,
    payer_name VARCHAR(50) NOT NULL,
    payer_document VARCHAR(14),
    installment_number INTEGER NOT NULL,
    total_installments INTEGER NOT NULL,
    original_value DECIMAL(10,2) NOT NULL,
    overdue_value DECIMAL(10,2),
    overdue_value_date DATE,
    due_date DATE NOT NULL,
    payment_date DATE,
    payment_status VARCHAR(20) NOT NULL,
    observation VARCHAR(400),

    CONSTRAINT fk_client
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,

    CONSTRAINT fk_payment_group
        FOREIGN KEY (payment_group) REFERENCES payment_groups(id)
);
