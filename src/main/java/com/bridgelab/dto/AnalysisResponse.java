package com.bridgelab.dto;

import java.util.*;

public record AnalysisResponse(String status, String message,
                                List<MemberResultDto> members,
                                List<ReactionDto> reactions,
                                SummaryDto summary) {}
