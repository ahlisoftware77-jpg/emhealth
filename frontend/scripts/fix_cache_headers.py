import re

with open("src/app/api/download/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_headers = """    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });"""

new_headers = """    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0"
      }
    });"""

if old_headers in content:
    content = content.replace(old_headers, new_headers)
    with open("src/app/api/download/route.ts", "w", encoding="utf-8") as f:
        f.write(content)
    print("Added cache-control to download route.")
else:
    print("Could not find the exact headers string.")
