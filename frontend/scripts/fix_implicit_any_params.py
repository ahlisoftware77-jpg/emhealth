import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Match single parameter without parens: .map(col => ...) -> .map((col: any) => ...)
content = re.sub(r'\.(map|filter|forEach|some|every|find|reduce)\(\s*([a-zA-Z0-9_]+)\s*=>', r'.\1((\2: any) =>', content)

# Match parameter list with 1-3 params without types: .map((col, idx) => ...) -> .map((col: any, idx: any) => ...)
# This is tricky with regex, so let's just do the common ones manually
patterns = [
    (r'\(\s*col\s*,\s*idx\s*\)\s*=>', r'(col: any, idx: any) =>'),
    (r'\(\s*row\s*,\s*idx\s*\)\s*=>', r'(row: any, idx: any) =>'),
    (r'\(\s*row\s*,\s*rIdx\s*\)\s*=>', r'(row: any, rIdx: any) =>'),
    (r'\(\s*hist\s*,\s*idx\s*\)\s*=>', r'(hist: any, idx: any) =>'),
    (r'\(\s*hist\s*,\s*index\s*\)\s*=>', r'(hist: any, index: any) =>'),
    (r'\(\s*c\s*,\s*idx\s*\)\s*=>', r'(c: any, idx: any) =>'),
    (r'\(\s*v\s*,\s*idx\s*\)\s*=>', r'(v: any, idx: any) =>'),
    (r'\(\s*val\s*,\s*idx\s*\)\s*=>', r'(val: any, idx: any) =>'),
    (r'\(\s*_\s*,\s*idx\s*\)\s*=>', r'(_: any, idx: any) =>'),
]

for p, repl in patterns:
    content = re.sub(p, repl, content)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed implicit any for 2 parameters")
