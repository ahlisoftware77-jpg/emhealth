import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("filter(c => c !== colName)", "filter((c: any) => c !== colName)")
content = content.replace("map(row => {", "map((row: any) => {")
content = content.replace("filter(row =>", "filter((row: any) =>")
content = content.replace("some(v =>", "some((v: any) =>")

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed implicit any for 'c', 'row', and 'v'")
