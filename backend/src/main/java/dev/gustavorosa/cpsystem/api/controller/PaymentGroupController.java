package dev.gustavorosa.cpsystem.api.controller;

import dev.gustavorosa.cpsystem.api.request.CreatePaymentGroupRequest;
import dev.gustavorosa.cpsystem.service.PaymentGroupService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("v1/payment-group")
@Slf4j
public class PaymentGroupController {

    @Autowired
    private PaymentGroupService paymentGroupService;

    @PostMapping
    public ResponseEntity<Void> createPaymentGroup(@RequestBody CreatePaymentGroupRequest request) {
        log.info("[Entry - PaymentGroupController.createPaymentGroup] - Creating payment group: {}", request);
        paymentGroupService.createPaymentGroup(request);
        log.info("[Exit - PaymentGroupController.createPaymentGroup] - Payment group created successfully");
        return ResponseEntity.ok().build();
    }
}
