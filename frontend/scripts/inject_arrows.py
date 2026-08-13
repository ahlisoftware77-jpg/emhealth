import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Inject scrollToMatch
fn_scroll_sync = "const handleScrollSync = (source: 1 | 2) => {"
fn_scroll_match = """  const scrollToMatch = (row1: any) => {
    if (!filteredPreviewData2 || filteredPreviewData2.length === 0) return;
    const activeCols1 = Array.from(selectedKeyCols1Set);
    const activeCols2 = Array.from(selectedKeyCols2Set);
    
    const searchValues = new Set();
    const colsToSearch = activeCols1.length > 0 ? activeCols1 : (file1Preview?.columns || []);
    colsToSearch.forEach((c: any) => {
        const v = String(row1[c] ?? "").trim().toLowerCase();
        if (v) searchValues.add(v);
    });

    if (searchValues.size === 0) return;

    for (let i = 0; i < filteredPreviewData2.length; i++) {
        const row2 = filteredPreviewData2[i];
        const cols2 = activeCols2.length > 0 ? activeCols2 : (file2Preview?.columns || []);
        for (let c of cols2) {
            const v2 = String(row2[c] ?? "").trim().toLowerCase();
            if (v2 && searchValues.has(v2)) {
                const el = document.getElementById(`file2-row-${i}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('bg-sky-500/40', 'ring-2', 'ring-sky-400');
                  setTimeout(() => el.classList.remove('bg-sky-500/40', 'ring-2', 'ring-sky-400'), 2500);
                }
                return;
            }
        }
    }
  };

  """

if fn_scroll_match not in content:
    content = content.replace(fn_scroll_sync, fn_scroll_match + fn_scroll_sync)

# 2. Inject TH
old_th = """<th className="p-2.5 border-r border-emerald-500/30 font-mono text-[10px] bg-emerald-950 text-emerald-400">#</th>
                                  {visibleCols1.map((col: any, idx: any) => {"""
new_th = """<th className="p-2.5 border-r border-emerald-500/30 font-mono text-[10px] bg-emerald-950 text-emerald-400">#</th>
                                  <th className="p-2.5 border-r border-emerald-500/30 font-mono text-[10px] bg-emerald-950 text-emerald-400 w-10 text-center" title="Arahkan ke data yang sama di File 2">Tautan</th>
                                  {visibleCols1.map((col: any, idx: any) => {"""

content = content.replace(old_th, new_th)

# 3. Inject TD
old_td = """<Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                    {visibleCols1.map((col: any, cIdx: any) => {"""
new_td = """<Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                    <td className="p-2 border-r border-border text-center align-middle">
                                      {(() => {
                                        const activeCols1 = Array.from(selectedKeyCols1Set);
                                        const colsToSearch = activeCols1.length > 0 ? activeCols1 : visibleCols1;
                                        let hasMatch = false;
                                        for (let c of colsToSearch) {
                                          const v = String(row[c] ?? "").trim().toLowerCase();
                                          if (v && file2ValuesSet.has(v)) {
                                            hasMatch = true;
                                            break;
                                          }
                                        }
                                        return hasMatch ? (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); scrollToMatch(row); }}
                                            className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-400 hover:text-slate-950 transition-all hover:scale-110 shadow-sm"
                                            title="Sorot baris yang sama di File 2"
                                          >
                                            <ArrowRight className="w-3.5 h-3.5" />
                                          </button>
                                        ) : (
                                          <span className="text-muted-foreground/30 text-[10px]">-</span>
                                        );
                                      })()}
                                    </td>
                                    {visibleCols1.map((col: any, cIdx: any) => {"""

content = content.replace(old_td, new_td)

# 4. Inject ID into File 2 row
old_tr = """{filteredPreviewData2.slice(0, previewLimit2).map((row: any, rIdx: any) => (
                                <tr key={rIdx} className="hover:bg-sky-500/10 transition-all">"""
new_tr = """{filteredPreviewData2.slice(0, previewLimit2).map((row: any, rIdx: any) => (
                                <tr key={rIdx} id={`file2-row-${rIdx}`} className="hover:bg-sky-500/10 transition-all">"""

content = content.replace(old_tr, new_tr)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Injected matching arrows successfully!")
