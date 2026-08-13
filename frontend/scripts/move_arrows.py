import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Extract the updateArrows block
regex = r'(  const updateArrows = useCallback\(\(\) => \{.*?\n  \}, \[updateArrows\]\);\n\n)'
match = re.search(regex, content, re.DOTALL)
if match:
    block = match.group(1)
    # Remove it from the current position
    content = content.replace(block, "")
    
    # Insert it right before the return statement (line 1174 roughly)
    # Let's find "return (" that starts the JSX
    return_stmt = "  return (\n    <div className=\"space-y-6 pb-12\">"
    content = content.replace(return_stmt, block + return_stmt)
    
    with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Moved updateArrows successfully.")
else:
    print("Could not find updateArrows block.")
