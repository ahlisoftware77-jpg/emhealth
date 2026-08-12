"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useExcelStore, ExcelState } from "@/store/useExcelStore";

function useExcelStoreState<K extends keyof ExcelState>(key: K): [ExcelState[K], (val: ExcelState[K] | ((prev: ExcelState[K]) => ExcelState[K])) => void] {
  const value = useExcelStore(state => state[key]);
  const setExcelState = useExcelStore(state => state.setExcelState);
  
  const setter = (newVal: any) => {
    if (typeof newVal === 'function') {
       setExcelState({ [key]: newVal(useExcelStore.getState()[key]) } as any);
    } else {
       setExcelState({ [key]: newVal } as any);
    }
  };
  return [value, setter];
}

import { FileUploader } from "@/components/ui/FileUploader";
import { ExcelAPI, FileHistoryAPI, apiClient } from "@/lib/api";
import {
  FileSpreadsheet,
  GitCompare,
  Layers,
  Split,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowRightToLine,
  ArrowLeftToLine,
  Eye,
  Table as TableIcon,
  RefreshCw,
  TableProperties,
  Sparkles,
  Check,
  Maximize2,
  Columns,
  Rows,
  X,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Bot,
  BrainCircuit,
  Zap,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Save,
  Edit3,
  Trash2,
  Undo2,
  Link2,
  Unlink,
  History,
  Copy
} from "lucide-react";

export default function ExcelToolsPage() {
  const [activeTab, setActiveTab] = useExcelStoreState("activeTab");

  // State for Compare
  const [file1, setFile1] = useExcelStoreState("file1");
  const [file2, setFile2] = useExcelStoreState("file2");
  const [file1Name, setFile1Name] = useExcelStoreState("file1Name");
  const [file2Name, setFile2Name] = useExcelStoreState("file2Name");
  const [keyCols1, setKeyCols1] = useExcelStoreState("keyCols1");
  const [keyCols2, setKeyCols2] = useExcelStoreState("keyCols2");
  const [matchMode, setMatchMode] = useExcelStoreState("matchMode");
  const [similarityThreshold, setSimilarityThreshold] = useExcelStoreState("similarityThreshold");
  const [compareFormat, setCompareFormat] = useExcelStoreState("compareFormat");
  const [compareJobResult, setCompareJobResult] = useExcelStoreState("compareJobResult");

  // File History States
  const [showHistoryModal, setShowHistoryModal] = useExcelStoreState("showHistoryModal");
  const [historyList, setHistoryList] = useExcelStoreState("historyList");
  const [isLoadingHistory, setIsLoadingHistory] = useExcelStoreState("isLoadingHistory");
  const [activeHistoryTarget, setActiveHistoryTarget] = useExcelStoreState("activeHistoryTarget");

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await FileHistoryAPI.list();
      setHistoryList(res.history || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoadingHistory(false);
  };

  const handleDeleteHistory = async (id: string) => {
    if (!confirm("Hapus riwayat ini? File di Cloudinary juga akan kehilangan referensinya.")) return;
    try {
      await FileHistoryAPI.delete(id);
      fetchHistory();
    } catch (e) {
      alert("Gagal menghapus riwayat");
    }
  };

  const handleSelectHistory = async (hist: any) => {
    setShowHistoryModal(false);
    setMessage(null);
    setIsProcessing(true);

    try {
      const previewData = await ExcelAPI.previewUrl(hist.file_url);

      if (activeHistoryTarget === "file1") {
        setFile1Preview(previewData);
        setFile1(null);
        setFile1Name(hist.file_name);
      } else if (activeHistoryTarget === "file2") {
        setFile2Preview(previewData);
        setFile2(null);
        setFile2Name(hist.file_name);
      } else if (activeHistoryTarget === "dedup") {
        setDedupFilePreview(previewData);
        setDedupFile(null);
        setDedupFileName(hist.file_name);
      }
    } catch (err: any) {
      setMessage(`Gagal memuat file dari riwayat: ${err.message || err}`);
    }
    setIsProcessing(false);
  };


  // Preview States for File 1 & File 2
  const [file1Preview, setFile1Preview] = useExcelStoreState("file1Preview");
  const [file2Preview, setFile2Preview] = useExcelStoreState("file2Preview");
  const [file1History, setFile1History] = useExcelStoreState("file1History");
  const [file2History, setFile2History] = useExcelStoreState("file2History");
  const [loadingPreview1, setLoadingPreview1] = useExcelStoreState("loadingPreview1");
  const [loadingPreview2, setLoadingPreview2] = useExcelStoreState("loadingPreview2");
  const [showPreview, setShowPreview] = useExcelStoreState("showPreview");
  const [previewLayoutMode, setPreviewLayoutMode] = useExcelStoreState("previewLayoutMode");
  const [isFormMinimized, setIsFormMinimized] = useExcelStoreState("isFormMinimized");
  const [showOnlyKeyColumns, setShowOnlyKeyColumns] = useExcelStoreState("showOnlyKeyColumns");
  const [previewLimit1, setPreviewLimit1] = useExcelStoreState("previewLimit1");
  const [previewLimit2, setPreviewLimit2] = useExcelStoreState("previewLimit2");
  const [previewLimitDedup, setPreviewLimitDedup] = useExcelStoreState("previewLimitDedup");
  const [selectedCellValue, setSelectedCellValue] = useExcelStoreState("selectedCellValue");
  // Synchronized Scrolling States & Refs
  const [syncScroll, setSyncScroll] = useExcelStoreState("syncScroll");
  const tableContainer1Ref = useRef<HTMLDivElement | null>(null);
  const tableContainer2Ref = useRef<HTMLDivElement | null>(null);
  const isSyncingScrollRef = useRef<boolean>(false);

  // Synchronized scroll event handler between Table 1 & Table 2
  const handleScrollSync = (sourceFileNum: 1 | 2) => {
    if (!syncScroll || isSyncingScrollRef.current) return;
    isSyncingScrollRef.current = true;

    const sourceEl = sourceFileNum === 1 ? tableContainer1Ref.current : tableContainer2Ref.current;
    const targetEl = sourceFileNum === 1 ? tableContainer2Ref.current : tableContainer1Ref.current;

    if (sourceEl && targetEl) {
      targetEl.scrollTop = sourceEl.scrollTop;
      targetEl.scrollLeft = sourceEl.scrollLeft;
    }

    requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  };

  // Helper to scroll matching elements into view when cell is clicked
  const handleCellClick = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setSelectedCellValue((prev) => (prev === trimmed ? null : trimmed));

    // Wait for DOM update then scroll first matching element in opposite preview into view
    setTimeout(() => {
      const safeValue = trimmed.toLowerCase().replace(/"/g, '\\"');
      const matchElements = document.querySelectorAll(`[data-cell-value="${safeValue}"]`);
      if (matchElements.length > 0) {
        matchElements[0].scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }
    }, 50);
  };

  // AI Analytics & Incomplete Name Reconciliation States
  const [aiAnalysisResult, setAiAnalysisResult] = useExcelStoreState("aiAnalysisResult");
  const [isAnalyzingAI, setIsAnalyzingAI] = useExcelStoreState("isAnalyzingAI");

  // Memoized Sets of selected column names for zero-latency UI re-rendering
  const selectedKeyCols1Set = useMemo(() => {
    return new Set(keyCols1.split(",").map((s) => s.trim()).filter(Boolean));
  }, [keyCols1]);

  const selectedKeyCols2Set = useMemo(() => {
    return new Set(keyCols2.split(",").map((s) => s.trim()).filter(Boolean));
  }, [keyCols2]);

  // Word & Cell values sets for live cross-file highlight matching (Strictly bound to active selected Key Columns)
  const file2ValuesSet = useMemo(() => {
    if (!file2Preview?.preview_data) return new Set<string>();
    const set = new Set<string>();
    const activeCols = Array.from(selectedKeyCols2Set);
    file2Preview.preview_data.forEach((row) => {
      if (activeCols.length > 0) {
        activeCols.forEach((colName) => {
          const val = row[colName];
          if (val !== null && val !== undefined) {
            const str = String(val).trim().toLowerCase();
            if (str.length > 0) set.add(str);
          }
        });
      } else {
        Object.values(row).forEach((val) => {
          if (val !== null && val !== undefined) {
            const str = String(val).trim().toLowerCase();
            if (str.length > 0) set.add(str);
          }
        });
      }
    });
    return set;
  }, [file2Preview, selectedKeyCols2Set]);

  const file1ValuesSet = useMemo(() => {
    if (!file1Preview?.preview_data) return new Set<string>();
    const set = new Set<string>();
    const activeCols = Array.from(selectedKeyCols1Set);
    file1Preview.preview_data.forEach((row) => {
      if (activeCols.length > 0) {
        activeCols.forEach((colName) => {
          const val = row[colName];
          if (val !== null && val !== undefined) {
            const str = String(val).trim().toLowerCase();
            if (str.length > 0) set.add(str);
          }
        });
      } else {
        Object.values(row).forEach((val) => {
          if (val !== null && val !== undefined) {
            const str = String(val).trim().toLowerCase();
            if (str.length > 0) set.add(str);
          }
        });
      }
    });
    return set;
  }, [file1Preview, selectedKeyCols1Set]);

  // Single Global Search Query State for both File 1 & File 2
  const [globalFilterQuery, setGlobalFilterQuery] = useExcelStoreState("globalFilterQuery");
  const [isSearchFocused, setIsSearchFocused] = useExcelStoreState("isSearchFocused");

  // Auto Suggestions across ALL columns from File 1 & File 2
  const searchSuggestions = useMemo(() => {
    const query = globalFilterQuery.trim().toLowerCase();
    if (!query || query.length < 1) return [];
    const suggestionsSet = new Set<string>();

    const checkRows = (preview: any) => {
      if (!preview?.preview_data) return;
      for (const row of preview.preview_data) {
        for (const [colName, val] of Object.entries(row)) {
          if (val !== null && val !== undefined) {
            const strVal = String(val).trim();
            if (strVal.toLowerCase().includes(query)) {
              suggestionsSet.add(`${strVal} (${colName})`);
              if (suggestionsSet.size >= 8) return;
            }
          }
        }
      }
    };

    checkRows(file1Preview);
    if (suggestionsSet.size < 8) checkRows(file2Preview);
    return Array.from(suggestionsSet);
  }, [file1Preview, file2Preview, globalFilterQuery]);

  // Sorting States for File 1 & File 2
  const [sortCol1, setSortCol1] = useExcelStoreState("sortCol1");
  const [sortDir1, setSortDir1] = useExcelStoreState("sortDir1");
  const [sortCol2, setSortCol2] = useExcelStoreState("sortCol2");
  const [sortDir2, setSortDir2] = useExcelStoreState("sortDir2");

  // Inline Cell Edit State (e.g. { fileNum: 1, rowIndex: 0, col: "Nama" })
  const [editingCell, setEditingCell] = useExcelStoreState("editingCell");
  const [editingValue, setEditingValue] = useExcelStoreState("editingValue");

  // Column Name Edit State (e.g. { fileNum: 1, colIdx: 0 })
  const [editingColumn, setEditingColumn] = useExcelStoreState("editingColumn");
  const [editingColumnValue, setEditingColumnValue] = useExcelStoreState("editingColumnValue");

  // Track Unsaved Changes
  const [hasUnsavedChanges1, setHasUnsavedChanges1] = useExcelStoreState("hasUnsavedChanges1");
  const [hasUnsavedChanges2, setHasUnsavedChanges2] = useExcelStoreState("hasUnsavedChanges2");

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges1 || hasUnsavedChanges2) {
        e.preventDefault();
        e.returnValue = "Ada perubahan data yang belum disimpan. Yakin ingin memuat ulang?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges1, hasUnsavedChanges2]);

  // Handler to toggle column sorting
  const handleCopyColumnToFile2 = (colName: string) => {
    if (!file2Preview?.preview_data) {
      setMessage("❌ Silakan upload File 2 terlebih dahulu sebelum menyalin kolom.");
      return;
    }
    if (!file1Preview?.preview_data) return;

    saveHistory(2);

    let newCols = [...file2Preview.columns];
    if (!newCols.includes(colName)) {
      newCols.push(colName);
    }

    // Expand to the maximum length so no data is truncated if File 1 is longer
    const maxRows = Math.max(file2Preview.preview_data.length, file1Preview.preview_data.length);
    const newData = Array.from({ length: maxRows }).map((_, idx) => {
      const row = file2Preview.preview_data[idx] || {};
      // Strict undefined check to handle falsey values correctly, fallback to "" if absolutely missing
      const val = file1Preview.preview_data[idx] ? (file1Preview.preview_data[idx][colName] ?? "") : "";
      return { ...row, [colName]: val };
    });

    setFile2Preview({
      ...file2Preview,
      columns: newCols,
      preview_data: newData,
      total_rows: maxRows
    });

    setHasUnsavedChanges2(true);
    setMessage(`✅ Seluruh isi kolom "${colName}" berhasil disalin ke File 2 (Tersinkronisasi ${maxRows} baris)!`);
  };

  const handleCopyColumnToFile1 = (colName: string) => {
    if (!file1Preview?.preview_data) {
      setMessage("❌ Silakan upload File 1 terlebih dahulu sebelum menyalin kolom.");
      return;
    }
    if (!file2Preview?.preview_data) return;

    saveHistory(1);

    let newCols = [...file1Preview.columns];
    if (!newCols.includes(colName)) {
      newCols.push(colName);
    }

    const maxRows = Math.max(file1Preview.preview_data.length, file2Preview.preview_data.length);
    const newData = Array.from({ length: maxRows }).map((_, idx) => {
      const row = file1Preview.preview_data[idx] || {};
      const val = file2Preview.preview_data[idx] ? (file2Preview.preview_data[idx][colName] ?? "") : "";
      return { ...row, [colName]: val };
    });

    setFile1Preview({
      ...file1Preview,
      columns: newCols,
      preview_data: newData,
      total_rows: maxRows
    });

    setHasUnsavedChanges1(true);
    setMessage(`✅ Seluruh isi kolom "${colName}" berhasil disalin ke File 1 (Tersinkronisasi ${maxRows} baris)!`);
  };

  const handleSortColumn = (fileNum: 1 | 2, col: string) => {
    if (fileNum === 1) {
      if (sortCol1 === col) {
        setSortDir1((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortCol1(col);
        setSortDir1("asc");
      }
    } else {
      if (sortCol2 === col) {
        setSortDir2((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortCol2(col);
        setSortDir2("asc");
      }
    }
  };

  // Saving State Indicators
  const [isSavingFile1, setIsSavingFile1] = useExcelStoreState("isSavingFile1");
  const [isSavingFile2, setIsSavingFile2] = useExcelStoreState("isSavingFile2");

  // Handler to persist edited preview rows directly into physical Excel file
  const handleSaveToFile = async (fileNum: 1 | 2) => {
    const targetFile = fileNum === 1 ? file1 : file2;
    const targetPreview = fileNum === 1 ? file1Preview : file2Preview;
    
    if (!targetFile || !targetPreview?.preview_data) {
      setMessage(`Silakan atur & upload File ${fileNum} terlebih dahulu.`);
      return;
    }

    if (fileNum === 1) setIsSavingFile1(true);
    else setIsSavingFile2(true);

    try {
      // Pastikan data yang disimpan mengikuti urutan Sort yang sedang aktif di UI (tanpa terpengaruh Filter Pencarian)
      let dataToSave = [...targetPreview.preview_data];
      const activeSortCol = fileNum === 1 ? sortCol1 : sortCol2;
      const activeSortDir = fileNum === 1 ? sortDir1 : sortDir2;
      
      if (activeSortCol) {
        dataToSave.sort((a, b) => {
          const valA = String(a[activeSortCol] ?? "").toLowerCase();
          const valB = String(b[activeSortCol] ?? "").toLowerCase();
          const comp = valA.localeCompare(valB, undefined, { numeric: true });
          return activeSortDir === "asc" ? comp : -comp;
        });
      }

      const fileUrl = (targetFile as any).cloudinaryUrl || undefined;
      const res = await ExcelAPI.savePreview(targetFile.name, dataToSave, fileUrl);
      
      // Trigger download using showSaveFilePicker (Save As) if supported, else fallback to auto-download
      // Menggunakan API internal Next.js proxy agar 100% bebas dari isu CORS maupun IP berbeda
      const downloadUrl = `/api/download?filename=${encodeURIComponent(targetFile.name)}`;
      
      try {
        if ('showSaveFilePicker' in window) {
          let blob;
          try {
            // Coba fetch menggunakan rute internal Next.js
            const fallbackRes = await fetch(downloadUrl);
            if (!fallbackRes.ok) throw new Error("Gagal fallback fetch native: " + fallbackRes.statusText);
            blob = await fallbackRes.blob();
          } catch (fetchErr) {
            console.warn("fetch internal gagal, mencoba api Base sebagai fallback...", fetchErr);
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";
            const response = await apiClient.get(`/storage/download/${encodeURIComponent(targetFile.name)}`, { responseType: 'blob' });
            blob = response.data;
          }
          
          const isCsv = targetFile.name.toLowerCase().endsWith(".csv");
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: targetFile.name,
            types: [{
              description: isCsv ? 'CSV File' : 'Excel File',
              accept: isCsv ? { 'text/csv': ['.csv'] } : { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
            }],
          });
          
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } else {
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = targetFile.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (downloadErr: any) {
        if (downloadErr.name === 'AbortError') {
          setMessage(`✅ Perubahan disimpan di memori server, tetapi penyimpanan ke lokal dibatalkan.`);
          if (fileNum === 1) setHasUnsavedChanges1(false);
          else setHasUnsavedChanges2(false);
          return;
        }
        console.error("Save As error:", downloadErr);
        // Jika gagal total, fallback paksa menggunakan tag <a> agar user tetap bisa dapat file-nya
        console.warn("Mencoba fallback paksa dengan tag a...");
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = targetFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        throw new Error("Gagal memunculkan popup Save As. File akan diunduh secara otomatis sebagai gantinya.");
      }

      setMessage(`✅ ${res.message || `Perubahan data File ${fileNum} (${targetFile.name}) berhasil disimpan!`}. File Excel hasil perubahan telah diunduh.`);
      
      // Reset unsaved changes flag
      if (fileNum === 1) setHasUnsavedChanges1(false);
      else setHasUnsavedChanges2(false);
    } catch (err: any) {
      console.error(`SaveToFile Error for file ${fileNum}:`, err);
      const errMsg = err.response?.data?.detail || err.message || "Unknown error";
      setMessage(`❌ Gagal menyimpan file Excel ${fileNum}: ${errMsg}`);
    } finally {
      if (fileNum === 1) setIsSavingFile1(false);
      else setIsSavingFile2(false);
    }
  };

  // Handler to update a cell value with AUTO-SAVE into filePreview state (by object reference)

  const saveHistory = (fileNum: 1 | 2) => {
    if (fileNum === 1 && file1Preview) {
      setFile1History([...file1History, file1Preview]);
    } else if (fileNum === 2 && file2Preview) {
      setFile2History([...file2History, file2Preview]);
    }
  };

  const handleUndo = (fileNum: 1 | 2) => {
    if (fileNum === 1 && file1History.length > 0) {
      const prev = file1History[file1History.length - 1];
      setFile1Preview(prev);
      setFile1History(file1History.slice(0, -1));
    } else if (fileNum === 2 && file2History.length > 0) {
      const prev = file2History[file2History.length - 1];
      setFile2Preview(prev);
      setFile2History(file2History.slice(0, -1));
    }
  };

  const handleCellSave = (fileNum: 1 | 2, rowObj: any, col: string, newValue: string) => {
    if (fileNum === 1 && file1Preview) {
      const realIndex = file1Preview.preview_data.indexOf(rowObj);
      if (realIndex !== -1) {
        const updatedRows = [...file1Preview.preview_data];
        updatedRows[realIndex] = { ...updatedRows[realIndex], [col]: newValue };
        setFile1Preview({ ...file1Preview, preview_data: updatedRows });
        setHasUnsavedChanges1(true);
      }
    } else if (fileNum === 2 && file2Preview) {
      const realIndex = file2Preview.preview_data.indexOf(rowObj);
      if (realIndex !== -1) {
        const updatedRows = [...file2Preview.preview_data];
        updatedRows[realIndex] = { ...updatedRows[realIndex], [col]: newValue };
        setFile2Preview({ ...file2Preview, preview_data: updatedRows });
        setHasUnsavedChanges2(true);
      }
    }
    setEditingCell(null);
  };

  // Handler to rename a column header
  
  const handleDeleteRow = (fileNum: 1 | 2, row: any) => {
    if (!confirm("Apakah Anda yakin ingin menghapus baris ini?")) return;

    if (fileNum === 1 && file1Preview) {
      saveHistory(1);
      const idx = file1Preview.preview_data.indexOf(row);
      if (idx !== -1) {
        saveHistory(1);
      const newPreviewData = [...file1Preview.preview_data];
        newPreviewData.splice(idx, 1);
        setFile1Preview({ ...file1Preview, preview_data: newPreviewData, total_rows: file1Preview.total_rows - 1 });
        setHasUnsavedChanges1(true);
      }
    } else if (fileNum === 2 && file2Preview) {
      saveHistory(2);
      const idx = file2Preview.preview_data.indexOf(row);
      if (idx !== -1) {
        saveHistory(2);
      const newPreviewData = [...file2Preview.preview_data];
        newPreviewData.splice(idx, 1);
        setFile2Preview({ ...file2Preview, preview_data: newPreviewData, total_rows: file2Preview.total_rows - 1 });
        setHasUnsavedChanges2(true);
      }
    }
  };

  const handleDeleteColumn = (fileNum: 1 | 2, colName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kolom "${colName}" beserta seluruh isinya?`)) return;
    if (fileNum === 1 && file1Preview) {
      saveHistory(1);
      const newColumns = file1Preview.columns.filter(c => c !== colName);
      const newPreviewData = file1Preview.preview_data.map(row => {
        const newRow = { ...row };
        delete newRow[colName];
        return newRow;
      });
      setFile1Preview({ ...file1Preview, columns: newColumns, preview_data: newPreviewData });
      if (selectedKeyCols1Set.has(colName)) {
        setKeyCols1(Array.from(selectedKeyCols1Set).filter(c => c !== colName).join(", "));
      }
      setHasUnsavedChanges1(true);
    } else if (fileNum === 2 && file2Preview) {
      saveHistory(2);
      const newColumns = file2Preview.columns.filter(c => c !== colName);
      const newPreviewData = file2Preview.preview_data.map(row => {
        const newRow = { ...row };
        delete newRow[colName];
        return newRow;
      });
      setFile2Preview({ ...file2Preview, columns: newColumns, preview_data: newPreviewData });
      if (selectedKeyCols2Set.has(colName)) {
        setKeyCols2(Array.from(selectedKeyCols2Set).filter(c => c !== colName).join(", "));
      }
      setHasUnsavedChanges2(true);
    }
  };

  const handleColumnRenameSave = (fileNum: 1 | 2, oldColName: string, newColName: string) => {
    const trimmedNewColName = newColName.trim();
    if (!trimmedNewColName || trimmedNewColName === oldColName) {
      setEditingColumn(null);
      return;
    }

    if (fileNum === 1 && file1Preview) {
      if (file1Preview.columns.includes(trimmedNewColName)) {
        setMessage(`Kolom "${trimmedNewColName}" sudah ada di File 1!`);
        return;
      }
      
      // Update columns array
      saveHistory(1);
      const newColumns = file1Preview.columns.map(c => c === oldColName ? trimmedNewColName : c);
      
      // Update keys in preview_data
      const newPreviewData = file1Preview.preview_data.map(row => {
        const newRow = { ...row };
        newRow[trimmedNewColName] = newRow[oldColName];
        delete newRow[oldColName];
        return newRow;
      });
      
      setFile1Preview({ ...file1Preview, columns: newColumns, preview_data: newPreviewData });
      
      // Update keyCols if it was selected
      if (selectedKeyCols1Set.has(oldColName)) {
        const newKeyCols = Array.from(selectedKeyCols1Set).map(c => c === oldColName ? trimmedNewColName : c).join(", ");
        setKeyCols1(newKeyCols);
      }
      
      setHasUnsavedChanges1(true);
    } else if (fileNum === 2 && file2Preview) {
      if (file2Preview.columns.includes(trimmedNewColName)) {
        setMessage(`Kolom "${trimmedNewColName}" sudah ada di File 2!`);
        return;
      }
      
      saveHistory(2);
      const newColumns = file2Preview.columns.map(c => c === oldColName ? trimmedNewColName : c);
      const newPreviewData = file2Preview.preview_data.map(row => {
        const newRow = { ...row };
        newRow[trimmedNewColName] = newRow[oldColName];
        delete newRow[oldColName];
        return newRow;
      });
      
      setFile2Preview({ ...file2Preview, columns: newColumns, preview_data: newPreviewData });
      
      if (selectedKeyCols2Set.has(oldColName)) {
        const newKeyCols = Array.from(selectedKeyCols2Set).map(c => c === oldColName ? trimmedNewColName : c).join(", ");
        setKeyCols2(newKeyCols);
      }
      
      setHasUnsavedChanges2(true);
    }
    setEditingColumn(null);
  };

  // Handler to add a new empty row with AUTO-SAVE
  const handleAddRow = (fileNum: 1 | 2) => {
    if (fileNum === 1 && file1Preview) {
      const newRow: any = {};
      file1Preview.columns.forEach((c) => (newRow[c] = ""));
      setFile1Preview({
        ...file1Preview,
        total_rows: file1Preview.total_rows + 1,
        preview_data: [newRow, ...file1Preview.preview_data]
      });
    } else if (fileNum === 2 && file2Preview) {
      const newRow: any = {};
      file2Preview.columns.forEach((c) => (newRow[c] = ""));
      setFile2Preview({
        ...file2Preview,
        total_rows: file2Preview.total_rows + 1,
        preview_data: [newRow, ...file2Preview.preview_data]
      });
    }
  };

  // Ultra-Fast Memoized Filtering & Sorting for Preview Rows using Global Search Query
  const filteredPreviewData1 = useMemo(() => {
    if (!file1Preview?.preview_data) return [];
    const rawQuery = globalFilterQuery.trim();
    const query = (rawQuery.includes(" (") ? rawQuery.split(" (")[0] : rawQuery).toLowerCase();
    let rows = [...file1Preview.preview_data];
    if (query) {
      rows = rows.filter((row) =>
        Object.values(row).some((val) => val !== null && val !== undefined && String(val).toLowerCase().includes(query))
      );
    }
    if (sortCol1) {
      rows.sort((a, b) => {
        const valA = String(a[sortCol1] ?? "").toLowerCase();
        const valB = String(b[sortCol1] ?? "").toLowerCase();
        const comp = valA.localeCompare(valB, undefined, { numeric: true });
        return sortDir1 === "asc" ? comp : -comp;
      });
    }
    return rows;
  }, [file1Preview, globalFilterQuery, sortCol1, sortDir1]);

  const filteredPreviewData2 = useMemo(() => {
    if (!file2Preview?.preview_data) return [];
    const rawQuery = globalFilterQuery.trim();
    const query = (rawQuery.includes(" (") ? rawQuery.split(" (")[0] : rawQuery).toLowerCase();
    let rows = [...file2Preview.preview_data];
    if (query) {
      rows = rows.filter((row) =>
        Object.values(row).some((val) => val !== null && val !== undefined && String(val).toLowerCase().includes(query))
      );
    }
    if (sortCol2) {
      rows.sort((a, b) => {
        const valA = String(a[sortCol2] ?? "").toLowerCase();
        const valB = String(b[sortCol2] ?? "").toLowerCase();
        const comp = valA.localeCompare(valB, undefined, { numeric: true });
        return sortDir2 === "asc" ? comp : -comp;
      });
    }
    return rows;
  }, [file2Preview, globalFilterQuery, sortCol2, sortDir2]);

  // State for Dedup
  const [dedupFile, setDedupFile] = useExcelStoreState("dedupFile");
  const [dedupFileName, setDedupFileName] = useExcelStoreState("dedupFileName");
  const [dedupFilePreview, setDedupFilePreview] = useExcelStoreState("dedupFilePreview");
  const [loadingDedupPreview, setLoadingDedupPreview] = useExcelStoreState("loadingDedupPreview");
  const [dedupCols, setDedupCols] = useExcelStoreState("dedupCols");
  const [dedupSearchQuery, setDedupSearchQuery] = useExcelStoreState("dedupSearchQuery");
  const [keepStrategy, setKeepStrategy] = useExcelStoreState("keepStrategy");
  const [dedupSortCol, setDedupSortCol] = useExcelStoreState("dedupSortCol");
  const [dedupSortDir, setDedupSortDir] = useExcelStoreState("dedupSortDir");
  const [dedupJobResult, setDedupJobResult] = useExcelStoreState("dedupJobResult");

  const selectedDedupColsSet = useMemo(() => {
    return new Set(dedupCols.split(",").map((s) => s.trim()).filter(Boolean));
  }, [dedupCols]);

  // Client-side dedup calculation for preview
  const processedDedupData = useMemo(() => {
    if (!dedupFilePreview?.preview_data) return { rows: [], stats: { total: 0, removed: 0, kept: 0 } };
    
    const targetCols = dedupCols.split(",").map(s => s.trim()).filter(Boolean);
    let rows = [...dedupFilePreview.preview_data];

    if (dedupSortCol && dedupSortCol.trim()) {
      const sCol = dedupSortCol.trim();
      rows.sort((a, b) => {
        const valA = a[sCol] ?? "";
        const valB = b[sCol] ?? "";
        
        // Coba bandingkan sebagai angka jika memungkinkan
        const numA = Number(valA);
        const numB = Number(valB);
        let comp = 0;
        
        if (!isNaN(numA) && !isNaN(numB)) {
          comp = numA - numB;
        } else {
          comp = String(valA).localeCompare(String(valB));
        }
        
        return dedupSortDir === "asc" ? comp : -comp;
      });
    }
    
    if (targetCols.length === 0) {
      return {
        rows: rows.map((r: any) => ({ ...r, __dedup_status: "kept" })),
        stats: { total: rows.length, removed: 0, kept: rows.length }
      };
    }

    // Find duplicates based on target columns
    const grouped = new Map<string, number[]>();
    
    rows.forEach((row: any, idx: number) => {
      const key = targetCols.map(col => String(row[col] ?? "").toLowerCase().trim()).join("|");
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(idx);
    });

    const statusMap = new Array(rows.length).fill("removed");

    grouped.forEach((indices) => {
      if (indices.length === 1) {
        statusMap[indices[0]] = "kept";
      } else {
        if (keepStrategy === "first") {
          statusMap[indices[0]] = "kept";
        } else if (keepStrategy === "last") {
          statusMap[indices[indices.length - 1]] = "kept";
        } else if (keepStrategy === "unique") {
          // Keep nothing for this group
        }
      }
    });

    const processedRows = rows.map((r: any, idx: number) => ({
      ...r,
      __dedup_status: statusMap[idx]
    }));

    const removedCount = statusMap.filter(s => s === "removed").length;

    return {
      rows: processedRows,
      stats: {
        total: rows.length,
        removed: removedCount,
        kept: rows.length - removedCount
      }
    };
  }, [dedupFilePreview, dedupCols, keepStrategy, dedupSortCol, dedupSortDir]);

  // State for Merge
  const [mergeFiles, setMergeFiles] = useExcelStoreState("mergeFiles");
  const [addSourceCol, setAddSourceCol] = useExcelStoreState("addSourceCol");
  const [mergeJobResult, setMergeJobResult] = useExcelStoreState("mergeJobResult");

  // State for Split
  const [splitFile, setSplitFile] = useExcelStoreState("splitFile");
  const [splitMode, setSplitMode] = useExcelStoreState("splitMode");
  const [maxRows, setMaxRows] = useExcelStoreState("maxRows");
  const [splitCol, setSplitCol] = useExcelStoreState("splitCol");
  const [splitJobResult, setSplitJobResult] = useExcelStoreState("splitJobResult");

  const [isProcessing, setIsProcessing] = useExcelStoreState("isProcessing");
  const [message, setMessage] = useExcelStoreState("message");

  // Handlers for File Selection & Auto Inspection
  const handleFile1Select = async (f: File | null) => {
    setFile1(f);
    if (f) setFile1Name(f.name);
    if (!f) {
      setFile1Preview(null);
      setKeyCols1("");
      return;
    }
    setLoadingPreview1(true);
    try {
      const res = await ExcelAPI.inspectFile(f);
      if (res?.data) {
        setFile1Preview(res.data);
        if (res.data.columns && res.data.columns.length > 0) {
          // Default: Pilih maksimal 5 kolom pertama
          setKeyCols1(res.data.columns.slice(0, 5).join(", "));
        }
      }
    } catch (err: any) {
      console.error("Gagal memuat pratinjau File 1", err);
      setMessage(`Gagal membaca pratinjau File 1: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoadingPreview1(false);
    }
  };

  const handleFile2Select = async (f: File | null) => {
    setFile2(f);
    if (f) setFile2Name(f.name);
    if (!f) {
      setFile2Preview(null);
      setKeyCols2("");
      return;
    }
    setLoadingPreview2(true);
    try {
      const res = await ExcelAPI.inspectFile(f);
      if (res?.data) {
        setFile2Preview(res.data);
        if (res.data.columns && res.data.columns.length > 0) {
          // Default: Pilih maksimal 5 kolom pertama
          setKeyCols2(res.data.columns.slice(0, 5).join(", "));
        }
      }
    } catch (err: any) {
      console.error("Gagal memuat pratinjau File 2", err);
      setMessage(`Gagal membaca pratinjau File 2: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoadingPreview2(false);
    }
  };

  const handleDedupFileSelect = async (f: File | null) => {
    setDedupFile(f);
    if (f) setDedupFileName(f.name);
    if (!f) {
      setDedupFilePreview(null);
      return;
    }
    setLoadingDedupPreview(true);
    try {
      const res = await ExcelAPI.inspectFile(f);
      if (res?.data) {
        setDedupFilePreview(res.data);
      }
    } catch (err: any) {
      console.error("Gagal memuat pratinjau Dedup File", err);
      setMessage(`Gagal membaca pratinjau Dedup File: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoadingDedupPreview(false);
    }
  };

  const handleCompare = async () => {
    if (!file1Name || !file2Name) {
      setMessage("Silakan upload kedua file Excel (atau pilih dari riwayat).");
      return;
    }

    // Auto-sync Key Columns File 2 with File 1 if empty or requested
    if (!keyCols2.trim() && keyCols1.trim()) {
      setKeyCols2(keyCols1);
    }

    // Auto-filter preview to show only key columns during comparison
    setShowPreview(true);
    setShowOnlyKeyColumns(true);

    setIsProcessing(true);
    setMessage(null);
    try {
      const filesToUpload = [file1, file2].filter(Boolean) as File[];
      if (filesToUpload.length > 0) {
        const uploadRes = await ExcelAPI.upload(filesToUpload);
        
        // Save to File History
        if (uploadRes.files) {
          for (const up of uploadRes.files) {
            if (up.cloudinary_url) {
              const preview = up.filename === file1?.name ? file1Preview : file2Preview;
              if (preview) {
                try {
                  await FileHistoryAPI.save({
                    file_name: up.filename,
                    file_url: up.cloudinary_url,
                    columns: preview.columns,
                    total_rows: preview.total_rows
                  });
                } catch (e) {
                  console.warn("Failed to save history for", up.filename, e);
                }
              }
            }
          }
        }
      }
      const res = await ExcelAPI.compare({
        file1_name: file1Name,
        file2_name: file2Name,
        key_columns_file1: keyCols1.split(",").map((s) => s.trim()).filter(Boolean),
        key_columns_file2: (keyCols2.trim() || keyCols1.trim()).split(",").map((s) => s.trim()).filter(Boolean),
        match_mode: matchMode,
        similarity_threshold: similarityThreshold,
        export_format: compareFormat,
      });
      setCompareJobResult(res.job);
      setMessage(`Job Komparasi telah dijadwalkan (ID: ${res.job.job_id}). Pantau kemajuan di Job Queue.`);
    } catch (err: any) {
      setMessage(`Gagal memproses: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDedup = async () => {
    if (!dedupFileName) {
      setMessage("Silakan upload file Excel (atau pilih dari riwayat).");
      return;
    }
    setIsProcessing(true);
    setMessage(null);
    try {
      if (dedupFile) {
        const uploadRes = await ExcelAPI.upload([dedupFile]);
        
        // Save to File History
        if (uploadRes.files && uploadRes.files[0]?.cloudinary_url && dedupFilePreview) {
          try {
            await FileHistoryAPI.save({
              file_name: uploadRes.files[0].filename,
              file_url: uploadRes.files[0].cloudinary_url,
              columns: dedupFilePreview.columns,
              total_rows: dedupFilePreview.total_rows
            });
          } catch (e) {
            console.warn("Failed to save dedup history", e);
          }
        }
      }
      const res = await ExcelAPI.deduplicate({
        file_name: dedupFileName,
        target_columns: dedupCols.split(",").map((s) => s.trim()),
        keep_strategy: keepStrategy,
        sort_column: dedupSortCol.trim() || null,
        sort_order: dedupSortDir,
        export_format: "xlsx",
      });
      setDedupJobResult(res.job);
      setMessage(`Job Hapus Duplikat telah dijadwalkan (ID: ${res.job.job_id}).`);
    } catch (err: any) {
      setMessage(`Gagal: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMerge = async () => {
    if (mergeFiles.length < 2) {
      setMessage("Upload minimal 2 file Excel untuk digabungkan.");
      return;
    }
    setIsProcessing(true);
    setMessage(null);
    try {
      await ExcelAPI.upload(mergeFiles);
      const res = await ExcelAPI.merge({
        file_names: mergeFiles.map((f) => f.name),
        add_source_column: addSourceCol,
        export_format: "xlsx",
      });
      setMergeJobResult(res.job);
      setMessage(`Job Merge Excel dijadwalkan (ID: ${res.job.job_id}).`);
    } catch (err: any) {
      setMessage(`Gagal: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (!splitFile) {
      setMessage("Silakan upload file Excel yang ingin dipecah.");
      return;
    }
    setIsProcessing(true);
    setMessage(null);
    try {
      await ExcelAPI.upload([splitFile]);
      const res = await ExcelAPI.split({
        file_name: splitFile.name,
        split_mode: splitMode,
        max_rows_per_file: maxRows,
        split_column: splitCol || undefined,
        export_format: "xlsx",
      });
      setSplitJobResult(res.job);
      setMessage(`Job Split Excel dijadwalkan (ID: ${res.job.job_id}).`);
    } catch (err: any) {
      setMessage(`Gagal: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunAIAnalysis = async () => {
    if (!file1Preview && !file2Preview) {
      setMessage("Harap unggah minimal satu file Excel untuk dianalisa AI.");
      return;
    }
    setIsAnalyzingAI(true);
    setMessage(null);
    try {
      const res = await ExcelAPI.aiAnalyzeComparison({
        file1_name: file1 ? file1.name : "File 1 Master",
        file2_name: file2 ? file2.name : "File 2 Pembanding",
        file1_data: file1Preview?.preview_data || [],
        file2_data: file2Preview?.preview_data || [],
        key_cols1: keyCols1,
        key_cols2: keyCols2,
      });
      setAiAnalysisResult(res);
    } catch (err: any) {
      setMessage(`Gagal Analisis AI: ${err.message}`);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
          Excel & Data Utility Suite
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Pengolahan file Excel (xlsx, xls, csv) volume tinggi dengan komparasi data live preview, RapidFuzz, hapus duplikat, serta merge & split.
        </p>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveTab("compare")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab === "compare"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <GitCompare className="w-4 h-4" /> Compare Excel (Fuzzy / Exact)
        </button>

        <button
          onClick={() => setActiveTab("dedup")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab === "dedup"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Remove Duplicate
        </button>

        <button
          onClick={() => setActiveTab("merge")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab === "merge"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <Layers className="w-4 h-4" /> Merge Files
        </button>

        <button
          onClick={() => setActiveTab("split")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab === "split"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <Split className="w-4 h-4" /> Split Excel
        </button>
      </div>

      {/* Feedback Message */}
      {message && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* CONTROL PANEL HEADER WITH MINIMIZE BUTTON */}
      <div className="flex items-center justify-between bg-card border border-border p-3.5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <TableProperties className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-xs font-bold text-foreground">
              {isFormMinimized ? "Panel Upload & Pengaturan Di-minimize" : "Panel Upload & Pengaturan Komparasi Excel"}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {isFormMinimized
                ? `File 1: ${file1?.name || "Belum dipilih"} (${file1Preview?.total_rows || 0} baris) | File 2: ${file2?.name || "Belum dipilih"} (${file2Preview?.total_rows || 0} baris) | Mode: ${matchMode}`
                : "Unggah kedua berkas Excel acuan dan pembanding untuk komparasi data."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFormMinimized && (
            <button
              onClick={handleCompare}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              {isProcessing ? "Memproses..." : "Jalankan Komparasi"}
            </button>
          )}
          <button
            onClick={() => setIsFormMinimized(!isFormMinimized)}
            className="px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            {isFormMinimized ? (
              <>
                <ChevronDown className="w-4 h-4 text-emerald-400" /> Buka Panel Pengaturan
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 text-rose-400" /> Minimize Panel
              </>
            )}
          </button>
        </div>
      </div>

      {/* FULL FORM CONTROLS (EXPANDED) */}
      {!isFormMinimized && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all">
          {/* FILE 1 */}
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TableProperties className="w-4 h-4 text-emerald-400" />
                1. File Excel 1 (Master / Acuan)
              </h2>
              {file1Preview && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold">
                  {file1Preview.total_rows} Baris Data
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <FileUploader
                label="Upload File Excel 1 (Master)"
                multiple={false}
                onFilesSelected={(files) => handleFile1Select(files[0] || null)}
              />
              <button
                type="button"
                onClick={() => {
                  setActiveHistoryTarget("file1");
                  fetchHistory();
                  setShowHistoryModal(true);
                }}
                className="w-full py-2 flex justify-center items-center gap-2 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-md text-xs font-medium hover:bg-cyan-500/10 transition-colors"
              >
                <History className="w-4 h-4" /> Pilih dari Riwayat File
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Kolom Kunci File 1 (pisahkan dengan koma):
                </label>
                <div className="flex items-center gap-2">
                  {file1Preview?.columns && file1Preview.columns.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const all1 = file1Preview.columns.join(", ");
                          setKeyCols1(all1);
                          setKeyCols2(all1);
                        }}
                        title="Pilih semua kolom File 1 & salin langsung ke File 2"
                        className="text-[10px] text-emerald-400 hover:underline font-mono"
                      >
                        Pilih Semua ({file1Preview.columns.length})
                      </button>
                      <span className="text-muted-foreground text-[10px]">|</span>
                      <button
                        type="button"
                        onClick={() => setKeyCols1("")}
                        className="text-[10px] text-rose-400 hover:underline font-mono"
                      >
                        Hapus Semua
                      </button>
                    </>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={keyCols1}
                onChange={(e) => setKeyCols1(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                placeholder="misal: NIK, Nama, Email"
              />
              {file1Preview?.columns && file1Preview.columns.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-h-40 overflow-y-auto p-2 border border-slate-700/60 dark:border-slate-700 rounded-lg bg-slate-900/60 dark:bg-slate-950/80 shadow-inner">
                  {file1Preview.columns.map((col, idx) => {
                    const isSelected = selectedKeyCols1Set.has(col);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setKeyCols1(Array.from(selectedKeyCols1Set).filter((c) => c !== col).join(", "));
                          } else {
                            setKeyCols1([...Array.from(selectedKeyCols1Set), col].join(", "));
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border shadow-sm ${isSelected
                            ? "bg-emerald-500 text-slate-950 font-bold border-emerald-400 ring-2 ring-emerald-400/40"
                            : "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700 hover:text-white"
                          }`}
                      >
                        {isSelected ? "✓ " : "+ "}{col}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* FILE 2 */}
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TableProperties className="w-4 h-4 text-sky-400" />
                2. File Excel 2 (Pembanding)
              </h2>
              {file2Preview && (
                <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded font-mono font-semibold">
                  {file2Preview.total_rows} Baris Data
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <FileUploader
                label="Upload File Excel 2 (Pembanding)"
                multiple={false}
                onFilesSelected={(files) => handleFile2Select(files[0] || null)}
              />
              <button
                type="button"
                onClick={() => {
                  setActiveHistoryTarget("file2");
                  fetchHistory();
                  setShowHistoryModal(true);
                }}
                className="w-full py-2 flex justify-center items-center gap-2 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-md text-xs font-medium hover:bg-cyan-500/10 transition-colors"
              >
                <History className="w-4 h-4" /> Pilih dari Riwayat File
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Kolom Kunci File 2 (pisahkan dengan koma):
                </label>
                <div className="flex items-center gap-2">
                  {keyCols1 && (
                    <button
                      type="button"
                      onClick={() => setKeyCols2(keyCols1)}
                      title="Salin persis urutan & susunan kolom kunci dari File 1"
                      className="text-[10px] text-amber-300 hover:underline font-mono font-bold flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/40"
                    >
                      📋 Salin dari File 1
                    </button>
                  )}
                  {file2Preview?.columns && file2Preview.columns.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setKeyCols2(file2Preview.columns.join(", "))}
                        className="text-[10px] text-sky-400 hover:underline font-mono font-bold"
                      >
                        Pilih Semua ({file2Preview.columns.length})
                      </button>
                      <span className="text-muted-foreground text-[10px]">|</span>
                      <button
                        type="button"
                        onClick={() => setKeyCols2("")}
                        className="text-[10px] text-rose-400 hover:underline font-mono font-bold"
                      >
                        Hapus Semua
                      </button>
                    </>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={keyCols2}
                onChange={(e) => setKeyCols2(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono text-slate-900 dark:text-slate-100 font-semibold"
                placeholder="misal: NIK, Nama, Email"
              />
              {file2Preview?.columns && file2Preview.columns.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-h-40 overflow-y-auto p-2 border border-slate-700/60 dark:border-slate-700 rounded-lg bg-slate-900/60 dark:bg-slate-950/80 shadow-inner">
                  {file2Preview.columns.map((col, idx) => {
                    const isSelected = selectedKeyCols2Set.has(col);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setKeyCols2(Array.from(selectedKeyCols2Set).filter((c) => c !== col).join(", "));
                          } else {
                            setKeyCols2([...Array.from(selectedKeyCols2Set), col].join(", "));
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border shadow-sm ${isSelected
                            ? "bg-sky-400 text-slate-950 font-bold border-sky-300 ring-2 ring-sky-300/40"
                            : "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700 hover:text-white"
                          }`}
                      >
                        {isSelected ? "✓ " : "+ "}{col}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Compare Controls */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-border bg-card space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">3. Pengaturan Algoritma Pencocokan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Metode Match:</label>
                <select
                  value={matchMode}
                  onChange={(e: any) => setMatchMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
                >
                  <option value="exact">Exact Match (Persis 100%)</option>
                  <option value="similar">Similar Match (Fuzzy RapidFuzz)</option>
                </select>
              </div>

              {matchMode === "similar" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Ambang Kemiripan (%): <span className="font-bold text-primary">{similarityThreshold}%</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={similarityThreshold}
                    onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Format Output:</label>
                <select
                  value={compareFormat}
                  onChange={(e: any) => setCompareFormat(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
                >
                  <option value="xlsx">Excel Multi-Sheet (.xlsx)</option>
                  <option value="csv">CSV Single File (.csv)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCompare}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-md bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow"
            >
              <span>{isProcessing ? "Memproses Komparasi..." : "Jalankan Komparasi Excel"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* AI DATA INTELLIGENCE & INCOMPLETE NAME RECONCILIATION PANEL */}
      {(file1Preview || file2Preview) && (
        <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 border-2 border-purple-500/80 dark:border-purple-400 shadow-2xl rounded-2xl p-6 space-y-5 text-slate-100">
          {/* Decorative accent glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/40 pb-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-900/50 border border-purple-300/40 shrink-0">
                <BrainCircuit className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-wide flex flex-wrap items-center gap-2">
                  <span>AI Data Intelligence & Deteksi Nama Identik</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500 text-white border border-purple-300/50 shadow-sm">
                    Smart AI Engine
                  </span>
                </h2>
                <p className="text-xs text-purple-200 mt-1 font-medium leading-relaxed">
                  Menganalisa tingkat kemiripan data & mendeteksi otomatis pasangan nama yang identik walaupun tersingkat / tidak lengkap (misal: "M. Rizky" vs "Muhammad Rizky").
                </p>
              </div>
            </div>

            <button
              onClick={handleRunAIAnalysis}
              disabled={isAnalyzingAI}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-emerald-500 to-teal-400 hover:from-purple-400 hover:via-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-xl hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 shrink-0 border border-white/60 active:scale-95 cursor-pointer"
            >
              {isAnalyzingAI ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Menganalisa Data via AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950 fill-amber-300" />
                  <span>Jalankan Analisis AI & Rangkuman Data</span>
                </>
              )}
            </button>
          </div>

          {/* AI ANALYSIS RESULTS DISPLAY */}
          {aiAnalysisResult && (
            <div className="space-y-6 pt-2 animate-in fade-in duration-300 relative z-10">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/90 border-2 border-purple-500/50 shadow-md">
                  <span className="text-[10px] text-purple-300 block font-mono font-semibold uppercase tracking-wider">Engine Pengolah</span>
                  <span className="text-xs font-black text-purple-300 truncate block mt-1">{aiAnalysisResult.provider}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/90 border-2 border-emerald-500/50 shadow-md">
                  <span className="text-[10px] text-emerald-300 block font-mono font-semibold uppercase tracking-wider">File 1 (Master)</span>
                  <span className="text-xs font-black text-emerald-400 block mt-1">{aiAnalysisResult.total_file1} Baris Data</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/90 border-2 border-sky-500/50 shadow-md">
                  <span className="text-[10px] text-sky-300 block font-mono font-semibold uppercase tracking-wider">File 2 (Pembanding)</span>
                  <span className="text-xs font-black text-sky-400 block mt-1">{aiAnalysisResult.total_file2} Baris Data</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/90 border-2 border-amber-500/60 shadow-md">
                  <span className="text-[10px] text-amber-300 block font-mono font-semibold uppercase tracking-wider">Nama Parsial</span>
                  <span className="text-xs font-black text-amber-400 block mt-1">{aiAnalysisResult.reconciled_matches?.length || 0} Pasangan</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/90 border-2 border-rose-500/60 shadow-md">
                  <span className="text-[10px] text-rose-300 block font-mono font-semibold uppercase tracking-wider">Beda Nama (Email Sama)</span>
                  <span className="text-xs font-black text-rose-400 block mt-1">{aiAnalysisResult.name_discrepancies?.length || 0} Akun</span>
                </div>
              </div>

              {/* DISCREPANCY TABLE: SAME EMAIL/NIK BUT DIFFERENT NAME */}
              {aiAnalysisResult.name_discrepancies && aiAnalysisResult.name_discrepancies.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold text-rose-300 flex items-center gap-2 bg-rose-950/80 px-3 py-1.5 rounded-lg border border-rose-500/40 w-fit">
                    <AlertCircle className="w-4 h-4 text-rose-400 animate-bounce" />
                    Peringatan AI: Deteksi Email/NIK Sama Tetapi Penulisan Nama Berbeda ({aiAnalysisResult.name_discrepancies.length} Akun):
                  </h3>
                  <div className="overflow-x-auto border-2 border-rose-500/50 rounded-xl max-h-64 overflow-y-auto bg-slate-950 shadow-inner">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead className="bg-rose-950 text-rose-100 font-black sticky top-0 border-b-2 border-rose-500/50">
                        <tr>
                          <th className="p-2.5 border-r border-rose-500/30">#</th>
                          <th className="p-2.5 border-r border-rose-500/30">Acuan Sama (Email/NIK)</th>
                          <th className="p-2.5 border-r border-rose-500/30">Nama di File 1 (Master)</th>
                          <th className="p-2.5 border-r border-rose-500/30">Nama di File 2 (Pembanding)</th>
                          <th className="p-2.5">Rincian Temuan AI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-[11px]">
                        {aiAnalysisResult.name_discrepancies.map((disc: any, dIdx: number) => (
                          <tr key={dIdx} className="hover:bg-rose-900/30 transition-all">
                            <td className="p-2.5 border-r border-slate-800 text-slate-400 font-bold">{dIdx + 1}</td>
                            <td className="p-2.5 border-r border-slate-800 font-black text-amber-300">{disc.match_value}</td>
                            <td className="p-2.5 border-r border-slate-800 font-extrabold text-emerald-400">{disc.file1_name}</td>
                            <td className="p-2.5 border-r border-slate-800 font-extrabold text-sky-400">{disc.file2_name}</td>
                            <td className="p-2.5 text-rose-200 font-medium">{disc.detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* INCOMPLETE / PARTIAL NAME MATCHES TABLE */}
              {aiAnalysisResult.reconciled_matches && aiAnalysisResult.reconciled_matches.length > 0 ? (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold text-purple-200 flex items-center gap-2 bg-purple-950/80 px-3 py-1.5 rounded-lg border border-purple-500/40 w-fit">
                    <Zap className="w-4 h-4 text-amber-300" />
                    Tabel Rekonsiliasi AI (Hasil Deteksi Nama Identik / Tersingkat):
                  </h3>
                  <div className="overflow-x-auto border-2 border-purple-500/50 rounded-xl max-h-64 overflow-y-auto bg-slate-950 shadow-inner">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead className="bg-purple-950 text-purple-100 font-black sticky top-0 border-b-2 border-purple-500/50">
                        <tr>
                          <th className="p-2.5 border-r border-purple-500/30">#</th>
                          <th className="p-2.5 border-r border-purple-500/30">Nama File 1 (Master)</th>
                          <th className="p-2.5 border-r border-purple-500/30">Nama File 2 (Pembanding)</th>
                          <th className="p-2.5 border-r border-purple-500/30 text-center">Skor AI</th>
                          <th className="p-2.5">Analisis & Alasan AI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-[11px]">
                        {aiAnalysisResult.reconciled_matches.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-purple-900/30 transition-all">
                            <td className="p-2.5 border-r border-slate-800 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-2.5 border-r border-slate-800 font-extrabold text-emerald-400">{item.name_file1}</td>
                            <td className="p-2.5 border-r border-slate-800 font-extrabold text-sky-400">{item.name_file2}</td>
                            <td className="p-2.5 border-r border-slate-800 text-center">
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black border border-amber-300 shadow-sm">
                                {item.similarity_score}%
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-200 font-medium">{item.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 text-center font-medium">
                  Semua nama pada sampel data sudah cocok sempurna atau belum ditemukan variasi nama tersingkat.
                </div>
              )}

              {/* AI EXECUTIVE REPORT MARKDOWN VIEW */}
              {aiAnalysisResult.executive_report && (
                <div className="p-5 rounded-2xl bg-slate-950 border-2 border-purple-500/60 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-purple-500/30 pb-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-black text-purple-300 uppercase tracking-wider font-mono">
                      Laporan Eksekutif & Rangkuman Analisis AI
                    </h4>
                  </div>
                  <div className="prose prose-invert max-w-none text-xs leading-relaxed whitespace-pre-line text-slate-100 font-sans font-medium">
                    {aiAnalysisResult.executive_report}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* LIVE EXCEL CONTENT PREVIEW TABLES */}
      {(file1Preview || file2Preview || loadingPreview1 || loadingPreview2) && (
        <div className="space-y-6 pt-4 border-t border-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-emerald-400" />
                Pratinjau Isi Berkas Excel (Web Data Viewer)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nilai/kata yang sama antara File 1 dan File 2 ditandai dengan warna sorotan khusus (*Live Match Highlight*).
              </p>
            </div>

            {/* SINGLE GLOBAL SEARCH INPUT WITH AUTO-SUGGESTIONS */}
            <div className="relative w-full lg:w-96">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <input
                  type="text"
                  value={globalFilterQuery}
                  onChange={(e) => setGlobalFilterQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder="Cari kata/nilai dari semua kolom (File 1 & 2)..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border-2 border-purple-500/50 bg-background focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono shadow-md"
                />
                {globalFilterQuery && (
                  <button
                    onClick={() => setGlobalFilterQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* AUTO-SUGGESTIONS DROPDOWN */}
              {isSearchFocused && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border-2 border-purple-500/60 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-800 animate-in fade-in">
                  <div className="p-2 text-[10px] font-mono text-purple-300 uppercase tracking-wider font-bold bg-purple-950/80">
                    💡 Sugesti Nilai Kolom Terdeteksi:
                  </div>
                  {searchSuggestions.map((item, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onMouseDown={() => setGlobalFilterQuery(item)}
                      className="w-full text-left px-3 py-2 text-xs font-mono text-slate-200 hover:bg-purple-900/40 hover:text-amber-300 transition-all flex items-center justify-between"
                    >
                      <span>{item}</span>
                      <span className="text-[10px] text-purple-400 font-bold">Pilih ↵</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Legend Badges */}
              <div className="flex items-center gap-2 text-[11px] font-bold mr-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500 text-slate-950 font-black border border-emerald-300 shadow">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-950"></span> Cocok di File 2 (Emerald)
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-400 text-slate-950 font-black border border-sky-200 shadow">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-950"></span> Cocok di File 1 (Sky Blue)
                </span>
              </div>

              {/* Sync Scroll Toggle Button */}
              <button
                onClick={() => setSyncScroll(!syncScroll)}
                title={syncScroll ? "Matikan Scroll Sinkron Bersamaan" : "Aktifkan Scroll Sinkron Bersamaan"}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 border ${syncScroll
                    ? "bg-amber-400 text-slate-950 border-amber-300 font-bold shadow"
                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                  }`}
              >
                {syncScroll ? <Link2 className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
                {syncScroll ? "Scroll Synchronized" : "Scroll Terpisah"}
              </button>

              {/* Filter Only Selected Key Columns Toggle */}
              <button
                onClick={() => setShowOnlyKeyColumns(!showOnlyKeyColumns)}
                title={showOnlyKeyColumns ? "Tampilkan Semua Kolom Excel" : "Sinkronkan & Tampilkan Hanya Kolom Kunci Terpilih"}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 border shadow-sm ${showOnlyKeyColumns
                    ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30"
                    : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                  }`}
              >
                <Filter className="w-4 h-4" />
                {showOnlyKeyColumns ? "Sinkron: Menyala (Hanya Kunci)" : "Sinkron: Semua Kolom"}
              </button>

              {/* Layout Mode Switcher */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
                <button
                  onClick={() => setPreviewLayoutMode("stacked")}
                  title="Tampilan Lebar Penuh (100% Full Width Atas-Bawah)"
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${previewLayoutMode === "stacked" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Rows className="w-3.5 h-3.5" /> Lebar Penuh
                </button>
                <button
                  onClick={() => setPreviewLayoutMode("grid")}
                  title="Tampilan 2 Kolom Bersandingan"
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${previewLayoutMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Columns className="w-3.5 h-3.5" /> 2 Kolom
                </button>
                <button
                  onClick={() => setPreviewLayoutMode("fullscreen")}
                  title="Tampilan Layar Penuh (Fullscreen Modal)"
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${previewLayoutMode === "fullscreen" ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Layar Penuh
                </button>
              </div>

              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground rounded text-xs font-medium transition-all flex items-center gap-1.5 border border-border"
              >
                <Eye className="w-3.5 h-3.5" />
                {showPreview ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
          </div>

          {showPreview && (
            <>
              <div className={previewLayoutMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-6"}>
                {/* PREVIEW FILE 1 */}
                <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border pb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-xs text-foreground truncate max-w-[250px]">
                        {file1 ? file1.name : "File 1 (Master)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {file1Preview && (
                        <>
                          {file1History.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleUndo(1)}
                              className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[10px] font-mono font-bold border border-amber-500/30 transition-all flex items-center gap-1"
                            >
                              <Undo2 className="w-3 h-3" /> Undo
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSaveToFile(1)}
                            disabled={isSavingFile1}
                            title="Simpan semua perubahan isi sel langsung ke berkas fisik Excel File 1"
                            className="px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-[10px] font-mono font-black border border-emerald-300 transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                          >
                            {isSavingFile1 ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            {isSavingFile1 ? "Menyimpan..." : "Simpan Ke Excel"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddRow(1)}
                            className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-mono font-bold border border-emerald-500/40 transition-all flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Tambah Baris
                          </button>
                        </>
                      )}
                      {loadingPreview1 ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : file1Preview ? (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                          {filteredPreviewData1.length} / {file1Preview.total_rows} Baris
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {loadingPreview1 ? (
                    <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-lg border border-emerald-500/20">
                      <RefreshCw className="w-7 h-7 animate-spin text-emerald-400" />
                      <span className="font-semibold text-emerald-300">Membaca data File 1...</span>
                    </div>
                  ) : file1Preview && file1Preview.columns?.length > 0 ? (
                    (() => {
                      const normalizedKeyCols1 = new Set(Array.from(selectedKeyCols1Set).map(s => s.toLowerCase()));
                      const visibleCols1 = showOnlyKeyColumns && normalizedKeyCols1.size > 0
                        ? file1Preview.columns.filter((c) => normalizedKeyCols1.has(c.toLowerCase()))
                        : file1Preview.columns;

                      return (
                        <div
                          ref={tableContainer1Ref}
                          onScroll={() => handleScrollSync(1)}
                          className={`overflow-x-auto overflow-y-auto border border-emerald-500/20 rounded-md transition-all ${isFormMinimized ? "max-h-[720px] h-[calc(100vh-240px)]" : "max-h-[550px]"
                            }`}
                        >
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-emerald-950 sticky top-0 border-b border-emerald-500/50 text-emerald-200 font-black shadow-sm">
                              <tr>
                                <th className="p-2.5 border-r border-emerald-500/30 font-mono text-[10px] bg-emerald-950 text-emerald-400">#</th>
                                {visibleCols1.map((col, idx) => {
                                  const isSorted = sortCol1 === col;
                                  const isEditingThisColumn = editingColumn?.fileNum === 1 && editingColumn?.colIdx === idx;
                                  
                                  if (isEditingThisColumn) {
                                    return (
                                      <th key={idx} className="p-1 border-r border-emerald-500/30 bg-emerald-900">
                                        <input
                                          type="text"
                                          autoFocus
                                          value={editingColumnValue}
                                          onChange={(e) => setEditingColumnValue(e.target.value)}
                                          onBlur={() => handleColumnRenameSave(1, col, editingColumnValue)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") handleColumnRenameSave(1, col, editingColumnValue);
                                            if (e.key === "Escape") setEditingColumn(null);
                                          }}
                                          className="w-full px-2 py-1 text-xs bg-slate-900 text-emerald-300 rounded border border-emerald-400 focus:outline-none font-mono"
                                        />
                                      </th>
                                    );
                                  }

                                  return (
                                    <th
                                      key={idx}
                                      className={`p-2.5 border-r border-emerald-500/30 truncate min-w-[140px] max-w-[220px] tracking-wide text-xs select-none transition-all group ${isSorted ? "bg-emerald-900/90" : "hover:bg-emerald-900/40"}`}
                                    >
                                      <div className="flex items-center justify-between gap-1 relative">
                                        <span 
                                          onDoubleClick={(e) => { e.stopPropagation(); setEditingColumn({ fileNum: 1, colIdx: idx }); setEditingColumnValue(col); }} 
                                          className={`flex-1 truncate cursor-pointer hover:underline ${isSorted ? "text-amber-300" : ""}`}
                                          title="Klik 2x untuk ubah nama kolom"
                                        >
                                          {col}
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0 bg-emerald-950/90 px-1 py-0.5 rounded transition-opacity opacity-40 group-hover:opacity-100">
                                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(col); setMessage(`✅ Nama kolom "${col}" disalin!`); }} className="p-0.5 hover:bg-emerald-500/20 text-emerald-500/80 hover:text-emerald-400 rounded transition-colors" title={`Salin nama kolom ke teks`}>
                                              <Copy className="w-3 h-3" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleCopyColumnToFile2(col); }} className="p-0.5 hover:bg-indigo-500/20 text-indigo-500/80 hover:text-indigo-400 rounded transition-colors" title={`Salin isi kolom ${col} ke File 2`}>
                                              <ArrowRightToLine className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleSortColumn(1, col)} className={`p-0.5 hover:bg-emerald-500/20 rounded transition-colors ${isSorted ? "text-amber-300" : "text-emerald-500/60 hover:text-emerald-300"}`} title="Urutkan">
                                              {isSorted ? (sortDir1 === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(1, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/70 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                      </div>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border font-mono text-[11px]">
                              {filteredPreviewData1.slice(0, previewLimit1).map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-emerald-500/10 transition-all">
                                  <td className="p-2 border-r border-border text-muted-foreground text-[10px] relative group w-12 text-center align-middle">
                                    <span className="group-hover:hidden">{rIdx + 1}</span>
                                    <button 
                                      onClick={() => handleDeleteRow(1, row)}
                                      className="hidden group-hover:flex absolute inset-0 items-center justify-center bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 w-full h-full transition-colors"
                                      title={`Hapus baris ${rIdx + 1}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                  {visibleCols1.map((col, cIdx) => {
                                    const rawVal = String(row[col] ?? "").trim();
                                    const lowerVal = rawVal.toLowerCase();
                                    const isMatch = lowerVal.length > 0 && file2ValuesSet.has(lowerVal);
                                    const isSelectedCell = selectedCellValue !== null && selectedCellValue.toLowerCase() === lowerVal;
                                    const isEditingThis = editingCell?.fileNum === 1 && editingCell?.rowIndex === rIdx && editingCell?.col === col;

                                    if (isEditingThis) {
                                      return (
                                        <td key={cIdx} className="p-1 border-r border-border bg-emerald-950">
                                          <input
                                            type="text"
                                            autoFocus
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            onBlur={() => handleCellSave(1, row, col, editingValue)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") handleCellSave(1, row, col, editingValue);
                                              if (e.key === "Escape") setEditingCell(null);
                                            }}
                                            className="w-full px-2 py-1 text-xs bg-slate-900 text-white rounded border border-emerald-400 focus:outline-none font-mono"
                                          />
                                        </td>
                                      );
                                    }

                                    return (
                                      <td
                                        key={cIdx}
                                        data-cell-value={lowerVal}
                                        onClick={() => handleCellClick(rawVal)}
                                        onDoubleClick={() => {
                                          setEditingCell({ fileNum: 1, rowIndex: rIdx, col });
                                          setEditingValue(rawVal);
                                        }}
                                        title="Klik 2x untuk mengedit isi kolom"
                                        className={`p-2 border-r border-border truncate min-w-[140px] max-w-[220px] cursor-pointer transition-all ${isSelectedCell ? "bg-amber-400/30 ring-2 ring-amber-400 font-bold scale-[1.02] z-10 shadow-lg" : ""
                                          }`}
                                      >
                                        {isMatch ? (
                                          <span className={`px-2 py-0.5 rounded font-black shadow-md inline-block transition-all ${isSelectedCell
                                              ? "bg-amber-400 text-slate-950 border-2 border-white ring-4 ring-amber-300 animate-pulse scale-105"
                                              : "bg-emerald-500 text-slate-950 border border-emerald-300 ring-2 ring-emerald-400/40"
                                            }`}>
                                            {rawVal || <span className="opacity-40 italic">Kosong</span>}
                                          </span>
                                        ) : (
                                          <span className={isSelectedCell ? "text-amber-300 font-black" : "text-foreground"}>
                                            {rawVal || <span className="opacity-30 italic">Kosong</span>}
                                          </span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {filteredPreviewData1.length > previewLimit1 && (
                            <div className="text-center p-2 text-[10px] text-muted-foreground bg-emerald-500/5 italic border-t border-emerald-500/20 flex items-center justify-between">
                              <span>Menampilkan {previewLimit1} baris pertama dari {filteredPreviewData1.length} baris hasil filter...</span>
                              <button 
                                onClick={() => setPreviewLimit1(prev => prev + 50)}
                                className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded font-semibold transition-colors"
                              >
                                Muat Lebih Banyak (+50)
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      Unggah File 1 untuk menampilkan isi data Excel di sini.
                    </div>
                  )}
                </div>

                {/* PREVIEW FILE 2 */}
                <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border pb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                      <span className="font-semibold text-xs text-foreground truncate max-w-[250px]">
                        {file2 ? file2.name : "File 2 (Pembanding)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {file2Preview && (
                        <>
                          {file2History.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleUndo(2)}
                              className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[10px] font-mono font-bold border border-amber-500/30 transition-all flex items-center gap-1"
                            >
                              <Undo2 className="w-3 h-3" /> Undo
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSaveToFile(2)}
                            disabled={isSavingFile2}
                            title="Simpan semua perubahan isi sel langsung ke berkas fisik Excel File 2"
                            className="px-2.5 py-0.5 rounded bg-sky-400 text-slate-950 hover:bg-sky-300 text-[10px] font-mono font-black border border-sky-200 transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                          >
                            {isSavingFile2 ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            {isSavingFile2 ? "Menyimpan..." : "Simpan Ke Excel"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddRow(2)}
                            className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-[10px] font-mono font-bold border border-sky-500/40 transition-all flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Tambah Baris
                          </button>
                        </>
                      )}
                      {loadingPreview2 ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : file2Preview ? (
                        <span className="text-[10px] font-mono text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 shrink-0">
                          {filteredPreviewData2.length} / {file2Preview.total_rows} Baris
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {loadingPreview2 ? (
                    <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-lg border border-sky-500/20">
                      <RefreshCw className="w-7 h-7 animate-spin text-sky-400" />
                      <span className="font-semibold text-sky-300">Membaca data File 2...</span>
                    </div>
                  ) : file2Preview && file2Preview.columns?.length > 0 ? (
                    (() => {
                      const normalizedKeyCols2 = new Set(Array.from(selectedKeyCols2Set).map(s => s.toLowerCase()));
                      const visibleCols2 = showOnlyKeyColumns && normalizedKeyCols2.size > 0
                        ? file2Preview.columns.filter((c) => normalizedKeyCols2.has(c.toLowerCase()))
                        : file2Preview.columns;

                      return (
                      <div
                        ref={tableContainer2Ref}
                        onScroll={() => handleScrollSync(2)}
                        className={`overflow-x-auto overflow-y-auto border border-sky-500/20 rounded-md transition-all ${isFormMinimized ? "max-h-[720px] h-[calc(100vh-240px)]" : "max-h-[550px]"
                          }`}
                      >
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-sky-950 sticky top-0 border-b border-sky-500/50 text-sky-200 font-black shadow-sm">
                            <tr>
                              <th className="p-2.5 border-r border-sky-500/30 font-mono text-[10px] bg-sky-950 text-sky-400">#</th>
                              {visibleCols2.map((col, idx) => {
                                const isSorted = sortCol2 === col;
                                  const isEditingThisColumn = editingColumn?.fileNum === 2 && editingColumn?.colIdx === idx;
                                  
                                  if (isEditingThisColumn) {
                                    return (
                                      <th key={idx} className="p-1 border-r border-sky-500/30 bg-sky-900">
                                        <input
                                          type="text"
                                          autoFocus
                                          value={editingColumnValue}
                                          onChange={(e) => setEditingColumnValue(e.target.value)}
                                          onBlur={() => handleColumnRenameSave(2, col, editingColumnValue)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") handleColumnRenameSave(2, col, editingColumnValue);
                                            if (e.key === "Escape") setEditingColumn(null);
                                          }}
                                          className="w-full px-2 py-1 text-xs bg-slate-900 text-sky-300 rounded border border-sky-400 focus:outline-none font-mono"
                                        />
                                      </th>
                                    );
                                  }

                                  return (
                                    <th
                                      key={idx}
                                      className={`p-2.5 border-r border-sky-500/30 truncate min-w-[140px] max-w-[220px] tracking-wide text-xs select-none transition-all group ${isSorted ? "bg-sky-900/90" : "hover:bg-sky-900/40"}`}
                                    >
                                      <div className="flex items-center justify-between gap-1 relative">
                                        <span 
                                          onDoubleClick={(e) => { e.stopPropagation(); setEditingColumn({ fileNum: 2, colIdx: idx }); setEditingColumnValue(col); }} 
                                          className={`flex-1 truncate cursor-pointer hover:underline ${isSorted ? "text-amber-300" : ""}`}
                                          title="Klik 2x untuk ubah nama kolom"
                                        >
                                          {col}
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0 bg-sky-950/90 px-1 py-0.5 rounded transition-opacity opacity-40 group-hover:opacity-100">
                                            <button onClick={(e) => { e.stopPropagation(); handleCopyColumnToFile1(col); }} className="p-0.5 hover:bg-indigo-500/20 text-indigo-500/80 hover:text-indigo-400 rounded transition-colors" title={`Salin isi kolom ${col} ke File 1`}>
                                              <ArrowLeftToLine className="w-3 h-3" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(col); setMessage(`✅ Nama kolom "${col}" disalin!`); }} className="p-0.5 hover:bg-sky-500/20 text-sky-500/80 hover:text-sky-400 rounded transition-colors" title={`Salin nama kolom ke teks`}>
                                              <Copy className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleSortColumn(2, col)} className={`p-0.5 hover:bg-sky-500/20 rounded transition-colors ${isSorted ? "text-amber-300" : "text-sky-500/60 hover:text-sky-300"}`} title="Urutkan">
                                              {isSorted ? (sortDir2 === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(2, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/70 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                      </div>
                                    </th>
                                  );
                              })}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border font-mono text-[11px]">
                            {filteredPreviewData2.slice(0, previewLimit2).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-sky-500/10 transition-all">
                                <td className="p-2 border-r border-border text-muted-foreground text-[10px] relative group w-12 text-center align-middle">
                                    <span className="group-hover:hidden">{rIdx + 1}</span>
                                    <button 
                                      onClick={() => handleDeleteRow(2, row)}
                                      className="hidden group-hover:flex absolute inset-0 items-center justify-center bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 w-full h-full transition-colors"
                                      title={`Hapus baris ${rIdx + 1}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                {visibleCols2.map((col, cIdx) => {
                                  const rawVal = String(row[col] ?? "").trim();
                                  const lowerVal = rawVal.toLowerCase();
                                  const isMatch = lowerVal.length > 0 && file1ValuesSet.has(lowerVal);
                                  const isSelectedCell = selectedCellValue !== null && selectedCellValue.toLowerCase() === lowerVal;
                                  const isEditingThis = editingCell?.fileNum === 2 && editingCell?.rowIndex === rIdx && editingCell?.col === col;

                                  if (isEditingThis) {
                                    return (
                                      <td key={cIdx} className="p-1 border-r border-border bg-sky-950">
                                        <input
                                          type="text"
                                          autoFocus
                                          value={editingValue}
                                          onChange={(e) => setEditingValue(e.target.value)}
                                          onBlur={() => handleCellSave(2, row, col, editingValue)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") handleCellSave(2, row, col, editingValue);
                                            if (e.key === "Escape") setEditingCell(null);
                                          }}
                                          className="w-full px-2 py-1 text-xs bg-slate-900 text-white rounded border border-sky-400 focus:outline-none font-mono"
                                        />
                                      </td>
                                    );
                                  }

                                  return (
                                    <td
                                      key={cIdx}
                                      data-cell-value={lowerVal}
                                      onClick={() => handleCellClick(rawVal)}
                                      onDoubleClick={() => {
                                        setEditingCell({ fileNum: 2, rowIndex: rIdx, col });
                                        setEditingValue(rawVal);
                                      }}
                                      title="Klik 2x untuk mengedit isi kolom"
                                      className={`p-2 border-r border-border truncate min-w-[140px] max-w-[220px] cursor-pointer transition-all ${isSelectedCell ? "bg-amber-400/30 ring-2 ring-amber-400 font-bold scale-[1.02] z-10 shadow-lg" : ""
                                        }`}
                                    >
                                      {isMatch ? (
                                        <span className={`px-2 py-0.5 rounded font-black shadow-md inline-block transition-all ${isSelectedCell
                                            ? "bg-amber-400 text-slate-950 border-2 border-white ring-4 ring-amber-300 animate-pulse scale-105"
                                            : "bg-sky-400 text-slate-950 border border-sky-200 ring-2 ring-sky-300/40"
                                          }`}>
                                          {rawVal || <span className="opacity-40 italic">Kosong</span>}
                                        </span>
                                      ) : (
                                        <span className={isSelectedCell ? "text-amber-300 font-black" : "text-foreground"}>
                                          {rawVal || <span className="opacity-30 italic">Kosong</span>}
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {filteredPreviewData2.length > previewLimit2 && (
                          <div className="text-center p-2 text-[10px] text-muted-foreground bg-sky-500/5 italic border-t border-sky-500/20 flex items-center justify-between">
                            <span>Menampilkan {previewLimit2} baris pertama dari {filteredPreviewData2.length} baris hasil filter...</span>
                            <button 
                              onClick={() => setPreviewLimit2(prev => prev + 50)}
                              className="px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 rounded font-semibold transition-colors"
                            >
                              Muat Lebih Banyak (+50)
                            </button>
                          </div>
                        )}
                      </div>
                      );
                      })()
                    ) : (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        Unggah File 2 untuk menampilkan isi data Excel di sini.
                      </div>
                    )}
                    </div>
                </div>

                {/* FULLSCREEN OVERLAY MODAL */}
                {previewLayoutMode === "fullscreen" && (
                  <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md p-6 overflow-y-auto space-y-6">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <TableIcon className="w-5 h-5 text-emerald-400" />
                        Pratinjau Berkas Excel - Mode Layar Penuh (Fullscreen)
                      </h2>
                      <button
                        onClick={() => setPreviewLayoutMode("stacked")}
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-all flex items-center gap-1.5 text-xs font-semibold border border-border"
                      >
                        <X className="w-4 h-4 text-rose-400" /> Tutup Layar Penuh
                      </button>
                    </div>

                    <div className="space-y-8">
                      {/* FILE 1 FULLSCREEN */}
                      {file1Preview && (
                        <div className="bg-card border border-emerald-500/30 rounded-xl p-5 space-y-3 shadow-md">
                          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4" /> File 1: {file1 ? file1.name : "Master"} ({file1Preview.total_rows} Baris Data)
                          </h3>
                          <div className="overflow-x-auto max-h-[70vh] border border-emerald-500/20 rounded-lg">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-emerald-950 sticky top-0 text-emerald-200 font-bold border-b border-emerald-500/40">
                                <tr>
                                  <th className="p-3 border-r border-emerald-500/20">#</th>
                                  {file1Preview.columns.map((col, idx) => (
                                    <th key={idx} className="p-3 border-r border-emerald-500/20 font-bold">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border font-mono">
                                {file1Preview.preview_data.slice(0, 50).map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-emerald-500/5">
                                    <td className="p-2.5 border-r border-border text-muted-foreground">{rIdx + 1}</td>
                                    {file1Preview.columns.map((col, cIdx) => {
                                      const rawVal = String(row[col] ?? "").trim();
                                      const lowerVal = rawVal.toLowerCase();
                                      const isMatch = rawVal && file2ValuesSet.has(lowerVal);
                                      const isSelectedCell = selectedCellValue !== null && selectedCellValue.toLowerCase() === lowerVal;
                                      return (
                                        <td
                                          key={cIdx}
                                          data-cell-value={lowerVal}
                                          onClick={() => handleCellClick(rawVal)}
                                          className={`p-2.5 border-r border-border cursor-pointer transition-all ${isSelectedCell ? "bg-amber-400/30 ring-2 ring-amber-400 font-bold scale-[1.02] z-10 shadow-lg" : ""
                                            }`}
                                        >
                                          {isMatch ? (
                                            <span className={`px-2 py-0.5 rounded font-black shadow-md inline-block transition-all ${isSelectedCell
                                                ? "bg-amber-400 text-slate-950 border-2 border-white ring-4 ring-amber-300 animate-pulse scale-105"
                                                : "bg-emerald-500 text-slate-950 border border-emerald-300 ring-2 ring-emerald-400/40"
                                              }`}>
                                              {rawVal}
                                            </span>
                                          ) : (
                                            <span className={isSelectedCell ? "text-amber-300 font-black" : "text-foreground"}>{rawVal}</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* FILE 2 FULLSCREEN */}
                      {file2Preview && (
                        <div className="bg-card border border-sky-500/30 rounded-xl p-5 space-y-3 shadow-md">
                          <h3 className="font-bold text-sm text-sky-400 flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4" /> File 2: {file2 ? file2.name : "Pembanding"} ({file2Preview.total_rows} Baris Data)
                          </h3>
                          <div className="overflow-x-auto max-h-[70vh] border border-sky-500/20 rounded-lg">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-sky-950 sticky top-0 text-sky-200 font-bold border-b border-sky-500/40">
                                <tr>
                                  <th className="p-3 border-r border-sky-500/20">#</th>
                                  {file2Preview.columns.map((col, idx) => (
                                    <th key={idx} className="p-3 border-r border-sky-500/20 font-bold">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border font-mono">
                                {file2Preview.preview_data.slice(0, 50).map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-sky-500/5">
                                    <td className="p-2.5 border-r border-border text-muted-foreground">{rIdx + 1}</td>
                                    {file2Preview.columns.map((col, cIdx) => {
                                      const rawVal = String(row[col] ?? "").trim();
                                      const lowerVal = rawVal.toLowerCase();
                                      const isMatch = rawVal && file1ValuesSet.has(lowerVal);
                                      const isSelectedCell = selectedCellValue !== null && selectedCellValue.toLowerCase() === lowerVal;
                                      return (
                                        <td
                                          key={cIdx}
                                          data-cell-value={lowerVal}
                                          onClick={() => handleCellClick(rawVal)}
                                          className={`p-2.5 border-r border-border cursor-pointer transition-all ${isSelectedCell ? "bg-amber-400/30 ring-2 ring-amber-400 font-bold scale-[1.02] z-10 shadow-lg" : ""
                                            }`}
                                        >
                                          {isMatch ? (
                                            <span className={`px-2 py-0.5 rounded font-black shadow-md inline-block transition-all ${isSelectedCell
                                                ? "bg-amber-400 text-slate-950 border-2 border-white ring-4 ring-amber-300 animate-pulse scale-105"
                                                : "bg-sky-400 text-slate-950 border border-sky-200 ring-2 ring-sky-300/40"
                                              }`}>
                                              {rawVal}
                                            </span>
                                          ) : (
                                            <span className={isSelectedCell ? "text-amber-300 font-black" : "text-foreground"}>{rawVal}</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
          )}
            </div>
      )}

          {/* TAB 2: DEDUP */}
          {activeTab === "dedup" && (
            <>
            <div className="max-w-2xl mx-auto p-6 rounded-xl border border-border bg-card space-y-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Remove Duplicate Baris Excel</h2>
              <div className="flex flex-col gap-2">
                <FileUploader
                  label="Upload file Excel/CSV untuk dibersihkan"
                  multiple={false}
                  onFilesSelected={(files) => handleDedupFileSelect(files[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveHistoryTarget("dedup");
                    fetchHistory();
                    setShowHistoryModal(true);
                  }}
                  className="w-full py-2 flex justify-center items-center gap-2 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-md text-xs font-medium hover:bg-cyan-500/10 transition-colors"
                >
                  <History className="w-4 h-4" /> Pilih dari Riwayat File
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Kolom Acuan Duplikat (koma untuk multi-kolom):
                  </label>
                  <div className="flex items-center gap-2">
                    {dedupFilePreview?.columns && dedupFilePreview.columns.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setDedupCols(dedupFilePreview.columns.join(", "))}
                          className="text-[10px] text-emerald-400 hover:underline font-mono"
                        >
                          Pilih Semua
                        </button>
                        <span className="text-muted-foreground text-[10px]">|</span>
                        <button
                          type="button"
                          onClick={() => setDedupCols("")}
                          className="text-[10px] text-rose-400 hover:underline font-mono"
                        >
                          Hapus Semua
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={dedupCols}
                  onChange={(e) => setDedupCols(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  placeholder="misal: Email, NoHP"
                />
                {dedupFilePreview?.columns && dedupFilePreview.columns.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-h-40 overflow-y-auto p-2 border border-slate-700/60 dark:border-slate-700 rounded-lg bg-slate-900/60 dark:bg-slate-950/80 shadow-inner">
                    {dedupFilePreview.columns.map((col: string, idx: number) => {
                      const isSelected = selectedDedupColsSet.has(col);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setDedupCols(Array.from(selectedDedupColsSet).filter((c) => c !== col).join(", "));
                            } else {
                              setDedupCols([...Array.from(selectedDedupColsSet), col].join(", "));
                            }
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border shadow-sm ${isSelected
                              ? "bg-emerald-500 text-slate-950 font-bold border-emerald-400 ring-2 ring-emerald-400/40"
                              : "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700 hover:text-white"
                            }`}
                        >
                          {isSelected ? "✓ " : "+ "}{col}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Aturan Simpan (Keep Rule):</label>
                <select
                  value={keepStrategy}
                  onChange={(e: any) => setKeepStrategy(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
                >
                  <option value="first">Simpan Kemunculan Pertama (Keep First)</option>
                  <option value="last">Simpan Kemunculan Terakhir (Keep Last)</option>
                  <option value="unique">Hapus Semua yang Duplikat (Keep Unique Only)</option>
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Urutkan Berdasarkan Kolom (Opsional):
                  </label>
                  <input
                    type="text"
                    value={dedupSortCol}
                    onChange={(e) => setDedupSortCol(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background font-mono"
                    placeholder="misal: Tanggal"
                  />
                </div>
                <div className="w-1/3">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Urutan:</label>
                  <select
                    value={dedupSortDir}
                    onChange={(e: any) => setDedupSortDir(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
                  >
                    <option value="asc">A-Z (Ascending)</option>
                    <option value="desc">Z-A (Descending)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleDedup}
                disabled={isProcessing || loadingDedupPreview || !dedupFilePreview}
                className="w-full py-2.5 rounded-md bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow disabled:opacity-50"
              >
                <span>{isProcessing ? "Memproses Hapus Duplikat..." : "Jalankan Pembersihan Duplikat"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dedup Preview Table */}
            {loadingDedupPreview ? (
              <div className="max-w-6xl mx-auto mt-6 p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3 bg-card border border-border rounded-xl">
                <RefreshCw className="w-7 h-7 animate-spin text-emerald-400" />
                <span className="font-semibold text-emerald-500">Membaca file untuk pratinjau...</span>
              </div>
            ) : dedupFilePreview ? (
              <div className="max-w-6xl mx-auto mt-6 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      Pratinjau Hapus Duplikat: {dedupFile?.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Menampilkan sampel data. Baris berwarna merah muda dengan coretan akan <b>dihapus</b>.
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs font-mono">
                    <div className="flex flex-col text-right">
                      <span className="text-muted-foreground">Total Baris:</span>
                      <span className="font-bold">{processedDedupData.stats.total}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-rose-500">Akan Dihapus:</span>
                      <span className="font-bold text-rose-500">{processedDedupData.stats.removed}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-emerald-500">Dipertahankan:</span>
                      <span className="font-bold text-emerald-500">{processedDedupData.stats.kept}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 border-b border-border bg-card">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Cari data di tabel pratinjau..."
                      value={dedupSearchQuery}
                      onChange={(e) => setDedupSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 sticky top-0 border-b-2 border-emerald-500/50 text-slate-100 font-bold shadow-md z-10">
                      <tr>
                        <th className="p-3 border-r border-slate-700/50 text-center w-12">#</th>
                        <th className="p-3 border-r border-slate-700/50 text-center w-24">Status</th>
                        {dedupFilePreview.columns.map((col: string, idx: number) => (
                          <th key={idx} className="p-3 border-r border-slate-700/50 truncate max-w-[200px]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono text-[11px]">
                      {processedDedupData.rows
                        .filter((row: any) => {
                          if (!dedupSearchQuery) return true;
                          const q = dedupSearchQuery.toLowerCase();
                          return Object.values(row).some(v => String(v).toLowerCase().includes(q));
                        })
                        .slice(0, previewLimitDedup)
                        .map((row: any, rIdx: number) => {
                        const isRemoved = row.__dedup_status === "removed";
                        return (
                          <tr 
                            key={rIdx} 
                            className={`transition-colors ${
                              isRemoved 
                                ? "bg-rose-500/10 text-muted-foreground line-through decoration-rose-500/50" 
                                : "hover:bg-muted/30"
                            }`}
                          >
                            <td className="p-2 border-r border-border text-center text-muted-foreground/70">{rIdx + 1}</td>
                            <td className="p-2 border-r border-border text-center">
                              {isRemoved ? (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[9px] uppercase tracking-wider">Hapus</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-bold text-[9px] uppercase tracking-wider">Simpan</span>
                              )}
                            </td>
                            {dedupFilePreview.columns.map((col: string, cIdx: number) => (
                              <td key={cIdx} className={`p-2 border-r border-border truncate max-w-[200px] ${isRemoved ? "opacity-60" : ""}`}>
                                {String(row[col] ?? "") || <span className="opacity-30 italic">Kosong</span>}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {processedDedupData.rows.length > previewLimitDedup && (
                    <div className="text-center p-2 text-[10px] text-muted-foreground bg-amber-500/5 italic border-t border-amber-500/20 flex items-center justify-between">
                      <span>Menampilkan {previewLimitDedup} baris pertama dari total {processedDedupData.rows.length} baris...</span>
                      <button 
                        onClick={() => setPreviewLimitDedup(prev => prev + 50)}
                        className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded font-semibold transition-colors"
                      >
                        Muat Lebih Banyak (+50)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
            </>
          )}

          {/* TAB 3: MERGE */}
          {activeTab === "merge" && (
            <div className="max-w-2xl mx-auto p-6 rounded-xl border border-border bg-card space-y-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Merge Penggabungan File Excel</h2>
              <FileUploader
                label="Upload 2 atau lebih file Excel/CSV"
                multiple={true}
                onFilesSelected={(files) => setMergeFiles(files)}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="addSourceCol"
                  checked={addSourceCol}
                  onChange={(e) => setAddSourceCol(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <label htmlFor="addSourceCol" className="text-xs font-medium text-foreground cursor-pointer">
                  Tambahkan kolom asal nama file (_SourceFile)
                </label>
              </div>

              <button
                onClick={handleMerge}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-md bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow"
              >
                <span>{isProcessing ? "Memproses Penggabungan..." : "Jalankan Penggabungan Excel"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 4: SPLIT */}
          {activeTab === "split" && (
            <div className="max-w-2xl mx-auto p-6 rounded-xl border border-border bg-card space-y-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Split Pemecahan File Excel</h2>
              <FileUploader
                label="Upload file Excel besar yang ingin dipecah"
                multiple={false}
                onFilesSelected={(files) => setSplitFile(files[0] || null)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Metode Pecah:</label>
                  <select
                    value={splitMode}
                    onChange={(e: any) => setSplitMode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
                  >
                    <option value="rows">Berdasarkan Jumlah Baris (Max Rows)</option>
                    <option value="column">Berdasarkan Nilai Kategori Kolom</option>
                  </select>
                </div>

                {splitMode === "rows" ? (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Maksimal Baris per File:</label>
                    <input
                      type="number"
                      value={maxRows}
                      onChange={(e) => setMaxRows(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Kolom Acuan Pecah:</label>
                    <input
                      type="text"
                      value={splitCol}
                      onChange={(e) => setSplitCol(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background font-mono"
                      placeholder="misal: Kota, Departemen"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleSplit}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-md bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow"
              >
                <span>{isProcessing ? "Memproses Pemecahan..." : "Jalankan Pemecahan Excel"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
      {/* File History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-3xl rounded-xl border border-border shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" /> Riwayat File Excel
              </h2>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {isLoadingHistory ? (
                <div className="flex justify-center p-8"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : historyList.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground italic text-sm">Belum ada riwayat file yang diunggah.</div>
              ) : (
                <div className="space-y-3">
                  {historyList.map(hist => (
                    <div key={hist.id} className="p-3 border border-border rounded-lg bg-background hover:border-cyan-500/50 transition-colors flex items-center justify-between group">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="font-medium text-sm text-foreground truncate">{hist.file_name}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                          <span>{hist.total_rows} baris</span>
                          <span>{hist.columns?.length || 0} kolom</span>
                          <span>{new Date(hist.created_at * 1000).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSelectHistory(hist)} className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded text-xs font-medium transition-colors">
                          Gunakan File
                        </button>
                        <button onClick={() => handleDeleteHistory(hist.id)} className="p-1.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 rounded transition-colors" title="Hapus Riwayat">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
      );
}
