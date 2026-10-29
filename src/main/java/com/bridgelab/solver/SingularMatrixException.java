package com.bridgelab.solver;

/** Thrown when matrix is singular and cannot be solved by elimination. */
public class SingularMatrixException extends Exception {
    public SingularMatrixException(String msg) { super(msg); }
}
