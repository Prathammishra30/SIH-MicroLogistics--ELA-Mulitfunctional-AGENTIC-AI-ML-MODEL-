package com.agriroute.dto;

import java.util.Map;

public class ElaToolRequest {
    private String toolName;
    private Map<String, Object> params;
    private String userId;
    private String role;
    private boolean confirmed;

    public ElaToolRequest() {}

    public ElaToolRequest(String toolName, Map<String, Object> params, String userId, String role, boolean confirmed) {
        this.toolName = toolName;
        this.params = params;
        this.userId = userId;
        this.role = role;
        this.confirmed = confirmed;
    }

    public String getToolName() { return toolName; }
    public void setToolName(String toolName) { this.toolName = toolName; }

    public Map<String, Object> getParams() { return params; }
    public void setParams(Map<String, Object> params) { this.params = params; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isConfirmed() { return confirmed; }
    public void setConfirmed(boolean confirmed) { this.confirmed = confirmed; }
}
