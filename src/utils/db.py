import os
import json

EMP_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../database/employees.json'))
USER_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../database/users.json'))

def ensure_db_exists():
    """
    Ensures that the database directory and json files exist, initializing with empty arrays if needed.
    """
    try:
        db_dir = os.path.dirname(EMP_DB_PATH)
        if not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            
        if not os.path.exists(EMP_DB_PATH):
            with open(EMP_DB_PATH, 'w', encoding='utf-8') as f:
                json.dump([], f, indent=2)

        if not os.path.exists(USER_DB_PATH):
            with open(USER_DB_PATH, 'w', encoding='utf-8') as f:
                json.dump([], f, indent=2)
    except Exception as e:
        print(f"Error ensuring database files exist: {e}")

# --- EMPLOYEE DATA UTILITIES ---

def read_employees():
    """
    Reads all employees from the JSON database file.
    Returns an empty list if the file is empty, missing, or corrupted.
    """
    ensure_db_exists()
    try:
        if not os.path.exists(EMP_DB_PATH):
            return []
            
        with open(EMP_DB_PATH, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                return []
            return json.loads(content)
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error reading employees database file: {e}")
        return []

def write_employees(employees):
    """
    Writes the employee list back to the JSON database file.
    """
    ensure_db_exists()
    try:
        with open(EMP_DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(employees, f, indent=2, ensure_ascii=False)
        return True
    except IOError as e:
        print(f"Error writing to employees database file: {e}")
        raise RuntimeError("Failed to write employee records.")

# --- USER ACCOUNTS UTILITIES ---

def read_users():
    """
    Reads all registered user accounts from the users JSON file.
    """
    ensure_db_exists()
    try:
        if not os.path.exists(USER_DB_PATH):
            return []
            
        with open(USER_DB_PATH, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                return []
            return json.loads(content)
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error reading users database file: {e}")
        return []

def write_users(users):
    """
    Writes user accounts list to the users JSON file.
    """
    ensure_db_exists()
    try:
        with open(USER_DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
        return True
    except IOError as e:
        print(f"Error writing to users database file: {e}")
        raise RuntimeError("Failed to write user account records.")
