import sys
import os

# Ensure 'src' directory is in Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from server import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    print(f"=================================================")
    print(f" Employee Management System (Python Flask)      ")
    print(f" URL: http://localhost:{port}                    ")
    print(f"=================================================")
    app.run(host='0.0.0.0', port=port, debug=True)
