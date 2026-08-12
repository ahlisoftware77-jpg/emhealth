import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Import Undo2 from lucide-react
if "Undo2" not in content:
    content = content.replace("Trash2,", "Trash2,\n  Undo2,")

# 2. Add state hooks for history
history_hooks = """  const [file1History, setFile1History] = useExcelStoreState("file1History");
  const [file2History, setFile2History] = useExcelStoreState("file2History");"""

if "file1History" not in content:
    content = content.replace(
        'const [file2Preview, setFile2Preview] = useExcelStoreState("file2Preview");',
        'const [file2Preview, setFile2Preview] = useExcelStoreState("file2Preview");\n' + history_hooks
    )

# 3. Add helper functions for saveHistory and handleUndo
funcs = """
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
"""
if "saveHistory = " not in content:
    content = content.replace(
        'const handleCellSave = (fileNum: 1 | 2, row: any, col: string, newVal: string) => {',
        funcs + '\n  const handleCellSave = (fileNum: 1 | 2, row: any, col: string, newVal: string) => {'
    )

# 4. Inject saveHistory(fileNum) before modifications
# In handleCellSave:
content = content.replace(
    'const newPreviewData = [...file1Preview.preview_data];',
    'saveHistory(1);\n      const newPreviewData = [...file1Preview.preview_data];'
)
content = content.replace(
    'const newPreviewData = [...file2Preview.preview_data];',
    'saveHistory(2);\n      const newPreviewData = [...file2Preview.preview_data];'
)

# In handleColumnRenameSave (it has separate fileNum branches)
content = content.replace(
    'const newColumns = file1Preview.columns.map(c => c === oldColName ? trimmedNewColName : c);',
    'saveHistory(1);\n      const newColumns = file1Preview.columns.map(c => c === oldColName ? trimmedNewColName : c);'
)
content = content.replace(
    'const newColumns = file2Preview.columns.map(c => c === oldColName ? trimmedNewColName : c);',
    'saveHistory(2);\n      const newColumns = file2Preview.columns.map(c => c === oldColName ? trimmedNewColName : c);'
)

# In handleDeleteRow (it has separate branches, but we injected saveHistory above `const idx = ...` is better)
content = content.replace(
    'const idx = file1Preview.preview_data.indexOf(row);',
    'saveHistory(1);\n      const idx = file1Preview.preview_data.indexOf(row);'
)
content = content.replace(
    'const idx = file2Preview.preview_data.indexOf(row);',
    'saveHistory(2);\n      const idx = file2Preview.preview_data.indexOf(row);'
)

# In handleDeleteColumn
content = content.replace(
    'const newColumns = file1Preview.columns.filter(c => c !== colName);',
    'saveHistory(1);\n      const newColumns = file1Preview.columns.filter(c => c !== colName);'
)
content = content.replace(
    'const newColumns = file2Preview.columns.filter(c => c !== colName);',
    'saveHistory(2);\n      const newColumns = file2Preview.columns.filter(c => c !== colName);'
)


# 5. Add Undo buttons in UI
undo_btn_1 = """                    {file1History.length > 0 && (
                      <button
                        onClick={() => handleUndo(1)}
                        className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all border border-amber-500/30"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Undo
                      </button>
                    )}"""
undo_btn_2 = """                    {file2History.length > 0 && (
                      <button
                        onClick={() => handleUndo(2)}
                        className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all border border-amber-500/30"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Undo
                      </button>
                    )}"""

# Insert next to Save Preview button
save_btn_1 = """{hasUnsavedChanges1 && (
                      <button
                        onClick={() => handleSavePreview(1)}"""

content = content.replace(save_btn_1, undo_btn_1 + '\n                    ' + save_btn_1)

save_btn_2 = """{hasUnsavedChanges2 && (
                      <button
                        onClick={() => handleSavePreview(2)}"""

content = content.replace(save_btn_2, undo_btn_2 + '\n                    ' + save_btn_2)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done inserting Undo feature.")
