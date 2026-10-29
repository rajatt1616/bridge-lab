package com.bridgelab.dto;

public record SummaryDto(String maxForceMember, double maxUtilization,
                         int overloadedCount, double totalLength, boolean pass,
                         double totalLoad, double capacity) {}
