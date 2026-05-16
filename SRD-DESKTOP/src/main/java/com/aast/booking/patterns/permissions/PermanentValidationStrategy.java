package com.aast.booking.patterns.permissions;
 
/**
 * STRATEGY PATTERN: Concrete Strategy
 * Permanent delegation is always valid.
 */
public class PermanentValidationStrategy implements DelegationStrategy {
    @Override
    public boolean isValid() {
        return true;
    }
 
    @Override
    public String getType() {
        return "permanent";
    }
}
