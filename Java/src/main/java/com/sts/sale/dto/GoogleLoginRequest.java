package com.sts.sale.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Credential returned by Google Identity Services after account selection.
 */
@Data
public class GoogleLoginRequest {

    @NotBlank(message = "Google credential is required.")
    private String credential;

    public String getCredential() {
        return credential;
    }

    public void setCredential(String credential) {
        this.credential = credential;
    }
}
