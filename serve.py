#!/usr/bin/env python3
"""
PWABox 本地局域网极速开发服务器（带自动热刷新 Live-Reload）
- 零依赖：纯 Python 标准库，无需 pip 安装任何包
- 双模热刷新：只要文件修改或 AI 生成新小工具，电脑浏览器与手机真机同时自动秒级刷新
- 零代码污染：热重载监听脚本仅在本地服务响应时动态注入，不修改源文件
"""

import sys
import os
import time
import socket
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

# 全局版本号与文件变动监听
server_epoch = int(time.time() * 1000)

# 动态注入的无感微型热重载脚本
RELOAD_SCRIPT = """
<script>
(function() {
  let lastEpoch = null;
  function checkReload() {
    fetch('/__pwabox_heartbeat__?t=' + Date.now())
      .then(r => r.json())
      .then(data => {
        if (lastEpoch === null) {
          lastEpoch = data.epoch;
        } else if (lastEpoch !== data.epoch) {
          console.log('⚡️ [PWABox] 检测到文件改动，正在自动刷新...');
          location.reload();
        }
      })
      .catch(() => {})
      .finally(() => {
        setTimeout(checkReload, 800);
      });
  }
  checkReload();
})();
</script>
</body>
"""

def scan_files_mtime():
    """扫描所有静态资源文件的最新修改时间"""
    max_mtime = 0
    for root, dirs, files in os.walk(BASE_DIR):
        # 忽略隐藏目录
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            if f.endswith(('.html', '.js', '.css', '.json', '.svg')):
                try:
                    fp = os.path.join(root, f)
                    mt = os.path.getmtime(fp)
                    if mt > max_mtime:
                        max_mtime = mt
                except OSError:
                    pass
    return max_mtime

def file_watcher():
    """后台监控线程：一旦文件变化，提升全局版本号"""
    global server_epoch
    last_mtime = scan_files_mtime()
    while True:
        time.sleep(0.5)
        current_mtime = scan_files_mtime()
        if current_mtime > last_mtime:
            last_mtime = current_mtime
            server_epoch = int(time.time() * 1000)

class LiveReloadHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # 只打印错误，保持终端清爽
        if args and str(args[1])[0] in ('4', '5'):
            sys.stderr.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))

    def do_GET(self):
        # 心跳探针：返回当前时间戳版本
        if self.path.startswith('/__pwabox_heartbeat__'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.end_headers()
            self.wfile.write(f'{{"epoch": {server_epoch}}}'.encode('utf-8'))
            return

        # 针对 HTML 请求，动态注入热刷新微脚本
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            index_path = os.path.join(path, 'index.html')
            if os.path.exists(index_path):
                path = index_path

        if os.path.isfile(path) and path.endswith('.html'):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                # 注入脚本到 </body> 前
                if '</body>' in content:
                    content = content.replace('</body>', RELOAD_SCRIPT)
                else:
                    content += RELOAD_SCRIPT

                encoded = content.encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(encoded)))
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(encoded)
                return
            except Exception:
                pass

        # 智能 404 兜底：访问错误路径时，自动返回 404.html 并启动倒计时回首页
        if not os.path.exists(path):
            four_o_four = os.path.join(BASE_DIR, '404.html')
            if os.path.exists(four_o_four):
                try:
                    with open(four_o_four, 'r', encoding='utf-8') as f:
                        content = f.read()
                    encoded = content.encode('utf-8')
                    self.send_response(404)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Content-Length', str(len(encoded)))
                    self.send_header('Cache-Control', 'no-cache')
                    self.end_headers()
                    self.wfile.write(encoded)
                    return
                except Exception:
                    pass

        return super().do_GET()

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
    except Exception:
        try:
            ip = socket.gethostbyname(socket.gethostname())
        except Exception:
            ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def find_available_port(start_port=8000):
    port = start_port
    while port < 65535:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            if sock.connect_ex(('127.0.0.1', port)) != 0:
                return port
            port += 1
    return start_port

def print_banner(local_ip, port):
    local_url = f"http://localhost:{port}"
    network_url = f"http://{local_ip}:{port}"
    
    print("\n" + "═" * 58)
    print("  📦 PWABox 微应用百宝箱 · 本地服务已启动 (支持自动热刷新 ⚡️)")
    print("═" * 58)
    print(f"\n  💻 电脑浏览器访问：")
    print(f"     👉 \033[96m{local_url}\033[0m")
    print(f"\n  📱 手机局域网真机测试（连同 Wi-Fi）：")
    print(f"     👉 \033[92m{network_url}\033[0m")
    print("\n  ⚡️ 无论你自己修改保存、还是 AI 刚刚生成了新代码，")
    print("     电脑和手机都会【瞬间自动刷新】，无需手动按 F5！")
    print("\n  💡 按下 Ctrl + C 可随时退出服务")
    print("═" * 58 + "\n")

def main():
    port = find_available_port(8000)
    local_ip = get_local_ip()

    # 启动后台文件监听线程
    watcher_thread = threading.Thread(target=file_watcher, daemon=True)
    watcher_thread.start()

    server = HTTPServer(('0.0.0.0', port), LiveReloadHandler)
    print_banner(local_ip, port)

    try:
        webbrowser.open(f"http://localhost:{port}")
    except Exception:
        pass

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 本地开发服务已安全退出！")
        sys.exit(0)

if __name__ == '__main__':
    main()
