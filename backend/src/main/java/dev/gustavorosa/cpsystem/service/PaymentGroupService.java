package dev.gustavorosa.cpsystem.service;

import dev.gustavorosa.cpsystem.api.request.CreatePaymentGroupRequest;
import dev.gustavorosa.cpsystem.model.Payment;
import dev.gustavorosa.cpsystem.model.PaymentGroup;
import dev.gustavorosa.cpsystem.model.factory.PaymentGroupFactory;
import dev.gustavorosa.cpsystem.repository.PaymentGroupRepository;
import dev.gustavorosa.cpsystem.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaymentGroupService {

    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private PaymentGroupRepository paymentGroupRepository;
    @Autowired
    private PaymentGroupFactory paymentGroupFactory;

    public void createPaymentGroup(CreatePaymentGroupRequest request) {
        PaymentGroup newPaymentGroup = paymentGroupFactory.buildPaymentGroup(request);
        paymentGroupRepository.save(newPaymentGroup);

        List<Payment> paymentList = paymentGroupFactory.buildPaymentList(newPaymentGroup, request);
        paymentRepository.saveAll(paymentList);
    }
}
