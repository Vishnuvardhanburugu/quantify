package com.quantify.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantify.model.*;
import com.quantify.repository.ChatMessageRepository;
import com.quantify.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final AIContextBuilder contextBuilder;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    // ── Groq (primary - fast cloud LLM) ────────────────────────────
    @Value("${groq.api-key:}")
    private String groqApiKey;

    @Value("${groq.base-url:https://api.groq.com/openai/v1}")
    private String groqBaseUrl;

    @Value("${groq.model:llama3-8b-8192}")
    private String groqModel;

    @Value("${groq.timeout:30000}")
    private int groqTimeout;

    // ── Ollama (fallback - local dev) ───────────────────────────────
    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:llama3:latest}")
    private String ollamaModel;

    @Value("${ollama.timeout:120000}")
    private int ollamaTimeout;

    public List<ChatSession> getUserSessions(User user) {
        return sessionRepository.findByUserOrderByUpdatedAtDesc(user);
    }

    public ChatSession getSessionWithMessages(User user, Long sessionId) {
        return sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    @Transactional
    public Map<String, Object> sendMessage(User user, String message, Long sessionId) {
        ChatSession session;

        if (sessionId != null) {
            session = sessionRepository.findByIdAndUser(sessionId, user)
                    .orElseThrow(() -> new RuntimeException("Session not found"));
        } else {
            session = ChatSession.builder()
                    .user(user)
                    .title(generateSessionTitle(message))
                    .build();
            session = sessionRepository.save(session);
        }

        // Save user message
        ChatMessage userMessage = ChatMessage.builder()
                .session(session)
                .role(ChatMessage.Role.USER)
                .content(message)
                .build();
        userMessage = messageRepository.save(userMessage);

        // Build AI context and get response
        String context = contextBuilder.buildContext(user);
        String aiResponse = getAIResponse(context, message, session);

        // Save AI response
        ChatMessage assistantMessage = ChatMessage.builder()
                .session(session)
                .role(ChatMessage.Role.ASSISTANT)
                .content(aiResponse)
                .build();
        assistantMessage = messageRepository.save(assistantMessage);

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("sessionTitle", session.getTitle());
        response.put("userMessage", buildMessageDto(userMessage));
        response.put("assistantMessage", buildMessageDto(assistantMessage));

        return response;
    }

    @Transactional
    public void deleteSession(User user, Long sessionId) {
        sessionRepository.deleteByIdAndUser(sessionId, user);
    }

    private String getAIResponse(String context, String userMessage, ChatSession session) {
        try {
            List<ChatMessage> recentMessages = messageRepository
                    .findTop10BySessionOrderByCreatedAtDesc(session);
            Collections.reverse(recentMessages);

            String systemPrompt = buildSystemPrompt(context);

            // Try Groq first (fast cloud), fall back to Ollama (local)
            String response = null;
            if (groqApiKey != null && !groqApiKey.isBlank()) {
                log.debug("Using Groq API (model: {})", groqModel);
                response = callGroq(systemPrompt, recentMessages, userMessage);
            }

            if (response == null || response.isBlank()) {
                log.debug("Groq not available or returned empty — falling back to Ollama");
                response = callOllamaChat(systemPrompt, recentMessages, userMessage);
            }

            if (response == null || response.isBlank()) {
                throw new RuntimeException("Both Groq and Ollama returned empty responses");
            }

            return response;
        } catch (Exception e) {
            log.error("Error getting AI response: {}. Using template fallback.", e.getMessage());
            return getFallbackResponse(userMessage);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Groq API — OpenAI-compatible chat completions endpoint
    // ─────────────────────────────────────────────────────────────────
    private String callGroq(String systemPrompt, List<ChatMessage> history, String userMessage) {
        try {
            WebClient webClient = webClientBuilder.build();

            // Build OpenAI-style messages array
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));

            for (ChatMessage msg : history) {
                String role = msg.getRole() == ChatMessage.Role.USER ? "user" : "assistant";
                messages.add(Map.of("role", role, "content", msg.getContent()));
            }
            messages.add(Map.of("role", "user", "content", userMessage));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", groqModel);
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 600);
            requestBody.put("stream", false);

            String rawResponse = webClient.post()
                    .uri(groqBaseUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(groqTimeout))
                    .block();

            if (rawResponse != null) {
                JsonNode root = objectMapper.readTree(rawResponse);
                String text = root
                        .path("choices").get(0)
                        .path("message")
                        .path("content")
                        .asText();
                log.debug("Groq responded: {} chars", text.length());
                return text;
            }
        } catch (Exception e) {
            log.warn("Groq API error: {}", e.getMessage());
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────────
    // Ollama — local fallback (uses /api/chat with messages array)
    // ─────────────────────────────────────────────────────────────────
    private String callOllamaChat(String systemPrompt, List<ChatMessage> history, String userMessage) {
        try {
            WebClient webClient = webClientBuilder.build();

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            for (ChatMessage msg : history) {
                String role = msg.getRole() == ChatMessage.Role.USER ? "user" : "assistant";
                messages.add(Map.of("role", role, "content", msg.getContent()));
            }
            messages.add(Map.of("role", "user", "content", userMessage));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", ollamaModel);
            requestBody.put("messages", messages);
            requestBody.put("stream", false);
            requestBody.put("options", Map.of("temperature", 0.7, "num_predict", 500));

            String rawResponse = webClient.post()
                    .uri(ollamaBaseUrl + "/api/chat")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(ollamaTimeout))
                    .block();

            if (rawResponse != null) {
                JsonNode root = objectMapper.readTree(rawResponse);
                String text = root.path("message").path("content").asText();
                log.debug("Ollama responded: {} chars", text.length());
                return text;
            }
        } catch (Exception e) {
            log.warn("Ollama API error: {}", e.getMessage());
        }
        return null;
    }

    private String buildSystemPrompt(String context) {
        return """
                You are Quantify AI, a personalized trading assistant for the Quantify trading platform.
                You provide thoughtful, data-driven advice based on the user's trading history and portfolio.

                Your key responsibilities:
                1. Analyze the user's trading patterns and provide personalized insights
                2. Offer stock recommendations based on their risk profile and trading history
                3. Warn about potential emotional trading decisions
                4. Explain market concepts in simple terms
                5. Help users understand their portfolio performance

                Important guidelines:
                - Always consider the user's risk profile when giving advice
                - Reference their actual holdings and trades when relevant
                - Be concise but helpful
                - Avoid generic advice - personalize based on their data
                - If asked about specific stocks, consider their existing positions
                - Use ₹ (INR) for currency
                - Focus on NSE/BSE Indian stocks

                User Profile and Trading Data:
                """ + context;
    }

    private String getFallbackResponse(String userMessage) {
        String lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.contains("portfolio") || lowerMessage.contains("holdings")) {
            return "I can see you're asking about your portfolio. Based on your current holdings, " +
                    "your portfolio shows a mix of IT and banking stocks. Would you like me to analyze " +
                    "any specific holding or provide a detailed performance breakdown?";
        } else if (lowerMessage.contains("buy") || lowerMessage.contains("sell")) {
            return "Before making any trading decision, I'd recommend considering your current portfolio " +
                    "allocation and risk profile. What specific stock are you considering, and what's " +
                    "your investment thesis?";
        } else if (lowerMessage.contains("market") || lowerMessage.contains("today")) {
            return "The Indian markets have been showing mixed signals recently. Based on your portfolio " +
                    "composition, you may want to watch the IT and banking sectors closely. Would you like " +
                    "more specific analysis on any sector?";
        } else if (lowerMessage.contains("risk") || lowerMessage.contains("advice")) {
            return "Based on your trading history, I notice your risk profile is moderate. It's important " +
                    "to maintain diversification across sectors. Would you like me to review your current " +
                    "portfolio allocation?";
        }

        return "I'm here to help you with your trading decisions. I can analyze your portfolio, " +
                "provide insights on your trading patterns, or help you research specific stocks. " +
                "What would you like to explore?";
    }

    private String generateSessionTitle(String firstMessage) {
        if (firstMessage.length() > 50) {
            return firstMessage.substring(0, 47) + "...";
        }
        return firstMessage;
    }

    private Map<String, Object> buildMessageDto(ChatMessage message) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", message.getId());
        dto.put("role", message.getRole().name().toLowerCase());
        dto.put("content", message.getContent());
        dto.put("createdAt", message.getCreatedAt());
        return dto;
    }
}
