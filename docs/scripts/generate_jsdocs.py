import re
from pathlib import Path

INPUT_DIR = Path("src/lib/utils")
OUTPUT_DIR = Path("docs/technical")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Matches /** ... */ including multiline, non-greedy
JSDOC_BLOCK = re.compile(r"/\*\*[\s\S]*?\*/", re.MULTILINE)

def extract_jsdoc_blocks(js_path):
    """
    Returns a list of (docstring, code_after) tuples.
    """
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    blocks = []
    for match in re.finditer(JSDOC_BLOCK, content):
        doc = match.group()
        after = content[match.end():].lstrip().splitlines()
        code_line = after[0] if after else ""
        blocks.append((doc, code_line))
    return blocks

def clean_and_format_doc(block, code_line, index):
    description = []
    tags = []

    for line in block.splitlines():
        line = line.strip()
        if line.startswith("/**") or line.startswith("*/"):
            continue
        line = line.lstrip("*").strip()
        if line.startswith("@"):
            tags.append(line)
        else:
            description.append(line)

    # Function name guess
    fn_name = f"Function {index}"
    fn_match = (
        re.search(r"@function\s+(\w+)", block) or
        re.search(r"function\s+(\w+)", code_line) or
        re.search(r"const\s+(\w+)\s*=", code_line) or
        re.search(r"export\s+const\s+(\w+)", code_line) or
        re.search(r"(\w+)\s*=\s*\(.*\)\s*=>", code_line) or
        re.search(r"exports\.(\w+)\s*=", code_line)
    )
    if fn_match:
        fn_name = fn_match.group(1)

    # Format Markdown
    block_lines = [f"### {fn_name}"]
    if description:
        block_lines.append("\n".join(description))
    if tags:
        block_lines.append("")
        for tag_line in tags:
            if "{{" in tag_line or "}}" in tag_line:
                block_lines.append("{% raw %}")
                block_lines.append(tag_line)
                block_lines.append("{% endraw %}")
            else:
                block_lines.append(tag_line)
    block_lines.append("")  # spacer

    return "\n".join(block_lines)

def generate_markdown(file_path, jsdoc_blocks):
    lines = [f"## {file_path.name}"]
    for i, (block, code_line) in enumerate(jsdoc_blocks, 1):
        lines.append(clean_and_format_doc(block, code_line, i))
    return "\n".join(lines)

# Grouped outputs
top_level_docs = []
subfolder_docs = {}

for js_file in INPUT_DIR.rglob("*.js"):
    rel = js_file.relative_to(INPUT_DIR)
    jsdoc_blocks = extract_jsdoc_blocks(js_file)
    if not jsdoc_blocks:
        continue

    markdown = generate_markdown(js_file, jsdoc_blocks)

    if len(rel.parts) == 1:
        # Top-level .js file
        top_level_docs.append(markdown)
    else:
        folder = rel.parts[0]
        subfolder_docs.setdefault(folder, []).append(markdown)

# Write top-level utils.md
if top_level_docs:
    with open(OUTPUT_DIR / "utils.md", "w", encoding="utf-8") as f:
        f.write("# Utility Functions\n\n" + "\n\n".join(top_level_docs))
    print("✅ Wrote docs/technical/utils.md")

# Write one file per subfolder
for folder, sections in subfolder_docs.items():
    out_path = OUTPUT_DIR / f"utils_{folder}.md"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(f"# Utility Functions – {folder.title()}\n\n" + "\n\n".join(sections))
    print(f"✅ Wrote {out_path}")
