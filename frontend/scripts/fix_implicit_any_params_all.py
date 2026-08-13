import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix parameter lists like (col, cIdx) => to (col: any, cIdx: any) =>
# Be careful not to replace things that already have types like (col: string, cIdx: number) =>
# We only match word characters without colons
pattern = re.compile(r'\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*=>')

def replacer(match):
    # If the match string already contains ':', skip it (though the regex [a-zA-Z0-9_] doesn't match ':')
    return f"({match.group(1)}: any, {match.group(2)}: any) =>"

content = pattern.sub(replacer, content)

# Also fix the previous regex mistake if I double-parenthesized anything (like `((c: any) =>`)
content = content.replace("(((", "((").replace("(((", "((")

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed implicit any for 2 parameters universally")
