package util;

/** Console demonstration of a simple triangular truss. Shows math explanation. */
public class TrussDemo {
    public static void main(String[] args) {
        System.out.println("=== BridgeLab Truss Demo ===");
        System.out.println("Triangular truss: 3 joints, 3 beams, 2 supports (pinned + roller), 1 downward load.");
        System.out.println("Method of joints: for each free joint, sum Fx=0 and sum Fy=0.");
        System.out.println("Unknowns = member forces + reactions. Solve linear system A*x = b with Gaussian elimination.");
        System.out.println("Sign convention: positive = tension, negative = compression.");
        System.out.println("This demo prints the setup; actual forces computed by MethodOfJointsSolver when fully wired.");
    }
}
