import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Badges File 1
btn1_old = """                        <button
                          key={idx}
                          type="button"
                          onClick={() => {"""
btn1_new = """                        <button
                          key={idx}
                          type="button"
                          draggable={true}
                          onDragStart={() => { draggedCol1Ref.current = col; }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleColumnReorder(1, col)}
                          onClick={() => {"""
content = content.replace(btn1_old, btn1_new)

# Badges File 1 Class
cls1_old = """                          className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border shadow-sm ${isSelected
                              ? "bg-emerald-500 text-slate-950 font-bold border-emerald-400 ring-2 ring-emerald-400/40"
                              : "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700 hover:text-white"
                            }`}"""
cls1_new = """                          className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border shadow-sm cursor-grab active:cursor-grabbing ${isSelected
                              ? "bg-emerald-500 text-slate-950 font-bold border-emerald-400 ring-2 ring-emerald-400/40"
                              : "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700 hover:text-white"
                            }`}"""
content = content.replace(cls1_old, cls1_new)


# Badges File 2
btn2_old = """                        <button
                          key={idx}
                          type="button"
                          onClick={() => {"""
btn2_new = """                        <button
                          key={idx}
                          type="button"
                          draggable={true}
                          onDragStart={() => { draggedCol2Ref.current = col; }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleColumnReorder(2, col)}
                          onClick={() => {"""
content = content.replace(btn2_old, btn2_new)

# Badges File 2 Class
cls2_old = """                          className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border shadow-sm ${isSelected
                              ? "bg-sky-500 text-slate-950 font-bold border-sky-400 ring-2 ring-sky-400/40"
                              : "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700 hover:text-white"
                            }`}"""
cls2_new = """                          className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border shadow-sm cursor-grab active:cursor-grabbing ${isSelected
                              ? "bg-sky-500 text-slate-950 font-bold border-sky-400 ring-2 ring-sky-400/40"
                              : "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700 hover:text-white"
                            }`}"""
content = content.replace(cls2_old, cls2_new)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Injected DnD to badges")
