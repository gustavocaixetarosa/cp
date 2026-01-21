DO $$
DECLARE
    client_id_val BIGINT;
    group_id_val BIGINT;
    i INTEGER;
    j INTEGER;
    k INTEGER;
    base_date DATE := '2025-01-10';
    client_names TEXT[] := ARRAY['Construtora Horizonte', 'Tecnologia Avançada S.A.', 'Distribuidora Aliança'];
    payer_names TEXT[] := ARRAY['João Silva', 'Maria Oliveira', 'Carlos Souza', 'Ana Santos', 'Paulo Lima', 'Juliana Costa'];
BEGIN
    FOR i IN 1..3 LOOP
        INSERT INTO clients (name, address, phone, document, bank, late_fee_rate, monthly_interest_rate)
        VALUES (
            client_names[i], 
            'Rua das Palmeiras, ' || (100 * i) || ', São Paulo - SP', 
            '119' || (90000000 + (i * 1234)), 
            LPAD((12345678000100 + i)::TEXT, 14, '0'), 
            CASE i WHEN 1 THEN 'Itaú' WHEN 2 THEN 'Bradesco' ELSE 'Santander' END, 
            0.02,
            0.10
        )
        RETURNING id INTO client_id_val;

        FOR j IN 1..2 LOOP
            INSERT INTO payment_groups (client_id, group_name, payer_document, total_installments, late_fee_rate, monthly_interest_rate, creation_date, observation)
            VALUES (
                client_id_val, 
                'Contrato de Serviço #' || (1000 + (i * 10) + j), 
                LPAD((44455566600 + i + j)::TEXT, 11, '0'), 
                12, 
                0.02,
                0.10,
                base_date - INTERVAL '1 month',
                'Contrato anual de prestação de serviços para ' || client_names[i]
            )
            RETURNING id INTO group_id_val;

            FOR k IN 1..10 LOOP
                INSERT INTO payments (
                    client_id, 
                    payment_group, 
                    payer_name, 
                    payer_document, 
                    installment_number, 
                    total_installments, 
                    original_value, 
                    due_date, 
                    payment_date, 
                    payment_status, 
                    observation
                )
                VALUES (
                    client_id_val, 
                    group_id_val, 
                    payer_names[((i+j+k) % 6) + 1], 
                    LPAD((44455566600 + i + j)::TEXT, 11, '0'), 
                    k, 
                    12, 
                    1250.00 + (j * 100) + (k * 5), 
                    (base_date + (k - 1 || ' months')::interval), 
                    CASE 
                        WHEN k < 2 THEN (base_date + (k - 1 || ' months')::interval - INTERVAL '2 days')
                        ELSE NULL 
                    END,
                    CASE 
                        WHEN k < 2 THEN 'PAID'
                        WHEN (base_date + (k - 1 || ' months')::interval) < CURRENT_DATE THEN 'OVERDUE'
                        ELSE 'PENDING'
                    END, 
                    'Parcela ' || k || ' de 12 - Ref. ' || TO_CHAR(base_date + (k - 1 || ' months')::interval, 'MM/YYYY')
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
