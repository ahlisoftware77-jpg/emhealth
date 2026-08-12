import re

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

funcs = """
  const saveHistory = (fileNum: 1 | 2) => {
    if (fileNum === 1 && file1Preview) {
      setFile1History([...file1History, file1Preview]);
    } else if (fileNum === 2 && file2Preview) {
      setFile2History([...file2History, file2Preview]);
    }
  };

  const handleUndo = (fileNum: 1 | 2) => {
    if (fileNum === 1 && file1History.length > 0) {
      const prev = file1History[file1History.length - 1];
      setFile1Preview(prev);
      setFile1History(file1History.slice(0, -1));
    } else if (fileNum === 2 && file2History.length > 0) {
      const prev = file2History[file2History.length - 1];
      setFile2Preview(prev);
      setFile2History(file2History.slice(0, -1));
    }
  };
"""

if "saveHistory = " not in content:
    content = content.replace(
        '  const handleCellSave = (fileNum: 1 | 2, rowObj: any, col: string, newValue: string) => {',
        funcs + '\n  const handleCellSave = (fileNum: 1 | 2, rowObj: any, col: string, newValue: string) => {'
    )

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed missing saveHistory.")
