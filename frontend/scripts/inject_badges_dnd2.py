import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace Kolom Kunci 1 badges
# Find:
# const isSelected = selectedKeyCols1Set.has(col);
# return (
#   <button
#     key={idx}
#     type="button"
#     onClick={() => {
pattern1 = r"(const isSelected = selectedKeyCols1Set\.has\(col\);\s*return \(\s*<button\s*key=\{idx\}\s*type=\"button\")(\s*onClick=\{)"
repl1 = r"\1\n                          draggable={true}\n                          onDragStart={() => { draggedCol1Ref.current = col; }}\n                          onDragOver={(e) => e.preventDefault()}\n                          onDrop={() => handleColumnReorder(1, col)}\2"

content = re.sub(pattern1, repl1, content)

# Add cursor styles for Kolom Kunci 1
pattern1_class = r"(className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border shadow-sm)(\s*\$\{isSelected\s*\?\s*\"bg-emerald-500)"
repl1_class = r"\1 cursor-grab active:cursor-grabbing\2"
content = re.sub(pattern1_class, repl1_class, content)

# Replace Kolom Kunci 2 badges
pattern2 = r"(const isSelected = selectedKeyCols2Set\.has\(col\);\s*return \(\s*<button\s*key=\{idx\}\s*type=\"button\")(\s*onClick=\{)"
repl2 = r"\1\n                          draggable={true}\n                          onDragStart={() => { draggedCol2Ref.current = col; }}\n                          onDragOver={(e) => e.preventDefault()}\n                          onDrop={() => handleColumnReorder(2, col)}\2"
content = re.sub(pattern2, repl2, content)

# Add cursor styles for Kolom Kunci 2
pattern2_class = r"(className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border shadow-sm)(\s*\$\{isSelected\s*\?\s*\"bg-sky-400)"
repl2_class = r"\1 cursor-grab active:cursor-grabbing\2"
content = re.sub(pattern2_class, repl2_class, content)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Injected accurate DnD to Kolom Kunci badges")
