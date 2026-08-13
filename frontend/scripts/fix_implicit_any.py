import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("file2Preview.preview_data.forEach((row) => {", "file2Preview.preview_data.forEach((row: any) => {")
content = content.replace("file1Preview.preview_data.forEach((row) => {", "file1Preview.preview_data.forEach((row: any) => {")
content = content.replace("rows = rows.filter((row) =>", "rows = rows.filter((row: any) =>")

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed implicit any for 'row'")
