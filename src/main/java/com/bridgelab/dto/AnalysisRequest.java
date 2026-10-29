package com.bridgelab.dto;

import java.util.*;

public record AnalysisRequest(List<JointDto> joints, List<BeamDto> beams,
                              List<SupportDto> supports, List<LoadDto> loads,
                              double overloadLimit) {}
