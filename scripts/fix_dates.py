import re

with open("backend/app/services/excel_service.py", "r", encoding="utf-8") as f:
    content = f.read()

# Make sure datetime is imported
if "import datetime" not in content:
    content = content.replace("import logging", "import logging\nimport datetime")

# Replace logic in openpyxl reader
old_openpyxl = """                            for j, val in enumerate(row_values):
                                col_name = headers[j] if j < len(headers) else f"Kolom_{j+1}"
                                row_dict[col_name] = "" if val is None else str(val).strip()"""

new_openpyxl = """                            for j, val in enumerate(row_values):
                                col_name = headers[j] if j < len(headers) else f"Kolom_{j+1}"
                                if val is None:
                                    row_dict[col_name] = ""
                                elif isinstance(val, datetime.datetime):
                                    if val.time() == datetime.time(0, 0, 0):
                                        row_dict[col_name] = val.strftime("%Y-%m-%d")
                                    else:
                                        row_dict[col_name] = str(val).strip()
                                else:
                                    row_dict[col_name] = str(val).strip()"""

content = content.replace(old_openpyxl, new_openpyxl)

# Replace logic in pandas fallback
# Wait, pandas dtype=str automatically casts. Instead of dtype=str, we'd need to parse it or clean it up.
# For pandas fallback, it's safer to just replace " 00:00:00" string suffix since it's already a string.
old_pandas = """                    df = pd.read_excel(bio, dtype=str).head(max_rows).fillna("")
                    columns = [str(c).strip() for c in df.columns.tolist()]
                    for row in df.head(max_rows).to_dict(orient="records"):
                        clean_row = {str(k): "" if pd.isna(v) or v is None else str(v).strip() for k, v in row.items()}"""

new_pandas = """                    df = pd.read_excel(bio, dtype=str).head(max_rows).fillna("")
                    columns = [str(c).strip() for c in df.columns.tolist()]
                    for row in df.head(max_rows).to_dict(orient="records"):
                        clean_row = {}
                        for k, v in row.items():
                            val_str = "" if pd.isna(v) or v is None else str(v).strip()
                            if val_str.endswith(" 00:00:00"):
                                val_str = val_str[:-9]
                            clean_row[str(k)] = val_str"""

content = content.replace(old_pandas, new_pandas)

# Same for the other method (get_columns_and_preview)
old_pandas_2 = """                    df = pd.read_excel(file_path, dtype=str).head(max_rows).fillna("")
                    columns = [str(c).strip() for c in df.columns.tolist()]
                    for row in df.head(max_rows).to_dict(orient="records"):
                        clean_row = {str(k): "" if pd.isna(v) or v is None else str(v).strip() for k, v in row.items()}"""

new_pandas_2 = """                    df = pd.read_excel(file_path, dtype=str).head(max_rows).fillna("")
                    columns = [str(c).strip() for c in df.columns.tolist()]
                    for row in df.head(max_rows).to_dict(orient="records"):
                        clean_row = {}
                        for k, v in row.items():
                            val_str = "" if pd.isna(v) or v is None else str(v).strip()
                            if val_str.endswith(" 00:00:00"):
                                val_str = val_str[:-9]
                            clean_row[str(k)] = val_str"""

content = content.replace(old_pandas_2, new_pandas_2)


with open("backend/app/services/excel_service.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Injected datetime formatting fix to excel_service.py")
