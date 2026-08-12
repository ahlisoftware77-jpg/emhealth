import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the inner try/catch for download
old_download_block = """      // Trigger download using showSaveFilePicker (Save As) if supported, else fallback to auto-download
      try {
        if ('showSaveFilePicker' in window) {
          const response = await apiClient.get(`/storage/download/${encodeURIComponent(targetFile.name)}`, { responseType: 'blob' });
          const blob = response.data;
          
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
          const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";
          const downloadUrl = `${apiBase}/storage/download/${encodeURIComponent(targetFile.name)}`;
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
        throw new Error("Gagal mengunduh file hasil simpan ke perangkat lokal: " + (downloadErr.message || downloadErr.name));
      }"""

new_download_block = """      // Trigger download using showSaveFilePicker (Save As) if supported, else fallback to auto-download
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";
      const downloadUrl = `${apiBase}/storage/download/${encodeURIComponent(targetFile.name)}`;
      
      try {
        if ('showSaveFilePicker' in window) {
          let blob;
          try {
            // Coba fetch dengan apiClient
            const response = await apiClient.get(`/storage/download/${encodeURIComponent(targetFile.name)}`, { responseType: 'blob' });
            blob = response.data;
          } catch (fetchErr) {
            console.warn("apiClient.get gagal, mencoba fetch native sebagai fallback...", fetchErr);
            // Fallback ke native fetch jika apiClient gagal karena alasan apapun (misal CORS atau Network Error aneh)
            const fallbackRes = await fetch(downloadUrl);
            if (!fallbackRes.ok) throw new Error("Gagal fallback fetch native");
            blob = await fallbackRes.blob();
          }
          
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
          if (fileNum === 1) setHasUnsavedChanges1(false);
          else setHasUnsavedChanges2(false);
          return;
        }
        console.error("Save As error:", downloadErr);
        // Jika gagal total, fallback paksa menggunakan tag <a> agar user tetap bisa dapat file-nya
        console.warn("Mencoba fallback paksa dengan tag a...");
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = targetFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        throw new Error("Gagal memunculkan popup Save As. File akan diunduh secara otomatis sebagai gantinya.");
      }"""

content = content.replace(old_download_block, new_download_block)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated handleSaveToFile to be completely bulletproof with fallbacks")
