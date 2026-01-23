package dev.gustavorosa.cpsystem.api.response;

import dev.gustavorosa.cpsystem.model.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentResponse(
        Long id,
        Long clientId,
        Long paymentGroupId,
        String groupName,
        String payerName,
        String payerPhone,
        int installmentNumber,
        int totalInstallments,
        BigDecimal originalValue,
        BigDecimal overdueValue,
        LocalDate dueDate,
        LocalDate paymentDate,
        PaymentStatus paymentStatus,
        String observation
) {
}
