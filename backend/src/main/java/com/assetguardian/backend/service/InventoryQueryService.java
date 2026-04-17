package com.assetguardian.backend.service;

import com.assetguardian.backend.api.dto.AssetInventoryResponse;
import com.assetguardian.backend.domain.AssetStatus;
import com.assetguardian.backend.readmodel.AssetInventoryView;
import com.assetguardian.backend.repository.AssetInventoryViewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InventoryQueryService {

    private final AssetInventoryViewRepository assetInventoryViewRepository;

    public Page<AssetInventoryResponse> listAssets(
        String search,
        AssetStatus status,
        Long stationId,
        Long employeeId,
        Long departmentId,
        Pageable pageable
    ) {
        return assetInventoryViewRepository.findInventory(search, status, stationId, employeeId, departmentId, pageable)
            .map(this::toResponse);
    }

    private AssetInventoryResponse toResponse(AssetInventoryView view) {
        return new AssetInventoryResponse(
            view.getAssetId(),
            view.getAssetCode(),
            view.getAssetType(),
            view.getAssetDescription(),
            view.getSerialNumber(),
            view.getAssetStatus(),
            view.getAssetOrigin(),
            view.getStationId(),
            view.getStationCode(),
            view.getStationName(),
            view.getStationStatus(),
            view.getEmployeeId(),
            view.getEmployeeName(),
            view.getDepartmentId(),
            view.getDepartmentName(),
            view.getAssignedAt(),
            view.getLastInventoryCheckAt(),
            view.getAssetUpdatedAt()
        );
    }
}
