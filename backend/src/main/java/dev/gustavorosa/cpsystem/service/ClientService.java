package dev.gustavorosa.cpsystem.service;

import dev.gustavorosa.cpsystem.api.request.CreateClientRequest;
import dev.gustavorosa.cpsystem.api.request.UpdateClientRequest;
import dev.gustavorosa.cpsystem.exception.NoClientFoundException;
import dev.gustavorosa.cpsystem.model.Client;
import dev.gustavorosa.cpsystem.repository.ClientRepository;
import dev.gustavorosa.cpsystem.utils.NameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    public Long createClient(CreateClientRequest clientRequest) {
        Client savedClient = clientRepository.save(clientRequest.toModel());
        return savedClient.getId();
    }

    public List<Client> findAllClients() {
        List<Client> allClients = clientRepository.findAll();
        if (allClients.isEmpty()) {
            throw new NoClientFoundException("No client found");
        }
        return allClients;
    }

    public Client findClientById(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new NoClientFoundException("Client with id " + id + " not found"));
    }

    public Client updateClient(Long id, UpdateClientRequest updateRequest) {
        Client client = findClientById(id);

        if (updateRequest.clientName() != null) {
            client.setName(NameUtils.toTitleCase(updateRequest.clientName()));
        }
        if (updateRequest.address() != null) {
            client.setAddress(updateRequest.address());
        }
        if (updateRequest.phone() != null) {
            client.setPhone(updateRequest.phone());
        }
        if (updateRequest.document() != null) {
            client.setDocument(updateRequest.document());
        }
        if (updateRequest.bank() != null) {
            client.setBank(updateRequest.bank());
        }
        if (updateRequest.lateFeeRate() != null) {
            client.setLateFeeRate(updateRequest.lateFeeRate());
        }
        if (updateRequest.monthlyInterestRate() != null) {
            client.setMonthlyInterestRate(updateRequest.monthlyInterestRate());
        }

        return clientRepository.save(client);
    }

    public void deleteClient(Long id) {
        Client client = findClientById(id);
        clientRepository.delete(client);
    }
}
