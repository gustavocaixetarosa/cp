package dev.gustavorosa.cpsystem.service;

import dev.gustavorosa.cpsystem.api.request.UpdateClientRequest;
import dev.gustavorosa.cpsystem.exception.NoClientFoundException;
import dev.gustavorosa.cpsystem.model.Client;
import dev.gustavorosa.cpsystem.repository.ClientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClientServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private ClientService clientService;

    @Test
    void findClientById_shouldReturnClient_whenIdExists() {
        Client client = new Client();
        client.setId(1L);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));

        Client result = clientService.findClientById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void findClientById_shouldThrowException_whenIdDoesNotExist() {
        when(clientRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(NoClientFoundException.class, () -> clientService.findClientById(1L));
    }

    @Test
    void updateClient_shouldUpdateOnlyProvidedFields() {
        Client existingClient = new Client();
        existingClient.setId(1L);
        existingClient.setName("Old Name");
        existingClient.setAddress("Old Address");

        UpdateClientRequest request = new UpdateClientRequest(
                "new name", 
                null, 
                null, 
                null, 
                null, 
                BigDecimal.valueOf(2.0), 
                null
        );

        when(clientRepository.findById(1L)).thenReturn(Optional.of(existingClient));
        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArguments()[0]);

        Client updated = clientService.updateClient(1L, request);

        assertEquals("New Name", updated.getName()); // Title Case
        assertEquals("Old Address", updated.getAddress()); // Kept old
        assertEquals(BigDecimal.valueOf(2.0), updated.getLateFeeRate()); // Updated
    }
}

