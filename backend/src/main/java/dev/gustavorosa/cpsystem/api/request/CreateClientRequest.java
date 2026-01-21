package dev.gustavorosa.cpsystem.api.request;

import dev.gustavorosa.cpsystem.model.Client;
import dev.gustavorosa.cpsystem.utils.NameUtils;

import java.math.BigDecimal;

public record CreateClientRequest(
    String clientName,
    String address,
    String phone,
    String document,
    String bank,
    BigDecimal lateFeeRate,
    BigDecimal monthlyInterestRate
) {

    public Client toModel() {
        return Client.builder()
                .name(NameUtils.toTitleCase(clientName))
                .address(address)
                .bank(bank)
                .document(document)
                .phone(phone)
                .lateFeeRate(lateFeeRate)
                .monthlyInterestRate(monthlyInterestRate)
                .build();
    }
}
