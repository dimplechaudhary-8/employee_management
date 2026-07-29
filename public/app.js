// State variables
let employeesState = [];
let currentUserState = null;
let currentEditingId = null;
let currentDeletingId = null;
let searchDebounceTimeout = null;

// DOM Elements
const themeToggleBtn = document.getElementById('themeToggle');
const addEmployeeBtn = document.getElementById('addEmployeeBtn');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const departmentFilter = document.getElementById('departmentFilter');
const employeesTableBody = document.getElementById('employeesTableBody');
const emptyState = document.getElementById('emptyState');
const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');

// User Header Profile Elements
const userProfileBadge = document.getElementById('userProfileBadge');
const headerUsername = document.getElementById('headerUsername');
const logoutBtn = document.getElementById('logoutBtn');

// Auth Modal Elements
const authModal = document.getElementById('authModal');
const loginTabBtn = document.getElementById('loginTabBtn');
const signupTabBtn = document.getElementById('signupTabBtn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const signupUsername = document.getElementById('signupUsername');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const authErrorAlert = document.getElementById('authErrorAlert');
const authErrorText = document.getElementById('authErrorText');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const signupSubmitBtn = document.getElementById('signupSubmitBtn');

// Stats Elements
const valTotalEmployees = document.getElementById('valTotalEmployees');
const valTotalBudget = document.getElementById('valTotalBudget');
const valAverageSalary = document.getElementById('valAverageSalary');
const valDepartments = document.getElementById('valDepartments');

// Employee Modal Elements
const employeeModal = document.getElementById('employeeModal');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const employeeForm = document.getElementById('employeeForm');
const empIdInput = document.getElementById('empIdInput');
const empName = document.getElementById('empName');
const empEmail = document.getElementById('empEmail');
const empDepartment = document.getElementById('empDepartment');
const empRole = document.getElementById('empRole');
const empBaseSalary = document.getElementById('empBaseSalary');
const empBonuses = document.getElementById('empBonuses');
const empDeductions = document.getElementById('empDeductions');
const netPayPreview = document.getElementById('netPayPreview');
const saveEmployeeBtn = document.getElementById('saveEmployeeBtn');

// Delete Modal Elements
const deleteModal = document.getElementById('deleteModal');
const deleteEmpName = document.getElementById('deleteEmpName');
const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Toast Container
const toastContainer = document.getElementById('toastContainer');

/* -------------------------------------------------------------
 * Initialization & Theme Operations
 * ------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  checkAuthStatus();
});

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

/* -------------------------------------------------------------
 * Auth Operations (Check Session, Login, Signup, Logout)
 * ------------------------------------------------------------- */
async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.authenticated) {
      currentUserState = data.user;
      showAuthenticatedUI(data.user);
      fetchEmployees();
    } else {
      currentUserState = null;
      showUnauthenticatedUI();
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    showUnauthenticatedUI();
  }
}

function showAuthenticatedUI(user) {
  authModal.classList.add('hidden');
  userProfileBadge.classList.remove('hidden');
  headerUsername.innerText = user.username || 'User';
  hideAuthError();
}

function showUnauthenticatedUI() {
  userProfileBadge.classList.add('hidden');
  employeesTableBody.innerHTML = `
    <tr>
      <td colspan="7" class="loading-state">
        <i class="fa-solid fa-lock" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 0.5rem;"></i>
        <p>Please log in or register to view your directory.</p>
      </td>
    </tr>
  `;
  openAuthModal();
}

function openAuthModal() {
  authModal.classList.remove('hidden');
  authModal.setAttribute('aria-hidden', 'false');
  switchAuthTab('login');
}

function switchAuthTab(tab) {
  hideAuthError();
  if (tab === 'login') {
    loginTabBtn.classList.add('active');
    signupTabBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  } else {
    signupTabBtn.classList.add('active');
    loginTabBtn.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

function showAuthError(msg) {
  authErrorText.innerText = msg;
  authErrorAlert.classList.remove('hidden');
}

function hideAuthError() {
  authErrorAlert.classList.add('hidden');
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  hideAuthError();
  
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    showAuthError('Please enter email and password.');
    return;
  }

  setBtnLoading(loginSubmitBtn, true);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    currentUserState = data.user;
    showAuthenticatedUI(data.user);
    showToast(`Welcome back, ${data.user.username}!`, 'success');
    fetchEmployees();
  } catch (err) {
    showAuthError(err.message);
  } finally {
    setBtnLoading(loginSubmitBtn, false);
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  hideAuthError();

  const username = signupUsername.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;

  if (!username || !email || !password) {
    showAuthError('Please fill out all fields.');
    return;
  }

  setBtnLoading(signupSubmitBtn, true);

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    currentUserState = data.user;
    showAuthenticatedUI(data.user);
    showToast(`Account created! Welcome, ${data.user.username}.`, 'success');
    fetchEmployees();
  } catch (err) {
    showAuthError(err.message);
  } finally {
    setBtnLoading(signupSubmitBtn, false);
  }
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentUserState = null;
    employeesState = [];
    updateDashboardStats([]);
    showUnauthenticatedUI();
    showToast('Logged out successfully.', 'info');
  } catch (err) {
    console.error('Logout error:', err);
  }
}

function setBtnLoading(btnEl, isLoading) {
  const textEl = btnEl.querySelector('.btn-text');
  const spinnerEl = btnEl.querySelector('.btn-spinner');
  if (isLoading) {
    textEl?.classList.add('hidden');
    spinnerEl?.classList.remove('hidden');
    btnEl.disabled = true;
  } else {
    textEl?.classList.remove('hidden');
    spinnerEl?.classList.add('hidden');
    btnEl.disabled = false;
  }
}

/* -------------------------------------------------------------
 * Event Listeners Registration
 * ------------------------------------------------------------- */
function setupEventListeners() {
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Auth listeners
  loginTabBtn.addEventListener('click', () => switchAuthTab('login'));
  signupTabBtn.addEventListener('click', () => switchAuthTab('signup'));
  loginForm.addEventListener('submit', handleLoginSubmit);
  signupForm.addEventListener('submit', handleSignupSubmit);
  logoutBtn.addEventListener('click', handleLogout);

  // Modals trigger
  addEmployeeBtn.addEventListener('click', () => openEmployeeModal());
  emptyStateAddBtn.addEventListener('click', () => openEmployeeModal());
  closeModalBtn.addEventListener('click', closeEmployeeModal);
  cancelFormBtn.addEventListener('click', closeEmployeeModal);

  // Delete modal triggers
  closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', deleteEmployee);

  // Employee Form submission & input logic
  employeeForm.addEventListener('submit', handleFormSubmit);
  
  const salaryInputs = [empBaseSalary, empBonuses, empDeductions];
  salaryInputs.forEach(input => {
    input.addEventListener('input', updateNetPayPreview);
  });

  // Search input events
  searchInput.addEventListener('input', handleSearchInput);
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    fetchEmployees();
  });

  // Filter selection
  departmentFilter.addEventListener('change', () => {
    renderEmployeesTable();
  });

  // Background clicks
  window.addEventListener('click', (e) => {
    if (e.target === employeeModal) closeEmployeeModal();
    if (e.target === deleteModal) closeDeleteModal();
  });
}

/* -------------------------------------------------------------
 * API Interactions (Fetch, Create, Update, Delete)
 * ------------------------------------------------------------- */
async function fetchEmployees(searchQuery = '') {
  if (!currentUserState) return;
  
  showTableLoading();
  try {
    const url = searchQuery 
      ? `/api/employees?search=${encodeURIComponent(searchQuery)}`
      : '/api/employees';

    const response = await fetch(url);
    if (response.status === 401) {
      showUnauthenticatedUI();
      return;
    }

    if (!response.ok) {
      throw new Error('Server returned an error while fetching employee records.');
    }
    
    const data = await response.json();
    employeesState = data;
    
    if (!searchQuery) {
      populateDepartmentFilter(data);
    }
    
    updateDashboardStats(data);
    renderEmployeesTable();
  } catch (error) {
    console.error('Error fetching employees:', error);
    showToast('Failed to load employee records.', 'danger');
    employeesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger" style="padding: 3rem;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
          <p>Error connecting to server. Please try again later.</p>
        </td>
      </tr>
    `;
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  const saveBtnText = saveEmployeeBtn.querySelector('.save-btn-text');
  const saveSpinner = saveEmployeeBtn.querySelector('.save-spinner');
  saveBtnText.classList.add('hidden');
  saveSpinner.classList.remove('hidden');
  saveEmployeeBtn.disabled = true;

  const payload = {
    name: empName.value,
    email: empEmail.value,
    department: empDepartment.value,
    role: empRole.value,
    baseSalary: parseFloat(empBaseSalary.value) || 0,
    bonuses: parseFloat(empBonuses.value) || 0,
    deductions: parseFloat(empDeductions.value) || 0
  };

  try {
    const isEdit = !!currentEditingId;
    const url = isEdit ? `/api/employees/${currentEditingId}` : '/api/employees';
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Server request failed.');
    }

    showToast(
      isEdit 
        ? `Employee ${result.name} (${result.id}) has been updated.` 
        : `Employee ${result.name} has been added successfully.`,
      'success'
    );

    closeEmployeeModal();
    fetchEmployees();
  } catch (error) {
    console.error('Error saving employee:', error);
    showToast(error.message || 'Error occurred while saving employee record.', 'danger');
  } finally {
    saveBtnText.classList.remove('hidden');
    saveSpinner.classList.add('hidden');
    saveEmployeeBtn.disabled = false;
  }
}

async function deleteEmployee() {
  if (!currentDeletingId) return;

  try {
    const response = await fetch(`/api/employees/${currentDeletingId}`, {
      method: 'DELETE'
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete record.');
    }

    showToast(result.message || 'Employee deleted successfully.', 'success');
    closeDeleteModal();
    fetchEmployees();
  } catch (error) {
    console.error('Error deleting employee:', error);
    showToast(error.message || 'An error occurred while deleting the record.', 'danger');
  }
}

/* -------------------------------------------------------------
 * UI Rendering Operations
 * ------------------------------------------------------------- */
function renderEmployeesTable() {
  const selectedDept = departmentFilter.value;
  
  let displayedEmployees = employeesState;
  if (selectedDept) {
    displayedEmployees = employeesState.filter(emp => emp.department === selectedDept);
  }

  if (displayedEmployees.length === 0) {
    employeesTableBody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  
  employeesTableBody.innerHTML = displayedEmployees.map(emp => {
    const base = emp.salary.baseSalary;
    const allowances = emp.salary.bonuses;
    const deductions = emp.salary.deductions;
    const netPay = base + allowances - deductions;

    return `
      <tr>
        <td>
          <span class="emp-id-badge">${escapeHTML(emp.id)}</span>
        </td>
        <td>
          <div class="emp-name-wrapper">
            <span class="emp-name">${escapeHTML(emp.name)}</span>
            <span class="emp-email">${escapeHTML(emp.email)}</span>
          </div>
        </td>
        <td>
          <span class="emp-dept-badge">${escapeHTML(emp.department)}</span>
          <span class="emp-role">${escapeHTML(emp.role)}</span>
        </td>
        <td>
          <span class="salary-base">${formatCurrency(base)}</span>
        </td>
        <td>
          <div class="salary-adjust">
            <span class="text-success">+ ${formatCurrency(allowances)}</span><br>
            <span class="text-danger">- ${formatCurrency(deductions)}</span>
          </div>
        </td>
        <td>
          <span class="salary-net ${netPay < 0 ? 'text-danger' : ''}">${formatCurrency(netPay)}</span>
        </td>
        <td class="text-right">
          <div class="action-buttons">
            <button class="btn-edit-action" onclick="triggerEditEmployee('${emp.id}')" title="Edit Employee">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-delete-action" onclick="triggerDeleteEmployee('${emp.id}', '${escapeHTML(emp.name)}')" title="Delete Employee">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateDashboardStats(data) {
  const totalEmployees = data.length;
  
  let totalMonthlyPayroll = 0;
  let activeSalarySum = 0;
  let salariesCount = 0;
  const uniqueDepts = new Set();

  data.forEach(emp => {
    const base = emp.salary.baseSalary || 0;
    const bonuses = emp.salary.bonuses || 0;
    const deductions = emp.salary.deductions || 0;
    const net = base + bonuses - deductions;

    totalMonthlyPayroll += net;
    activeSalarySum += base;
    salariesCount++;
    
    if (emp.department) {
      uniqueDepts.add(emp.department.trim());
    }
  });

  const averageSalary = salariesCount > 0 ? (activeSalarySum / salariesCount) : 0;

  valTotalEmployees.innerText = totalEmployees;
  valTotalBudget.innerText = formatCurrency(totalMonthlyPayroll);
  valAverageSalary.innerText = formatCurrency(averageSalary);
  valDepartments.innerText = uniqueDepts.size;
}

function populateDepartmentFilter(data) {
  const currentSelection = departmentFilter.value;
  const departments = new Set();
  
  data.forEach(emp => {
    if (emp.department) {
      departments.add(emp.department.trim());
    }
  });

  const sortedDepts = Array.from(departments).sort();
  
  departmentFilter.innerHTML = '<option value="">All Departments</option>' + 
    sortedDepts.map(dept => `<option value="${escapeHTML(dept)}">${escapeHTML(dept)}</option>`).join('');

  if (departments.has(currentSelection)) {
    departmentFilter.value = currentSelection;
  }
}

function showTableLoading() {
  emptyState.classList.add('hidden');
  employeesTableBody.innerHTML = `
    <tr>
      <td colspan="7" class="loading-state">
        <div class="spinner"></div>
        <p>Fetching records from server...</p>
      </td>
    </tr>
  `;
}

/* -------------------------------------------------------------
 * Search & Filters Debounce
 * ------------------------------------------------------------- */
function handleSearchInput() {
  const val = searchInput.value;
  
  if (val.length > 0) {
    clearSearchBtn.style.display = 'block';
  } else {
    clearSearchBtn.style.display = 'none';
  }

  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    fetchEmployees(val);
  }, 300);
}

/* -------------------------------------------------------------
 * Modals Open/Close/Prefill Actions
 * ------------------------------------------------------------- */
function openEmployeeModal(employee = null) {
  if (!currentUserState) {
    openAuthModal();
    return;
  }

  clearFormValidationErrors();
  employeeForm.reset();

  if (employee) {
    currentEditingId = employee.id;
    modalTitle.innerText = `Edit Employee Details (${employee.id})`;
    empIdInput.value = employee.id;
    empName.value = employee.name;
    empEmail.value = employee.email;
    empDepartment.value = employee.department;
    empRole.value = employee.role;
    
    empBaseSalary.value = employee.salary.baseSalary;
    empBonuses.value = employee.salary.bonuses;
    empDeductions.value = employee.salary.deductions;
  } else {
    currentEditingId = null;
    modalTitle.innerText = "Add New Employee";
    empIdInput.value = '';
    
    empBaseSalary.value = '0';
    empBonuses.value = '0';
    empDeductions.value = '0';
  }

  updateNetPayPreview();
  
  employeeModal.classList.remove('hidden');
  employeeModal.setAttribute('aria-hidden', 'false');
  empName.focus();
}

function closeEmployeeModal() {
  employeeModal.classList.add('hidden');
  employeeModal.setAttribute('aria-hidden', 'true');
  employeeForm.reset();
  currentEditingId = null;
}

window.triggerEditEmployee = function(id) {
  const employee = employeesState.find(emp => emp.id === id);
  if (employee) {
    openEmployeeModal(employee);
  }
};

function triggerDeleteEmployee(id, name) {
  currentDeletingId = id;
  deleteEmpName.innerText = name;
  deleteModal.classList.remove('hidden');
  deleteModal.setAttribute('aria-hidden', 'false');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  deleteModal.setAttribute('aria-hidden', 'true');
  currentDeletingId = null;
}

window.triggerDeleteEmployee = triggerDeleteEmployee;

/* -------------------------------------------------------------
 * Validations & Calculations Helper
 * ------------------------------------------------------------- */
function updateNetPayPreview() {
  const base = parseFloat(empBaseSalary.value) || 0;
  const allowance = parseFloat(empBonuses.value) || 0;
  const deductions = parseFloat(empDeductions.value) || 0;
  const net = base + allowance - deductions;
  netPayPreview.innerText = formatCurrency(net);
}

function validateForm() {
  let isValid = true;
  clearFormValidationErrors();

  if (!empName.value.trim()) {
    showInputError(empName, 'empNameError');
    isValid = false;
  }

  const emailVal = empEmail.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailVal) {
    showInputError(empEmail, 'empEmailError');
    isValid = false;
  } else if (!emailRegex.test(emailVal)) {
    showInputError(empEmail, 'empEmailError');
    empEmail.parentElement.querySelector('.error-msg').innerText = 'Please enter a valid email structure (e.g. user@company.com)';
    isValid = false;
  }

  if (!empDepartment.value.trim()) {
    showInputError(empDepartment, 'empDeptError');
    isValid = false;
  }

  if (!empRole.value.trim()) {
    showInputError(empRole, 'empRoleError');
    isValid = false;
  }

  const baseVal = parseFloat(empBaseSalary.value) || 0;
  const bonusVal = parseFloat(empBonuses.value) || 0;
  const dedVal = parseFloat(empDeductions.value) || 0;

  if (baseVal < 0) empBaseSalary.value = 0;
  if (bonusVal < 0) empBonuses.value = 0;
  if (dedVal < 0) empDeductions.value = 0;

  return isValid;
}

function showInputError(inputEl, errorId) {
  const group = inputEl.closest('.form-group');
  group.classList.add('has-error');
}

function clearFormValidationErrors() {
  const errorGroups = employeeForm.querySelectorAll('.form-group.has-error');
  errorGroups.forEach(group => group.classList.remove('has-error'));
  
  document.getElementById('empNameError').innerText = 'Please enter the employee\'s name.';
  document.getElementById('empEmailError').innerText = 'Please enter a valid email address.';
  document.getElementById('empDeptError').innerText = 'Department name is required.';
  document.getElementById('empRoleError').innerText = 'Job role is required.';
}

/* -------------------------------------------------------------
 * Toast Utilities
 * ------------------------------------------------------------- */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconClass = 'fa-circle-check';
  if (type === 'danger') iconClass = 'fa-triangle-exclamation';
  if (type === 'warning') iconClass = 'fa-circle-exclamation';
  if (type === 'info') iconClass = 'fa-circle-info';

  toast.innerHTML = `
    <span class="toast-icon"><i class="fa-solid ${iconClass}"></i></span>
    <span class="toast-message">${escapeHTML(message)}</span>
    <button class="toast-close" aria-label="Close message"><i class="fa-solid fa-xmark"></i></button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    dismissToast(toast);
  });

  toastContainer.appendChild(toast);

  setTimeout(() => {
    dismissToast(toast);
  }, 4000);
}

function dismissToast(toastEl) {
  if (toastEl.parentNode) {
    toastEl.classList.add('fade-out');
    toastEl.addEventListener('animationend', () => {
      toastEl.remove();
    });
    setTimeout(() => toastEl.remove(), 300);
  }
}

/* -------------------------------------------------------------
 * Formatting & Securing Helpers
 * ------------------------------------------------------------- */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
