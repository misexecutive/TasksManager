const API_BASE = 'https://script.google.com/macros/s/AKfycbwvthEU19w4Xs9qCdQOaetDqlanzd50pnHX4oL2AN1ns_Wuy1sSqnkN_fZ_cdcrweZu/exec';

let adminUserEmail = ''; // This variable will store the admin's email

/**
 * Initializes the admin page.
 * It retrieves the user's email from sessionStorage and verifies their role.
 * If not an admin, it redirects them to the portal.
 * Otherwise, it loads all necessary admin data.
 */
async function initializeAdminPage() {
  adminUserEmail = sessionStorage.getItem('userEmail');
  const userName = sessionStorage.getItem('userName');

  if (!adminUserEmail) {
    // If no user email, redirect to login page
    window.location.href = 'portal.html';
    return;
  }

  showLoader(); // Show loader during initialization
  try {
    // Verify if the logged-in user is an Admin
    const res = await fetch(`${API_BASE}?action=getUserRole&email=${adminUserEmail}`);
    const result = await res.json();

    if (result.status === 'success' && result.role === 'Admin') {
      // Display admin user name
      document.getElementById('userName').textContent = userName || 'Admin';
      // Load all admin-specific data
      await loadEmployees();
      await loadTasks();
      await populateDropdowns();
      await loadGlobalPerformance();
      await populateDepartmentFilter(); // New: Populate department filter
      await loadFilteredStats(); // Load initial filtered stats (all)
    } else {
      // If not an admin, redirect to user portal or login
      showToast('Access Denied: You are not authorized to view this page.', 'error');
      setTimeout(() => {
        window.location.href = 'performance.html'; // Or 'portal.html' if unauthorized access is not allowed at all
      }, 1500); // Give time for toast to show
    }
  } catch (error) {
    console.error('Error verifying admin role:', error);
    showToast('An error occurred during authorization. Please try again.', 'error');
    setTimeout(() => {
      window.location.href = 'portal.html'; // Redirect to login on error
    }, 1500); // Give time for toast to show
  } finally {
    hideLoader(); // Hide loader after initialization
  }
}

// Event listener for adding a new employee
document.getElementById('employeeForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const params = new URLSearchParams({
    action: 'addEmployee',
    name: formData.get('name'),
    email: formData.get('email'),
    department: formData.get('department')
  });

  showLoader();
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      body: params
    });

    const result = await res.json();
    if (result.status === 'success') {
      showToast(result.message, 'success');
      e.target.reset();
      await loadEmployees(); // Reload employee list
      await populateDropdowns(); // Update employee dropdown
      await populateDepartmentFilter(); // Update department filter
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    console.error('Error adding employee:', error);
    showToast('An error occurred while adding the employee.', 'error');
  } finally {
    hideLoader();
  }
});

/**
 * Loads all employees and populates the employee table.
 */
async function loadEmployees() {
  showLoader();
  try {
    const res = await fetch(`${API_BASE}?action=getAllEmployees`);
    const data = await res.json();

    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = ''; // Clear existing rows

    if (data.status === 'success' && data.employees) {
      data.employees.forEach(emp => {
        const row = `<tr>
          <td>${emp.Name || ''}</td>
          <td>${emp.Email || ''}</td>
          <td>${emp.Department || ''}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
      });
    } else {
      console.error('Failed to load employees:', data.message);
      showToast(`Failed to load employees: ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('Error loading employees:', error);
    showToast('An error occurred while loading employees.', 'error');
  } finally {
    hideLoader();
  }
}

// Event listener for adding a new task
document.getElementById('taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const params = new URLSearchParams({
    action: 'addTask',
    name: formData.get('name'),
    description: formData.get('description')
  });

  showLoader();
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      body: params
    });

    const result = await res.json();
    if (result.status === 'success') {
      showToast(result.message, 'success');
      e.target.reset();
      await loadTasks(); // Reload task list
      await populateDropdowns(); // Update task dropdown
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    console.error('Error adding task:', error);
    showToast('An error occurred while adding the task.', 'error');
  } finally {
    hideLoader();
  }
});

/**
 * Loads all tasks and populates the task table.
 */
async function loadTasks() {
  showLoader();
  try {
    const res = await fetch(`${API_BASE}?action=getAllTasks`);
    const data = await res.json();

    const tbody = document.getElementById('taskTableBody');
    tbody.innerHTML = ''; // Clear existing rows

    if (data.status === 'success' && data.tasks) {
      data.tasks.forEach(task => {
        const row = `<tr>
          <td>${task["Task ID"] || ''}</td>
          <td>${task["Task Name"] || ''}</td>
          <td>${task["Description"] || ''}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
      });
    } else {
      console.error('Failed to load tasks:', data.message);
      showToast(`Failed to load tasks: ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('Error loading tasks:', error);
    showToast('An error occurred while loading tasks.', 'error');
  } finally {
    hideLoader();
  }
}

// Event listener for assigning a task
document.getElementById('assignForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const params = new URLSearchParams({
    action: 'assignTask',
    task: formData.get('task'),
    assignedTo: formData.get('assignedTo'),
    recurrence: formData.get('recurrence'),
    startDate: formData.get('startDate')
  });

  showLoader();
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      body: params
    });

    const result = await res.json();
    if (result.status === 'success') {
      showToast(result.message, 'success');
      e.target.reset();
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    console.error('Error assigning task:', error);
    showToast('An error occurred while assigning the task.', 'error');
  } finally {
    hideLoader();
  }
});

/**
 * Populates the task and employee dropdowns for the assign task form.
 */
async function populateDropdowns() {
  showLoader();
  try {
    // Populate task dropdown
    const taskRes = await fetch(`${API_BASE}?action=getAllTasks`);
    const taskData = await taskRes.json();
    const taskDropdown = document.getElementById('taskDropdown');
    taskDropdown.innerHTML = '<option value="">Select Task</option>'; // Add a default option
    if (taskData.status === 'success' && taskData.tasks) {
      taskData.tasks.forEach(task => {
        const opt = document.createElement('option');
        opt.value = task["Task ID"];
        opt.textContent = `${task["Task ID"]} - ${task["Task Name"]}`;
        taskDropdown.appendChild(opt);
      });
    } else {
      console.error('Failed to load tasks for dropdown:', taskData.message);
      showToast(`Failed to load tasks for dropdown: ${taskData.message}`, 'error');
    }

    // Populate employee dropdown
    const empRes = await fetch(`${API_BASE}?action=getAllEmployees`);
    const empData = await empRes.json();
    const empDropdown = document.getElementById('employeeDropdown');
    empDropdown.innerHTML = '<option value="">Select Employee</option>'; // Add a default option
    if (empData.status === 'success' && empData.employees) {
      empData.employees.forEach(emp => {
        const opt = document.createElement('option');
        opt.value = emp.Email;
        opt.textContent = `${emp.Name} (${emp.Email})`;
        empDropdown.appendChild(opt);
      });
    } else {
      console.error('Failed to load employees for dropdown:', empData.message);
      showToast(`Failed to load employees for dropdown: ${empData.message}`, 'error');
    }
  } catch (error) {
    console.error('Error populating dropdowns:', error);
    showToast('An error occurred while populating dropdowns.', 'error');
  } finally {
    hideLoader();
  }
}

/**
 * Loads global performance statistics.
 * Fixed to handle the summary array structure returned by backend.
 */
async function loadGlobalPerformance() {
  showLoader();
  try {
    const res = await fetch(`${API_BASE}?action=getStatsAll`);
    const data = await res.json();

    if (data.status === 'success' && data.summary) {
      // Calculate totals from summary array
      const totals = data.summary.reduce((acc, user) => ({
        total: acc.total + (user.total || 0),
        onTime: acc.onTime + (user.onTime || 0),
        late: acc.late + (user.late || 0),
        pending: acc.pending + (user.pending || 0)
      }), { total: 0, onTime: 0, late: 0, pending: 0 });

      document.getElementById('globalTotal').textContent = totals.total;
      document.getElementById('globalOnTime').textContent = totals.onTime;
      document.getElementById('globalLate').textContent = totals.late;
      document.getElementById('globalPending').textContent = totals.pending;
    } else {
      console.error('Failed to load global performance stats:', data.message);
      showToast(`Failed to load global performance stats: ${data.message}`, 'error');
      // Show zero values instead of error
      document.getElementById('globalTotal').textContent = '0';
      document.getElementById('globalOnTime').textContent = '0';
      document.getElementById('globalLate').textContent = '0';
      document.getElementById('globalPending').textContent = '0';
    }
  } catch (error) {
    console.error('Error fetching global performance stats:', error);
    showToast('An error occurred while fetching global performance stats.', 'error');
    document.getElementById('globalTotal').textContent = 'Error';
    document.getElementById('globalOnTime').textContent = 'Error';
    document.getElementById('globalLate').textContent = 'Error';
    document.getElementById('globalPending').textContent = 'Error';
  } finally {
    hideLoader();
  }
}

/**
 * Populates the department filter dropdown with unique department names.
 */
async function populateDepartmentFilter() {
    showLoader();
    try {
        const res = await fetch(`${API_BASE}?action=getAllEmployees`);
        const data = await res.json();
        const departmentDropdown = document.getElementById('filterDepartment');
        departmentDropdown.innerHTML = '<option value="">All Departments</option>'; // Default option

        if (data.status === 'success' && data.employees) {
            const departments = [...new Set(data.employees.map(emp => emp.Department).filter(Boolean))];
            departments.sort().forEach(dept => {
                const opt = document.createElement('option');
                opt.value = dept.toLowerCase();
                opt.textContent = dept;
                departmentDropdown.appendChild(opt);
            });
        } else {
            console.error('Failed to load departments for filter:', data.message);
            showToast(`Failed to load departments for filter: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Error populating department filter:', error);
        showToast('An error occurred while populating department filter.', 'error');
    } finally {
        hideLoader();
    }
}

/**
 * Loads filtered performance statistics based on user inputs.
 * This function can be called when implementing advanced filtering features.
 */
async function loadFilteredStats(filters = {}) {
  showLoader();
  try {
    const params = new URLSearchParams({
      action: 'getFilteredStats',
      ...filters
    });

    const res = await fetch(`${API_BASE}?${params}`);
    const data = await res.json();

    const tbody = document.getElementById('filteredStatsTableBody');
    tbody.innerHTML = ''; // Clear existing rows

    if (data.status === 'success' && data.data) {
        data.data.forEach(stat => {
            const row = `<tr>
                <td>${stat.name}</td>
                <td>${stat.email}</td>
                <td>${stat.department}</td>
                <td>${stat.total}</td>
                <td class="status-on-time">${stat.onTime}</td>
                <td class="status-late">${stat.late}</td>
                <td class="status-pending">${stat.pending}</td>
                <td>${stat.percent}%</td>
                <td>${stat.level}</td>
            </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    } else {
      console.error('Failed to load filtered stats:', data.message);
      showToast(`Failed to load filtered stats: ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('Error fetching filtered stats:', error);
    showToast('An error occurred while fetching filtered stats.', 'error');
  } finally {
    hideLoader();
  }
}

// Event listeners for filter controls
document.getElementById('applyFilterBtn').addEventListener('click', () => {
    const department = document.getElementById('filterDepartment').value;
    const level = document.getElementById('filterLevel').value;
    const fromDate = document.getElementById('filterFromDate').value;
    const toDate = document.getElementById('filterToDate').value;

    const filters = {};
    if (department) filters.department = department;
    if (level) filters.level = level;
    if (fromDate) filters.from = fromDate;
    if (toDate) filters.to = toDate;

    loadFilteredStats(filters);
});

document.getElementById('clearFilterBtn').addEventListener('click', () => {
    document.getElementById('filterDepartment').value = '';
    document.getElementById('filterLevel').value = '';
    document.getElementById('filterFromDate').value = '';
    document.getElementById('filterToDate').value = '';
    loadFilteredStats({}); // Load all stats after clearing filters
});
