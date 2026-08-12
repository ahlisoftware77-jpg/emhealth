import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Insert handleDeleteRow and handleDeleteColumn
funcs = """
  const handleDeleteRow = (fileNum: 1 | 2, rowIndex: number) => {
    if (fileNum === 1 && file1Preview) {
      const newPreviewData = [...file1Preview.preview_data];
      newPreviewData.splice(rowIndex, 1);
      setFile1Preview({ ...file1Preview, preview_data: newPreviewData, total_rows: file1Preview.total_rows - 1 });
      setHasUnsavedChanges1(true);
    } else if (fileNum === 2 && file2Preview) {
      const newPreviewData = [...file2Preview.preview_data];
      newPreviewData.splice(rowIndex, 1);
      setFile2Preview({ ...file2Preview, preview_data: newPreviewData, total_rows: file2Preview.total_rows - 1 });
      setHasUnsavedChanges2(true);
    }
  };

  const handleDeleteColumn = (fileNum: 1 | 2, colName: string) => {
    if (fileNum === 1 && file1Preview) {
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
"""

if "handleDeleteRow =" not in content:
    content = content.replace(
        'const handleColumnRenameSave = (fileNum: 1 | 2, oldColName: string, newColName: string) => {',
        funcs + '\n  const handleColumnRenameSave = (fileNum: 1 | 2, oldColName: string, newColName: string) => {'
    )


# 2. File 1 `th`
th_1_old = """                                    <th
                                      key={idx}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setEditingColumn({ fileNum: 1, colIdx: idx });
                                        setEditingColumnValue(col);
                                      }}
                                      onClick={() => handleSortColumn(1, col)}
                                      title="Klik 2x untuk ubah nama kolom | Klik 1x untuk urutkan"
                                      className={`p-2.5 border-r border-emerald-500/30 truncate min-w-[140px] max-w-[220px] tracking-wide text-xs cursor-pointer hover:bg-emerald-900/60 select-none transition-all ${isSorted ? "bg-emerald-900/90 text-amber-300" : ""
                                        }`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span>{col}</span>
                                        {isSorted ? (
                                          sortDir1 === "asc" ? <SortAsc className="w-3.5 h-3.5 text-amber-300 shrink-0" /> : <SortDesc className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                        ) : (
                                          <ArrowUpDown className="w-3 h-3 text-emerald-500/40 opacity-60 shrink-0" />
                                        )}
                                      </div>
                                    </th>"""

th_1_new = """                                    <th
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
                                        <div className="flex items-center gap-1 shrink-0 bg-emerald-950/90 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => handleSortColumn(1, col)} className={`p-0.5 hover:bg-emerald-500/20 rounded transition-colors ${isSorted ? "text-amber-300" : "text-emerald-500/60 hover:text-emerald-300"}`} title="Urutkan">
                                            {isSorted ? (sortDir1 === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(1, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/70 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </th>"""

# 3. File 2 `th`
th_2_old = """                                    <th
                                      key={idx}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setEditingColumn({ fileNum: 2, colIdx: idx });
                                        setEditingColumnValue(col);
                                      }}
                                      onClick={() => handleSortColumn(2, col)}
                                      title="Klik 2x untuk ubah nama kolom | Klik 1x untuk urutkan"
                                      className={`p-2.5 border-r border-sky-500/30 truncate min-w-[140px] max-w-[220px] tracking-wide text-xs cursor-pointer hover:bg-sky-900/60 select-none transition-all ${isSorted ? "bg-sky-900/90 text-amber-300" : ""
                                        }`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span>{col}</span>
                                        {isSorted ? (
                                          sortDir2 === "asc" ? <SortAsc className="w-3.5 h-3.5 text-amber-300 shrink-0" /> : <SortDesc className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                        ) : (
                                          <ArrowUpDown className="w-3 h-3 text-sky-500/40 opacity-60 shrink-0" />
                                        )}
                                      </div>
                                    </th>"""
th_2_new = """                                    <th
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
                                        <div className="flex items-center gap-1 shrink-0 bg-sky-950/90 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => handleSortColumn(2, col)} className={`p-0.5 hover:bg-sky-500/20 rounded transition-colors ${isSorted ? "text-amber-300" : "text-sky-500/60 hover:text-sky-300"}`} title="Urutkan">
                                            {isSorted ? (sortDir2 === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(2, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/70 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </th>"""


# 4. File 1 `tr`
tr_1_old = """<td className="p-2 border-r border-border text-muted-foreground text-[10px]">{rIdx + 1}</td>"""
tr_1_new = """<td className="p-2 border-r border-border text-muted-foreground text-[10px] relative group w-12 text-center align-middle">
                                    <span className="group-hover:hidden">{rIdx + 1}</span>
                                    <button 
                                      onClick={() => handleDeleteRow(1, rIdx)}
                                      className="hidden group-hover:flex absolute inset-0 items-center justify-center bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 w-full h-full transition-colors"
                                      title={`Hapus baris ${rIdx + 1}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>"""

# 5. File 2 `tr`
tr_2_old = """<td className="p-2 border-r border-border text-muted-foreground text-[10px]">{rIdx + 1}</td>"""
tr_2_new = """<td className="p-2 border-r border-border text-muted-foreground text-[10px] relative group w-12 text-center align-middle">
                                    <span className="group-hover:hidden">{rIdx + 1}</span>
                                    <button 
                                      onClick={() => handleDeleteRow(2, rIdx)}
                                      className="hidden group-hover:flex absolute inset-0 items-center justify-center bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 w-full h-full transition-colors"
                                      title={`Hapus baris ${rIdx + 1}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>"""

content = content.replace(th_1_old, th_1_new)
content = content.replace(th_2_old, th_2_new)

# Since `tr_1_old` and `tr_2_old` are identical, we have to be careful.
# But they appear inside `filteredPreviewData1.slice(0, previewLimit1).map((row, rIdx) => (`
# and `filteredPreviewData2.slice(0, previewLimit2).map((row, rIdx) => (`

# Let's use regex for tr replacement to ensure context.
import re

content = re.sub(
    r'(<tr key=\{rIdx\} className="hover:bg-emerald-500/10 transition-all">\s*)<td className="p-2 border-r border-border text-muted-foreground text-\[10px\]">\{rIdx \+ 1\}</td>',
    r'\1' + tr_1_new,
    content
)

content = re.sub(
    r'(<tr key=\{rIdx\} className="hover:bg-sky-500/10 transition-all">\s*)<td className="p-2 border-r border-border text-muted-foreground text-\[10px\]">\{rIdx \+ 1\}</td>',
    r'\1' + tr_2_new,
    content
)


with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done inserting delete functionality.")
