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

# Convert Markdown to Typst using pandoc
# If mermaid blocks are detected, pre-render them
MERMAID_PROCESSED=false
if grep -q "\`\`\`mermaid" "$MD_FILE"; then
  echo "Mermaid code blocks detected. Rendering diagrams..."
  PROCESSED_MD="$DIRNAME/$BASENAME.mermaid.md"
  if npx -y @mermaid-js/mermaid-cli -i "$MD_FILE" -o "$PROCESSED_MD"; then
    pandoc -f markdown -t typst "$PROCESSED_MD" -o "$TYP_FILE"
    MERMAID_PROCESSED=true
  else
    echo "Warning: Mermaid rendering failed, falling back to direct pandoc conversion."
    pandoc -f markdown -t typst "$MD_FILE" -o "$TYP_FILE"
  fi
else
  pandoc -f markdown -t typst "$MD_FILE" -o "$TYP_FILE"
fi

# Create a temporary file to hold the styling and the converted content
TEMP_FILE=$(mktemp)

# Write Typst styling configurations (A4, Apple SD Gothic Neo for Korean)
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
#set text(
  font: ("Apple SD Gothic Neo", "Helvetica Neue", "Arial"),
  size: 10.5pt,
  lang: "ko",
)
#set par(
  justify: true,
  leading: 0.7em,
)
#show heading: set text(fill: rgb("#1a3a5f"))
#show heading.where(level: 1): it => {
  v(1.5em, weak: true)
  it
  v(1em, weak: true)
}

// Table styling for a modern, clean look (Zebra striping, slate headers, no vertical borders)
#show figure.where(kind: table): set block(breakable: true)
#show table.cell.where(y: 0): set text(weight: "bold", fill: rgb("#ffffff"))
#show table.cell.where(y: 0): set align(center + horizon)
#show table.hline: set table.hline(stroke: 0.5pt + rgb("#e2e8f0"))
#show table.vline: set table.vline(stroke: none)
#set table(
  stroke: (x, y) => if y == 0 { none } else { (bottom: 0.5pt + rgb("#e2e8f0")) },
  fill: (x, y) => if y == 0 { rgb("#1e293b") } else if calc.even(y) { rgb("#f8fafc") } else { rgb("#ffffff") },
  inset: (x: 10pt, y: 8pt),
)

#let horizontalrule = line(length: 100%, stroke: 0.5pt + luma(150))

EOF

# Append the converted typst content to the temp file
cat "$TYP_FILE" >> "$TEMP_FILE"
mv "$TEMP_FILE" "$TYP_FILE"

# Compile to PDF
typst compile "$TYP_FILE" "$PDF_FILE"

# Clean up the intermediate .typ and temporary mermaid files
rm "$TYP_FILE"
if [ "$MERMAID_PROCESSED" = true ]; then
  rm -f "$DIRNAME/$BASENAME.mermaid.md"
  rm -f "$DIRNAME/$BASENAME.mermaid-"*.svg
fi

echo "Successfully converted $MD_FILE to $PDF_FILE"
