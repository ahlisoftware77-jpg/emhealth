import re

with open("src/app/settings/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_save = """    try {
      const res = await SettingsAPI.update({
        primary_storage_engine: storageEngine,
        tesseract_cmd: tesseractCmd,
        cloudinary_cloud_name: cloudName,
        cloudinary_upload_preset: uploadPreset,
        firebase_project_id: firebaseProjectId,
        firebase_api_key: firebaseApiKey,
        firebase_service_account_json: firebaseServiceAccountJson,
        openai_api_key: openaiKey,
        gemini_api_key: geminiKey,
        deepseek_api_key: deepseekKey,
        primary_ai_provider: primaryAi,
      });
      setStatusType("success");"""

new_save = """    try {
      // 1. Langsung push ke Firestore dari Frontend
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        
        await setDoc(doc(db, "settings", "system_config"), {
          PRIMARY_STORAGE_ENGINE: storageEngine,
          TESSERACT_CMD: tesseractCmd,
          CLOUDINARY_CLOUD_NAME: cloudName,
          CLOUDINARY_UPLOAD_PRESET: uploadPreset,
          FIREBASE_PROJECT_ID: firebaseProjectId,
          FIREBASE_API_KEY: firebaseApiKey,
          FIREBASE_SERVICE_ACCOUNT_JSON: firebaseServiceAccountJson,
          OPENAI_API_KEY: openaiKey,
          GEMINI_API_KEY: geminiKey,
          DEEPSEEK_API_KEY: deepseekKey,
          PRIMARY_AI_PROVIDER: primaryAi,
        }, { merge: true });
        console.log("Berhasil push langsung ke Firestore dari client!");
      } catch (fbErr) {
        console.warn("Gagal push ke Firestore dari client:", fbErr);
      }

      // 2. Teruskan ke Backend (supaya backend juga memperbarui environment-nya sendiri)
      const res = await SettingsAPI.update({
        primary_storage_engine: storageEngine,
        tesseract_cmd: tesseractCmd,
        cloudinary_cloud_name: cloudName,
        cloudinary_upload_preset: uploadPreset,
        firebase_project_id: firebaseProjectId,
        firebase_api_key: firebaseApiKey,
        firebase_service_account_json: firebaseServiceAccountJson,
        openai_api_key: openaiKey,
        gemini_api_key: geminiKey,
        deepseek_api_key: deepseekKey,
        primary_ai_provider: primaryAi,
      });
      setStatusType("success");"""

content = content.replace(old_save, new_save)

with open("src/app/settings/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Injected direct firestore push")
