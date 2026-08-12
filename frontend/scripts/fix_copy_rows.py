import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace handleCopyColumnToFile2
old_func_2 = """  const handleCopyColumnToFile2 = (colName: string) => {
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
  };"""

new_func_2 = """  const handleCopyColumnToFile2 = (colName: string) => {
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

    // Expand to the maximum length so no data is truncated if File 1 is longer
    const maxRows = Math.max(file2Preview.preview_data.length, file1Preview.preview_data.length);
    const newData = Array.from({ length: maxRows }).map((_, idx) => {
      const row = file2Preview.preview_data[idx] || {};
      // Strict undefined check to handle falsey values correctly, fallback to "" if absolutely missing
      const val = file1Preview.preview_data[idx] ? (file1Preview.preview_data[idx][colName] ?? "") : "";
      return { ...row, [colName]: val };
    });

    setFile2Preview({
      ...file2Preview,
      columns: newCols,
      preview_data: newData,
      total_rows: maxRows
    });

    setHasUnsavedChanges2(true);
    setMessage(`✅ Seluruh isi kolom "${colName}" berhasil disalin ke File 2 (Tersinkronisasi ${maxRows} baris)!`);
  };"""

content = content.replace(old_func_2, new_func_2)

# Replace handleCopyColumnToFile1
old_func_1 = """  const handleCopyColumnToFile1 = (colName: string) => {
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
  };"""

new_func_1 = """  const handleCopyColumnToFile1 = (colName: string) => {
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

    const maxRows = Math.max(file1Preview.preview_data.length, file2Preview.preview_data.length);
    const newData = Array.from({ length: maxRows }).map((_, idx) => {
      const row = file1Preview.preview_data[idx] || {};
      const val = file2Preview.preview_data[idx] ? (file2Preview.preview_data[idx][colName] ?? "") : "";
      return { ...row, [colName]: val };
    });

    setFile1Preview({
      ...file1Preview,
      columns: newCols,
      preview_data: newData,
      total_rows: maxRows
    });

    setHasUnsavedChanges1(true);
    setMessage(`✅ Seluruh isi kolom "${colName}" berhasil disalin ke File 1 (Tersinkronisasi ${maxRows} baris)!`);
  };"""

content = content.replace(old_func_1, new_func_1)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated copy column logic to support expanding row lengths.")
