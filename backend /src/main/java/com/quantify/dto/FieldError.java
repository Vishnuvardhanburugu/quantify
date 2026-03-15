package com.quantify.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldError {
    private String field;
    private String message;
}
