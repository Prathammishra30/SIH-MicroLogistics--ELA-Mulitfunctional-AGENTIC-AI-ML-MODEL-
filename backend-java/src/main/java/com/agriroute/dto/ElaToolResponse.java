package com.agriroute.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElaToolResponse {
    private String toolName;
    private Boolean success;
    private String message;
    private Object data;
    private String error;

    public static ElaToolResponse ok(String toolName, String message, Object data) {
        return ElaToolResponse.builder()
                .toolName(toolName)
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static ElaToolResponse fail(String toolName, String error) {
        return ElaToolResponse.builder()
                .toolName(toolName)
                .success(false)
                .error(error)
                .build();
    }
}