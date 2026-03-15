package com.quantify.controller;

import com.quantify.model.ChatSession;
import com.quantify.model.User;
import com.quantify.service.AuthService;
import com.quantify.service.ChatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> sendMessage(@Valid @RequestBody ChatRequest request) {
        User user = authService.getCurrentUser();
        Map<String, Object> response = chatService.sendMessage(
                user,
                request.getMessage(),
                request.getSessionId()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> getSessions() {
        User user = authService.getCurrentUser();
        List<ChatSession> sessions = chatService.getUserSessions(user);
        
        List<Map<String, Object>> response = sessions.stream()
                .map(this::mapSessionToResponse)
                .toList();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<Map<String, Object>> getSession(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        ChatSession session = chatService.getSessionWithMessages(user, id);
        
        Map<String, Object> response = mapSessionToResponse(session);
        response.put("messages", session.getMessages().stream()
                .map(msg -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", msg.getId());
                    m.put("role", msg.getRole().name().toLowerCase());
                    m.put("content", msg.getContent());
                    m.put("createdAt", msg.getCreatedAt());
                    return m;
                })
                .toList());
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Map<String, String>> deleteSession(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        chatService.deleteSession(user, id);
        return ResponseEntity.ok(Map.of("message", "Session deleted successfully"));
    }

    private Map<String, Object> mapSessionToResponse(ChatSession session) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", session.getId());
        map.put("title", session.getTitle());
        map.put("createdAt", session.getCreatedAt());
        map.put("updatedAt", session.getUpdatedAt());
        return map;
    }

    @Data
    static class ChatRequest {
        @NotBlank(message = "Message is required")
        private String message;

        private Long sessionId;
    }
}
