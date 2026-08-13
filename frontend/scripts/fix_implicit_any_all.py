import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Match .method((param) => ...)
content = re.sub(r'\.(map|filter|some|every|forEach|find|reduce)\(\((\w+)\)\s*=>', r'.\1((\2: any) =>', content)
# Match .method(param => ...)
content = re.sub(r'\.(map|filter|some|every|forEach|find|reduce)\((\w+)\s*=>', r'.\1((\2: any) =>', content)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed implicit any with generic regex")
