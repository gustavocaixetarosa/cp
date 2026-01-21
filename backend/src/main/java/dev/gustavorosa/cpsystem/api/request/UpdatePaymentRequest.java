package dev.gustavorosa.cpsystem.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdatePaymentRequest(
    BigDecimal originalValue,
    LocalDate dueDate,
    LocalDate paymentDate,
    String observation
) {
}

