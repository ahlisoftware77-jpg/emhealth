import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """      // Auto-trigger download of updated file to browser so user receives modified file with updated timestamp
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";
      const downloadUrl = `${apiBase}/storage/download/${encodeURIComponent(targetFile.name)}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = targetFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);"""

new_logic = """      // Trigger download using showSaveFilePicker (Save As) if supported, else fallback to auto-download
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";
      const downloadUrl = `${apiBase}/storage/download/${encodeURIComponent(targetFile.name)}`;
      
      try {
        if ('showSaveFilePicker' in window) {
          const response = await fetch(downloadUrl);
          if (!response.ok) throw new Error("Gagal mengunduh file dari server.");
          const blob = await response.blob();
          
          const isCsv = targetFile.name.toLowerCase().endsWith(".csv");
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: targetFile.name,
            types: [{
              description: isCsv ? 'CSV File' : 'Excel File',
              accept: isCsv ? { 'text/csv': ['.csv'] } : { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
            }],
          });
          
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } else {
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = targetFile.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (downloadErr: any) {
        if (downloadErr.name === 'AbortError') {
          setMessage(`✅ Perubahan disimpan di memori server, tetapi penyimpanan ke lokal dibatalkan.`);
          // Reset unsaved changes flag anyway since it's saved in backend
          if (fileNum === 1) setHasUnsavedChanges1(false);
          else setHasUnsavedChanges2(false);
          return;
        }
        console.error("Save As error:", downloadErr);
        throw new Error("Gagal menyimpan file ke perangkat lokal.");
      }"""

content = content.replace(old_logic, new_logic)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated handleSaveToFile for Save As.")
