package com.bridgelab.solver;

/** Small custom Gaussian elimination with partial pivoting. No external libraries. */
public class GaussianEliminator {

    public static double[] solve(double[][] A, double[] b) throws SingularMatrixException {
        int n = b.length;
        // Deep copy to avoid mutating inputs
        double[][] M = new double[n][n + 1];
        for (int i = 0; i < n; i++) {
            System.arraycopy(A[i], 0, M[i], 0, n);
            M[i][n] = b[i];
        }

        // Partial pivoting elimination
        for (int k = 0; k < n; k++) {
            int maxRow = k;
            double maxVal = Math.abs(M[k][k]);
            for (int i = k + 1; i < n; i++) {
                if (Math.abs(M[i][k]) > maxVal) {
                    maxVal = Math.abs(M[i][k]);
                    maxRow = i;
                }
            }
            if (maxVal < 1e-12) {
                throw new SingularMatrixException("Matrix is singular or near-singular at pivot " + k);
            }
            // Swap rows
            double[] temp = M[k];
            M[k] = M[maxRow];
            M[maxRow] = temp;

            // Eliminate below
            for (int i = k + 1; i < n; i++) {
                double factor = M[i][k] / M[k][k];
                for (int j = k; j <= n; j++) {
                    M[i][j] -= factor * M[k][j];
                }
            }
        }

        // Back substitution
        double[] x = new double[n];
        for (int i = n - 1; i >= 0; i--) {
            double sum = M[i][n];
            for (int j = i + 1; j < n; j++) {
                sum -= M[i][j] * x[j];
            }
            x[i] = sum / M[i][i];
        }
        return x;
    }
}
