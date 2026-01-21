package dev.gustavorosa.cpsystem.repository;

import dev.gustavorosa.cpsystem.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
}
