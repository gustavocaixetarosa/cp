package dev.gustavorosa.cpsystem.exception.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponse(
    int status,
    String message,
    LocalDateTime timestamp,
    List<String> details
) {
    public ErrorResponse(int status, String message) {
        this(status, message, LocalDateTime.now(), null);
    }
}

