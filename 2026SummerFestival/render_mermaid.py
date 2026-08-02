import sys
import re
import base64
import urllib.request
import os

def render_mermaid_to_png(mermaid_code, output_png_path):
    # Encode code to utf-8, then base64
    code_bytes = mermaid_code.strip().encode("utf-8")
    b64_bytes = base64.urlsafe_b64encode(code_bytes)
    # Remove padding '=' characters as mermaid.ink sometimes prefers it, 
    # but standard is usually fine. Let's keep it safe.
    b64_str = b64_bytes.decode("ascii").replace("=", "")
    
    url = f"https://mermaid.ink/img/{b64_str}?type=png"
    
    # Add a user-agent to avoid generic bot blocks
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"})
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            if response.status == 200:
                with open(output_png_path, "wb") as f:
                    f.write(response.read())
                return True
            else:
                print(f"Error rendering mermaid: HTTP status {response.status}", file=sys.stderr)
                return False
    except Exception as e:
        print(f"Exception rendering mermaid: {str(e)}", file=sys.stderr)
        return False

def process_markdown(input_md, output_md):
    if not os.path.exists(input_md):
        print(f"Error: Input markdown file '{input_md}' does not exist.", file=sys.stderr)
        sys.exit(1)
        
    with open(input_md, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Pattern to find mermaid blocks: ```mermaid ... ```
    pattern = re.compile(r"```mermaid\s*\n(.*?)\n```", re.DOTALL)
    
    matches = list(pattern.finditer(content))
    if not matches:
        # No mermaid blocks, just write copy
        with open(output_md, "w", encoding="utf-8") as f:
            f.write(content)
        return
        
    dir_name = os.path.dirname(os.path.abspath(output_md))
    base_name = os.path.splitext(os.path.basename(input_md))[0]
    
    new_content = ""
    last_pos = 0
    
    for idx, match in enumerate(matches):
        mermaid_code = match.group(1)
        png_filename = f"{base_name}_mermaid_{idx+1}.png"
        png_path = os.path.join(dir_name, png_filename)
        
        print(f"Rendering mermaid block {idx+1} to {png_filename}...")
        success = render_mermaid_to_png(mermaid_code, png_path)
        
        # Append content up to match start
        new_content += content[last_pos:match.start()]
        
        if success:
            # Replace code block with image reference
            new_content += f"![Mermaid Diagram]({png_filename})"
            # Print to stdout so bash script knows to clean it up
            print(f"GENERATED_PNG:{png_path}")
        else:
            # Fallback to text inside raw block if render failed
            new_content += f"```\n[Mermaid Render Failed]\n{mermaid_code}\n```"
            
        last_pos = match.end()
        
    new_content += content[last_pos:]
    
    with open(output_md, "w", encoding="utf-8") as f:
        f.write(new_content)

def main():
    if len(sys.argv) < 4 or sys.argv[1] != "--process-markdown":
        print("Usage: python3 render_mermaid.py --process-markdown <input_md> <output_md>", file=sys.stderr)
        sys.exit(1)
        
    input_md = sys.argv[2]
    output_md = sys.argv[3]
    
    process_markdown(input_md, output_md)

if __name__ == "__main__":
    main()
