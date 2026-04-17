package com.assetguardian.backend.api.dto;

import com.assetguardian.backend.domain.EmployeeStatus;

public record EmployeeResponse(
    Long id,
    String fullName,
    String cpf,
    EmployeeStatus status,
    Long departmentId,
    String departmentName,
    Long stationId,
    String stationCode
) {
}
