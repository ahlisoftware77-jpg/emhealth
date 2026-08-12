import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the download urls with the new proxy URL
old_download_block = """      // Trigger download using showSaveFilePicker (Save As) if supported, else fallback to auto-download
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
          }"""

new_download_block = """      // Trigger download using showSaveFilePicker (Save As) if supported, else fallback to auto-download
      // Menggunakan API internal Next.js proxy agar 100% bebas dari isu CORS maupun IP berbeda
      const downloadUrl = `/api/download?filename=${encodeURIComponent(targetFile.name)}`;
      
      try {
        if ('showSaveFilePicker' in window) {
          let blob;
          try {
            // Coba fetch menggunakan rute internal Next.js
            const fallbackRes = await fetch(downloadUrl);
            if (!fallbackRes.ok) throw new Error("Gagal fallback fetch native: " + fallbackRes.statusText);
            blob = await fallbackRes.blob();
          } catch (fetchErr) {
            console.warn("fetch internal gagal, mencoba api Base sebagai fallback...", fetchErr);
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";
            const response = await apiClient.get(`/storage/download/${encodeURIComponent(targetFile.name)}`, { responseType: 'blob' });
            blob = response.data;
          }"""

content = content.replace(old_download_block, new_download_block)

# Fix the fallback `downloadUrl` inside the catch blocks if needed
# The fallback link.click() uses downloadUrl which is now `/api/download...`
# That works perfectly!

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated handleSaveToFile to use internal Next.js proxy endpoint")
