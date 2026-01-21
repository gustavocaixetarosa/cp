package dev.gustavorosa.cpsystem.api.response;

import java.util.List;

public record GroupedPaymentResponse(
        PaymentResponse mainPayment,
        List<PaymentResponse> overduePayments
) {
}
