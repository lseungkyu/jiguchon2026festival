import urllib.request
import json

print("Downloading qrcode.min.js...")
with urllib.request.urlopen('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js') as r:
    qrcode_js = r.read().decode('utf-8')

print("Downloading peerjs.min.js...")
with urllib.request.urlopen('https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js') as r:
    peerjs_js = r.read().decode('utf-8')

with open('quiz_data.json', 'r', encoding='utf-8') as f:
    quiz_data = json.load(f)

quiz_json_str = json.dumps(quiz_data, ensure_ascii=False, indent=2)

html_template = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>지구촌교회 중등부 O/X 퀴즈 대회</title>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;500;700;900&family=Outfit:wght@600;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0b0f19;
      --bg-card: rgba(23, 31, 51, 0.75);
      --bg-card-hover: rgba(33, 45, 74, 0.85);
      --border-color: rgba(255, 255, 255, 0.12);
      
      --accent-blue: #38bdf8;
      --accent-cyan: #22d3ee;
      --accent-purple: #a855f7;
      --accent-pink: #ec4899;
      --accent-emerald: #10b981;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      
      --color-o: #10b981;
      --color-o-glow: rgba(16, 185, 129, 0.4);
      --color-x: #f43f5e;
      --color-x-glow: rgba(244, 63, 94, 0.4);
      
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      
      --font-heading: 'Black Han Sans', 'Noto Sans KR', sans-serif;
      --font-body: 'Noto Sans KR', sans-serif;
      --font-num: 'Outfit', 'Noto Sans KR', sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: var(--font-body);
      min-height: 100vh;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    /* Fullscreen Stage Flash Overlay */
    .screen-flash-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 40;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .screen-flash-overlay.flash-tick {
      background: radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(56, 189, 248, 0.05) 70%, transparent 100%);
      animation: tickPulse 0.35s ease-out forwards;
    }

    .screen-flash-overlay.flash-tick-warning {
      background: radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, rgba(245, 158, 11, 0.08) 70%, transparent 100%);
      animation: tickPulse 0.35s ease-out forwards;
    }

    .screen-flash-overlay.flash-tick-urgent {
      background: radial-gradient(circle, rgba(244, 63, 94, 0.55) 0%, rgba(244, 63, 94, 0.15) 70%, transparent 100%);
      animation: tickPulseUrgent 0.35s ease-out forwards;
    }

    .screen-flash-overlay.flash-o {
      background: radial-gradient(circle, rgba(16, 185, 129, 0.5) 0%, rgba(16, 185, 129, 0.15) 60%, transparent 100%);
      animation: screenPulseGreen 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .screen-flash-overlay.flash-x {
      background: radial-gradient(circle, rgba(244, 63, 94, 0.5) 0%, rgba(244, 63, 94, 0.15) 60%, transparent 100%);
      animation: screenPulseRed 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .screen-flash-overlay.flash-timeover {
      background: radial-gradient(circle, rgba(244, 63, 94, 0.6) 0%, rgba(244, 63, 94, 0.2) 70%, transparent 100%);
      animation: screenFlashDanger 0.4s ease-in-out infinite alternate;
    }

    @keyframes tickPulse {
      0% { opacity: 0; transform: scale(0.97); }
      35% { opacity: 1; transform: scale(1.02); }
      100% { opacity: 0; transform: scale(1); }
    }

    @keyframes tickPulseUrgent {
      0% { opacity: 0; transform: scale(0.95); }
      45% { opacity: 1; transform: scale(1.04); }
      100% { opacity: 0; transform: scale(1); }
    }

    @keyframes screenPulseGreen {
      0% { opacity: 0; transform: scale(0.95); }
      30% { opacity: 1; transform: scale(1.03); }
      100% { opacity: 0; transform: scale(1); }
    }

    @keyframes screenPulseRed {
      0% { opacity: 0; transform: scale(0.95); }
      30% { opacity: 1; transform: scale(1.03); }
      100% { opacity: 0; transform: scale(1); }
    }

    @keyframes screenFlashDanger {
      0% { opacity: 0.3; }
      100% { opacity: 0.8; }
    }

    /* Timeover Banner Overlay */
    .timeover-banner {
      display: none;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      background: rgba(244, 63, 94, 0.95);
      color: white;
      font-family: var(--font-heading);
      font-size: 2.8rem;
      padding: 1.25rem 3rem;
      border-radius: 20px;
      box-shadow: 0 0 50px rgba(244, 63, 94, 0.8);
      z-index: 35;
      text-shadow: 0 4px 10px rgba(0,0,0,0.5);
      border: 3px solid white;
      white-space: nowrap;
    }

    .timeover-banner.active {
      display: block;
      animation: timeoverPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes timeoverPop {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    /* Ambient Animated Glow Background */
    .bg-blobs {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
      overflow: hidden;
      pointer-events: none;
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.25;
      animation: float 20s infinite alternate ease-in-out;
    }

    .blob-1 {
      top: -10%;
      left: -10%;
      width: 50vw;
      height: 50vw;
      background: radial-gradient(circle, var(--accent-purple), var(--accent-blue));
    }

    .blob-2 {
      bottom: -15%;
      right: -10%;
      width: 55vw;
      height: 55vw;
      background: radial-gradient(circle, var(--accent-cyan), var(--accent-emerald));
      animation-delay: -7s;
    }

    .blob-3 {
      top: 40%;
      left: 35%;
      width: 35vw;
      height: 35vw;
      background: radial-gradient(circle, #4f46e5, var(--accent-pink));
      animation-delay: -12s;
    }

    @keyframes float {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(5%, 8%) scale(1.08); }
      100% { transform: translate(-4%, -5%) scale(0.95); }
    }

    /* Header Nav */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      background: rgba(11, 15, 25, 0.7);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-color);
      z-index: 10;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-logo {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-heading);
      font-size: 1.3rem;
      color: white;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
    }

    .brand-title {
      font-weight: 700;
      font-size: 1.15rem;
      letter-spacing: -0.5px;
      background: linear-gradient(to right, #ffffff, #cbd5e1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .top-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-icon {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.5rem 0.9rem;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
    }

    .btn-icon.active {
      background: linear-gradient(135deg, var(--accent-blue), #2563eb);
      border-color: transparent;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
    }

    /* Main Container */
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      max-width: 1300px;
      width: 100%;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    /* Slide Screens */
    .screen {
      display: none;
      width: 100%;
      animation: fadeIn 0.4s ease forwards;
    }

    .screen.active {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px) scale(0.99); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* COVER SCREEN */
    .cover-card {
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-color);
      border-radius: 28px;
      padding: 3.5rem 3rem;
      text-align: center;
      max-width: 850px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(56, 189, 248, 0.1);
      position: relative;
      overflow: hidden;
    }

    .cover-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(to right, var(--accent-cyan), var(--accent-purple), var(--accent-pink));
    }

    .cover-badge {
      display: inline-block;
      padding: 0.4rem 1.2rem;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: var(--accent-cyan);
      border-radius: 50px;
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      letter-spacing: 1px;
    }

    .cover-title {
      font-family: var(--font-heading);
      font-size: 3.8rem;
      line-height: 1.15;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #ffffff 30%, var(--accent-cyan) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }

    .cover-subtitle {
      font-size: 1.25rem;
      color: var(--text-muted);
      margin-bottom: 2.5rem;
      word-break: keep-all;
    }

    .cover-actions {
      display: flex;
      gap: 1.25rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-primary {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: white;
      font-size: 1.2rem;
      font-weight: 700;
      padding: 1rem 2.5rem;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(2, 132, 199, 0.4);
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .btn-primary:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 15px 35px rgba(2, 132, 199, 0.6);
      background: linear-gradient(135deg, #38bdf8, #3b82f6);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      font-size: 1rem;
      font-weight: 600;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    /* SECTION HEADER SCREEN (PART 1 / PART 2) */
    .part-card {
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-color);
      border-radius: 28px;
      padding: 4rem 3rem;
      text-align: center;
      max-width: 850px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      position: relative;
    }

    .part-tag {
      font-family: var(--font-num);
      font-size: 1.5rem;
      font-weight: 900;
      color: var(--accent-purple);
      letter-spacing: 2px;
      margin-bottom: 1rem;
      text-transform: uppercase;
    }

    .part-title {
      font-family: var(--font-heading);
      font-size: 3.2rem;
      margin-bottom: 1.25rem;
      color: white;
    }

    .part-desc {
      font-size: 1.25rem;
      color: var(--text-muted);
      margin-bottom: 2.5rem;
    }

    /* QUESTION SCREEN */
    .quiz-container {
      width: 100%;
      max-width: 1100px;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .quiz-meta-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 0.85rem 1.5rem;
      backdrop-filter: blur(10px);
    }

    .meta-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .q-number-badge {
      font-family: var(--font-num);
      font-size: 1.25rem;
      font-weight: 900;
      color: var(--accent-cyan);
      background: rgba(34, 211, 238, 0.1);
      border: 1px solid rgba(34, 211, 238, 0.3);
      padding: 0.3rem 0.9rem;
      border-radius: 8px;
    }

    .badge {
      padding: 0.35rem 0.85rem;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      letter-spacing: -0.2px;
    }

    .badge-cat {
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.3);
    }

    .badge-diff-하 {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-diff-중 {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .badge-diff-상 {
      background: rgba(244, 63, 94, 0.15);
      color: #f87171;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
    .badge-diff-눈치 {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    .badge-ref {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-dim);
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-family: var(--font-num);
    }

    /* Main Question Box */
    .question-card {
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 2.5rem 2.5rem 3rem 2.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      min-height: 420px;
      justify-content: center;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
      position: relative;
    }

    /* PROMINENT STAGE COUNTDOWN TIMER */
    .large-timer-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(15, 23, 42, 0.7);
      border: 2px solid rgba(56, 189, 248, 0.3);
      padding: 0.4rem 1.4rem;
      border-radius: 50px;
      margin-bottom: 1.75rem;
      cursor: pointer;
      box-shadow: 0 0 25px rgba(56, 189, 248, 0.15);
      transition: all 0.25s ease;
    }

    .large-timer-wrapper:hover {
      transform: scale(1.05);
      border-color: var(--accent-cyan);
      box-shadow: 0 0 35px rgba(56, 189, 248, 0.3);
    }

    .timer-ring-box {
      position: relative;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .timer-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .timer-circle-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.1);
      stroke-width: 6;
    }

    .timer-circle-progress {
      fill: none;
      stroke: var(--accent-cyan);
      stroke-width: 6;
      stroke-linecap: round;
      stroke-dasharray: 113;
      stroke-dashoffset: 0;
      transition: stroke-dashoffset 0.9s linear, stroke 0.3s ease;
    }

    .large-timer-val {
      font-family: var(--font-num);
      font-size: 2.2rem;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.5px;
      min-width: 40px;
      text-align: center;
      transition: color 0.3s ease;
    }

    .large-timer-wrapper.urgent {
      border-color: var(--accent-rose);
      background: rgba(244, 63, 94, 0.2);
      box-shadow: 0 0 35px rgba(244, 63, 94, 0.4);
      animation: pulseAlert 0.5s infinite alternate ease-in-out;
    }

    .large-timer-wrapper.urgent .large-timer-val {
      color: var(--accent-rose);
    }

    .large-timer-wrapper.urgent .timer-circle-progress {
      stroke: var(--accent-rose);
    }

    @keyframes pulseAlert {
      from { transform: scale(1); }
      to { transform: scale(1.08); }
    }

    .question-text {
      font-size: 2.3rem;
      font-weight: 700;
      line-height: 1.45;
      word-break: keep-all;
      color: #ffffff;
      margin-bottom: 2.2rem;
      letter-spacing: -0.5px;
    }

    /* Interactive O / X Choice Buttons */
    .ox-choices {
      display: flex;
      gap: 3rem;
      justify-content: center;
      width: 100%;
    }

    .ox-btn {
      width: 160px;
      height: 160px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-num);
      font-size: 5rem;
      font-weight: 900;
      border: 3px solid;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(10px);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
    }

    .ox-btn-o {
      border-color: rgba(16, 185, 129, 0.4);
      color: var(--color-o);
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.1);
    }

    .ox-btn-x {
      border-color: rgba(244, 63, 94, 0.4);
      color: var(--color-x);
      box-shadow: 0 10px 30px rgba(244, 63, 94, 0.1);
    }

    .ox-btn:hover {
      transform: translateY(-5px) scale(1.05);
    }

    .ox-btn-o:hover {
      border-color: var(--color-o);
      background: rgba(16, 185, 129, 0.15);
      box-shadow: 0 15px 40px var(--color-o-glow);
    }

    .ox-btn-x:hover {
      border-color: var(--color-x);
      background: rgba(244, 63, 94, 0.15);
      box-shadow: 0 15px 40px var(--color-x-glow);
    }

    .ox-btn.selected-o {
      border-color: var(--color-o);
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1));
      box-shadow: 0 0 50px var(--color-o-glow);
      transform: scale(1.1);
    }

    .ox-btn.selected-x {
      border-color: var(--color-x);
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.3), rgba(244, 63, 94, 0.1));
      box-shadow: 0 0 50px var(--color-x-glow);
      transform: scale(1.1);
    }

    /* ANSWER REVEAL PANEL */
    .answer-panel {
      display: none;
      width: 100%;
      margin-top: 1.5rem;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 1.75rem 2rem;
      animation: popUp 0.35s ease forwards;
    }

    .answer-panel.active {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    @keyframes popUp {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .answer-header-row {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .answer-stamp {
      width: 65px;
      height: 65px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-num);
      font-size: 2.4rem;
      font-weight: 900;
      color: white;
      flex-shrink: 0;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
      animation: stampZoom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes stampZoom {
      0% { transform: scale(2.2); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .stamp-o {
      background: linear-gradient(135deg, #10b981, #059669);
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
    }

    .stamp-x {
      background: linear-gradient(135deg, #f43f5e, #e11d48);
      box-shadow: 0 0 30px rgba(244, 63, 94, 0.5);
    }

    .answer-title-group {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .answer-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .answer-val-text {
      font-size: 1.5rem;
      font-weight: 800;
      color: white;
    }

    .explanation-box {
      background: rgba(255, 255, 255, 0.04);
      border-left: 4px solid var(--accent-cyan);
      padding: 1rem 1.25rem;
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 1.1rem;
      line-height: 1.6;
      word-break: keep-all;
    }

    .explanation-box strong {
      color: var(--accent-cyan);
      display: block;
      margin-bottom: 0.3rem;
      font-size: 0.9rem;
    }

    /* FOOTER CONTROLS */
    footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      background: rgba(11, 15, 25, 0.8);
      backdrop-filter: blur(16px);
      border-top: 1px solid var(--border-color);
      z-index: 10;
    }

    .nav-buttons {
      display: flex;
      gap: 0.75rem;
    }

    .btn-nav {
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid var(--border-color);
      color: white;
      font-size: 0.95rem;
      font-weight: 600;
      padding: 0.6rem 1.25rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .btn-nav:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-1px);
    }

    .btn-nav:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-reveal {
      background: linear-gradient(135deg, var(--accent-purple), #7c3aed);
      border: none;
      color: white;
      font-size: 1.05rem;
      font-weight: 700;
      padding: 0.65rem 1.8rem;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 5px 20px rgba(168, 85, 247, 0.3);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-reveal:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(168, 85, 247, 0.5);
      background: linear-gradient(135deg, #c084fc, #8b5cf6);
    }

    .progress-info {
      font-family: var(--font-num);
      font-size: 0.9rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .progress-bar-bg {
      width: 140px;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(to right, var(--accent-cyan), var(--accent-purple));
      width: 0%;
      transition: width 0.3s ease;
    }

    /* OVERLAYS & MODALS */
    .overlay-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 100;
      display: none;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .overlay-backdrop.active {
      display: flex;
      opacity: 1;
    }

    /* DRAWER CONTENT */
    .drawer-content {
      position: fixed;
      top: 0;
      right: -450px;
      width: 450px;
      height: 100vh;
      background: #0f172a;
      border-left: 1px solid var(--border-color);
      z-index: 101;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: -10px 0 40px rgba(0,0,0,0.6);
    }

    .overlay-backdrop.active .drawer-content {
      right: 0;
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .drawer-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
    }

    .drawer-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
    }

    .drawer-close:hover {
      color: white;
    }

    .slide-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.65rem;
      overflow-y: auto;
      padding-right: 0.5rem;
      flex: 1;
    }

    .grid-item {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 0.75rem 0.5rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
    }

    .grid-item:hover {
      background: rgba(56, 189, 248, 0.15);
      border-color: var(--accent-cyan);
    }

    .grid-item.active {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      border-color: transparent;
      box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
    }

    .grid-item-num {
      font-family: var(--font-num);
      font-weight: 800;
      font-size: 0.9rem;
    }

    .grid-item-badge {
      font-size: 0.68rem;
      color: var(--text-muted);
    }

    /* QR CODE MODAL BOX */
    .qr-modal-box {
      background: #0f172a;
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 2.2rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
      max-width: 480px;
      width: 92%;
      z-index: 102;
      animation: popUp 0.3s ease forwards;
    }

    .qr-container {
      background: white;
      padding: 1.25rem;
      border-radius: 18px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      min-width: 210px;
      min-height: 210px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ip-guide-box {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      padding: 0.85rem;
      border-radius: 12px;
      font-size: 0.82rem;
      color: var(--text-muted);
      width: 100%;
      text-align: left;
      line-height: 1.45;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 1rem;
      border-radius: 50px;
      font-size: 0.88rem;
      font-weight: 700;
    }
    .status-badge.waiting {
      background: rgba(245, 158, 11, 0.15);
      color: var(--accent-amber);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .status-badge.connected {
      background: rgba(16, 185, 129, 0.15);
      color: var(--accent-emerald);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    /* MOBILE REMOTE UI MODE */
    .remote-view {
      display: none;
      flex-direction: column;
      width: 100vw;
      min-height: 100vh;
      background: #090d16;
      color: white;
      padding: 1.25rem;
      gap: 1.25rem;
      z-index: 999;
      position: fixed;
      top: 0;
      left: 0;
      overflow-y: auto;
    }

    .remote-view.active {
      display: flex;
    }

    .remote-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.85rem 1.25rem;
      border-radius: 16px;
      border: 1px solid var(--border-color);
    }

    .remote-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .remote-q-text {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.4;
      word-break: keep-all;
    }

    .remote-hint-box {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.85rem 1rem;
      border-radius: 12px;
      color: #34d399;
      font-size: 0.95rem;
    }

    .remote-controls-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .btn-remote-large {
      grid-column: span 2;
      padding: 1.3rem;
      font-size: 1.3rem;
      font-weight: 800;
      border-radius: 18px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      transition: transform 0.1s active;
    }

    .btn-remote-large:active {
      transform: scale(0.96);
    }

    .btn-remote-reveal {
      background: linear-gradient(135deg, var(--accent-purple), #7c3aed);
      color: white;
    }

    .btn-remote-next {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: white;
    }

    .btn-remote-sub {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-color);
      color: white;
      padding: 1rem;
      font-size: 1rem;
      font-weight: 700;
      border-radius: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
    }
  </style>
</head>
<body>

  <!-- Fullscreen Stage Flash Overlay -->
  <div class="screen-flash-overlay" id="screenFlashOverlay"></div>

  <!-- Ambient Animated Background -->
  <div class="bg-blobs">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
  </div>

  <!-- Header -->
  <header>
    <div class="brand">
      <div class="brand-logo">OX</div>
      <div>
        <div class="brand-title">지구촌교회 청소년지구 중등부</div>
        <div class="brand-subtitle">수련회 맞춤 O/X 퀴즈 대회</div>
      </div>
    </div>
    <div class="top-controls">
      <button class="btn-icon" id="btnRemoteQr" onclick="openQrModal()">
        📱 스마트폰 리모컨
      </button>
      <button class="btn-icon" id="btnSound" onclick="toggleSound()">
        🔊 <span id="soundLabel">소리 켜짐</span>
      </button>
      <button class="btn-icon" onclick="toggleDrawer()">
        ☰ 목록
      </button>
      <button class="btn-icon" onclick="toggleFullscreen()">
        ⛶ 전체화면
      </button>
    </div>
  </header>

  <!-- Main Presentation View -->
  <main id="mainHostView">
    
    <!-- COVER SCREEN -->
    <div class="screen active" id="screenCover">
      <div class="cover-card">
        <div class="cover-badge">지구촌교회 청소년지구 중등부</div>
        <h1 class="cover-title">O / X 퀴즈 대회</h1>
        <p class="cover-subtitle">수련회 현장 이동형 O/X 퀴즈 | 총 45문항 (본 퀴즈 35문항 + 여분 10문항)</p>
        <div class="cover-actions">
          <button class="btn-primary" onclick="startQuiz()">
            ▶ 퀴즈 진행 시작하기 (Space)
          </button>
        </div>
      </div>
    </div>

    <!-- PART 1 HEADER SCREEN -->
    <div class="screen" id="screenPart1">
      <div class="part-card">
        <div class="part-tag">SECTION 01</div>
        <h2 class="part-title">PART 1 : 본 퀴즈</h2>
        <p class="part-desc">1번 ~ 35번 문제<br>준비되셨나요? 신중하게 생각하고 O / X 구역으로 이동해 주세요!</p>
        <button class="btn-primary" onclick="nextSlide()">
          1번 문제 시작 (Space) ▶
        </button>
      </div>
    </div>

    <!-- PART 2 HEADER SCREEN -->
    <div class="screen" id="screenPart2">
      <div class="part-card">
        <div class="part-tag" style="color: var(--accent-cyan);">SECTION 02</div>
        <h2 class="part-title">PART 2 : 여분 문제</h2>
        <p class="part-desc">여분 1번 ~ 10번 문제<br>패자부활전 & 동점자 처리용 예비 퀴즈 10문항</p>
        <button class="btn-primary" onclick="nextSlide()">
          여분 1번 시작 (Space) ▶
        </button>
      </div>
    </div>

    <!-- QUIZ QUESTION SCREEN -->
    <div class="screen" id="screenQuiz">
      <div class="quiz-container">
        <div class="quiz-meta-bar">
          <div class="meta-left">
            <div class="q-number-badge" id="qNumBadge">Q 01 / 35</div>
            <div class="badge badge-cat" id="qCatBadge">성경</div>
            <div class="badge badge-diff-하" id="qDiffBadge">난이도: 하</div>
            <div class="badge badge-ref" id="qRefBadge">자료집 #6</div>
          </div>
        </div>

        <div class="question-card">
          <!-- Timeover Banner -->
          <div class="timeover-banner" id="timeoverBanner">
            ⏰ 시간 종료! 더 이상 이동하지 말아주세요!
          </div>

          <!-- PROMINENT STAGE COUNTDOWN TIMER -->
          <div class="large-timer-wrapper" id="timerWrapper" onclick="toggleTimer()" title="클릭하여 10초 타이머 시작/일시정지 (단축키 T)">
            <div class="timer-ring-box">
              <svg class="timer-svg" viewBox="0 0 40 40">
                <circle class="timer-circle-bg" cx="20" cy="20" r="18"></circle>
                <circle class="timer-circle-progress" id="timerSvgProgress" cx="20" cy="20" r="18"></circle>
              </svg>
            </div>
            <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 700;">남은 시간</span>
            <div class="large-timer-val" id="timerText">10</div>
          </div>

          <div class="question-text" id="questionText">
            질문 텍스트가 여기에 표시됩니다.
          </div>

          <div class="ox-choices">
            <div class="ox-btn ox-btn-o" id="btnChoiceO" onclick="selectChoice('O')">O</div>
            <div class="ox-btn ox-btn-x" id="btnChoiceX" onclick="selectChoice('X')">X</div>
          </div>
        </div>

        <!-- Answer Panel -->
        <div class="answer-panel" id="answerPanel">
          <div class="answer-header-row">
            <div class="answer-stamp stamp-o" id="ansStamp">O</div>
            <div class="answer-title-group">
              <div class="answer-label">정 답</div>
              <div class="answer-val-text" id="ansValText">O (참)</div>
            </div>
          </div>
          <div class="explanation-box" id="explanationText">
            <strong>💡 해설 및 참고</strong>
            해설 내용이 여기에 들어갑니다.
          </div>
        </div>
      </div>
    </div>

    <!-- OUTRO SCREEN -->
    <div class="screen" id="screenOutro">
      <div class="cover-card" style="border-color: var(--accent-emerald);">
        <div class="cover-badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); border-color: rgba(16, 185, 129, 0.3);">대회 종료</div>
        <h1 class="cover-title" style="font-size: 3.5rem;">수고하셨습니다!</h1>
        <p class="cover-subtitle">지구촌교회 청소년지구 중등부 O/X 퀴즈 종료</p>
        <div class="cover-actions">
          <button class="btn-primary" onclick="resetQuiz()">
            🔄 처음으로 돌아가기
          </button>
        </div>
      </div>
    </div>

  </main>

  <!-- Footer Navigation -->
  <footer id="footerHostView">
    <div class="nav-buttons">
      <button class="btn-nav" id="btnPrev" onclick="prevSlide()">◀ 이전 (←)</button>
      <button class="btn-nav" id="btnNext" onclick="nextSlide()">다음 (→) ▶</button>
    </div>

    <button class="btn-reveal" id="btnReveal" onclick="toggleAnswer()">
      💡 정답 및 해설 보기 (Space)
    </button>

    <div class="progress-info">
      <span id="progressText">0 / 45</span>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="progressBar"></div>
      </div>
    </div>
  </footer>

  <!-- Slide List Drawer Overlay -->
  <div class="overlay-backdrop" id="drawerOverlay" onclick="toggleDrawer()">
    <div class="drawer-content" onclick="event.stopPropagation()">
      <div class="drawer-header">
        <div class="drawer-title">문항 바로가기</div>
        <button class="drawer-close" onclick="toggleDrawer()">✕</button>
      </div>
      <div class="slide-grid" id="slideGrid">
        <!-- Grid Items injected via JS -->
      </div>
    </div>
  </div>

  <!-- QR Code Modal Backdrop -->
  <div class="overlay-backdrop" id="qrModalOverlay" onclick="closeQrModal()">
    <div class="qr-modal-box" onclick="event.stopPropagation()">
      <h3 style="color: white; font-size: 1.3rem;">📱 스마트폰 리모컨 연결</h3>
      <p style="color: var(--text-muted); font-size: 0.88rem; word-break: keep-all;">
        스마트폰과 노트북이 <strong>동일한 Wi-Fi</strong>에 연결된 상태에서 카메라로 QR 코드를 스캔하세요.
      </p>

      <div class="qr-container" id="qrcode"></div>

      <div class="status-badge waiting" id="remoteStatusBadge">
        ● 스마트폰 연결 대기 중...
      </div>

      <div class="ip-guide-box" id="ipNoticeBox">
        <div style="color: var(--accent-cyan); font-weight: bold; margin-bottom: 0.2rem;">💡 테스트 및 실전 연결 팁</div>
        터미널에서 <code>python3 start_server.py</code> 실행 후 접속하면 스마트폰에서 QR 스캔 시 100% 즉시 연결됩니다!
      </div>

      <button class="btn-icon" style="width: 100%; justify-content: center; padding: 0.75rem;" onclick="copyRemoteUrl()">
        🔗 리모컨 주소 복사하기
      </button>
      <button class="btn-secondary" style="width: 100%; padding: 0.65rem;" onclick="closeQrModal()">
        닫기
      </button>
    </div>
  </div>

  <!-- MOBILE REMOTE UI SCREEN MODE -->
  <div class="remote-view" id="remoteViewScreen">
    <div class="remote-header">
      <div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">지구촌교회 중등부 OX퀴즈</div>
        <div style="font-weight: 800; font-size: 1.1rem;">📱 MC 무대 리모컨</div>
      </div>
      <div class="status-badge connected" id="remoteConnectStatus">
        🟢 연결됨
      </div>
    </div>

    <!-- Current Question MC Hint Card -->
    <div class="remote-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-family: var(--font-num); font-weight: 900; color: var(--accent-cyan);" id="rmQNum">Q 01</span>
        <span style="font-size: 0.85rem; color: var(--text-muted);" id="rmQCat">[성경] 난이도:하</span>
      </div>
      <div class="remote-q-text" id="rmQText">
        현재 문제 텍스트가 여기에 표시됩니다.
      </div>
      <div class="remote-hint-box" id="rmHintBox">
        <strong>🔑 진행자 전용 정답 힌트: O</strong><br>
        <span id="rmExplanation">해설 스포일러가 진행자 휴대폰에만 선공개됩니다.</span>
      </div>
    </div>

    <!-- Main Touch Control Buttons -->
    <div class="remote-controls-grid">
      <button class="btn-remote-large btn-remote-reveal" onclick="sendRemoteCmd('toggleAnswer')">
        💡 정답 및 해설 공개
      </button>
      
      <button class="btn-remote-large btn-remote-next" onclick="sendRemoteCmd('nextSlide')">
        ▶ 다음 문제로 이동
      </button>

      <button class="btn-remote-sub" onclick="sendRemoteCmd('prevSlide')">
        ◀ 이전 문제
      </button>

      <button class="btn-remote-sub" onclick="sendRemoteCmd('toggleTimer')">
        ⏱ 10초 타이머 ON/OFF
      </button>

      <button class="btn-remote-sub" onclick="sendRemoteCmd('resetTimer')">
        ↺ 10초 리셋
      </button>

      <button class="btn-remote-sub" onclick="sendRemoteCmd('toggleSound')">
        🔊 음소거 토글
      </button>
    </div>
  </div>

  <!-- Embedded Libraries -->
  <script>
    """ + qrcode_js + """
  </script>
  <script>
    """ + peerjs_js + """
  </script>

  <!-- Embedded Quiz Dataset & Script -->
  <script>
    const quizDataset = __QUIZ_JSON__;

    let slideFlow = [
      { type: 'cover' },
      { type: 'part1_title' }
    ];
    
    quizDataset.filter(q => q.part === 1).forEach(q => {
      slideFlow.push({ type: 'quiz', quizData: q });
    });
    
    slideFlow.push({ type: 'part2_title' });
    
    quizDataset.filter(q => q.part === 2).forEach(q => {
      slideFlow.push({ type: 'quiz', quizData: q });
    });
    
    slideFlow.push({ type: 'outro' });

    let currentSlideIdx = 0;
    let isAnswerRevealed = false;
    let timerInterval = null;
    let timerVal = 10;
    let isTimerRunning = false;
    let soundEnabled = true;

    // Web Audio API Audio Synthesizer
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playTone(freq, type, duration, gainVal = 0.1) {
      if (!soundEnabled) return;
      try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    function playSoundEffect(type) {
      if (!soundEnabled) return;
      if (type === 'click') {
        playTone(600, 'sine', 0.08, 0.08);
      } else if (type === 'reveal') {
        playTone(440, 'triangle', 0.1, 0.15);
        setTimeout(() => playTone(880, 'sine', 0.25, 0.2), 80);
      } else if (type === 'tick') {
        playTone(800, 'square', 0.04, 0.04);
      } else if (type === 'timeover') {
        playTone(300, 'sawtooth', 0.4, 0.2);
      }
    }

    function triggerScreenFlash(type) {
      const flash = document.getElementById('screenFlashOverlay');
      if (!flash) return;

      flash.className = 'screen-flash-overlay';
      void flash.offsetWidth; // Force reflow

      if (type === 'O') {
        flash.classList.add('flash-o');
      } else if (type === 'X') {
        flash.classList.add('flash-x');
      } else if (type === 'timeover') {
        flash.classList.add('flash-timeover');
      } else if (type === 'tick') {
        flash.classList.add('flash-tick');
      } else if (type === 'tick-warning') {
        flash.classList.add('flash-tick-warning');
      } else if (type === 'tick-urgent') {
        flash.classList.add('flash-tick-urgent');
      }

      if (type !== 'timeover') {
        setTimeout(() => {
          flash.className = 'screen-flash-overlay';
        }, 350);
      }
    }

    function clearScreenFlash() {
      const flash = document.getElementById('screenFlashOverlay');
      if (flash) flash.className = 'screen-flash-overlay';
      const banner = document.getElementById('timeoverBanner');
      if (banner) banner.classList.remove('active');
    }

    function toggleSound() {
      soundEnabled = !soundEnabled;
      document.getElementById('soundLabel').innerText = soundEnabled ? '소리 켜짐' : '음소거';
      document.getElementById('btnSound').classList.toggle('active', soundEnabled);
      syncRemoteState();
    }

    function renderSlide() {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('answerPanel').classList.remove('active');
      isAnswerRevealed = false;
      clearScreenFlash();
      stopTimer();

      const current = slideFlow[currentSlideIdx];
      const btnReveal = document.getElementById('btnReveal');

      if (current.type === 'cover') {
        document.getElementById('screenCover').classList.add('active');
        btnReveal.style.display = 'none';
      } else if (current.type === 'part1_title') {
        document.getElementById('screenPart1').classList.add('active');
        btnReveal.style.display = 'none';
      } else if (current.type === 'part2_title') {
        document.getElementById('screenPart2').classList.add('active');
        btnReveal.style.display = 'none';
      } else if (current.type === 'outro') {
        document.getElementById('screenOutro').classList.add('active');
        btnReveal.style.display = 'none';
      } else if (current.type === 'quiz') {
        document.getElementById('screenQuiz').classList.add('active');
        btnReveal.style.display = 'flex';
        btnReveal.innerText = '💡 정답 및 해설 보기 (Space)';

        const q = current.quizData;
        document.getElementById('qNumBadge').innerText = q.q_num_display;
        document.getElementById('qCatBadge').innerText = q.category;
        
        const diffBadge = document.getElementById('qDiffBadge');
        diffBadge.innerText = '난이도: ' + q.difficulty;
        diffBadge.className = 'badge badge-diff-' + q.difficulty;
        
        document.getElementById('qRefBadge').innerText = q.reference;
        document.getElementById('questionText').innerText = q.question;

        const btnO = document.getElementById('btnChoiceO');
        const btnX = document.getElementById('btnChoiceX');
        btnO.className = 'ox-btn ox-btn-o';
        btnX.className = 'ox-btn ox-btn-x';

        const stamp = document.getElementById('ansStamp');
        const valText = document.getElementById('ansValText');
        stamp.innerText = q.answer;
        if (q.answer === 'O') {
          stamp.className = 'answer-stamp stamp-o';
          valText.innerText = 'O (참)';
          valText.style.color = 'var(--color-o)';
        } else {
          stamp.className = 'answer-stamp stamp-x';
          valText.innerText = 'X (거짓)';
          valText.style.color = 'var(--color-x)';
        }

        document.getElementById('explanationText').innerHTML = '<strong>💡 해설 및 참고</strong>' + q.explanation;
        
        resetTimer(10);
      }

      document.getElementById('btnPrev').disabled = (currentSlideIdx === 0);
      document.getElementById('btnNext').disabled = (currentSlideIdx === slideFlow.length - 1);

      const totalQuizCount = 45;
      let quizNumber = 0;
      if (current.type === 'quiz') {
        quizNumber = current.quizData.id;
      } else if (current.type === 'outro') {
        quizNumber = 45;
      }
      document.getElementById('progressText').innerText = `${quizNumber} / ${totalQuizCount}`;
      document.getElementById('progressBar').style.width = `${(quizNumber / totalQuizCount) * 100}%`;

      updateGridHighlight();
      syncRemoteState();
    }

    function toggleAnswer() {
      const current = slideFlow[currentSlideIdx];
      if (current.type !== 'quiz') return;

      const panel = document.getElementById('answerPanel');
      const btnReveal = document.getElementById('btnReveal');

      if (!isAnswerRevealed) {
        clearScreenFlash();
        panel.classList.add('active');
        isAnswerRevealed = true;
        btnReveal.innerText = '▶ 다음 문제로 이동 (Space)';
        playSoundEffect('reveal');
        
        const q = current.quizData;
        triggerScreenFlash(q.answer);

        if (q.answer === 'O') {
          document.getElementById('btnChoiceO').classList.add('selected-o');
        } else {
          document.getElementById('btnChoiceX').classList.add('selected-x');
        }
      } else {
        nextSlide();
      }
      syncRemoteState();
    }

    function selectChoice(choice) {
      playSoundEffect('click');
      const btnO = document.getElementById('btnChoiceO');
      const btnX = document.getElementById('btnChoiceX');
      if (choice === 'O') {
        btnO.classList.add('selected-o');
        btnX.classList.remove('selected-x');
      } else {
        btnX.classList.add('selected-x');
        btnO.classList.remove('selected-o');
      }
    }

    function startQuiz() {
      currentSlideIdx = 1;
      renderSlide();
      playSoundEffect('click');
    }

    function nextSlide() {
      if (currentSlideIdx < slideFlow.length - 1) {
        currentSlideIdx++;
        renderSlide();
        playSoundEffect('click');
      }
    }

    function prevSlide() {
      if (currentSlideIdx > 0) {
        currentSlideIdx--;
        renderSlide();
        playSoundEffect('click');
      }
    }

    function resetQuiz() {
      currentSlideIdx = 0;
      renderSlide();
    }

    function updateTimerUI() {
      document.getElementById('timerText').innerText = timerVal;
      const totalDash = 113; // 2 * PI * 18
      const offset = totalDash - (timerVal / 10) * totalDash;
      const circle = document.getElementById('timerSvgProgress');
      const wrapper = document.getElementById('timerWrapper');
      
      if (circle) {
        circle.style.strokeDashoffset = offset;
      }

      if (wrapper) {
        if (timerVal <= 3 && timerVal > 0) {
          wrapper.classList.add('urgent');
        } else {
          wrapper.classList.remove('urgent');
        }
      }
    }

    function resetTimer(seconds = 10) {
      stopTimer();
      clearScreenFlash();
      timerVal = seconds;
      updateTimerUI();
    }

    function toggleTimer() {
      if (isTimerRunning) {
        stopTimer();
      } else {
        startTimer();
      }
    }

    function startTimer() {
      if (isTimerRunning) return;
      clearScreenFlash();
      isTimerRunning = true;
      timerInterval = setInterval(() => {
        if (timerVal > 0) {
          timerVal--;
          updateTimerUI();
          
          if (timerVal >= 6) {
            triggerScreenFlash('tick');
          } else if (timerVal >= 4) {
            triggerScreenFlash('tick-warning');
          } else if (timerVal >= 1) {
            triggerScreenFlash('tick-urgent');
            playSoundEffect('tick');
          }

        } else {
          stopTimer();
          playSoundEffect('timeover');
          triggerScreenFlash('timeover');
          const banner = document.getElementById('timeoverBanner');
          if (banner) banner.classList.add('active');
        }
      }, 1000);
    }

    function stopTimer() {
      isTimerRunning = false;
      if (timerInterval) clearInterval(timerInterval);
    }

    function toggleDrawer() {
      const overlay = document.getElementById('drawerOverlay');
      overlay.classList.toggle('active');
      playSoundEffect('click');
    }

    function buildDrawerGrid() {
      const grid = document.getElementById('slideGrid');
      grid.innerHTML = '';
      
      slideFlow.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'grid-item';
        
        if (item.type === 'cover') {
          div.innerHTML = '<span class="grid-item-num">표지</span><span class="grid-item-badge">시작</span>';
        } else if (item.type === 'part1_title') {
          div.innerHTML = '<span class="grid-item-num">PART 1</span><span class="grid-item-badge">본 퀴즈</span>';
        } else if (item.type === 'part2_title') {
          div.innerHTML = '<span class="grid-item-num">PART 2</span><span class="grid-item-badge">여분</span>';
        } else if (item.type === 'outro') {
          div.innerHTML = '<span class="grid-item-num">종료</span><span class="grid-item-badge">엔딩</span>';
        } else if (item.type === 'quiz') {
          const q = item.quizData;
          const isPart2 = (q.part === 2);
          const numStr = isPart2 ? `여분 ${q.part_q_num}` : `Q${q.part_q_num}`;
          div.innerHTML = `<span class="grid-item-num">${numStr}</span><span class="grid-item-badge">${q.category}</span>`;
        }

        div.onclick = () => {
          currentSlideIdx = idx;
          renderSlide();
          toggleDrawer();
        };

        grid.appendChild(div);
      });
    }

    function updateGridHighlight() {
      const items = document.querySelectorAll('.grid-item');
      items.forEach((item, idx) => {
        item.classList.toggle('active', idx === currentSlideIdx);
      });
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }

    /* WEBRTC / BROADCAST REMOTE CONTROL ENGINE */
    let peer = null;
    let remoteConn = null;
    let peerId = 'jiguchon-ox-' + Math.floor(1000 + Math.random() * 9000);
    const broadcastChannel = new BroadcastChannel('jiguchon_ox_remote');

    const urlParams = new URLSearchParams(window.location.search);
    const isRemoteMode = (urlParams.get('mode') === 'remote');
    const targetPeerId = urlParams.get('peerId');

    function initRemoteSystem() {
      if (isRemoteMode) {
        document.getElementById('mainHostView').style.display = 'none';
        document.getElementById('footerHostView').style.display = 'none';
        document.querySelector('header').style.display = 'none';
        document.getElementById('remoteViewScreen').classList.add('active');

        if (targetPeerId) {
          try {
            peer = new Peer();
            peer.on('open', () => {
              remoteConn = peer.connect(targetPeerId);
              remoteConn.on('open', () => {
                document.getElementById('remoteConnectStatus').innerText = '🟢 연결됨';
                document.getElementById('remoteConnectStatus').className = 'status-badge connected';
              });
              remoteConn.on('data', (data) => handleHostStateUpdate(data));
            });
          } catch(e) {}
        }

        broadcastChannel.onmessage = (e) => {
          if (e.data.type === 'stateUpdate') handleHostStateUpdate(e.data.state);
        };
      } else {
        generateQrCode(peerId);
        try {
          peer = new Peer(peerId);
          peer.on('open', (id) => {
            peerId = id;
            generateQrCode(id);
          });
          peer.on('connection', (conn) => {
            remoteConn = conn;
            document.getElementById('remoteStatusBadge').innerText = '🟢 스마트폰 연결 완료!';
            document.getElementById('remoteStatusBadge').className = 'status-badge connected';
            document.getElementById('btnRemoteQr').classList.add('active');
            
            conn.on('data', (cmd) => handleRemoteCommand(cmd));
            syncRemoteState();
          });
        } catch(e) {}

        broadcastChannel.onmessage = (e) => {
          if (e.data.type === 'remoteCmd') handleRemoteCommand(e.data.cmd);
        };
      }
    }

    function generateQrCode(id) {
      const qrDiv = document.getElementById('qrcode');
      qrDiv.innerHTML = '';
      
      let remoteUrl = `${window.location.origin}${window.location.pathname}?mode=remote&peerId=${id}`;
      if (window.location.protocol === 'file:') {
        remoteUrl = `http://192.168.0.129:8000/ox_quiz.html?mode=remote&peerId=${id}`;
      }

      new QRCode(qrDiv, {
        text: remoteUrl,
        width: 190,
        height: 190,
        colorDark : "#0f172a",
        colorLight : "#ffffff"
      });
    }

    function copyRemoteUrl() {
      let remoteUrl = `${window.location.origin}${window.location.pathname}?mode=remote&peerId=${peerId}`;
      if (window.location.protocol === 'file:') {
        remoteUrl = `http://192.168.0.129:8000/ox_quiz.html?mode=remote&peerId=${peerId}`;
      }
      navigator.clipboard.writeText(remoteUrl).then(() => {
        alert('스마트폰 리모컨 주소가 복사되었습니다!:\\n' + remoteUrl);
      }).catch(e => alert(remoteUrl));
    }

    function openQrModal() {
      document.getElementById('qrModalOverlay').classList.add('active');
      generateQrCode(peerId);
      playSoundEffect('click');
    }

    function closeQrModal() {
      document.getElementById('qrModalOverlay').classList.remove('active');
    }

    function syncRemoteState() {
      const current = slideFlow[currentSlideIdx];
      let stateData = {
        slideIdx: currentSlideIdx,
        type: current.type,
        isAnswerRevealed: isAnswerRevealed,
        soundEnabled: soundEnabled
      };

      if (current.type === 'quiz') {
        const q = current.quizData;
        stateData.qNum = q.q_num_display;
        stateData.category = q.category;
        stateData.difficulty = q.difficulty;
        stateData.question = q.question;
        stateData.answer = q.answer;
        stateData.explanation = q.explanation;
      } else {
        stateData.qNum = current.type.toUpperCase();
        stateData.category = '';
        stateData.difficulty = '';
        stateData.question = (current.type === 'cover') ? 'O/X 퀴즈 대회 표지' : '안내 슬라이드';
        stateData.answer = '-';
        stateData.explanation = '';
      }

      if (remoteConn && remoteConn.open) {
        remoteConn.send(stateData);
      }
      broadcastChannel.postMessage({ type: 'stateUpdate', state: stateData });
    }

    function sendRemoteCmd(cmd) {
      if (remoteConn && remoteConn.open) {
        remoteConn.send({ cmd: cmd });
      }
      broadcastChannel.postMessage({ type: 'remoteCmd', cmd: cmd });
    }

    function handleRemoteCommand(cmd) {
      const action = typeof cmd === 'object' ? cmd.cmd : cmd;
      if (action === 'toggleAnswer') toggleAnswer();
      else if (action === 'nextSlide') nextSlide();
      else if (action === 'prevSlide') prevSlide();
      else if (action === 'toggleTimer') toggleTimer();
      else if (action === 'resetTimer') resetTimer(10);
      else if (action === 'toggleSound') toggleSound();
    }

    function handleHostStateUpdate(state) {
      document.getElementById('rmQNum').innerText = state.qNum || 'Q00';
      document.getElementById('rmQCat').innerText = `[${state.category || '안내'}] 난이도:${state.difficulty || '-'}`;
      document.getElementById('rmQText').innerText = state.question || '';
      
      const hintBox = document.getElementById('rmHintBox');
      const expSpan = document.getElementById('rmExplanation');
      
      if (state.type === 'quiz') {
        hintBox.style.display = 'block';
        hintBox.querySelector('strong').innerText = `🔑 진행자 전용 정답 힌트: [ ${state.answer} ]`;
        expSpan.innerText = state.explanation;
      } else {
        hintBox.style.display = 'none';
      }
    }

    document.addEventListener('keydown', (e) => {
      if (isRemoteMode) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        const current = slideFlow[currentSlideIdx];
        if (current.type === 'quiz') {
          toggleAnswer();
        } else {
          nextSlide();
        }
      } else if (e.code === 'ArrowRight' || e.code === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.code === 'ArrowLeft' || e.code === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.code === 'KeyO') {
        selectChoice('O');
      } else if (e.code === 'KeyX') {
        selectChoice('X');
      } else if (e.code === 'KeyT') {
        toggleTimer();
      } else if (e.code === 'KeyM') {
        toggleSound();
      } else if (e.code === 'KeyF') {
        toggleFullscreen();
      } else if (e.code === 'KeyG') {
        toggleDrawer();
      }
    });

    window.addEventListener('DOMContentLoaded', () => {
      buildDrawerGrid();
      renderSlide();
      initRemoteSystem();
    });
  </script>
</body>
</html>
"""

final_html = html_template.replace("__QUIZ_JSON__", quiz_json_str)

with open('ox_quiz.html', 'w', encoding='utf-8') as f:
    f.write(final_html)

print("Generated ox_quiz.html with 1-second pulse tick flash effects!")
