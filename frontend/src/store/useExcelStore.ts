import { create } from "zustand";

export interface ExcelState {
  activeTab: "compare" | "dedup" | "merge" | "split";
  file1: File | null;
  file2: File | null;
  file1Name: string;
  file2Name: string;
  keyCols1: string;
  keyCols2: string;
  matchMode: "exact" | "similar";
  similarityThreshold: number;
  compareFormat: "xlsx" | "csv";
  compareJobResult: any;
  showHistoryModal: boolean;
  historyList: any[];
  isLoadingHistory: boolean;
  activeHistoryTarget: "file1" | "file2" | "dedup" | null;
  file1Preview: any;
  file2Preview: any;
  file1History: any[];
  file2History: any[];
  loadingPreview1: boolean;
  loadingPreview2: boolean;
  showPreview: boolean;
  previewLayoutMode: "stacked" | "grid" | "fullscreen";
  isFormMinimized: boolean;
  showOnlyKeyColumns: boolean;
  previewLimit1: number;
  previewLimit2: number;
  previewLimitDedup: number;
  selectedCellValue: string | null;
  syncScroll: boolean;
  aiAnalysisResult: any;
  isAnalyzingAI: boolean;
  globalFilterQuery: string;
  isSearchFocused: boolean;
  sortCol1: string | null;
  sortDir1: "asc" | "desc";
  sortCol2: string | null;
  sortDir2: "asc" | "desc";
  editingCell: { fileNum: 1 | 2; rowIndex: number; col: string } | null;
  editingValue: string;
  editingColumn: { fileNum: 1 | 2; colIdx: number } | null;
  editingColumnValue: string;
  hasUnsavedChanges1: boolean;
  hasUnsavedChanges2: boolean;
  isSavingFile1: boolean;
  isSavingFile2: boolean;
  dedupFile: File | null;
  dedupFileName: string;
  dedupFilePreview: any;
  loadingDedupPreview: boolean;
  dedupCols: string;
  dedupSearchQuery: string;
  keepStrategy: "first" | "last" | "unique";
  dedupSortCol: string;
  dedupSortDir: "asc" | "desc";
  dedupJobResult: any;
  mergeFiles: File[];
  addSourceCol: boolean;
  mergeJobResult: any;
  splitFile: File | null;
  splitMode: "rows" | "column";
  maxRows: number;
  splitCol: string;
  splitJobResult: any;
  isProcessing: boolean;
  message: string | null;
}

const initialState: ExcelState = {
  activeTab: "compare",
  file1: null,
  file2: null,
  file1Name: "",
  file2Name: "",
  keyCols1: "NIK, Nama",
  keyCols2: "NIK, Nama",
  matchMode: "exact",
  similarityThreshold: 80,
  compareFormat: "xlsx",
  compareJobResult: null,
  showHistoryModal: false,
  historyList: [],
  isLoadingHistory: false,
  activeHistoryTarget: null,
  file1Preview: null,
  file2Preview: null,
  file1History: [],
  file2History: [],
  loadingPreview1: false,
  loadingPreview2: false,
  showPreview: true,
  previewLayoutMode: "grid",
  isFormMinimized: false,
  showOnlyKeyColumns: false,
  previewLimit1: 50,
  previewLimit2: 50,
  previewLimitDedup: 50,
  selectedCellValue: null,
  syncScroll: true,
  aiAnalysisResult: null,
  isAnalyzingAI: false,
  globalFilterQuery: "",
  isSearchFocused: false,
  sortCol1: null,
  sortDir1: "asc",
  sortCol2: null,
  sortDir2: "asc",
  editingCell: null,
  editingValue: "",
  editingColumn: null,
  editingColumnValue: "",
  hasUnsavedChanges1: false,
  hasUnsavedChanges2: false,
  isSavingFile1: false,
  isSavingFile2: false,
  dedupFile: null,
  dedupFileName: "",
  dedupFilePreview: null,
  loadingDedupPreview: false,
  dedupCols: "Email",
  dedupSearchQuery: "",
  keepStrategy: "first",
  dedupSortCol: "",
  dedupSortDir: "asc",
  dedupJobResult: null,
  mergeFiles: [],
  addSourceCol: true,
  mergeJobResult: null,
  splitFile: null,
  splitMode: "rows",
  maxRows: 10000,
  splitCol: "",
  splitJobResult: null,
  isProcessing: false,
  message: null,
};

interface ExcelStore extends ExcelState {
  setExcelState: (state: Partial<ExcelState>) => void;
  resetState: () => void;
}

export const useExcelStore = create<ExcelStore>((set) => ({
  ...initialState,
  setExcelState: (state) => set((prev) => ({ ...prev, ...state })),
  resetState: () => set({ ...initialState }),
}));
