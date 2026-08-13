import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'\.map\((\w+)\s*=>', r'.map((\1: any) =>', content)
content = re.sub(r'\.filter\((\w+)\s*=>', r'.filter((\1: any) =>', content)
content = re.sub(r'\.some\((\w+)\s*=>', r'.some((\1: any) =>', content)
content = re.sub(r'\.forEach\((\w+)\s*=>', r'.forEach((\1: any) =>', content)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed implicit any universally")
