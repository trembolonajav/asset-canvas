import { create } from 'zustand';
import { inventoryApi } from '@/lib/inventory-api';
import type { LayoutElement, EditorMode, ElementType, Layout } from '../types/inventoryMap.types';
import { mockLayout } from '../data/mockData';

const GRID_SIZE = 20;

const snapToGrid = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

let nextId = 100;
const genId = () => `el-${nextId++}`;

function createEmptyLayout(spaceId: string, spaceName: string): Layout {
  return {
    id: `layout-${spaceId}`,
    name: spaceName,
    code: spaceId,
    width: 1200,
    height: 800,
    spaceId,
    elements: [],
  };
}

interface InventoryMapState {
  layout: Layout;
  activeSpaceId: string | null;
  mode: EditorMode;
  selectedElementId: string | null;
  hoveredElementId: string | null;
  inspectedStationId: string | null;
  showGrid: boolean;
  scale: number;
  stagePosition: { x: number; y: number };
  placingType: ElementType | null;
  isSaving: boolean;

  setMode: (mode: EditorMode) => void;
  selectElement: (id: string | null) => void;
  hoverElement: (id: string | null) => void;
  inspectStation: (stationId: string | null) => void;
  toggleGrid: () => void;
  setScale: (scale: number) => void;
  setStagePosition: (pos: { x: number; y: number }) => void;
  startPlacing: (type: ElementType) => void;
  cancelPlacing: () => void;

  addElement: (x: number, y: number) => void;
  moveElement: (id: string, x: number, y: number) => void;
  updateElement: (id: string, updates: Partial<LayoutElement>) => void;
  rotateElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  deleteElement: (id: string) => void;

  saveLayout: () => Promise<void>;
  loadLayout: (spaceId?: string, spaceName?: string) => Promise<void>;
  switchToSpace: (spaceId: string, spaceName: string) => Promise<void>;
}

const defaultsForType = (type: ElementType): Partial<LayoutElement> => {
  switch (type) {
    case 'WALL': return { width: 200, height: 8, layer: 'structural', zIndex: 1 };
    case 'PARTITION': return { width: 160, height: 4, layer: 'structural', zIndex: 2 };
    case 'DESK': return { width: 140, height: 70, layer: 'furniture', zIndex: 10 };
    case 'CHAIR': return { width: 40, height: 40, layer: 'furniture', zIndex: 9 };
    case 'LABEL': return { width: 100, height: 24, layer: 'labels', zIndex: 20, label: 'Rótulo' };
    case 'ROOM_BLOCK': return { width: 200, height: 150, layer: 'structural', zIndex: 0 };
    default: return { width: 100, height: 50, layer: 'furniture', zIndex: 5 };
  }
};

const normalizeLayout = (layout: Layout): Layout => ({
  ...layout,
  id: layout.id || `layout-${layout.spaceId || 'default'}`,
  elements: [...layout.elements].sort((a, b) => a.zIndex - b.zIndex),
});

export const useInventoryMapStore = create<InventoryMapState>((set, get) => ({
  layout: mockLayout,
  activeSpaceId: mockLayout.spaceId || null,
  mode: 'VIEW',
  selectedElementId: null,
  hoveredElementId: null,
  inspectedStationId: null,
  showGrid: true,
  scale: 1,
  stagePosition: { x: 0, y: 0 },
  placingType: null,
  isSaving: false,

  setMode: (mode) => set({ mode, selectedElementId: null, placingType: null }),
  selectElement: (id) => set({ selectedElementId: id }),
  hoverElement: (id) => set({ hoveredElementId: id }),
  inspectStation: (stationId) => set({ inspectedStationId: stationId }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  setScale: (scale) => set({ scale: Math.max(0.3, Math.min(3, scale)) }),
  setStagePosition: (pos) => set({ stagePosition: pos }),
  startPlacing: (type) => set({ placingType: type }),
  cancelPlacing: () => set({ placingType: null }),

  addElement: (x, y) => {
    const { placingType } = get();
    if (!placingType) return;
    const defaults = defaultsForType(placingType);
    const el: LayoutElement = {
      id: genId(),
      elementType: placingType,
      x: snapToGrid(x),
      y: snapToGrid(y),
      width: defaults.width!,
      height: defaults.height!,
      rotation: 0,
      layer: defaults.layer!,
      zIndex: defaults.zIndex!,
      label: defaults.label,
    };
    set((s) => ({
      layout: normalizeLayout({ ...s.layout, elements: [...s.layout.elements, el] }),
      placingType: null,
      selectedElementId: el.id,
    }));
  },

  moveElement: (id, x, y) => {
    set((s) => ({
      layout: normalizeLayout({
        ...s.layout,
        elements: s.layout.elements.map((el) => el.id === id ? { ...el, x: snapToGrid(x), y: snapToGrid(y) } : el),
      }),
    }));
  },

  updateElement: (id, updates) => {
    set((s) => ({
      layout: normalizeLayout({
        ...s.layout,
        elements: s.layout.elements.map((el) => el.id === id ? { ...el, ...updates } : el),
      }),
    }));
  },

  rotateElement: (id) => {
    set((s) => ({
      layout: normalizeLayout({
        ...s.layout,
        elements: s.layout.elements.map((el) => el.id === id ? { ...el, rotation: (el.rotation + 90) % 360 } : el),
      }),
    }));
  },

  duplicateElement: (id) => {
    const el = get().layout.elements.find((element) => element.id === id);
    if (!el) return;
    const newEl = { ...el, id: genId(), x: el.x + 20, y: el.y + 20, stationId: undefined };
    set((s) => ({
      layout: normalizeLayout({ ...s.layout, elements: [...s.layout.elements, newEl] }),
      selectedElementId: newEl.id,
    }));
  },

  deleteElement: (id) => {
    set((s) => ({
      layout: normalizeLayout({
        ...s.layout,
        elements: s.layout.elements.filter((el) => el.id !== id),
      }),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    }));
  },

  saveLayout: async () => {
    const { layout, activeSpaceId } = get();
    if (!activeSpaceId) return;
    set({ isSaving: true });
    try {
      const saved = await inventoryApi.saveLayout(activeSpaceId, {
        id: layout.id,
        name: layout.name,
        code: layout.code,
        width: layout.width,
        height: layout.height,
        spaceId: Number(activeSpaceId),
        elements: layout.elements,
      });
      set({
        layout: normalizeLayout({
          id: saved.id,
          name: saved.name,
          code: saved.code,
          width: saved.width,
          height: saved.height,
          spaceId: String(saved.spaceId),
          elements: saved.elements,
        }),
        isSaving: false,
      });
    } catch (error) {
      set({ isSaving: false });
      throw error;
    }
  },

  loadLayout: async (spaceId, spaceName) => {
    const targetSpaceId = spaceId || get().activeSpaceId || mockLayout.spaceId || null;
    if (!targetSpaceId) {
      set({ layout: mockLayout, activeSpaceId: mockLayout.spaceId || null });
      return;
    }

    const remoteLayout = await inventoryApi.getLayout(targetSpaceId);
    if (remoteLayout) {
      set({
        layout: normalizeLayout({
          id: remoteLayout.id,
          name: remoteLayout.name,
          code: remoteLayout.code,
          width: remoteLayout.width,
          height: remoteLayout.height,
          spaceId: String(remoteLayout.spaceId),
          elements: remoteLayout.elements,
        }),
        activeSpaceId: String(remoteLayout.spaceId),
      });
      return;
    }

    if (mockLayout.spaceId === targetSpaceId) {
      set({ layout: normalizeLayout({ ...mockLayout }), activeSpaceId: targetSpaceId });
      return;
    }

    set({
      layout: createEmptyLayout(targetSpaceId, spaceName || targetSpaceId),
      activeSpaceId: targetSpaceId,
      mode: 'VIEW',
      selectedElementId: null,
      placingType: null,
      scale: 1,
      stagePosition: { x: 0, y: 0 },
    });
  },

  switchToSpace: async (spaceId, spaceName) => {
    set({
      activeSpaceId: spaceId,
      mode: 'VIEW',
      selectedElementId: null,
      placingType: null,
      scale: 1,
      stagePosition: { x: 0, y: 0 },
    });
    await get().loadLayout(spaceId, spaceName);
  },
}));
