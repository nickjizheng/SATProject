package com.sts.sale.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Service
public class DictionaryService {

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String baseUrl;

    public DictionaryService(
        RestTemplate restTemplate,
        @Value("${dictionary.api.key}") String apiKey,
        @Value("${dictionary.api.base-url}") String baseUrl
    ) {
        this.restTemplate = restTemplate;
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    public Object getWordDefinition(String word) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Dictionary service is not configured.");
        }

        URI uri = UriComponentsBuilder.fromHttpUrl(baseUrl)
            .pathSegment(word)
            .queryParam("key", apiKey)
            .build()
            .encode()
            .toUri();
        return restTemplate.getForObject(uri, Object.class);
    }
}
