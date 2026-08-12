import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add Copy to imports if not exists
if "Copy" not in content.split("from \"lucide-react\"")[0]:
    content = content.replace("History\n} from \"lucide-react\";", "History,\n  Copy\n} from \"lucide-react\";")

# For File 1
old_buttons_1 = """                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-1 bg-background/80 px-1 py-0.5 rounded shadow-sm backdrop-blur-sm border border-border/50">
                                          <button onClick={() => handleSortColumn(1, col)} className={`p-0.5 hover:bg-emerald-500/20 rounded transition-colors ${isSorted ? "text-amber-300" : "text-emerald-500/60 hover:text-emerald-300"}`} title="Urutkan">
                                            {sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(1, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/70 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>"""

new_buttons_1 = """                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-1 bg-background/80 px-1 py-0.5 rounded shadow-sm backdrop-blur-sm border border-border/50">
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

content = content.replace(old_buttons_1, new_buttons_1)


# For File 2
old_buttons_2 = """                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-1 bg-background/80 px-1 py-0.5 rounded shadow-sm backdrop-blur-sm border border-border/50">
                                          <button onClick={() => handleSortColumn(2, col)} className={`p-0.5 hover:bg-sky-500/20 rounded transition-colors ${isSorted ? "text-amber-300" : "text-sky-500/60 hover:text-sky-300"}`} title="Urutkan">
                                            {sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(2, col); }} className="p-0.5 hover:bg-rose-500/20 text-rose-500/70 hover:text-rose-400 rounded transition-colors" title={`Hapus kolom ${col}`}>
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>"""

new_buttons_2 = """                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-1 bg-background/80 px-1 py-0.5 rounded shadow-sm backdrop-blur-sm border border-border/50">
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

content = content.replace(old_buttons_2, new_buttons_2)


with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Added copy icons to column headers")
