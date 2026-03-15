package com.quantify.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationErrorResponse {
    private int status;
    private String message;
    private List<FieldError> errors;
    private LocalDateTime timestamp;
}
