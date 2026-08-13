import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add draggedCol refs and handleColumnReorder
hooks_insert = """  const isSyncingScrollRef = useRef<boolean>(false);
  const draggedCol1Ref = useRef<string | null>(null);
  const draggedCol2Ref = useRef<string | null>(null);

  const handleColumnReorder = (fileNum: 1 | 2, targetCol: string) => {
    const draggedCol = fileNum === 1 ? draggedCol1Ref.current : draggedCol2Ref.current;
    if (!draggedCol || draggedCol === targetCol) return;

    if (fileNum === 1 && file1Preview) {
        const newCols = [...file1Preview.columns];
        const dragIdx = newCols.indexOf(draggedCol);
        const targetIdx = newCols.indexOf(targetCol);
        if (dragIdx !== -1 && targetIdx !== -1) {
            newCols.splice(dragIdx, 1);
            newCols.splice(targetIdx, 0, draggedCol);
            setFile1Preview({ ...file1Preview, columns: newCols });
            setHasUnsavedChanges1(true);
        }
    } else if (fileNum === 2 && file2Preview) {
        const newCols = [...file2Preview.columns];
        const dragIdx = newCols.indexOf(draggedCol);
        const targetIdx = newCols.indexOf(targetCol);
        if (dragIdx !== -1 && targetIdx !== -1) {
            newCols.splice(dragIdx, 1);
            newCols.splice(targetIdx, 0, draggedCol);
            setFile2Preview({ ...file2Preview, columns: newCols });
            setHasUnsavedChanges2(true);
        }
    }
  };
"""
content = content.replace("  const isSyncingScrollRef = useRef<boolean>(false);", hooks_insert)


# 2. Add draggable events to TH of File 1
th1_old = """                                  return (
                                    <th
                                      key={idx}
                                      className="p-2 border-r border-emerald-500/30 font-medium whitespace-nowrap bg-emerald-950 text-emerald-100 group relative"
                                    >"""
th1_new = """                                  return (
                                    <th
                                      key={idx}
                                      draggable={true}
                                      onDragStart={() => { draggedCol1Ref.current = col; }}
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={() => handleColumnReorder(1, col)}
                                      className="p-2 border-r border-emerald-500/30 font-medium whitespace-nowrap bg-emerald-950 text-emerald-100 group relative cursor-grab active:cursor-grabbing"
                                    >"""
content = content.replace(th1_old, th1_new)


# 3. Add draggable events to TH of File 2
th2_old = """                                  return (
                                    <th
                                      key={idx}
                                      className="p-2 border-r border-sky-500/30 font-medium whitespace-nowrap bg-sky-950 text-sky-100 group relative"
                                    >"""
th2_new = """                                  return (
                                    <th
                                      key={idx}
                                      draggable={true}
                                      onDragStart={() => { draggedCol2Ref.current = col; }}
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={() => handleColumnReorder(2, col)}
                                      className="p-2 border-r border-sky-500/30 font-medium whitespace-nowrap bg-sky-950 text-sky-100 group relative cursor-grab active:cursor-grabbing"
                                    >"""
content = content.replace(th2_old, th2_new)


# 4. Modify handleSavePreviewChanges to rebuild row objects
save_old = """      const response = await fetch(`${API_BASE_URL}/excel/save-preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          filename,
          rows_data: previewData.data,
          url: fileRecord?.url || null
        })
      });"""

save_new = """      // Rebuild rows to respect column order so pandas infers the exact structure
      const orderedRows = previewData.data.map((row: any) => {
        const newRow: any = {};
        previewData.columns.forEach((col: string) => {
          if (row.hasOwnProperty(col)) {
            newRow[col] = row[col];
          }
        });
        return newRow;
      });

      const response = await fetch(`${API_BASE_URL}/excel/save-preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          filename,
          rows_data: orderedRows,
          url: fileRecord?.url || null
        })
      });"""

content = content.replace(save_old, save_new)


with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Injected Drag & Drop functionality.")
