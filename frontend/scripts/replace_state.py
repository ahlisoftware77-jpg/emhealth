import re

def to_pascal(s):
    return s[0].upper() + s[1:]

with open("src/app/excel-tools/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

def replacer(match):
    var_name = match.group(1)
    setter_name = match.group(2)
    # Return the new line
    return f'const [{var_name}, {setter_name}] = useExcelStoreState("{var_name}");'

# We match `const [var, setVar] = useState...`
pattern = re.compile(r'const \[([a-zA-Z0-9_]+),\s*(set[a-zA-Z0-9_]+)\]\s*=\s*useState(?:<[^>]*>)?\([^)]*\);')

new_content = pattern.sub(replacer, content)

# Add imports
import_str = """import { useState, useMemo, useRef, useEffect } from "react";
import { useExcelStore, ExcelState } from "@/store/useExcelStore";

function useExcelStoreState<K extends keyof ExcelState>(key: K): [ExcelState[K], (val: ExcelState[K] | ((prev: ExcelState[K]) => ExcelState[K])) => void] {
  const value = useExcelStore(state => state[key]);
  const setExcelState = useExcelStore(state => state.setExcelState);
  
  const setter = (newVal: any) => {
    if (typeof newVal === 'function') {
       setExcelState({ [key]: newVal(useExcelStore.getState()[key]) } as any);
    } else {
       setExcelState({ [key]: newVal } as any);
    }
  };
  return [value, setter];
}
"""

new_content = new_content.replace('import { useState, useMemo, useRef, useEffect } from "react";', import_str)

with open("src/app/excel-tools/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Done replacing.")
