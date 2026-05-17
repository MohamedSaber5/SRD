package com.aast.booking.patterns.command;

/**
 * DESIGN PATTERN: Command
 * 
 * Problem Solved: Decouples the object that invokes the operation from the one that 
 *                 knows how to perform it. Allows for history, undo, and logging.
 */
public interface ICommand {
    void execute();
    void undo();
}
