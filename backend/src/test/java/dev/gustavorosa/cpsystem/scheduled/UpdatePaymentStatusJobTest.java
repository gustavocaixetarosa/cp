package dev.gustavorosa.cpsystem.scheduled;

import dev.gustavorosa.cpsystem.model.Payment;
import dev.gustavorosa.cpsystem.model.PaymentGroup;
import dev.gustavorosa.cpsystem.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdatePaymentStatusJobTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private UpdatePaymentStatusJob updatePaymentStatusJob;

    @Test
    void updatePaymentOverdueValues_shouldCalculateCorrectFees() {
        // Given
        PaymentGroup group = PaymentGroup.builder()
                .lateFeeRate(BigDecimal.valueOf(0.02)) // 2% multa
                .monthlyInterestRate(BigDecimal.valueOf(0.03)) // 3% ao mês
                .build();

        Payment payment = Payment.builder()
                .originalValue(BigDecimal.valueOf(100.00))
                .dueDate(LocalDate.now().minusDays(10)) // 10 dias de atraso
                .paymentGroup(group)
                .build();

        when(paymentRepository.findAllOverdueWithGroup()).thenReturn(List.of(payment));

        // When
        updatePaymentStatusJob.updatePaymentOverdueValues();

        // Then
        // Multa: 100 * 0.02 = 2.00
        // Juros: (100 * (0.03 / 30)) * 10 dias = 1.00
        // Total esperado de atraso: 3.00
        
        ArgumentCaptor<List<Payment>> captor = ArgumentCaptor.forClass(List.class);
        verify(paymentRepository).saveAll(captor.capture());
        
        Payment updatedPayment = captor.getValue().get(0);
        assertEquals(0, BigDecimal.valueOf(3.00).compareTo(updatedPayment.getOverdueValue()));
        assertEquals(LocalDate.now(), updatedPayment.getOverdueValueDate());
    }

    @Test
    void updatePaymentOverdueValues_shouldDoNothing_ifDaysOverdueIsZeroOrLess() {
        Payment payment = Payment.builder()
                .dueDate(LocalDate.now())
                .paymentGroup(new PaymentGroup())
                .build();

        when(paymentRepository.findAllOverdueWithGroup()).thenReturn(List.of(payment));

        updatePaymentStatusJob.updatePaymentOverdueValues();

        verify(paymentRepository).saveAll(anyList());
        assertNull(payment.getOverdueValue());
    }
}

