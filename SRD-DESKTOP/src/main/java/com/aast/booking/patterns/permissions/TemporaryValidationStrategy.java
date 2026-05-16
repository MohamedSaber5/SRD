package com.aast.booking.patterns.permissions;
 
import java.time.LocalDateTime;
 
/**
 * STRATEGY PATTERN: Concrete Strategy
 * Temporary delegation is valid only within the specified date/time range.
 */
public class TemporaryValidationStrategy implements DelegationStrategy {
    private LocalDateTime start;
    private LocalDateTime end;
 
    public TemporaryValidationStrategy(LocalDateTime start, LocalDateTime end) {
        this.start = start;
        this.end = end;
    }
 
    @Override
    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return !now.isBefore(start) && !now.isAfter(end);
    }
 
    public LocalDateTime getStart() { return start; }
    public LocalDateTime getEnd() { return end; }
 
    @Override
    public String getType() {
        return "temporary";
    }
}
