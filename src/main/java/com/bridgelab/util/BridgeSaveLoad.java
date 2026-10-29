package com.bridgelab.util;

import com.bridgelab.model.*;
import java.nio.file.*;
import java.io.*;

/** Simple JSON-like save/load for design comparison and persistence. */
public class BridgeSaveLoad {
    public static void save(Bridge b, String path) throws IOException {
        try (PrintWriter pw = new PrintWriter(new FileWriter(path))) {
            pw.println("BridgeLab Save v1");
            pw.println("joints=" + b.getJoints().size());
            for (Joint j : b.getJoints()) {
                pw.println("J," + j.getId() + "," + j.getX() + "," + j.getY());
            }
            pw.println("members=" + b.getMembers().size());
            for (Member m : b.getMembers()) {
                pw.println("M," + m.getId() + "," + m.getJointA().getId() + "," + m.getJointB().getId() + "," + (m instanceof Beam ? ((Beam)m).getMaterial().getName() : "CABLE"));
            }
            pw.println("supports=" + b.getSupports().size());
            for (Support s : b.getSupports()) {
                pw.println("S," + s.getType() + "," + s.getJoint().getId());
            }
            pw.println("loads=" + b.getLoads().size());
            for (Load l : b.getLoads()) {
                pw.println("L," + l.getJoint().getId() + "," + l.getFx() + "," + l.getFy());
            }
        }
    }

    public static Bridge load(String path) throws IOException {
        Bridge b = new Bridge();
        try (BufferedReader br = new BufferedReader(new FileReader(path))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.startsWith("BridgeLab")) continue;
                String[] parts = line.split(",");
                if (parts.length < 2) continue;
                String type = parts[0];
                switch (type) {
                    case "J": b.addJoint(new Joint(Integer.parseInt(parts[1]), Double.parseDouble(parts[2]), Double.parseDouble(parts[3]))); break;
                    case "S": {
                        Joint j = b.findJointById(Integer.parseInt(parts[2]));
                        Support s = parts[1].equals("Pinned") ? new PinnedSupport(j) : new RollerSupport(j);
                        b.addSupport(s);
                        break;
                    }
                    case "L": b.addLoad(new Load(b.findJointById(Integer.parseInt(parts[1])), Double.parseDouble(parts[2]), Double.parseDouble(parts[3]))); break;
                    case "M": {
                        Joint a = b.findJointById(Integer.parseInt(parts[2]));
                        Joint c = b.findJointById(Integer.parseInt(parts[3]));
                        b.addMember(new Beam(Integer.parseInt(parts[1]), a, c, 300, Material.STEEL));
                        break;
                    }
                }
            }
        }
        return b;
    }
}
