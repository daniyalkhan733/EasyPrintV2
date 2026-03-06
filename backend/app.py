from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from werkzeug.utils import secure_filename
from PIL import Image
from docx import Document as DocxDocument
from PyPDF2 import PdfMerger, PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import time
import random
import uuid

app = Flask(__name__)

# CORS Configuration - Allow specific origins with credentials
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    },
    r"/pfp/*": {"origins": "*"},
    r"/processed/*": {"origins": "*"}
})

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(APP_ROOT, 'uploads')
PROCESSED_FOLDER = os.path.join(APP_ROOT, 'processed')
DB_FILE = os.path.join(APP_ROOT, 'db.json')
USERS_FILE = os.path.join(APP_ROOT, 'users.json')
SHOPS_FILE = os.path.join(APP_ROOT, 'shops.json')
WALLETS_FILE = os.path.join(APP_ROOT, 'wallets.json')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)
PFP_FOLDER = os.path.join(APP_ROOT, 'pfp')
os.makedirs(PFP_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER
app.config['PFP_FOLDER'] = PFP_FOLDER

# ============== DB Helpers ==============
def read_json_file(filepath):
    if not os.path.exists(filepath):
        return {}
    with open(filepath, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def write_json_file(filepath, data):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)

def read_db():
    return read_json_file(DB_FILE)

def write_db(data):
    write_json_file(DB_FILE, data)

def read_users():
    return read_json_file(USERS_FILE)

def write_users(data):
    write_json_file(USERS_FILE, data)

def read_shops():
    return read_json_file(SHOPS_FILE)

def write_shops(data):
    write_json_file(SHOPS_FILE, data)

def read_wallets():
    return read_json_file(WALLETS_FILE)

def write_wallets(data):
    write_json_file(WALLETS_FILE, data)

# ============== Auth Endpoints ==============
@app.route('/api/student/register', methods=['POST'])
def student_register():
    data = request.get_json()
    users = read_users()
    
    username = data.get('username')
    if username in [u['username'] for u in users.values()]:
        return jsonify({"success": False, "error": "Username already exists"}), 409

    user_id = str(uuid.uuid4())
    users[user_id] = {
        "user_id": user_id,
        "username": username,
        "password": data.get('password'), # In a real app, hash this!
        "role": "student"
    }
    write_users(users)

    # Initialize wallet
    wallets = read_wallets()
    wallets[user_id] = {"balance": random.randint(50, 200)} # Random EP-Coins
    write_wallets(wallets)

    return jsonify({"success": True, "user_id": user_id}), 201

@app.route('/api/student/login', methods=['POST'])
def student_login():
    data = request.get_json()
    users = read_users()
    
    username = data.get('username')
    password = data.get('password')

    for user_id, user in users.items():
        if user['role'] == 'student' and user['username'] == username and user['password'] == password:
            return jsonify({"success": True, "user_id": user_id, "username": user['username']}), 200
    
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

@app.route('/api/shop/register', methods=['POST'])
def shop_register():
    if 'profile_photo' not in request.files:
        return jsonify({"success": False, "error": "No profile photo uploaded"}), 400

    data = request.form
    shops = read_shops()
    
    username = data.get('username')
    if username in [s['username'] for s in shops.values()]:
        return jsonify({"success": False, "error": "Username already exists"}), 409

    photo = request.files['profile_photo']
    photo_filename = ""
    if photo:
        photo_filename = secure_filename(f"{username}_{photo.filename}")
        photo.save(os.path.join(app.config['PFP_FOLDER'], photo_filename))

    shop_id = str(uuid.uuid4())
    shops[shop_id] = {
        "shop_id": shop_id,
        "shop_name": data.get('shop_name'),
        "username": username,
        "password": data.get('password'), # Hash this!
        "location": data.get('location'),
        "profile_photo": photo_filename,
        "status": "Verification Pending",
        "pricing": { 
            "bw": float(data.get('bw_price', 1)), 
            "color": float(data.get('color_price', 5))
        }
    }
    write_shops(shops)
    return jsonify({"success": True, "shop_id": shop_id}), 201

@app.route('/api/superadmin/login', methods=['POST'])
def superadmin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username == "superadmin" and password == "Admin@123":
        return jsonify({"success": True, "role": "superadmin"}), 200
    
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

@app.route('/api/shop/login', methods=['POST'])
def shop_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    shops = read_shops()
    for shop_id, shop in shops.items():
        if shop['username'] == username and shop['password'] == password:
            if shop['status'] == 'Active':
                return jsonify({"success": True, "role": "shop", "shop_id": shop_id}), 200
            elif shop['status'] == 'Verification Pending':
                return jsonify({"success": False, "error": "Shop not verified"}), 403
            else:
                return jsonify({"success": False, "error": "Account inactive"}), 403

    return jsonify({"success": False, "error": "Invalid credentials"}), 401

@app.route('/api/shop/<shop_id>', methods=['GET'])
def get_shop_info(shop_id):
    shops = read_shops()
    if shop_id in shops:
        shop = shops[shop_id].copy()
        # Don't expose password
        shop.pop('password', None)
        return jsonify(shop), 200
    return jsonify({"error": "Shop not found"}), 404

@app.route('/api/pricing', methods=['GET'])
def get_active_pricing():
    """Get pricing from the first active shop (for now, single shop system)"""
    shops = read_shops()
    for shop_id, shop in shops.items():
        if shop.get('status') == 'Active':
            return jsonify({
                "shop_id": shop_id,
                "shop_name": shop.get('shop_name', 'Shop'),
                "pricing": shop.get('pricing', {"bw": 1, "color": 5})
            }), 200
    # Default pricing if no active shop
    return jsonify({
        "shop_id": None,
        "shop_name": "Default",
        "pricing": {"bw": 1, "color": 5}
    }), 200

# ============== Wallet Endpoints ==============
@app.route('/api/wallet/<user_id>', methods=['GET'])
def get_wallet(user_id):
    wallets = read_wallets()
    if user_id in wallets:
        return jsonify(wallets[user_id]), 200
    return jsonify({"error": "Wallet not found"}), 404

# ============== Order Endpoints ==============
@app.route('/api/orders/create', methods=['POST'])
def create_order():
    if 'files' not in request.files:
        return jsonify({"error": "No files part"}), 400
    
    files = request.files.getlist('files')
    config_str = request.form.get('config')
    
    # Legacy guest flow
    student_name = request.form.get('studentName')
    session_id = request.form.get('sessionId')

    # New registered user flow
    user_id = request.form.get('userId')

    if not config_str:
        return jsonify({"error": "No config part"}), 400
    
    if not (student_name and session_id) and not user_id:
        return jsonify({"error": "Missing user identification"}), 400

    config = json.loads(config_str)
    order_id = "order_" + str(int(time.time()))

    # --- Wallet & Cost Calculation ---
    if user_id:
        # Get active shop pricing
        shops = read_shops()
        shop_pricing = {"bw": 1, "color": 5}  # Default
        for shop in shops.values():
            if shop.get('status') == 'Active':
                shop_pricing = shop.get('pricing', shop_pricing)
                break
        
        total_cost = 0
        for file_config in config:
            # Use pre-calculated cost from frontend if available
            if 'estimatedCost' in file_config:
                total_cost += file_config['estimatedCost']
            else:
                # Fallback: calculate based on bwPages and colorPagesCount
                bw_pages = file_config.get('bwPages', 0)
                color_pages = file_config.get('colorPagesCount', 0)
                copies = file_config.get('copies', 1)
                
                # If new format not available, use old calculation
                if bw_pages == 0 and color_pages == 0:
                    page_count = file_config.get('pageCount', 0)
                    total_cost += page_count * shop_pricing['bw'] * copies
                else:
                    total_cost += (bw_pages * shop_pricing['bw']) + (color_pages * shop_pricing['color'])

        wallets = read_wallets()
        current_balance = wallets.get(user_id, {}).get('balance', 0)
        
        if current_balance < total_cost:
            return jsonify({
                "error": f"Insufficient EP-Coin balance. Required: {total_cost}, Available: {current_balance}"
            }), 402
        
        wallets[user_id]['balance'] = current_balance - total_cost
        write_wallets(wallets)

    # --- Simple File Processing: Save each file as PDF ---
    saved_files = []
    for idx, file in enumerate(files):
        if file.filename == '':
            continue
        
        original_filename = secure_filename(file.filename)
        file_ext = os.path.splitext(original_filename)[1].lower()
        pdf_filename = f"{order_id}_file{idx+1}.pdf"
        pdf_path = os.path.join(app.config['PROCESSED_FOLDER'], pdf_filename)
        
        if file_ext in ['.png', '.jpg', '.jpeg']:
            # Save image as PDF
            temp_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
            file.save(temp_path)
            img = Image.open(temp_path)
            img.convert('RGB').save(pdf_path)
            os.remove(temp_path)
        elif file_ext == '.pdf':
            # Save PDF directly
            file.save(pdf_path)
        elif file_ext == '.docx':
            # Simple placeholder for DOCX
            temp_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
            file.save(temp_path)
            c = canvas.Canvas(pdf_path, pagesize=letter)
            c.drawString(100, 750, f"Document: {original_filename}")
            c.save()
            os.remove(temp_path)
        else:
            # Unsupported format - skip
            continue
            
        saved_files.append({
            "pdf_filename": pdf_filename,
            "original_name": original_filename,
            "config": config[idx] if idx < len(config) else {}
        })

    # --- Save Order ---
    orders = read_db()
    order_data = {
        "order_id": order_id,
        "files": saved_files,
        "status": "Pending",
        "order_time": time.time()
    }
    if user_id:
        users = read_users()
        order_data["user_id"] = user_id
        order_data["student_name"] = users.get(user_id, {}).get('username', 'N/A')
    else:
        order_data["student_name"] = student_name
        order_data["session_id"] = session_id

    orders[order_id] = order_data
    write_db(orders)

    return jsonify({"message": "Order created successfully", "order_id": order_id}), 200

@app.route('/api/orders/shop-view', methods=['GET'])
def shop_view():
    orders = read_db()
    return jsonify(list(orders.values())), 200

@app.route('/api/orders/<order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    status_data = request.get_json()
    if not status_data or 'status' not in status_data:
        return jsonify({"error": "Missing status"}), 400

    new_status = status_data['status']
    orders = read_db()
    if order_id in orders:
        orders[order_id]['status'] = new_status
        write_db(orders)
        return jsonify({"message": "Status updated successfully"}), 200
    return jsonify({"error": "Order not found"}), 404

@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    orders = read_db()
    if order_id in orders:
        return jsonify(orders[order_id]), 200
    return jsonify({"error": "Order not found"}), 404

@app.route('/api/orders/user/<session_id>', methods=['GET'])
def get_user_orders(session_id):
    orders = read_db()
    # This now supports both registered user_id and guest session_id
    user_orders = [
        order for order in orders.values() 
        if order.get('session_id') == session_id or order.get('user_id') == session_id
    ]
    return jsonify(user_orders), 200

# ============== Admin Endpoints ==============
@app.route('/api/admin/shops', methods=['GET'])
def get_all_shops():
    # A simple security check - in real life, use a proper auth token system
    auth_header = request.headers.get('Authorization')
    if auth_header != "superadmin:Admin@123":
        return jsonify({"error": "Unauthorized"}), 401
    
    shops = read_shops()
    return jsonify(list(shops.values())), 200

@app.route('/api/admin/shops/<shop_id>/verify', methods=['PUT'])
def verify_shop(shop_id):
    auth_header = request.headers.get('Authorization')
    if auth_header != "superadmin:Admin@123":
        return jsonify({"error": "Unauthorized"}), 401

    shops = read_shops()
    if shop_id in shops:
        shops[shop_id]['status'] = 'Active'
        write_shops(shops)
        return jsonify({"message": "Shop verified successfully"}), 200
    return jsonify({"error": "Shop not found"}), 404

@app.route('/api/admin/shops/<shop_id>/pricing', methods=['PUT'])
def update_pricing(shop_id):
    auth_header = request.headers.get('Authorization')
    if auth_header != "superadmin:Admin@123": # Should be shop owner or admin
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    shops = read_shops()
    if shop_id in shops:
        shops[shop_id]['pricing'] = data.get('pricing', shops[shop_id]['pricing'])
        write_shops(shops)
        return jsonify({"message": "Pricing updated successfully"}), 200
    return jsonify({"error": "Shop not found"}), 404

@app.route('/api/shop/<shop_id>/pricing', methods=['PUT'])
def update_shop_pricing(shop_id):
    """Allow shop owner to update their own pricing"""
    data = request.get_json()
    shops = read_shops()
    
    if shop_id not in shops:
        return jsonify({"error": "Shop not found"}), 404
    
    pricing = data.get('pricing')
    if not pricing:
        return jsonify({"error": "Missing pricing data"}), 400
    
    shops[shop_id]['pricing'] = {
        "bw": float(pricing.get('bw', shops[shop_id]['pricing']['bw'])),
        "color": float(pricing.get('color', shops[shop_id]['pricing']['color']))
    }
    write_shops(shops)
    return jsonify({"message": "Pricing updated successfully", "pricing": shops[shop_id]['pricing']}), 200

@app.route('/processed/<filename>')
def processed_file(filename):
    return send_from_directory(app.config['PROCESSED_FOLDER'], filename)

@app.route('/pfp/<filename>')
def pfp_file(filename):
    return send_from_directory(app.config['PFP_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
