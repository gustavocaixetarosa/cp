package dev.gustavorosa.cpsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payment_groups")
public class PaymentGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "group_name", length = 100)
    private String groupName;

    @Column(name = "payer_document", nullable = false, length = 20)
    private String payerDocument;

    @Column(name = "payer_phone", length = 20)
    private String payerPhone;

    @Column(name = "total_installments", nullable = false)
    private Integer totalInstallments;

    @Column(name = "late_fee_rate", precision = 10, scale = 4)
    private BigDecimal lateFeeRate;

    @Column(name = "monthly_interest_rate", precision = 10, scale = 4)
    private BigDecimal monthlyInterestRate;

    @Column(name = "creation_date")
    private LocalDate creationDate;

    @Column(name = "observation")
    private String observation;
}
