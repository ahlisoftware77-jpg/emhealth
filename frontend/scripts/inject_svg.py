import re
import os

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove scrollToMatch
content = re.sub(r'  const scrollToMatch = \(row1: any\) => \{.*?\n  };\n\n', '', content, flags=re.DOTALL)

# 2. Add SVG Arrow State and Refs
state_insert = """  const isSyncingScrollRef = useRef<boolean>(false);
  const gridWrapperRef = useRef<HTMLDivElement | null>(null);
  const [arrowPaths, setArrowPaths] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  const updateArrows = useCallback(() => {
    if (!gridWrapperRef.current || !filteredPreviewData2 || filteredPreviewData2.length === 0 || !filteredPreviewData1 || filteredPreviewData1.length === 0) {
      setArrowPaths([]);
      return;
    }

    if (previewLayoutMode !== "grid" || isFormMinimized) {
      setArrowPaths([]);
      return;
    }

    const wrapperRect = gridWrapperRef.current.getBoundingClientRect();
    const newPaths: any[] = [];
    
    const activeCols1 = Array.from(selectedKeyCols1Set);
    const activeCols2 = Array.from(selectedKeyCols2Set);
    
    const maxItems = Math.min(filteredPreviewData1.length, previewLimit1);
    for (let i = 0; i < maxItems; i++) {
        const row1 = filteredPreviewData1[i];
        
        const row1El = document.getElementById(`file1-row-${i}`);
        if (!row1El) continue;
        const rect1 = row1El.getBoundingClientRect();
        
        if (!tableContainer1Ref.current) continue;
        const container1Rect = tableContainer1Ref.current.getBoundingClientRect();
        if (rect1.bottom < container1Rect.top || rect1.top > container1Rect.bottom) continue;

        const searchValues = new Set();
        const colsToSearch = activeCols1.length > 0 ? activeCols1 : (file1Preview?.columns || []);
        colsToSearch.forEach((c: any) => {
            const v = String(row1[c] ?? "").trim().toLowerCase();
            if (v) searchValues.add(v);
        });

        if (searchValues.size === 0) continue;

        for (let j = 0; j < Math.min(filteredPreviewData2.length, previewLimit2); j++) {
            const row2 = filteredPreviewData2[j];
            const cols2 = activeCols2.length > 0 ? activeCols2 : (file2Preview?.columns || []);
            let matchFound = false;
            for (let c of cols2) {
                const v2 = String(row2[c] ?? "").trim().toLowerCase();
                if (v2 && searchValues.has(v2)) {
                    matchFound = true;
                    break;
                }
            }
            if (matchFound) {
                const row2El = document.getElementById(`file2-row-${j}`);
                if (row2El) {
                    const rect2 = row2El.getBoundingClientRect();
                    const container2Rect = tableContainer2Ref.current?.getBoundingClientRect();
                    if (container2Rect) {
                        if (rect2.bottom < container2Rect.top || rect2.top > container2Rect.bottom) continue;

                        const x1 = rect1.right - wrapperRect.left;
                        const y1 = rect1.top + (rect1.height / 2) - wrapperRect.top;
                        const x2 = rect2.left - wrapperRect.left;
                        const y2 = rect2.top + (rect2.height / 2) - wrapperRect.top;
                        
                        newPaths.push({ x1, y1, x2, y2 });
                    }
                }
                break;
            }
        }
    }
    setArrowPaths(newPaths);
  }, [filteredPreviewData1, filteredPreviewData2, previewLimit1, previewLimit2, selectedKeyCols1Set, selectedKeyCols2Set, file1Preview, file2Preview, previewLayoutMode, isFormMinimized]);

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [updateArrows]);
"""

content = content.replace("  const isSyncingScrollRef = useRef<boolean>(false);", state_insert)

# 3. Add to handleScrollSync
old_sync = """  const handleScrollSync = (sourceFileNum: 1 | 2) => {
    if (!syncScroll || isSyncingScrollRef.current) return;"""
new_sync = """  const handleScrollSync = (sourceFileNum: 1 | 2) => {
    updateArrows();
    if (!syncScroll || isSyncingScrollRef.current) return;"""
content = content.replace(old_sync, new_sync)

# 4. Inject gridWrapperRef and SVG
old_grid = """              <div className={previewLayoutMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-6"}>"""
new_grid = """              <div ref={gridWrapperRef} className={`relative ${previewLayoutMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-6"}`}>
                {arrowPaths.length > 0 && previewLayoutMode === "grid" && !isFormMinimized && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-50">
                    <defs>
                      <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                        <polygon points="0 0, 6 2, 0 4" fill="#3b82f6" />
                      </marker>
                    </defs>
                    {arrowPaths.map((p, i) => {
                      const cpX1 = p.x1 + Math.abs(p.x2 - p.x1) * 0.4;
                      const cpX2 = p.x2 - Math.abs(p.x2 - p.x1) * 0.4;
                      return (
                        <path 
                          key={i} 
                          d={`M ${p.x1} ${p.y1} C ${cpX1} ${p.y1}, ${cpX2} ${p.y2}, ${p.x2} ${p.y2}`} 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="2" 
                          markerEnd="url(#arrowhead)" 
                          className="opacity-80 drop-shadow-md animate-in fade-in"
                        />
                      );
                    })}
                  </svg>
                )}"""
content = content.replace(old_grid, new_grid)

# 5. Remove Tautan TH
th_regex = r'<th className="p-2\.5 border-r border-emerald-500/30 font-mono text-\[10px\] bg-emerald-950 text-emerald-400 w-10 text-center" title="Arahkan ke data yang sama di File 2">Tautan</th>\n\s*'
content = re.sub(th_regex, '', content)

# 6. Remove Tautan TD
td_regex = r'<td className="p-2 border-r border-border text-center align-middle">\s*\{\(\(\) => \{\s*const activeCols1 = Array\.from.*?\}\)\(\)\}\s*</td>\n\s*'
content = re.sub(td_regex, '', content, flags=re.DOTALL)

# 7. Add id to File 1 row
tr1_old = """<tr key={rIdx} className="hover:bg-emerald-500/10 transition-all">"""
tr1_new = """<tr key={rIdx} id={`file1-row-${rIdx}`} className="hover:bg-emerald-500/10 transition-all">"""
content = content.replace(tr1_old, tr1_new)


with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Injected SVG overlay logic.")
