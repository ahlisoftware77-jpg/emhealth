import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update handleDeleteRow to take `row: any` and add confirmation
old_row = """  const handleDeleteRow = (fileNum: 1 | 2, rowIndex: number) => {
    if (fileNum === 1 && file1Preview) {
      const newPreviewData = [...file1Preview.preview_data];
      newPreviewData.splice(rowIndex, 1);
      setFile1Preview({ ...file1Preview, preview_data: newPreviewData, total_rows: file1Preview.total_rows - 1 });
      setHasUnsavedChanges1(true);
    } else if (fileNum === 2 && file2Preview) {
      const newPreviewData = [...file2Preview.preview_data];
      newPreviewData.splice(rowIndex, 1);
      setFile2Preview({ ...file2Preview, preview_data: newPreviewData, total_rows: file2Preview.total_rows - 1 });
      setHasUnsavedChanges2(true);
    }
  };"""

new_row = """  const handleDeleteRow = (fileNum: 1 | 2, row: any) => {
    if (!confirm("Apakah Anda yakin ingin menghapus baris ini?")) return;

    if (fileNum === 1 && file1Preview) {
      const idx = file1Preview.preview_data.indexOf(row);
      if (idx !== -1) {
        const newPreviewData = [...file1Preview.preview_data];
        newPreviewData.splice(idx, 1);
        setFile1Preview({ ...file1Preview, preview_data: newPreviewData, total_rows: file1Preview.total_rows - 1 });
        setHasUnsavedChanges1(true);
      }
    } else if (fileNum === 2 && file2Preview) {
      const idx = file2Preview.preview_data.indexOf(row);
      if (idx !== -1) {
        const newPreviewData = [...file2Preview.preview_data];
        newPreviewData.splice(idx, 1);
        setFile2Preview({ ...file2Preview, preview_data: newPreviewData, total_rows: file2Preview.total_rows - 1 });
        setHasUnsavedChanges2(true);
      }
    }
  };"""

content = content.replace(old_row, new_row)

# 2. Add confirmation to handleDeleteColumn
old_col = """  const handleDeleteColumn = (fileNum: 1 | 2, colName: string) => {
    if (fileNum === 1 && file1Preview) {"""

new_col = """  const handleDeleteColumn = (fileNum: 1 | 2, colName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kolom "${colName}" beserta seluruh isinya?`)) return;
    if (fileNum === 1 && file1Preview) {"""

content = content.replace(old_col, new_col)

# 3. Update the calls in the table to pass `row` instead of `rIdx`
# Note: we need to change onClick={() => handleDeleteRow(1, rIdx)} to onClick={() => handleDeleteRow(1, row)}

content = content.replace(
    'onClick={() => handleDeleteRow(1, rIdx)}',
    'onClick={() => handleDeleteRow(1, row)}'
)
content = content.replace(
    'onClick={() => handleDeleteRow(2, rIdx)}',
    'onClick={() => handleDeleteRow(2, row)}'
)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done updating delete functions.")
