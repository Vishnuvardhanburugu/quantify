package com.quantify.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDto {
    private Long id;
    private String role;
    private String content;
    private LocalDateTime createdAt;
}
