import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_url = """const downloadUrl = `/api/download?filename=${encodeURIComponent(targetFile.name)}`;"""
new_url = """const downloadUrl = `/api/download?filename=${encodeURIComponent(targetFile.name)}&t=${Date.now()}`;"""

if old_url in content:
    content = content.replace(old_url, new_url)
    with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Replaced downloadUrl to prevent caching.")
else:
    print("Could not find the exact downloadUrl string.")
