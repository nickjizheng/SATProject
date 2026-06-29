package com.sts.sale.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

/**
 * Verifies Google credentials before any local account is created or linked.
 */
@Service
public class GoogleIdentityService {

    private final String clientId;
    private volatile GoogleIdTokenVerifier verifier;

    public GoogleIdentityService(@Value("${google.oauth.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    public boolean isConfigured() {
        return !clientId.isEmpty();
    }

    public String getClientId() {
        return clientId;
    }

    public GoogleProfile verify(String credential) {
        if (!isConfigured()) {
            throw new IllegalStateException("Google sign-in is not configured on this server.");
        }

        try {
            GoogleIdToken idToken = getVerifier().verify(credential);
            if (idToken == null) {
                throw new IllegalStateException("Google could not verify this sign-in attempt.");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new IllegalStateException("The Google account email is not verified.");
            }

            String email = payload.getEmail();
            String subject = payload.getSubject();
            if (email == null || email.isBlank() || subject == null || subject.isBlank()) {
                throw new IllegalStateException("Google did not provide the required account details.");
            }

            Object displayName = payload.get("name");
            return new GoogleProfile(subject, email.toLowerCase(), displayName == null ? null : displayName.toString());
        } catch (GeneralSecurityException | IOException e) {
            throw new IllegalStateException("Google sign-in verification is temporarily unavailable.", e);
        }
    }

    private GoogleIdTokenVerifier getVerifier() throws GeneralSecurityException, IOException {
        if (verifier == null) {
            synchronized (this) {
                if (verifier == null) {
                    verifier = new GoogleIdTokenVerifier.Builder(
                        GoogleNetHttpTransport.newTrustedTransport(),
                        GsonFactory.getDefaultInstance()
                    ).setAudience(Collections.singletonList(clientId)).build();
                }
            }
        }
        return verifier;
    }

    public record GoogleProfile(String subject, String email, String displayName) {
    }
}
