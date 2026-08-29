package com.agriroute.dto;

public class ElaToolResponse {
    private String toolName;
    private boolean success;
    private Object data;
    private String message;
    private String error;
    private String timestamp;

    public ElaToolResponse() {
        this.timestamp = java.time.LocalDateTime.now().toString();
    }

    public static ElaToolResponse ok(String toolName, String message, Object data) {
        ElaToolResponse r = new ElaToolResponse();
        r.toolName = toolName;
        r.success = true;
        r.message = message;
        r.data = data;
        return r;
    }

    public static ElaToolResponse fail(String toolName, String error) {
        ElaToolResponse r = new ElaToolResponse();
        r.toolName = toolName;
        r.success = false;
        r.error = error;
        r.message = error;
        return r;
    }

    public String getToolName() { return toolName; }
    public boolean isSuccess() { return success; }
    public Object getData() { return data; }
    public String getMessage() { return message; }
    public String getError() { return error; }
    public String getTimestamp() { return timestamp; }
}
