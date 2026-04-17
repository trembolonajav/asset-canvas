package com.assetguardian.backend.api.dto;

import com.assetguardian.backend.domain.StationStatus;
import java.time.LocalDateTime;

public record StationResponse(
    Long id,
    String code,
    String name,
    String locationCode,
    String description,
    StationStatus status,
    String observation,
    Long spaceId,
    String spaceName,
    String layoutElementRef,
    LocalDateTime lastInventoryCheckAt,
    Long responsibleEmployeeId,
    String responsibleEmployeeName,
    Long responsibleDepartmentId,
    String responsibleDepartmentName,
    long assetCount
) {
}
