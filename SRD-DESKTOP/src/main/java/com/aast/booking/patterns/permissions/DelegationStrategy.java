package com.aast.booking.patterns.permissions;
 
import java.time.LocalDate;
 
/**
 * STRATEGY PATTERN: Strategy Interface
 * Defines how to validate a permission delegation.
 */
public interface DelegationStrategy {
    boolean isValid();
    String getType();
}
