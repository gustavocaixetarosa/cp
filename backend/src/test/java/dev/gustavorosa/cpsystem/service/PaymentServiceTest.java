package dev.gustavorosa.cpsystem.service;

import dev.gustavorosa.cpsystem.api.request.UpdatePaymentRequest;
import dev.gustavorosa.cpsystem.api.response.PaymentResponse;
import dev.gustavorosa.cpsystem.exception.PaymentNotFoundException;
import dev.gustavorosa.cpsystem.model.Client;
import dev.gustavorosa.cpsystem.model.Payment;
import dev.gustavorosa.cpsystem.model.PaymentGroup;
import dev.gustavorosa.cpsystem.model.PaymentStatus;
import dev.gustavorosa.cpsystem.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    void updatePayment_shouldSetStatusToPaid_whenPaymentDateIsProvided() {
        Payment existingPayment = createMockPayment();
        UpdatePaymentRequest request = new UpdatePaymentRequest(
                null, null, LocalDate.now(), "Paid now"
        );

        when(paymentRepository.findById(1L)).thenReturn(Optional.of(existingPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArguments()[0]);

        PaymentResponse response = paymentService.updatePayment(1L, request);

        assertEquals(PaymentStatus.PAID, response.paymentStatus());
        assertEquals("Paid now", response.observation());
    }

    @Test
    void updatePayment_shouldSetStatusToOverdue_whenPaymentDateIsNullAndDueDatePassed() {
        Payment existingPayment = createMockPayment();
        UpdatePaymentRequest request = new UpdatePaymentRequest(
                null, LocalDate.now().minusDays(5), null, "Overdue logic"
        );

        when(paymentRepository.findById(1L)).thenReturn(Optional.of(existingPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArguments()[0]);

        PaymentResponse response = paymentService.updatePayment(1L, request);

        assertEquals(PaymentStatus.OVERDUE, response.paymentStatus());
    }

    @Test
    void updatePayment_shouldSetStatusToPending_whenPaymentDateIsNullAndDueDateIsFuture() {
        Payment existingPayment = createMockPayment();
        UpdatePaymentRequest request = new UpdatePaymentRequest(
                null, LocalDate.now().plusDays(5), null, "Pending logic"
        );

        when(paymentRepository.findById(1L)).thenReturn(Optional.of(existingPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArguments()[0]);

        PaymentResponse response = paymentService.updatePayment(1L, request);

        assertEquals(PaymentStatus.PENDING, response.paymentStatus());
    }

    @Test
    void updatePayment_shouldThrowException_whenPaymentNotFound() {
        when(paymentRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(PaymentNotFoundException.class, () -> 
                paymentService.updatePayment(1L, new UpdatePaymentRequest(null, null, null, null)));
    }

    private Payment createMockPayment() {
        Client client = new Client();
        client.setId(10L);
        
        PaymentGroup group = new PaymentGroup();
        group.setId(20L);

        return Payment.builder()
                .id(1L)
                .client(client)
                .paymentGroup(group)
                .payerName("Payer")
                .installmentNumber(1)
                .totalInstallments(1)
                .originalValue(BigDecimal.valueOf(100.0))
                .dueDate(LocalDate.now().plusDays(1))
                .paymentStatus(PaymentStatus.PENDING)
                .build();
    }
}

