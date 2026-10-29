package com.bridgelab.dto;

public record MemberResultDto(String id, double force, String type,
                              boolean overloaded, double utilization, double length) {}
