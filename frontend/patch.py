import re

with open('src/app/excel-tools/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add FileHistory States
states_code = '''  const [compareFormat, setCompareFormat] = useState<"xlsx" | "csv">("xlsx");
  const [compareJobResult, setCompareJobResult] = useState<any>(null);

  // File History States
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [activeHistoryTarget, setActiveHistoryTarget] = useState<"file1" | "file2" | "dedup" | null>(null);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await FileHistoryAPI.list();
      setHistoryList(res.history || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoadingHistory(false);
  };

  const handleDeleteHistory = async (id: string) => {
    if (!confirm("Hapus riwayat ini? File di Cloudinary juga akan kehilangan referensinya.")) return;
    try {
      await FileHistoryAPI.delete(id);
      fetchHistory();
    } catch (e) {
      alert("Gagal menghapus riwayat");
    }
  };

  const handleSelectHistory = async (hist: any) => {
    setShowHistoryModal(false);
    setMessage(null);
    setIsProcessing(true);

    try {
      const previewData = await ExcelAPI.previewUrl(hist.file_url);

      if (activeHistoryTarget === "file1") {
        setFile1Preview(previewData);
        setFile1(null);
      } else if (activeHistoryTarget === "file2") {
        setFile2Preview(previewData);
        setFile2(null);
      } else if (activeHistoryTarget === "dedup") {
        setDedupFilePreview(previewData);
        setDedupFile(null);
      }
    } catch (err: any) {
      setMessage(`Gagal memuat file dari riwayat: ${err.message || err}`);
    }
    setIsProcessing(false);
  };
'''
content = content.replace('  const [compareFormat, setCompareFormat] = useState<"xlsx" | "csv">("xlsx");\n  const [compareJobResult, setCompareJobResult] = useState<any>(null);', states_code)

# 2. Add History Modal at the bottom
modal_code = '''      {message && (
        <div className="fixed bottom-6 right-6 max-w-sm p-4 rounded-xl border border-border shadow-xl bg-card z-50 animate-in slide-in-from-bottom-5">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-purple-400 shrink-0" />
            <p className="text-sm text-foreground">{message}</p>
          </div>
        </div>
      )}

      {/* File History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-3xl rounded-xl border border-border shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" /> Riwayat File Excel
              </h2>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {isLoadingHistory ? (
                <div className="flex justify-center p-8"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : historyList.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground italic text-sm">Belum ada riwayat file yang diunggah.</div>
              ) : (
                <div className="space-y-3">
                  {historyList.map(hist => (
                    <div key={hist.id} className="p-3 border border-border rounded-lg bg-background hover:border-cyan-500/50 transition-colors flex items-center justify-between group">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="font-medium text-sm text-foreground truncate">{hist.file_name}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                          <span>{hist.total_rows} baris</span>
                          <span>{hist.columns?.length || 0} kolom</span>
                          <span>{new Date(hist.created_at * 1000).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSelectHistory(hist)} className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded text-xs font-medium transition-colors">
                          Gunakan File
                        </button>
                        <button onClick={() => handleDeleteHistory(hist.id)} className="p-1.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 rounded transition-colors" title="Hapus Riwayat">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'''

content = re.sub(r'      \{message && \(\n        <div className="fixed bottom-6.*?    </div>\n  \);\n}', modal_code, content, flags=re.DOTALL)

with open('src/app/excel-tools/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Patched successfully!')
