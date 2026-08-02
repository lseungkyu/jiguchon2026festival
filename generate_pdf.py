import csv
import subprocess

csv_file = "/Users/seungkyulee/Projects/jiguchon/bible_ox_quiz.csv"
html_file = "/Users/seungkyulee/Projects/jiguchon/quiz_guide.html"
pdf_file = "/Users/seungkyulee/Projects/jiguchon/지구촌교회_중등부_OX퀴즈_자료집.pdf"

with open(csv_file, mode="r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

total_count = len(rows)
o_count = sum(1 for r in rows if r["정답"] == "O")
x_count = sum(1 for r in rows if r["정답"] == "X")

html_content = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>지구촌교회 중등부 O/X 퀴즈 자료집</title>
<style>
    @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap");
    
    @page {{
        size: A4;
        margin: 12mm 15mm 12mm 15mm;
    }}
    
    body {{
        font-family: "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
        color: #2c3e50;
        line-height: 1.45;
        margin: 0;
        padding: 0;
        background-color: #ffffff;
        font-size: 9.5pt;
    }}

    .header-banner {{
        background: linear-gradient(135deg, #1b365d 0%, #2b548f 100%);
        color: #ffffff;
        padding: 18px 24px;
        border-radius: 8px;
        margin-bottom: 14px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }}

    .header-title {{
        font-size: 19pt;
        font-weight: 700;
        margin: 0 0 4px 0;
        letter-spacing: -0.5px;
    }}

    .header-subtitle {{
        font-size: 11pt;
        font-weight: 300;
        color: #e0eaf8;
        margin: 0;
    }}

    .guide-box {{
        background-color: #f8fafc;
        border-left: 5px solid #2b548f;
        border-right: 1px solid #e2e8f0;
        border-top: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
        padding: 12px 16px;
        border-radius: 6px;
        margin-bottom: 16px;
    }}

    .guide-title {{
        font-weight: 700;
        font-size: 10.5pt;
        color: #1b365d;
        margin-bottom: 6px;
    }}

    .guide-list {{
        margin: 0;
        padding-left: 18px;
        font-size: 9pt;
        color: #334155;
    }}

    .guide-list li {{
        margin-bottom: 4px;
    }}

    .stats-container {{
        display: flex;
        gap: 8px;
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px dashed #cbd5e1;
    }}

    .stat-badge {{
        background-color: #e2e8f0;
        padding: 3px 9px;
        border-radius: 10px;
        font-size: 8.5pt;
        font-weight: 600;
        color: #1e293b;
    }}

    .round-header {{
        background-color: #f1f5f9;
        font-weight: 700;
        color: #1e293b;
        padding: 8px;
        border: 1px solid #cbd5e1;
        font-size: 9.5pt;
    }}

    table {{
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
        font-size: 8.5pt;
    }}

    tr {{
        page-break-inside: avoid;
    }}

    th {{
        background-color: #1b365d;
        color: #ffffff;
        font-weight: 600;
        text-align: center;
        padding: 6px 5px;
        border: 1px solid #1b365d;
    }}

    td {{
        padding: 5px 6px;
        border: 1px solid #cbd5e0;
        vertical-align: middle;
    }}

    tbody tr:nth-child(even) {{
        background-color: #f8fafc;
    }}

    .col-num {{ width: 5%; text-align: center; font-weight: 500; }}
    .col-ess {{ width: 6%; text-align: center; font-weight: 700; }}
    .col-diff {{ width: 7%; text-align: center; }}
    .col-cat {{ width: 11%; text-align: center; font-weight: 500; }}
    .col-q {{ width: 42%; text-align: left; }}
    .col-ans {{ width: 6%; text-align: center; font-weight: 700; font-size: 10pt; }}
    .col-exp {{ width: 23%; text-align: left; font-size: 8pt; color: #4a5568; }}

    .badge-ess-Y {{ background-color: #ebf8ff; color: #2b6cb0; border: 1px solid #bee3f8; padding: 2px 4px; border-radius: 3px; font-weight: 700; font-size: 7.5pt; }}
    .badge-ess-N {{ background-color: #f7fafc; color: #a0aec0; border: 1px solid #e2e8f0; padding: 2px 4px; border-radius: 3px; font-weight: 500; font-size: 7.5pt; }}

    .badge-diff-하 {{ background-color: #e6fffa; color: #234e52; border: 1px solid #b2f5ea; padding: 2px 4px; border-radius: 3px; font-weight: 600; font-size: 7.5pt; }}
    .badge-diff-중 {{ background-color: #feebc8; color: #744210; border: 1px solid #fbd38d; padding: 2px 4px; border-radius: 3px; font-weight: 600; font-size: 7.5pt; }}
    .badge-diff-상 {{ background-color: #fed7d7; color: #742a2a; border: 1px solid #feb2b2; padding: 2px 4px; border-radius: 3px; font-weight: 600; font-size: 7.5pt; }}
    .badge-diff-눈치 {{ background-color: #e9d8fd; color: #44337a; border: 1px solid #d6bcfa; padding: 2px 4px; border-radius: 3px; font-weight: 600; font-size: 7.5pt; }}

    .ans-O {{ color: #2b6cb0; background-color: #ebf8ff; padding: 1px 6px; border-radius: 3px; display: inline-block; }}
    .ans-X {{ color: #c53030; background-color: #fff5f5; padding: 1px 6px; border-radius: 3px; display: inline-block; }}

    .footer-note {{
        text-align: center;
        margin-top: 15px;
        padding-top: 8px;
        border-top: 1px solid #e2e8f0;
        font-size: 8pt;
        color: #94a3b8;
    }}
</style>
</head>
<body>

<div class="header-banner">
    <div class="header-title">지구촌교회 청소년지구 중등부 O/X 퀴즈 자료집</div>
    <div class="header-subtitle">지구촌교회 중등부 수련회 · 골든벨 · 프로그램 진행용 (총 {total_count}문항 / 라운드별 필수 문제 선배치)</div>
</div>

<div class="guide-box">
    <div class="guide-title">📌 목자 진행 가이드 & 라운드별 필수 문제 운영 팁</div>
    
    <ul class="guide-list">
        <li><strong>라운드별 '필수(Y)' 문제 우선 배치</strong>: 각 라운드의 <strong>앞쪽 1~15번(필수='Y')은 무조건 다루어야 하는 핵심 꿀문제</strong>입니다. 시간이 부족할 경우 라운드 뒤쪽의 예비 문제를 건너뛰고 바로 다음 라운드로 넘어가시면 됩니다.</li>
        <li><strong>3개 라운드 분배 체계 (라운드당 30문항)</strong>:
            <ul>
                <li><strong>1라운드 (1~30번)</strong>: 1~15번 [필수 진행] / 16~30번 [예비 진행]</li>
                <li><strong>2라운드 (31~60번)</strong>: 31~45번 [필수 진행] / 46~60번 [예비 진행]</li>
                <li><strong>3라운드 (61~90번)</strong>: 61~75번 [필수 진행] / 76~90번 [예비 진행]</li>
            </ul>
        </li>
        <li><strong>불규칙 O/X 정답 배치</strong>: 아이들이 정답 패턴을 눈치채고 따라다니지 못하도록 정답을 불규칙하게 배열하였습니다.</li>
    </ul>

    <div class="stats-container">
        <span class="stat-badge">총 {total_count}문항 (3개 라운드 × 30문항)</span>
        <span class="stat-badge">라운드별 1~15번 [필수(Y)] 선배치</span>
        <span class="stat-badge">정답 비율 O {o_count}개 : X {x_count}개</span>
    </div>
</div>

<table>
    <thead>
        <tr>
            <th class="col-num">No</th>
            <th class="col-ess">필수</th>
            <th class="col-diff">난이도</th>
            <th class="col-cat">카테고리</th>
            <th class="col-q">문제 지문</th>
            <th class="col-ans">정답</th>
            <th class="col-exp">해설 및 참고</th>
        </tr>
    </thead>
    <tbody>
"""

round_names = [
    "🎈 1라운드 (1~15번 [필수 진행] / 16~30번 [예비 진행])",
    "💡 2라운드 (31~45번 [필수 진행] / 46~60번 [예비 진행])",
    "⛪ 3라운드 (61~75번 [필수 진행] / 76~90번 [예비 진행])"
]

for i, r in enumerate(rows, 1):
    if (i - 1) % 30 == 0:
        r_idx = (i - 1) // 30
        r_name = round_names[r_idx] if r_idx < len(round_names) else f"🔥 {r_idx+1}라운드"
        html_content += f"""        <tr>
            <td colspan="7" class="round-header">{r_name}</td>
        </tr>
"""
    ess = r.get("필수", "").strip()
    ess_str = "필수" if ess in ["Y", "y", "필수", "TRUE", "true", "1", "O", "o"] else "예비"
    ess_class = "badge-ess-Y" if ess_str == "필수" else "badge-ess-N"

    diff = r["난이도"]
    cat = r["카테고리"]
    q = r["문제"]
    ans = r["정답"]
    exp = r["해설 및 참고"]
    
    ans_class = "ans-O" if ans == "O" else "ans-X"
    
    html_content += f"""        <tr>
            <td class="col-num">{i}</td>
            <td class="col-ess"><span class="{ess_class}">{ess_str}</span></td>
            <td class="col-diff"><span class="badge-diff-{diff}">{diff}</span></td>
            <td class="col-cat">{cat}</td>
            <td class="col-q">{q}</td>
            <td class="col-ans"><span class="{ans_class}">{ans}</span></td>
            <td class="col-exp">{exp}</td>
        </tr>
"""

html_content += """    </tbody>
</table>

<div class="footer-note">
    지구촌교회 청소년지구 중등부 | 민족을 치유하고 세상을 변화시키는 다음세대
</div>

</body>
</html>
"""

with open(html_file, mode="w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML generated successfully: {html_file}")

# Convert HTML to PDF using Chrome Headless
chrome_cmd = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "--headless=new",
    f"--print-to-pdf={pdf_file}",
    html_file
]

subprocess.run(chrome_cmd, check=True)
print(f"PDF generated successfully: {pdf_file}")
