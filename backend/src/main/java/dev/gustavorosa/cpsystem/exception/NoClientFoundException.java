package dev.gustavorosa.cpsystem.exception;

public class NoClientFoundException extends RuntimeException {
    public NoClientFoundException(String message) {
        super(message);
    }
}
