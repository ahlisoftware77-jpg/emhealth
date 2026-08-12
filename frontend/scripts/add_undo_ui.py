import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

undo_1 = """                          {file1History.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleUndo(1)}
                              className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[10px] font-mono font-bold border border-amber-500/30 transition-all flex items-center gap-1"
                            >
                              <Undo2 className="w-3 h-3" /> Undo
                            </button>
                          )}"""

undo_2 = """                          {file2History.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleUndo(2)}
                              className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[10px] font-mono font-bold border border-amber-500/30 transition-all flex items-center gap-1"
                            >
                              <Undo2 className="w-3 h-3" /> Undo
                            </button>
                          )}"""


# Insert before "Simpan Ke Excel" for File 1
content = content.replace(
    """                          <button
                            type="button"
                            onClick={() => handleSaveToFile(1)}""",
    undo_1 + '\n' + """                          <button
                            type="button"
                            onClick={() => handleSaveToFile(1)}"""
)

# Insert before "Simpan Ke Excel" for File 2
content = content.replace(
    """                          <button
                            type="button"
                            onClick={() => handleSaveToFile(2)}""",
    undo_2 + '\n' + """                          <button
                            type="button"
                            onClick={() => handleSaveToFile(2)}"""
)

# Import Undo2 if not already
if "Undo2" not in content:
    content = content.replace("Trash2,", "Trash2,\n  Undo2,")

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Added UI buttons for Undo")
