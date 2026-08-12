import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# FOR FILE 1
old_file1 = """                                          <div className="flex items-center gap-1 shrink-0 bg-emerald-950/90 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleSortColumn(1, col)} className={`p-0.5 hover:bg-emerald-500/20 rounded transition-colors ${isSorted ? "text-amber-300" : "text-emerald-500/60 hover:text-emerald-300"}`} title="Urutkan">
                                              {isSorted ? (sortDir1 === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(1, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/70 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>"""

new_file1 = """                                          <div className="flex items-center gap-1 shrink-0 bg-emerald-950/90 px-1 py-0.5 rounded transition-opacity opacity-40 group-hover:opacity-100">
                                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(col); setMessage(`✅ Nama kolom "${col}" disalin!`); }} className="p-0.5 hover:bg-emerald-500/20 text-emerald-500/80 hover:text-emerald-400 rounded transition-colors" title={`Salin nama kolom ${col}`}>
                                              <Copy className="w-3 h-3" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleCopyColumnToFile2(col); }} className="p-0.5 hover:bg-indigo-500/20 text-indigo-500/80 hover:text-indigo-400 rounded transition-colors" title={`Salin SELURUH ISI kolom ${col} ke File 2`}>
                                              <ArrowRightToLine className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleSortColumn(1, col)} className={`p-0.5 hover:bg-emerald-500/20 rounded transition-colors ${isSorted ? "text-amber-300" : "text-emerald-500/60 hover:text-emerald-300"}`} title="Urutkan">
                                              {isSorted ? (sortDir1 === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(1, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/70 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>"""

content = content.replace(old_file1, new_file1)

# FOR FILE 2
old_file2 = """                                          <div className="flex items-center gap-1 shrink-0 bg-sky-950/90 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleSortColumn(2, col)} className={`p-0.5 hover:bg-sky-500/20 rounded transition-colors ${isSorted ? "text-amber-300" : "text-sky-500/60 hover:text-sky-300"}`} title="Urutkan">
                                              {isSorted ? (sortDir2 === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(2, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/70 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>"""

new_file2 = """                                          <div className="flex items-center gap-1 shrink-0 bg-sky-950/90 px-1 py-0.5 rounded transition-opacity opacity-40 group-hover:opacity-100">
                                            <button onClick={(e) => { e.stopPropagation(); handleCopyColumnToFile1(col); }} className="p-0.5 hover:bg-indigo-500/20 text-indigo-500/80 hover:text-indigo-400 rounded transition-colors" title={`Salin SELURUH ISI kolom ${col} ke File 1`}>
                                              <ArrowLeftToLine className="w-3 h-3" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(col); setMessage(`✅ Nama kolom "${col}" disalin!`); }} className="p-0.5 hover:bg-sky-500/20 text-sky-500/80 hover:text-sky-400 rounded transition-colors" title={`Salin nama kolom ${col}`}>
                                              <Copy className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleSortColumn(2, col)} className={`p-0.5 hover:bg-sky-500/20 rounded transition-colors ${isSorted ? "text-amber-300" : "text-sky-500/60 hover:text-sky-300"}`} title="Urutkan">
                                              {isSorted ? (sortDir2 === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(2, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/70 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>"""

content = content.replace(old_file2, new_file2)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Icons successfully added.")
