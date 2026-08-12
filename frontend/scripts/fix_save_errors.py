import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_catch = """    } catch (err: any) {
      setMessage(`❌ Gagal menyimpan file Excel ${fileNum}: ${err.response?.data?.detail || err.message}`);
    } finally {"""

new_catch = """    } catch (err: any) {
      console.error(`SaveToFile Error for file ${fileNum}:`, err);
      const errMsg = err.response?.data?.detail || err.message || "Unknown error";
      setMessage(`❌ Gagal menyimpan file Excel ${fileNum}: ${errMsg}`);
    } finally {"""

content = content.replace(old_catch, new_catch)

old_inner_catch = """        console.error("Save As error:", downloadErr);
        throw new Error("Gagal menyimpan file ke perangkat lokal.");
      }"""

new_inner_catch = """        console.error("Save As error:", downloadErr);
        throw new Error("Gagal mengunduh file hasil simpan ke perangkat lokal: " + (downloadErr.message || downloadErr.name));
      }"""

content = content.replace(old_inner_catch, new_inner_catch)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated error logging in handleSaveToFile")
