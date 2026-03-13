package com.quantify.dto;

import com.quantify.model.User;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private User.RiskProfile riskProfile;
    private LocalDateTime createdAt;
}
