#!/bin/bash

# Check if file is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <markdown-file>"
  exit 1
fi

MD_FILE="$1"
if [ ! -f "$MD_FILE" ]; then
  echo "Error: File $MD_FILE not found."
  exit 1
fi

FILENAME=$(basename -- "$MD_FILE")
BASENAME="${FILENAME%.*}"
DIRNAME=$(dirname -- "$MD_FILE")
TYP_FILE="$DIRNAME/$BASENAME.typ"
PDF_FILE="$DIRNAME/$BASENAME.pdf"
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)

# Pre-process Markdown to render Mermaid diagrams using render_mermaid.py
TEMP_MD_FILE="$DIRNAME/${BASENAME}_temp_processed.md"
PNG_FILES=()

echo "Pre-processing Markdown to render Mermaid diagrams..."
# Execute the python script and read the output line by line to collect generated PNG files
while IFS= read -r line; do
  echo "$line"
  if [[ "$line" =~ ^GENERATED_PNG:(.*) ]]; then
    PNG_FILES+=("${BASH_REMATCH[1]}")
  fi
done < <(python3 "$SCRIPT_DIR/render_mermaid.py" --process-markdown "$MD_FILE" "$TEMP_MD_FILE")

# Convert Processed Markdown to Typst using pandoc
pandoc -f markdown -t typst "$TEMP_MD_FILE" -o "$TYP_FILE"

# Post-process Typst table columns for auto-fitting and layout optimization
python3 -c '
import re, sys
typ_file = sys.argv[1]
with open(typ_file, "r", encoding="utf-8") as f:
    content = f.read()

def replace_columns(match):
    cols_content = match.group(1).strip()
    if cols_content.isdigit():
        num_cols = int(cols_content)
    else:
        elements = [x.strip() for x in cols_content.strip("()").split(",") if x.strip()]
        num_cols = len(elements)
    
    if num_cols == 13:
        return "columns: (auto, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr),"
    elif num_cols == 4:
        return "columns: (auto, 1fr, 1.2fr, 1.5fr),"
    elif num_cols == 5:
        return "columns: (auto, 1fr, 1fr, 1fr, 1fr),"
    elif num_cols > 0:
        return "columns: (auto, " + ", ".join(["1fr"] * (num_cols - 1)) + "),"
    return match.group(0)

# Replace table columns config in typst markup
content = re.sub(r"columns:\s*(\([^)]+\)|\d+),", replace_columns, content)

with open(typ_file, "w", encoding="utf-8") as f:
    f.write(content)
' "$TYP_FILE"

# Determine if landscape mode is requested
LANDSCAPE="false"
if grep -q "<!-- landscape -->" "$MD_FILE"; then
  LANDSCAPE="true"
fi

# Create a temporary file to hold the styling and the converted content
TEMP_FILE=$(mktemp)

# Write Typst styling configurations (A4, Apple SD Gothic Neo for Korean)
if [ "$LANDSCAPE" = "true" ]; then
cat << 'EOF' > "$TEMP_FILE"
#set page(
  paper: "a4",
  flipped: true,
  margin: 0.6cm,
  header: none,
  footer: none
)
#show image: set image(height: 16.5cm)
#show image: it => align(center)[#it]
#show heading.where(level: 1): set text(size: 13pt)
#show heading.where(level: 1): it => {
  v(0.1em, weak: true)
  it
  v(0.1em, weak: true)
}
EOF
else
cat << 'EOF' > "$TEMP_FILE"
#set page(
  paper: "a4",
  margin: (x: 2.5cm, y: 2.5cm),
  header: align(right)[
    #text(8pt, fill: luma(120))[Document Preview]
  ],
  footer: context [
    #align(center)[#counter(page).display()]
  ]
)
EOF
fi
cat << 'EOF' >> "$TEMP_FILE"
#set text(
  font: ("Apple SD Gothic Neo", "Helvetica Neue", "Arial"),
  size: 10.5pt,
  lang: "ko",
)
#set par(
  justify: true,
  leading: 0.9em,
)
#show heading: set text(fill: rgb("#1a3a5f"))
#show heading.where(level: 1): it => {
  v(1.5em, weak: true)
  it
  v(1em, weak: true)
}

// Table styling for a modern, clean look (Zebra striping, slate headers, no vertical borders)
#show table.cell.where(y: 0): set text(weight: "bold", fill: rgb("#ffffff"))
#show table.cell.where(y: 0): set align(center + horizon)
#show table.hline: set table.hline(stroke: 0.5pt + rgb("#e2e8f0"))
#show table.vline: set table.vline(stroke: none)
#set table(
  stroke: (x, y) => if y == 0 { none } else { (bottom: 0.5pt + rgb("#e2e8f0")) },
  fill: (x, y) => if y == 0 { rgb("#1e293b") } else if calc.even(y) { rgb("#f8fafc") } else { rgb("#ffffff") },
  inset: (x: 10pt, y: 8pt),
)

// Ensure table figures can break across pages and repeat headers
#show figure.where(kind: table): set block(breakable: true)

#let horizontalrule = line(length: 100%, stroke: 0.5pt + luma(150))

// Raw/Code block styling to prevent Korean and special symbols (circles, arrows) from breaking
#show raw: set text(font: ("SF Mono", "Menlo", "Courier New", "Apple SD Gothic Neo"), size: 7.5pt)

EOF

# Append the converted typst content to the temp file
cat "$TYP_FILE" >> "$TEMP_FILE"
mv "$TEMP_FILE" "$TYP_FILE"

# Compile to PDF
typst compile "$TYP_FILE" "$PDF_FILE"

# Clean up the intermediate files
rm "$TYP_FILE"
rm -f "$TEMP_MD_FILE"

# Clean up generated PNG files
if [ ${#PNG_FILES[@]} -gt 0 ]; then
  echo "Cleaning up generated PNG files..."
  for png in "${PNG_FILES[@]}"; do
    rm -f "$png"
  done
fi

echo "Successfully converted $MD_FILE to $PDF_FILE"
