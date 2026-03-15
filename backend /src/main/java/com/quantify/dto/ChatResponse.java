package com.quantify.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponse {
    private Long sessionId;
    private String sessionTitle;
    private MessageDto userMessage;
    private MessageDto assistantMessage;
}
