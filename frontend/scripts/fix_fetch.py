import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add apiClient to import
if "apiClient" not in content:
    content = content.replace(
        "import { ExcelAPI, FileHistoryAPI } from \"@/lib/api\";",
        "import { ExcelAPI, FileHistoryAPI, apiClient } from \"@/lib/api\";"
    )

old_logic = """      // Trigger download using showSaveFilePicker (Save As) if supported, else fallback to auto-download
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";
      const downloadUrl = `${apiBase}/storage/download/${encodeURIComponent(targetFile.name)}`;
      
      try {
        if ('showSaveFilePicker' in window) {
          const response = await fetch(downloadUrl);
          if (!response.ok) throw new Error("Gagal mengunduh file dari server.");
          const blob = await response.blob();"""

new_logic = """      // Trigger download using showSaveFilePicker (Save As) if supported, else fallback to auto-download
      try {
        if ('showSaveFilePicker' in window) {
          const response = await apiClient.get(`/storage/download/${encodeURIComponent(targetFile.name)}`, { responseType: 'blob' });
          const blob = response.data;"""

content = content.replace(old_logic, new_logic)

# Fix fallback apiBase block
old_fallback = """        } else {
          const link = document.createElement("a");
          link.href = downloadUrl;"""

new_fallback = """        } else {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";
          const downloadUrl = `${apiBase}/storage/download/${encodeURIComponent(targetFile.name)}`;
          const link = document.createElement("a");
          link.href = downloadUrl;"""

content = content.replace(old_fallback, new_fallback)


with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated handleSaveToFile for correct fetching")
