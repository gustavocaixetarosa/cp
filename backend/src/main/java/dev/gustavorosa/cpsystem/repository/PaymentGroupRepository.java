package dev.gustavorosa.cpsystem.repository;

import dev.gustavorosa.cpsystem.model.PaymentGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentGroupRepository extends JpaRepository<PaymentGroup, Long> {
    long countByPayerDocument(String payerDocument);
}
