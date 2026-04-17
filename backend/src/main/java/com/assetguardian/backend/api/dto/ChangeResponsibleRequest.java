package com.assetguardian.backend.api.dto;

import jakarta.validation.constraints.Size;

public record ChangeResponsibleRequest(
    Long employeeId,
    @Size(max = 2000)
    String notes
) {
}
