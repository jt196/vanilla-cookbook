import re
from pathlib import Path

# ----------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------
# Each dictionary specifies:
#   - "source": the folder containing the JS files (non-recursive)
#   - "destination": the folder to write the docs into
#   - "name": the output file name (extension optional)
FOLDERS = [
    {"source": "src/lib/utils", "destination": "docs/technical", "name": "utils"},
    {"source": "src/lib/utils/image", "destination": "docs/technical", "name": "utils_image"},
    {"source": "src/lib/utils/import", "destination": "docs/technical", "name": "utils_import"},
    {"source": "src/lib/utils/import/paprika", "destination": "docs/technical", "name": "utils_paprika"},
    {"source": "src/lib/utils/parse", "destination": "docs/technical", "name": "utils_parse"},
    {"source": "src/lib/utils/prisma", "destination": "docs/technical", "name": "utils_prisma"},
    {"source": "src/lib/utils/pwa", "destination": "docs/technical", "name": "utils_pwa"},
    {"source": "src/lib/utils/seed", "destination": "docs/technical", "name": "utils_seed"},
]

# ----------------------------------------------------------------------
# Constants and Regex Patterns
# ----------------------------------------------------------------------
# Regex to match JSDoc blocks (/** ... */) including multiline, non-greedy.
JSDOC_BLOCK = re.compile(r"/\*\*[\s\S]*?\*/", re.MULTILINE)

# ----------------------------------------------------------------------
# Utility Functions
# ----------------------------------------------------------------------
def clean_type(type_str):
    """
    Post-process a type string:
    - If it starts with '{{' and ends with '}}', remove one outer layer.
    - Escape pipe characters so that Markdown tables aren't broken.
    """
    if type_str.startswith("{{") and type_str.endswith("}}"):
        type_str = "{" + type_str[2:-2].strip() + "}"
    type_str = type_str.replace("|", r"\|")
    return type_str

def extract_jsdoc_blocks(js_path):
    """
    Extracts JSDoc blocks and the following code line from a JavaScript file.
    Returns a list of (docstring, code_line) tuples.
    """
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    blocks = []
    for match in re.finditer(JSDOC_BLOCK, content):
        doc = match.group()
        after = content[match.end():].lstrip().splitlines()
        code_line = ""
        # Skip empty or comment lines to capture the actual function declaration.
        for line in after:
            striped = line.strip()
            if striped and not striped.startswith("//"):
                code_line = striped
                break
        blocks.append((doc, code_line))
    return blocks

def clean_and_format_doc(block, code_line, index):
    """
    Cleans and formats a single JSDoc block and its associated code line into
    Markdown documentation.
    """
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

    # Determine the type information.
    if not type_line and extracted_type:
        lines = extracted_type.splitlines()
        cleaned_lines = [re.sub(r'^\s*\*\s*', '', l).strip() for l in lines if l.strip()]
        const_type = "\n".join(cleaned_lines)
    elif type_line:
        type_match = re.search(r"@type\s+\{([^}]+)\}", type_line)
        const_type = type_match.group(1).strip() if type_match else ""
    else:
        const_type = None

    # Try to extract a function name.
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

    # Start building the Markdown block.
    block_lines = []
    # Function name as a heading (with a blank line before and after)
    block_lines.append(f"### {fn_name}\n")
    if description:
        block_lines.append("\n".join(description))
        block_lines.append("")  # Ensure a blank line after description

    if param_tags:
        block_lines.append("#### Parameters\n")
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
        block_lines.append("")

    if returns_tags:
        block_lines.append("#### Returns\n")
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
        block_lines.append("")

    if throws_tags:
        block_lines.append("#### Throws\n")
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
        block_lines.append("")

    if const_type:
        block_lines.append("#### Type\n")
        block_lines.append("```JS")
        block_lines.append(f"{{ {const_type} }}")
        block_lines.append("```")
        block_lines.append("")

    if property_lines:
        block_lines.append("#### Properties\n")
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
        block_lines.append("")

    if other_tags:
        block_lines.append("\n".join(other_tags))
        block_lines.append("")

    if example_lines:
        block_lines.append("#### Example\n")
        block_lines.append("```JS")
        block_lines.extend(example_lines)
        block_lines.append("```")
        block_lines.append("")

    # Join all block lines and collapse multiple blank lines into a maximum of one.
    md_block = "\n".join(block_lines)
    md_block = re.sub(r'\n{3,}', '\n\n', md_block)
    return md_block

def generate_markdown(file_path, jsdoc_blocks):
    """
    Generates Markdown documentation for a given JS file.
    """
    lines = [f"## {file_path.name}\n"]
    for i, (block, code_line) in enumerate(jsdoc_blocks, 1):
        lines.append(clean_and_format_doc(block, code_line, i))
    markdown = "\n".join(lines)
    # Ensure that we collapse any accidental multiple blank lines.
    markdown = re.sub(r'\n{3,}', '\n\n', markdown)
    return markdown

# ----------------------------------------------------------------------
# Process each folder configuration
# ----------------------------------------------------------------------
for config in FOLDERS:
    source_dir = Path(config["source"])
    output_dir = Path(config["destination"])
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Allow specifying the output file name with or without .md extension.
    output_name = config["name"] if config["name"].endswith(".md") else f"{config['name']}.md"

    docs = []
    # Use non-recursive glob to list only the files in the source directory.
    for js_file in source_dir.glob("*.js"):
        jsdoc_blocks = extract_jsdoc_blocks(js_file)
        if not jsdoc_blocks:
            continue
        markdown = generate_markdown(js_file, jsdoc_blocks)
        docs.append(markdown)

    if docs:
        out_path = output_dir / output_name
        with open(out_path, "w", encoding="utf-8") as f:
            # Use a title based on the source directory name.
            title = f"# Utility Functions – {source_dir.name.title()}\n\n"
            f.write(title + "\n\n".join(docs))
        print(f"✅ Wrote {out_path}")
    else:
        print(f"⚠️ No JSDoc blocks found in {source_dir}")
