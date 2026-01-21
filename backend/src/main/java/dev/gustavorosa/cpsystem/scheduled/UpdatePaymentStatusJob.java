package dev.gustavorosa.cpsystem.scheduled;

import dev.gustavorosa.cpsystem.model.Payment;
import dev.gustavorosa.cpsystem.model.PaymentGroup;
import dev.gustavorosa.cpsystem.repository.PaymentRepository;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class UpdatePaymentStatusJob {

    @Autowired
    private PaymentRepository paymentRepository;

    @Scheduled(cron = "0 0 2 * * *", zone = "America/Sao_Paulo")
    public void updatePaymentStatus() {
        log.info("Starting update of payment status...");
        int affectedRows = paymentRepository.updatePaymentStatus();
        log.info("Update payment status job done. {} rows updated!", affectedRows);
    }


    @Scheduled(cron = "0 30 2 * * *", zone = "America/Sao_Paulo") 
    public void updatePaymentOverdueValues() {
    log.info("Starting update of overdue payment values...");
    int updatedPayments = 0;
    
    List<Payment> overduePayments = paymentRepository.findAllOverdueWithGroup();
    long today = LocalDate.now().toEpochDay();

    for (Payment payment : overduePayments) {
        // if (payment.getOverdueValueDate().isEqual(LocalDate.now())) continue;

        PaymentGroup group = payment.getPaymentGroup();
        if (group == null) continue;

        BigDecimal originalValue = payment.getOriginalValue();
        long dueDate = payment.getDueDate().toEpochDay();
        long daysOverdue = today - dueDate;

        if (daysOverdue <= 0) continue;

        BigDecimal lateFee = originalValue.multiply(group.getLateFeeRate());

        BigDecimal dailyInterestRate = group.getMonthlyInterestRate()
                .divide(BigDecimal.valueOf(30), 10, RoundingMode.HALF_UP);
        BigDecimal totalInterest = originalValue.multiply(dailyInterestRate)
                .multiply(BigDecimal.valueOf(daysOverdue));

        BigDecimal totalToIncrement = lateFee.add(totalInterest);

        payment.setOverdueValue(originalValue.add(totalToIncrement));
        payment.setOverdueValueDate(LocalDate.now());
        updatedPayments++;
    }

    paymentRepository.saveAll(overduePayments);
    log.info("Finished updating values for {} payments.", updatedPayments);
}
}
