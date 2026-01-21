package dev.gustavorosa.cpsystem.api.request;

import java.math.BigDecimal;

public record UpdateClientRequest(
    String clientName,
    String address,
    String phone,
    String document,
    String bank,
    BigDecimal lateFeeRate,
    BigDecimal monthlyInterestRate
) {
}

