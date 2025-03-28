import re
from pathlib import Path

INPUT_DIR = Path("src/lib/utils")
OUTPUT_DIR = Path("docs/technical")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Matches /** ... */ including multiline, non-greedy.
JSDOC_BLOCK = re.compile(r"/\*\*[\s\S]*?\*/", re.MULTILINE)

def clean_type(type_str):
    """
    Post-process a type string:
    - If it starts with '{{' and ends with '}}', remove one outer layer.
    - Escape pipe characters so that Markdown tables aren't broken.
    """
    if type_str.startswith("{{") and type_str.endswith("}}"):
        type_str = "{" + type_str[2:-2].strip() + "}"
    # Escape pipe characters.
    type_str = type_str.replace("|", r"\|")
    return type_str

def extract_jsdoc_blocks(js_path):
    """
    Returns a list of (docstring, code_line) tuples.
    Skips over lines (e.g. ESLint comments) to capture the actual function declaration.
    """
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    blocks = []
    for match in re.finditer(JSDOC_BLOCK, content):
        doc = match.group()
        after = content[match.end():].lstrip().splitlines()
        code_line = ""
        # Skip lines that are empty or start with a comment.
        for line in after:
            striped = line.strip()
            if striped and not striped.startswith("//"):
                code_line = striped
                break
        blocks.append((doc, code_line))
    return blocks

def clean_and_format_doc(block, code_line, index):
    # --- Preprocess: Extract multi-line @type (if present) and remove it from the block.
    extracted_type = None
    multi_type_match = re.search(r"@type\s+\{\{([\s\S]*?)\}\}", block)
    if multi_type_match:
        extracted_type = multi_type_match.group(1)
        block = block.replace(multi_type_match.group(0), "")
    
    description = []
    param_tags = []    # For @param tags.
    returns_tags = []  # For @returns tags.
    throws_tags = []   # For @throws tags.
    other_tags = []    # For any remaining tags.
    example_lines = [] # For @example sections.
    type_line = None   # For single-line @type (if any remains).
    property_lines = []# For @property tags.

    in_example = False  # Flag to capture subsequent example lines.

    for line in block.splitlines():
        line = line.strip()
        if line.startswith("/**") or line.startswith("*/"):
            continue
        line = line.lstrip("*").strip()
        if line.startswith("@"):
            in_example = False
            if line.startswith("@param"):
                param_tags.append(line)
            elif line.startswith("@returns"):
                returns_tags.append(line)
            elif line.startswith("@throws"):
                throws_tags.append(line)
            elif line.startswith("@example"):
                example_lines.append(line[len("@example"):].strip())
                in_example = True
            elif line.startswith("@type"):
                type_line = line
            elif line.startswith("@property"):
                property_lines.append(line)
            else:
                other_tags.append(line)
        else:
            if in_example:
                example_lines.append(line)
            else:
                description.append(line)

    # If no single-line @type was found but a multi-line one was extracted, use that.
    if not type_line and extracted_type:
        lines = extracted_type.splitlines()
        cleaned_lines = [re.sub(r'^\s*\*\s*', '', l).strip() for l in lines if l.strip()]
        const_type = "\n".join(cleaned_lines)
    elif type_line:
        type_match = re.search(r"@type\s+\{([^}]+)\}", type_line)
        const_type = type_match.group(1).strip() if type_match else ""
    else:
        const_type = None

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

    block_lines = [f"### {fn_name}"]
    if description:
        block_lines.append("\n".join(description))

    if param_tags:
        block_lines.append("\n**Parameters**\n")
        block_lines.append("| Parameter | Type | Description |")
        block_lines.append("| --- | --- | --- |")
        for tag in param_tags:
            match = re.search(
                r"@param\s+(\{(?:[^{}]|\{[^{}]*\})+\})\s+(?:\[?(\w+)(?:=[^\]]+)?\]?)(?:\s*-\s*(.*))?",
                tag
            )
            if match:
                param_type = clean_type(match.group(1))
                param_name = match.group(2)
                param_desc = match.group(3) if match.group(3) else ""
                block_lines.append(f"| {param_name} | `{param_type}` | {param_desc} |")
            else:
                block_lines.append(f"| {tag} |  |  |")

    if returns_tags:
        block_lines.append("\n**Returns**\n")
        block_lines.append("| Type | Description |")
        block_lines.append("| --- | --- |")
        for tag in returns_tags:
            match = re.search(r"@returns\s+(\{(?:[^{}]|\{[^{}]*\})+\})\s*(?:-?\s*(.*))?", tag)
            if match:
                ret_type = clean_type(match.group(1))
                ret_desc = match.group(2) if match.group(2) else ""
                block_lines.append(f"| `{ret_type}` | {ret_desc} |")
            else:
                block_lines.append(f"| {tag} |  |")

    if throws_tags:
        block_lines.append("\n**Throws**\n")
        block_lines.append("| Type | Description |")
        block_lines.append("| --- | --- |")
        for tag in throws_tags:
            match = re.search(r"@throws\s+(\{(?:[^{}]|\{[^{}]*\})+\})\s*(?:-?\s*(.*))?", tag)
            if match:
                throw_type = clean_type(match.group(1))
                throw_desc = match.group(2) if match.group(2) else ""
                block_lines.append(f"| `{throw_type}` | {throw_desc} |")
            else:
                block_lines.append(f"| {tag} |  |")

    if const_type:
        block_lines.append("\n**Type**\n")
        block_lines.append("```JS")
        block_lines.append(f"{{ {const_type} }}")
        block_lines.append("```")

    if property_lines:
        block_lines.append("\n**Properties**\n")
        block_lines.append("| Property | Type | Description |")
        block_lines.append("| --- | --- | --- |")
        for prop in property_lines:
            match = re.search(r"@property\s+\{([^}]+)\}\s+(\w+)\s*-\s*(.*)", prop)
            if match:
                prop_type = match.group(1).strip()
                prop_name = match.group(2).strip()
                prop_desc = match.group(3).strip()
                block_lines.append(f"| {prop_name} | `{{ {prop_type} }}` | {prop_desc} |")
            else:
                block_lines.append(f"| {prop} |  |  |")

    if other_tags:
        block_lines.append("")
        block_lines.extend(other_tags)

    if example_lines:
        block_lines.append("\n**Example**\n")
        block_lines.append("```JS")
        block_lines.extend(example_lines)
        block_lines.append("```")

    block_lines.append("")
    return "\n".join(block_lines)

def generate_markdown(file_path, jsdoc_blocks):
    lines = [f"## {file_path.name}"]
    for i, (block, code_line) in enumerate(jsdoc_blocks, 1):
        lines.append(clean_and_format_doc(block, code_line, i))
    return "\n".join(lines)

# Group outputs.
top_level_docs = []
subfolder_docs = {}

for js_file in INPUT_DIR.rglob("*.js"):
    rel = js_file.relative_to(INPUT_DIR)
    jsdoc_blocks = extract_jsdoc_blocks(js_file)
    if not jsdoc_blocks:
        continue

    markdown = generate_markdown(js_file, jsdoc_blocks)

    if len(rel.parts) == 1:
        top_level_docs.append(markdown)
    else:
        folder = rel.parts[0]
        subfolder_docs.setdefault(folder, []).append(markdown)

if top_level_docs:
    with open(OUTPUT_DIR / "utils.md", "w", encoding="utf-8") as f:
        f.write("# Utility Functions\n\n" + "\n\n".join(top_level_docs))
    print("✅ Wrote docs/technical/utils.md")

for folder, sections in subfolder_docs.items():
    out_path = OUTPUT_DIR / f"utils_{folder}.md"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(f"# Utility Functions – {folder.title()}\n\n" + "\n\n".join(sections))
    print(f"✅ Wrote {out_path}")
