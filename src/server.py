import os
import re
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, session
from werkzeug.security import generate_password_hash, check_password_hash
from utils.db import read_employees, write_employees, read_users, write_users

app = Flask(__name__, static_folder='../public', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'staffpulse_secure_session_key_998877')

# Helpers
def is_valid_email(email):
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(email_regex, email) is not None

def get_current_user_id():
    return session.get('user_id')

# =============================================================
# AUTHENTICATION ENDPOINTS
# =============================================================

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"authenticated": False}), 200
        
    users = read_users()
    user = next((u for u in users if u['id'] == user_id), None)
    if not user:
        session.clear()
        return jsonify({"authenticated": False}), 200
        
    return jsonify({
        "authenticated": True,
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user['email']
        }
    })

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.json or {}
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not username:
            return jsonify({"error": "Username is required"}), 400
        if not email or not is_valid_email(email):
            return jsonify({"error": "A valid email address is required"}), 400
        if not password or len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400

        users = read_users()
        if any(u['email'].lower() == email for u in users):
            return jsonify({"error": "An account with this email already exists"}), 400

        # Generate User ID
        user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
        password_hash = generate_password_hash(password)

        new_user = {
            "id": user_id,
            "username": username,
            "email": email,
            "passwordHash": password_hash,
            "createdAt": datetime.utcnow().isoformat() + 'Z'
        }

        users.append(new_user)
        write_users(users)

        # Set session
        session['user_id'] = user_id
        session['username'] = username
        session['email'] = email

        return jsonify({
            "message": "Account registered successfully",
            "user": {
                "id": user_id,
                "username": username,
                "email": email
            }
        }), 201
    except Exception as e:
        print(f"Error in signup: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        users = read_users()
        user = next((u for u in users if u['email'].lower() == email), None)

        if not user or not check_password_hash(user['passwordHash'], password):
            return jsonify({"error": "Invalid email or password"}), 401

        # Set session
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['email'] = user['email']

        return jsonify({
            "message": "Logged in successfully",
            "user": {
                "id": user['id'],
                "username": user['username'],
                "email": user['email']
            }
        }), 200
    except Exception as e:
        print(f"Error in login: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

# =============================================================
# SCOPED EMPLOYEE ENDPOINTS (USER-ISOLATED)
# =============================================================

@app.route('/api/employees', methods=['GET'])
def get_all_employees():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Please log in."}), 401
        
    try:
        all_employees = read_employees()
        # Filter employees belonging to the current user
        user_employees = [emp for emp in all_employees if emp.get('user_id') == user_id]
        
        search_query = request.args.get('search', '').strip().lower()
        if search_query:
            filtered = []
            for emp in user_employees:
                if (search_query in emp.get('id', '').lower() or
                    search_query in emp.get('name', '').lower() or
                    search_query in emp.get('department', '').lower() or
                    search_query in emp.get('role', '').lower()):
                    filtered.append(emp)
            return jsonify(filtered)
            
        return jsonify(user_employees)
    except Exception as e:
        print(f"Error in get_all_employees: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/api/employees/<emp_id>', methods=['GET'])
def get_employee_by_id(emp_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Please log in."}), 401

    try:
        all_employees = read_employees()
        employee = next((emp for emp in all_employees if emp['id'] == emp_id and emp.get('user_id') == user_id), None)
        
        if not employee:
            return jsonify({"error": "Employee not found"}), 404
            
        return jsonify(employee)
    except Exception as e:
        print(f"Error in get_employee_by_id: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/api/employees', methods=['POST'])
def add_employee():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Please log in."}), 401

    try:
        data = request.json or {}
        name = data.get('name', '').strip()
        role = data.get('role', '').strip()
        department = data.get('department', '').strip()
        email = data.get('email', '').strip().lower()
        
        if not name or not role or not department or not email:
            return jsonify({"error": "Missing required fields (Name, Role, Department, Email)"}), 400
        if not is_valid_email(email):
            return jsonify({"error": "Invalid email address format"}), 400
            
        all_employees = read_employees()
        user_employees = [emp for emp in all_employees if emp.get('user_id') == user_id]
        
        # Check email uniqueness within user's employees
        if any(emp['email'].lower() == email for emp in user_employees):
            return jsonify({"error": "An employee with this email already exists in your directory"}), 400
            
        # Generate EMP-ID scoped to user
        next_id_num = 1001
        if user_employees:
            id_numbers = []
            for emp in user_employees:
                match = re.match(r'^EMP-(\d+)$', emp['id'])
                if match:
                    id_numbers.append(int(match.group(1)))
            if id_numbers:
                next_id_num = max(id_numbers) + 1
        emp_id = f"EMP-{next_id_num}"
        
        try:
            base_salary = float(data.get('baseSalary', 0))
            bonuses = float(data.get('bonuses', 0))
            deductions = float(data.get('deductions', 0))
        except (ValueError, TypeError):
            base_salary = 0.0
            bonuses = 0.0
            deductions = 0.0
            
        new_employee = {
            "id": emp_id,
            "user_id": user_id,
            "name": name,
            "role": role,
            "department": department,
            "email": email,
            "salary": {
                "baseSalary": max(0.0, base_salary),
                "bonuses": max(0.0, bonuses),
                "deductions": max(0.0, deductions)
            },
            "createdAt": datetime.utcnow().isoformat() + 'Z'
        }
        
        all_employees.append(new_employee)
        write_employees(all_employees)
        
        return jsonify(new_employee), 201
    except Exception as e:
        print(f"Error in add_employee: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/api/employees/<emp_id>', methods=['PUT'])
def update_employee(emp_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Please log in."}), 401

    try:
        data = request.json or {}
        name = data.get('name', '').strip()
        role = data.get('role', '').strip()
        department = data.get('department', '').strip()
        email = data.get('email', '').strip().lower()
        
        if not name or not role or not department or not email:
            return jsonify({"error": "Missing required fields"}), 400
        if not is_valid_email(email):
            return jsonify({"error": "Invalid email address format"}), 400
            
        all_employees = read_employees()
        emp_index = next((idx for idx, emp in enumerate(all_employees) if emp['id'] == emp_id and emp.get('user_id') == user_id), -1)
        
        if emp_index == -1:
            return jsonify({"error": "Employee not found in your directory"}), 404
            
        # Email uniqueness check within user's list
        for idx, emp in enumerate(all_employees):
            if idx != emp_index and emp.get('user_id') == user_id and emp['email'].lower() == email:
                return jsonify({"error": "An employee with this email already exists"}), 400
                
        try:
            base_salary = float(data.get('baseSalary', 0))
            bonuses = float(data.get('bonuses', 0))
            deductions = float(data.get('deductions', 0))
        except (ValueError, TypeError):
            base_salary = 0.0
            bonuses = 0.0
            deductions = 0.0
            
        all_employees[emp_index].update({
            "name": name,
            "role": role,
            "department": department,
            "email": email,
            "salary": {
                "baseSalary": max(0.0, base_salary),
                "bonuses": max(0.0, bonuses),
                "deductions": max(0.0, deductions)
            },
            "updatedAt": datetime.utcnow().isoformat() + 'Z'
        })
        
        write_employees(all_employees)
        return jsonify(all_employees[emp_index])
    except Exception as e:
        print(f"Error in update_employee: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/api/employees/<emp_id>', methods=['DELETE'])
def delete_employee(emp_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Please log in."}), 401

    try:
        all_employees = read_employees()
        filtered = [emp for emp in all_employees if not (emp['id'] == emp_id and emp.get('user_id') == user_id)]
        
        if len(all_employees) == len(filtered):
            return jsonify({"error": "Employee not found in your directory"}), 404
            
        write_employees(filtered)
        return jsonify({"message": f"Employee {emp_id} deleted successfully."})
    except Exception as e:
        print(f"Error in delete_employee: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

# Wildcard catch-all: serves static files or index.html
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    if path.startswith('api/'):
        return jsonify({"error": "Not Found"}), 404
        
    file_path = os.path.join(app.static_folder, path)
    if path and os.path.exists(file_path):
        return send_from_directory(app.static_folder, path)
        
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    print(f"=================================================")
    print(f" Employee Management System (Flask + Auth)       ")
    print(f" URL: http://localhost:{port}                    ")
    print(f"=================================================")
    app.run(host='0.0.0.0', port=port, debug=True)

# commit update for 2026-07-21T11:11:49
