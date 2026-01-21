package dev.gustavorosa.cpsystem.api.controller;

import dev.gustavorosa.cpsystem.scheduled.UpdatePaymentStatusJob;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("v1/test")
public class TestController {

    @Autowired
    private UpdatePaymentStatusJob jobService;

    @GetMapping
    public void testJob() {
        jobService.updatePaymentStatus();
        jobService.updatePaymentOverdueValues();
    }
}
