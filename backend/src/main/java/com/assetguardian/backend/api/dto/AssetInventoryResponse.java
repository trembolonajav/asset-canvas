package com.assetguardian.backend.api.dto;

import com.assetguardian.backend.domain.AssetOrigin;
import com.assetguardian.backend.domain.AssetStatus;
import com.assetguardian.backend.domain.StationStatus;
import java.time.LocalDateTime;

public record AssetInventoryResponse(
    Long assetId,
    String assetCode,
    String assetType,
    String assetDescription,
    String serialNumber,
    AssetStatus assetStatus,
    AssetOrigin assetOrigin,
    Long stationId,
    String stationCode,
    String stationName,
    StationStatus stationStatus,
    Long employeeId,
    String employeeName,
    Long departmentId,
    String departmentName,
    LocalDateTime assignedAt,
    LocalDateTime lastInventoryCheckAt,
    LocalDateTime assetUpdatedAt
) {
}
