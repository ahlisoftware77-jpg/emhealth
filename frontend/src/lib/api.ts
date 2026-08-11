import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach Firebase Bearer token if available
apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// API helper functions
export const AuthAPI = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post("/auth/login", { email, password });
    return res.data;
  },
  register: async (name: string, email: string, password: string) => {
    const res = await apiClient.post("/auth/register", { name, email, password });
    return res.data;
  },
  listUsers: async () => {
    const res = await apiClient.get("/auth/users");
    return res.data;
  },
  approveUser: async (uid: string, action: "approve" | "reject", role?: string) => {
    const res = await apiClient.post("/auth/approve-user", { uid, action, role });
    return res.data;
  },
  me: async () => {
    const res = await apiClient.get("/auth/me");
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post("/auth/logout");
    return res.data;
  },
};

export const ExcelAPI = {
  upload: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    const res = await apiClient.post("/excel/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  inspect: async (filename: string) => {
    const res = await apiClient.post(`/excel/inspect?filename=${encodeURIComponent(filename)}`);
    return res.data;
  },
  inspectFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/excel/inspect-file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  savePreview: async (filename: string, rows_data: any[]) => {
    const res = await apiClient.post("/excel/save-preview", { filename, rows_data });
    return res.data;
  },
  compare: async (payload: any) => {
    const res = await apiClient.post("/excel/compare", payload);
    return res.data;
  },
  deduplicate: async (payload: any) => {
    const res = await apiClient.post("/excel/deduplicate", payload);
    return res.data;
  },
  merge: async (payload: any) => {
    const res = await apiClient.post("/excel/merge", payload);
    return res.data;
  },
  split: async (payload: any) => {
    const res = await apiClient.post("/excel/split", payload);
    return res.data;
  },
  aiAnalyzeComparison: async (payload: {
    file1_name: string;
    file2_name: string;
    file1_data: any[];
    file2_data: any[];
    key_cols1: string;
    key_cols2: string;
  }) => {
    const res = await apiClient.post("/excel/ai-analyze-comparison", payload);
    return res.data;
  },
};

export const ImageAPI = {
  upload: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    const res = await apiClient.post("/image/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  previewRename: async (payload: any) => {
    const res = await apiClient.post("/image/rename/preview", payload);
    return res.data;
  },
  rename: async (payload: any) => {
    const res = await apiClient.post("/image/rename", payload);
    return res.data;
  },
  compress: async (payload: any) => {
    const res = await apiClient.post("/image/compress", payload);
    return res.data;
  },
  ocr: async (payload: any) => {
    const res = await apiClient.post("/image/ocr", payload);
    return res.data;
  },
  codeGen: async (payload: any) => {
    const res = await apiClient.post("/image/code-gen", payload);
    return res.data;
  },
};

export const CloudinaryAPI = {
  bulkUpload: async (payload: any) => {
    const res = await apiClient.post("/cloudinary/bulk-upload", payload);
    return res.data;
  },
  bulkDownload: async (urls: string[]) => {
    const res = await apiClient.post("/cloudinary/bulk-download", urls);
    return res.data;
  },
};

export const StorageAPI = {
  getStats: async () => {
    const res = await apiClient.get("/storage/stats");
    return res.data;
  },
  listFiles: async (folder: string) => {
    const res = await apiClient.get(`/storage/files/${folder}`);
    return res.data;
  },
  clearFolder: async (folder: string) => {
    const res = await apiClient.delete(`/storage/clear/${folder}`);
    return res.data;
  },
  openFolder: async (folderName: string = "output") => {
    const res = await apiClient.post(`/storage/open-folder?folder_name=${encodeURIComponent(folderName)}`);
    return res.data;
  },
};

export const JobQueueAPI = {
  listJobs: async () => {
    const res = await apiClient.get("/job-queue/list");
    return res.data;
  },
  retryJob: async (jobId: string) => {
    const res = await apiClient.post(`/job-queue/${jobId}/retry`);
    return res.data;
  },
};

export const PresetsAPI = {
  list: async () => {
    const res = await apiClient.get("/presets");
    return res.data;
  },
  create: async (preset: any) => {
    const res = await apiClient.post("/presets", preset);
    return res.data;
  },
  delete: async (presetId: string) => {
    const res = await apiClient.delete(`/presets/${presetId}`);
    return res.data;
  },
};

export const SettingsAPI = {
  get: async () => {
    const res = await apiClient.get("/settings");
    return res.data;
  },
  update: async (settings: any) => {
    const res = await apiClient.put("/settings", settings);
    return res.data;
  },
};

export const StatsAPI = {
  get: async () => {
    const res = await apiClient.get("/stats");
    return res.data;
  },
};

export const AIAPI = {
  getStatus: async () => {
    const res = await apiClient.get("/ai/status");
    return res.data;
  },
  chat: async (prompt: string, provider?: string, model?: string) => {
    const res = await apiClient.post("/ai/chat", { prompt, provider, model });
    return res.data;
  },
};

export const MCUBlastAPI = {
  verifySMTP: async (payload: any) => {
    const res = await apiClient.post("/mcu-blast/verify-smtp", payload);
    return res.data;
  },
  processImages: async (images: File[], excelFile?: File) => {
    const formData = new FormData();
    images.forEach((img) => formData.append("images", img));
    if (excelFile) {
      formData.append("excel_file", excelFile);
    }
    const res = await apiClient.post("/mcu-blast/process-images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  sendEmails: async (payload: any) => {
    const res = await apiClient.post("/mcu-blast/send-emails", payload);
    return res.data;
  },
};

