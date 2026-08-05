import http.server
import socketserver
import socket
import webbrowser

PORT = 8000

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

local_ip = get_local_ip()
url = f"http://{local_ip}:{PORT}/ox_quiz.html"

print("=" * 60)
print(" 🚀 지구촌교회 중등부 O/X 퀴즈 웹 서버가 시작되었습니다!")
print(f" 💻 노트북 브라우저 접속 주소: {url}")
print(f" 📱 스마트폰을 같은 Wi-Fi에 연결 후 QR 코드를 스캔하세요.")
print("=" * 60)

webbrowser.open(url)

Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n서버가 종료되었습니다.")
