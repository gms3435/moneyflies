"""
MoneyFlies - Dedicated Personal Finance System
Python Backend Server (Zero external dependencies)
"""

import http.server
import socketserver
import json
import os
import sys
import urllib.parse

# Set stdout/stderr encoding for Windows console compatibility
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

PORT = 8080
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "moneyflies_db.json")

# Default initial finance state matching MoneyFlies schema
DEFAULT_FINANCE_STATE = {
    "version": "moneyflies-v1",
    "updatedAt": "",
    "security": {
        "enabled": True,
        "password": "admin"
    },
    "money": {
        "expenses": [],
        "incomes": [],
        "fixedExpenses": [],
        "creditCards": [
            {
                "id": "default",
                "name": "Cartão Principal",
                "limit": 3000,
                "closingDay": 5,
                "dueDay": 12
            }
        ],
        "categories": ["Alimentação", "Mercado", "Moradia", "Transporte", "Saúde", "Lazer", "Ensino", "Assinaturas", "Outros"]
    },
    "cryptoFutures": {
        "initialBalance": 60.0,
        "currency": "BRL",
        "activeTrade": None,
        "history": []
    }
}

def load_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "cryptoFutures" not in data:
                    data["cryptoFutures"] = {
                        "initialBalance": 60.0,
                        "currency": "BRL",
                        "activeTrade": None,
                        "history": []
                    }
                return data
        except Exception as e:
            print(f"[MoneyFlies] Erro ao ler {DB_FILE}: {e}")
    return DEFAULT_FINANCE_STATE

def save_db(data):
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"[MoneyFlies] Erro ao salvar {DB_FILE}: {e}")
        return False

class MoneyFliesRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "OK")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        
        # Route default to index.html
        if parsed.path == "/":
            self.path = "/index.html"
            return super().do_GET()
            
        if parsed.path == "/api/data":
            data = load_db()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
            return
            
        if parsed.path == "/api/export":
            data = load_db()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Disposition", "attachment; filename=moneyflies_finance_backup.json")
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8'))
            return

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        if parsed.path == "/api/data":
            try:
                payload = json.loads(post_data.decode('utf-8'))
                save_db(payload)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
            return

        if parsed.path == "/api/import-timeflies":
            try:
                tf_data = json.loads(post_data.decode('utf-8'))
                money_data = None
                
                if isinstance(tf_data, dict):
                    if "payload" in tf_data and isinstance(tf_data["payload"], dict) and "money" in tf_data["payload"]:
                        money_data = tf_data["payload"]["money"]
                    elif "money" in tf_data:
                        money_data = tf_data["money"]
                    elif "expenses" in tf_data or "incomes" in tf_data:
                        money_data = tf_data

                if money_data:
                    current_db = load_db()
                    current_db["money"] = money_data
                    current_db["updatedAt"] = tf_data.get("updatedAt", "")
                    save_db(current_db)
                    
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "success", "data": current_db}).encode('utf-8'))
                else:
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "error", "message": "Nenhum módulo de finanças (money) encontrado no arquivo."}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
            return

        self.send_response(444)
        self.end_headers()

def run_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MoneyFliesRequestHandler) as httpd:
        print(f"==================================================")
        print(f"[MoneyFlies] Servidor Financeiro em Execucao")
        print(f"Acesse: http://localhost:{PORT}")
        print(f"==================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[MoneyFlies] Servidor finalizado.")

if __name__ == "__main__":
    run_server()
