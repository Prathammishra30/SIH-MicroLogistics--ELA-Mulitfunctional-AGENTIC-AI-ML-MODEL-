package com.agriroute.dto;

import lombok.*;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElaToolRequest {
    private String toolName;
    private Map<String, Object> params;
    private String userId;
    private String role;
    private Boolean confirmed;
}