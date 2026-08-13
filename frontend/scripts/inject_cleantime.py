import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add handleCleanTime before handleSaveToFile
func_str = """  const handleCleanTime = (fileNum: 1 | 2) => {
    if (fileNum === 1 && file1Preview) {
      saveHistory(1);
      const newData = file1Preview.preview_data.map((row: any) => {
        const newRow = { ...row };
        for (const key in newRow) {
          if (typeof newRow[key] === 'string' && newRow[key].endsWith(' 00:00:00')) {
            newRow[key] = newRow[key].replace(' 00:00:00', '');
          }
        }
        return newRow;
      });
      setFile1Preview({ ...file1Preview, preview_data: newData });
      setHasUnsavedChanges1(true);
      toast.success("Berhasil membersihkan 00:00:00 di File 1");
    } else if (fileNum === 2 && file2Preview) {
      saveHistory(2);
      const newData = file2Preview.preview_data.map((row: any) => {
        const newRow = { ...row };
        for (const key in newRow) {
          if (typeof newRow[key] === 'string' && newRow[key].endsWith(' 00:00:00')) {
            newRow[key] = newRow[key].replace(' 00:00:00', '');
          }
        }
        return newRow;
      });
      setFile2Preview({ ...file2Preview, preview_data: newData });
      setHasUnsavedChanges2(true);
      toast.success("Berhasil membersihkan 00:00:00 di File 2");
    }
  };

  const handleSaveToFile"""

content = content.replace("  const handleSaveToFile", func_str)


# 2. Add button to File 1 Toolbar
btn1_old = """                            <button
                              type="button"
                              onClick={() => handleSaveToFile(1)}"""

btn1_new = """                            <button
                              type="button"
                              onClick={() => handleCleanTime(1)}
                              title="Bersihkan jam 00:00:00 dari semua kolom"
                              className="px-2.5 py-0.5 rounded bg-slate-700/50 text-slate-200 hover:bg-slate-700 hover:text-white text-[10px] font-mono border border-slate-600 transition-all shadow-sm"
                            >
                              Sapu 00:00:00
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveToFile(1)}"""

content = content.replace(btn1_old, btn1_new)


# 3. Add button to File 2 Toolbar
btn2_old = """                            <button
                              type="button"
                              onClick={() => handleSaveToFile(2)}"""

btn2_new = """                            <button
                              type="button"
                              onClick={() => handleCleanTime(2)}
                              title="Bersihkan jam 00:00:00 dari semua kolom"
                              className="px-2.5 py-0.5 rounded bg-slate-700/50 text-slate-200 hover:bg-slate-700 hover:text-white text-[10px] font-mono border border-slate-600 transition-all shadow-sm"
                            >
                              Sapu 00:00:00
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveToFile(2)}"""

content = content.replace(btn2_old, btn2_new)


with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Injected handleCleanTime successfully!")
