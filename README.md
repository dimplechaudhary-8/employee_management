# StaffPulse — Employee Management System

StaffPulse is a responsive, web-based Employee Management System built to manage corporate employee directories, contact information, and monthly salary reports. It features multi-user authentication (Login/Signup), session management, per-user isolated employee directories, dark/light theme switching, and local storage powered by a Python / Flask backend writing directly to local JSON database files.

---

## Features

*   **Multi-User Authentication**:
    *   **User Registration & Login**: Tabbed authentication overlay allowing users to create accounts with hashed passwords (`werkzeug.security`).
    *   **Per-User Data Isolation**: Each user gets their own private employee directory that is completely isolated from other users.
    *   **Session Persistence**: Maintains user session states across page reloads.
*   **Responsive Dashboard Metrics**: Real-time stats counting total staff count, total monthly budget, average baseline salary, and unique departments for the logged-in user.
*   **Complete Scoped CRUD Capabilities**:
    *   **Add Employee**: Structured form capturing personal information (Name, Email, Role, Department) and compensation details.
    *   **Update details**: Inline editing mode supporting dynamic net pay estimations.
    *   **Delete employee**: Secured verification modal preventing accidental deletions.
*   **Instant Search & Filters**: Search directory on-the-fly by Name, ID, Department, or Role (with input debouncing) or filter entries by specific departments.
*   **Auto-Recovery Database**: Fault-tolerant backend utility that auto-initializes the directory structures and JSON schemas if corrupt or missing.
*   **Rich Aesthetic System**: Support for light and dark theme mode preferences with smooth HSL colors, card shadows, responsive layouts, and toast feedback alerts.

---

## Folder Structure

```
employee-management-system/
├── database/
│   ├── users.json              # Local JSON storage for user accounts & password hashes
│   └── employees.json          # Local database storage for isolated employee records
├── public/                     # Static client files
│   ├── index.html              # Main dashboard & Auth modal overlay
│   ├── style.css               # Styling variables, layouts, theme & auth components
│   └── app.js                  # Auth state checks, fetch calls, DOM handlers
├── src/                        # Flask API Backend files
│   ├── utils/
│   │   └── db.py               # Safe filesystem JSON read/write utilities
│   └── server.py               # Flask server & Auth/Scoped CRUD API endpoints
├── app.py                      # Root entry point forwarding to src/server.py
├── requirements.txt            # Project Python dependencies
└── README.md                   # Documentation file (this file)
```

---

## API Endpoints

### Authentication Routes
* `GET /api/auth/me` — Checks session state and returns active user profile.
* `POST /api/auth/signup` — Registers a new user (`{ username, email, password }`).
* `POST /api/auth/login` — Authenticates user credentials (`{ email, password }`).
* `POST /api/auth/logout` — Terminates active session.

### Scoped Employee Directory Routes (Requires Session)
* `GET /api/employees` — Returns logged-in user's employees (supports `?search=` query).
* `GET /api/employees/<id>` — Returns specific employee detail if owned by user.
* `POST /api/employees` — Creates new employee tied to `user_id`.
* `PUT /api/employees/<id>` — Updates employee details if owned by user.
* `DELETE /api/employees/<id>` — Removes employee record if owned by user.

---

## Prerequisites

Ensure you have the following installed on your machine:
*   [Python 3.x](https://www.python.org/) (Version 3.10 or above is recommended)
*   `pip` (installed automatically with Python)

---

## Installation & Setup

1.  **Install dependencies**:
    From the project root directory, run the command to install required Flask dependencies:
    ```bash
    py -m pip install -r requirements.txt
    ```

2.  **Start the server**:
    Launch the application locally by running:
    ```bash
    py app.py
    ```
    *or*
    ```bash
    py src/server.py
    ```

3.  **Access the Dashboard**:
    Open your browser and navigate to:
    [http://localhost:3000](http://localhost:3000)
