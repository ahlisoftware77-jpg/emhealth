import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_save_block = """    try {
      const fileUrl = (targetFile as any).cloudinaryUrl || undefined;
      const res = await ExcelAPI.savePreview(targetFile.name, targetPreview.preview_data, fileUrl);"""

new_save_block = """    try {
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
      const res = await ExcelAPI.savePreview(targetFile.name, dataToSave, fileUrl);"""

content = content.replace(old_save_block, new_save_block)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated handleSaveToFile to respect UI sorting.")
