import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Import ArrowRightToLine, ArrowLeftToLine if not exist
if "ArrowRightToLine" not in content:
    content = content.replace("ArrowRight,\n", "ArrowRight,\n  ArrowRightToLine,\n  ArrowLeftToLine,\n")

# 2. Add handleCopyColumnToFile2 and handleCopyColumnToFile1 functions
# We'll inject it before handleSortColumn
functions_to_inject = """  const handleCopyColumnToFile2 = (colName: string) => {
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

    const newData = file2Preview.preview_data.map((row, idx) => {
      const val = file1Preview.preview_data[idx]?.[colName] ?? "";
      return { ...row, [colName]: val };
    });

    setFile2Preview({
      ...file2Preview,
      columns: newCols,
      preview_data: newData
    });

    setHasUnsavedChanges2(true);
    setMessage(`✅ Seluruh isi kolom "${colName}" berhasil disalin ke File 2!`);
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

    const newData = file1Preview.preview_data.map((row, idx) => {
      const val = file2Preview.preview_data[idx]?.[colName] ?? "";
      return { ...row, [colName]: val };
    });

    setFile1Preview({
      ...file1Preview,
      columns: newCols,
      preview_data: newData
    });

    setHasUnsavedChanges1(true);
    setMessage(`✅ Seluruh isi kolom "${colName}" berhasil disalin ke File 1!`);
  };

  const handleSortColumn = (fileNum: 1 | 2, colName: string) => {"""

content = content.replace("  const handleSortColumn = (fileNum: 1 | 2, colName: string) => {", functions_to_inject)

# 3. Update File 1 UI
old_buttons_1 = """                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-1 bg-background/80 px-1 py-0.5 rounded shadow-sm backdrop-blur-sm border border-border/50">
                                          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(col); setMessage(`✅ Nama kolom "${col}" disalin!`); }} className="p-0.5 hover:bg-emerald-500/20 text-emerald-500/60 hover:text-emerald-400 rounded transition-colors" title={`Salin nama kolom ${col}`}>
                                            <Copy className="w-3 h-3" />
                                          </button>
                                          <button onClick={() => handleSortColumn(1, col)} className={`p-0.5 hover:bg-emerald-500/20 rounded transition-colors ${isSorted ? "text-amber-300" : "text-emerald-500/60 hover:text-emerald-300"}`} title="Urutkan">
                                            {sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(1, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/70 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>"""

new_buttons_1 = """                                        <div className="flex items-center gap-0.5 ml-1 bg-background/50 group-hover:bg-background/90 px-1 py-0.5 rounded shadow-sm border border-border/50 transition-all opacity-40 group-hover:opacity-100">
                                          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(col); setMessage(`✅ Nama kolom "${col}" disalin!`); }} className="p-0.5 hover:bg-emerald-500/20 text-emerald-500/80 hover:text-emerald-400 rounded transition-colors" title={`Salin nama kolom ke teks`}>
                                            <Copy className="w-3 h-3" />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleCopyColumnToFile2(col); }} className="p-0.5 hover:bg-indigo-500/20 text-indigo-500/80 hover:text-indigo-400 rounded transition-colors" title={`Salin isi kolom ${col} ke File 2`}>
                                            <ArrowRightToLine className="w-3 h-3" />
                                          </button>
                                          <button onClick={() => handleSortColumn(1, col)} className={`p-0.5 hover:bg-emerald-500/20 rounded transition-colors ${isSorted ? "text-amber-400" : "text-emerald-500/80 hover:text-emerald-400"}`} title="Urutkan baris">
                                            {sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(1, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/80 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>"""

content = content.replace(old_buttons_1, new_buttons_1)

# 4. Update File 2 UI
old_buttons_2 = """                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-1 bg-background/80 px-1 py-0.5 rounded shadow-sm backdrop-blur-sm border border-border/50">
                                          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(col); setMessage(`✅ Nama kolom "${col}" disalin!`); }} className="p-0.5 hover:bg-sky-500/20 text-sky-500/60 hover:text-sky-400 rounded transition-colors" title={`Salin nama kolom ${col}`}>
                                            <Copy className="w-3 h-3" />
                                          </button>
                                          <button onClick={() => handleSortColumn(2, col)} className={`p-0.5 hover:bg-sky-500/20 rounded transition-colors ${isSorted ? "text-amber-300" : "text-sky-500/60 hover:text-sky-300"}`} title="Urutkan">
                                            {sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(2, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/70 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>"""

new_buttons_2 = """                                        <div className="flex items-center gap-0.5 ml-1 bg-background/50 group-hover:bg-background/90 px-1 py-0.5 rounded shadow-sm border border-border/50 transition-all opacity-40 group-hover:opacity-100">
                                          <button onClick={(e) => { e.stopPropagation(); handleCopyColumnToFile1(col); }} className="p-0.5 hover:bg-indigo-500/20 text-indigo-500/80 hover:text-indigo-400 rounded transition-colors" title={`Salin isi kolom ${col} ke File 1`}>
                                            <ArrowLeftToLine className="w-3 h-3" />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(col); setMessage(`✅ Nama kolom "${col}" disalin!`); }} className="p-0.5 hover:bg-sky-500/20 text-sky-500/80 hover:text-sky-400 rounded transition-colors" title={`Salin nama kolom ke teks`}>
                                            <Copy className="w-3 h-3" />
                                          </button>
                                          <button onClick={() => handleSortColumn(2, col)} className={`p-0.5 hover:bg-sky-500/20 rounded transition-colors ${isSorted ? "text-amber-400" : "text-sky-500/80 hover:text-sky-400"}`} title="Urutkan baris">
                                            {sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(2, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/80 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>"""

content = content.replace(old_buttons_2, new_buttons_2)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Added full column copy functionality")
