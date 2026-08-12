import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

functions_to_inject = """  const handleCopyColumnToFile2 = (colName: string) => {
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
  };

  const handleCopyColumnToFile1 = (colName: string) => {
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
  };

  const handleSortColumn"""

content = content.replace("  const handleSortColumn", functions_to_inject)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Functions injected successfully.")
