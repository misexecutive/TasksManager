/**
 * admin.js
 * This script handles all administrative functionalities including:
 * - Employee management (add, view)
 * - Task management (add, view)
 * - Task assignment
 * - Global and filtered performance statistics viewing
 * - User role verification and redirection
 * It interacts with a Google Apps Script backend for data operations.
 */

// Define the API base URL for the Google Apps Script deployment.
const API_BASE = 'https://script.google.com/macros/s/AKfycbwvthEU19w4Xs9qCdQOaetDqlanzd50pnHX4oL2AN1ns_Wuy1sSqnkN_fZ_cdcrweZu/exec';

// Variable to store the admin's email, retrieved from sessionStorage.
let adminUserEmail = '';

/**
 * Initializes the admin page.
 * It retrieves the user's email and name from sessionStorage.
 * It then verifies if the logged-in user has 'Admin' role.
 * If not an admin, it redirects them to the user performance portal or login page.
 * Otherwise, it proceeds to load all necessary admin-specific data such as
 * employee list, task list, dropdowns for assignment, and performance statistics.
 */
async function initializeAdminPage() {
  adminUserEmail = sessionStorage.getItem('userEmail');
  const userName = sessionStorage.getItem('userName');

  // If no user email is found in sessionStorage, redirect to the login page.
  if (!adminUserEmail) {
    window.location.href = 'portal.html';
    return;
  }

  showLoader('Verifying admin access...'); // Show loader during authorization check
  try {
    // Fetch the user's role from the backend to verify admin privileges.
    const res = await fetch(`${API_BASE}?action=getUserRole&email=${adminUserEmail}`);
    updateLoaderProgress(30); // Update progress after fetching role
    const result = await res.json();

    // Check if the API call was successful and the user's role is 'Admin'.
    if (result.status === 'success' && result.role === 'Admin') {
      // Display the admin user's name on the page.
      document.getElementById('userName').textContent = userName || 'Admin';
      updateLoaderProgress(60); // Update progress before loading data

      // Load all administrative data concurrently for efficiency.
      await Promise.all([
        loadEmployees(),
        loadTasks(),
        populateDropdowns(),
        loadGlobalPerformance(),
        populateDepartmentFilter(),
        loadFilteredStats({}) // Load initial filtered stats (all)
      ]);
      updateLoaderProgress(100); // Progress complete
    } else {
      // If the user is not an admin, show an access denied toast and redirect.
      showToast('Access Denied: You are not authorized to view this page.', 'error');
      setTimeout(() => {
        window.location.href = 'performance.html'; // Redirect to user portal
      }, 1500); // Give time for toast message to be visible
    }
  } catch (error) {
    // Log and display any errors during the authorization process.
    console.error('Error verifying admin role:', error);
    showToast('An error occurred during authorization. Please try again.', 'error');
    setTimeout(() => {
      window.location.href = 'portal.html'; // Redirect to login on critical error
    }, 1500); // Give time for toast message to be visible
  } finally {
    hideLoader(); // Hide loader regardless of success or failure
  }
}

/**
 * Event listener for the employee form submission.
 * Prevents default form submission, collects data, and sends it to the backend
 * to add a new employee. Reloads employee list and dropdowns on success.
 */
document.getElementById('employeeForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent the default form submission behavior.

  // Collect form data using FormData API.
  const formData = new FormData(e.target);
  const params = new URLSearchParams({
    action: 'addEmployee',
    name: formData.get('name'),
    email: formData.get('email'),
    department: formData.get('department')
  });

  showLoader('Adding employee...'); // Show loader during employee addition
  try {
    // Send a POST request to the API to add the employee.
    const res = await fetch(API_BASE, {
      method: 'POST',
      body: params
    });
    updateLoaderProgress(50); // Update progress

    const result = await res.json();
    if (result.status === 'success') {
      showToast(result.message, 'success'); // Show success toast
      e.target.reset(); // Clear the form fields.
      updateLoaderProgress(75); // Update progress before reloading data
      // Reload relevant data after successful addition.
      await loadEmployees();
      await populateDropdowns();
      await populateDepartmentFilter();
      updateLoaderProgress(100); // Progress complete
    } else {
      showToast(result.message, 'error'); // Show error toast
    }
  } catch (error) {
    // Log and display any errors during the employee addition process.
    console.error('Error adding employee:', error);
    showToast('An error occurred while adding the employee.', 'error');
  } finally {
    hideLoader(); // Hide loader
  }
});

/**
 * Loads all employees from the backend and populates the employee table on the page.
 */
async function loadEmployees() {
  showLoader('Loading employees...'); // Show loader during data fetch
  try {
    // Fetch all employees from the backend.
    const res = await fetch(`${API_BASE}?action=getAllEmployees`);
    updateLoaderProgress(50); // Update progress
    const data = await res.json();

    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = ''; // Clear existing rows in the employee table.

    // Check if the API call was successful and employees data is available.
    if (data.status === 'success' && data.employees) {
      // Iterate over each employee and append a new row to the table.
      data.employees.forEach(emp => {
        const row = `<tr>
          <td>${emp.Name || ''}</td>
          <td>${emp.Email || ''}</td>
          <td>${emp.Department || ''}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
      });
      updateLoaderProgress(100); // Progress complete
    } else {
      // Log and display an error if employee data could not be loaded.
      console.error('Failed to load employees:', data.message);
      showToast(`Failed to load employees: ${data.message}`, 'error');
    }
  } catch (error) {
    // Log and display any errors during the employee loading process.
    console.error('Error loading employees:', error);
    showToast('An error occurred while loading employees.', 'error');
  } finally {
    hideLoader(); // Hide loader
  }
}

/**
 * Event listener for the task form submission.
 * Prevents default form submission, collects data, and sends it to the backend
 * to add a new task. Reloads task list and dropdowns on success.
 */
document.getElementById('taskForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent the default form submission behavior.

  // Collect form data.
  const formData = new FormData(e.target);
  const params = new URLSearchParams({
    action: 'addTask',
    name: formData.get('name'),
    description: formData.get('description')
  });

  showLoader('Adding task...'); // Show loader during task addition
  try {
    // Send a POST request to the API to add the task.
    const res = await fetch(API_BASE, {
      method: 'POST',
      body: params
    });
    updateLoaderProgress(50); // Update progress

    const result = await res.json();
    if (result.status === 'success') {
      showToast(result.message, 'success'); // Show success toast
      e.target.reset(); // Clear the form fields.
      updateLoaderProgress(75); // Update progress before reloading data
      // Reload relevant data after successful addition.
      await loadTasks();
      await populateDropdowns();
      updateLoaderProgress(100); // Progress complete
    } else {
      showToast(result.message, 'error'); // Show error toast
    }
  } catch (error) {
    // Log and display any errors during the task addition process.
    console.error('Error adding task:', error);
    showToast('An error occurred while adding the task.', 'error');
  } finally {
    hideLoader(); // Hide loader
  }
});

/**
 * Loads all tasks from the backend and populates the task table on the page.
 */
async function loadTasks() {
  showLoader('Loading tasks...'); // Show loader during data fetch
  try {
    // Fetch all tasks from the backend.
    const res = await fetch(`${API_BASE}?action=getAllTasks`);
    updateLoaderProgress(50); // Update progress
    const data = await res.json();

    const tbody = document.getElementById('taskTableBody');
    tbody.innerHTML = ''; // Clear existing rows in the task table.

    // Check if the API call was successful and tasks data is available.
    if (data.status === 'success' && data.tasks) {
      // Iterate over each task and append a new row to the table.
      data.tasks.forEach(task => {
        const row = `<tr>
          <td>${task["Task ID"] || ''}</td>
          <td>${task["Task Name"] || ''}</td>
          <td>${task["Description"] || ''}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
      });
      updateLoaderProgress(100); // Progress complete
    } else {
      // Log and display an error if task data could not be loaded.
      console.error('Failed to load tasks:', data.message);
      showToast(`Failed to load tasks: ${data.message}`, 'error');
    }
  } catch (error) {
    // Log and display any errors during the task loading process.
    console.error('Error loading tasks:', error);
    showToast('An error occurred while loading tasks.', 'error');
  } finally {
    hideLoader(); // Hide loader
  }
}

/**
 * Event listener for the assign task form submission.
 * Prevents default form submission, collects data, and sends it to the backend
 * to assign a task to an employee.
 */
document.getElementById('assignForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent the default form submission behavior.

  // Collect form data.
  const formData = new FormData(e.target);
  const params = new URLSearchParams({
    action: 'assignTask',
    task: formData.get('task'),
    assignedTo: formData.get('assignedTo'),
    recurrence: formData.get('recurrence'),
    startDate: formData.get('startDate')
  });

  showLoader('Assigning task...'); // Show loader during task assignment
  try {
    // Send a POST request to the API to assign the task.
    const res = await fetch(API_BASE, {
      method: 'POST',
      body: params
    });
    updateLoaderProgress(50); // Update progress

    const result = await res.json();
    if (result.status === 'success') {
      showToast(result.message, 'success'); // Show success toast
      e.target.reset(); // Clear the form fields.
      updateLoaderProgress(100); // Progress complete
    } else {
      showToast(result.message, 'error'); // Show error toast
    }
  } catch (error) {
    // Log and display any errors during the task assignment process.
    console.error('Error assigning task:', error);
    showToast('An error occurred while assigning the task.', 'error');
  } finally {
    hideLoader(); // Hide loader
  }
});

/**
 * Populates the task and employee dropdowns in the assign task form.
 * It fetches all tasks and employees from the backend and populates the respective select elements.
 */
async function populateDropdowns() {
  showLoader('Populating dropdowns...'); // Show loader during dropdown population
  try {
    // Fetch all tasks for the task dropdown.
    const taskRes = await fetch(`${API_BASE}?action=getAllTasks`);
    updateLoaderProgress(30); // Update progress
    const taskData = await taskRes.json();
    const taskDropdown = document.getElementById('taskDropdown');
    taskDropdown.innerHTML = '<option value="">Select Task</option>'; // Add a default "Select Task" option.
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

    // Fetch all employees for the employee dropdown.
    const empRes = await fetch(`${API_BASE}?action=getAllEmployees`);
    updateLoaderProgress(60); // Update progress
    const empData = await empRes.json();
    const empDropdown = document.getElementById('employeeDropdown');
    empDropdown.innerHTML = '<option value="">Select Employee</option>'; // Add a default "Select Employee" option.
    if (empData.status === 'success' && empData.employees) {
      empData.employees.forEach(emp => {
        const opt = document.createElement('option');
        opt.value = emp.Email;
        opt.textContent = `${emp.Name} (${emp.Email})`;
        empDropdown.appendChild(opt);
      });
      updateLoaderProgress(100); // Progress complete
    } else {
      console.error('Failed to load employees for dropdown:', empData.message);
      showToast(`Failed to load employees for dropdown: ${empData.message}`, 'error');
    }
  } catch (error) {
    // Log and display any errors during dropdown population.
    console.error('Error populating dropdowns:', error);
    showToast('An error occurred while populating dropdowns.', 'error');
  } finally {
    hideLoader(); // Hide loader
  }
}

/**
 * Loads global performance statistics from the backend and displays them.
 * It aggregates total, on-time, late, and pending tasks across all employees.
 */
async function loadGlobalPerformance() {
  showLoader('Loading global performance...'); // Show loader during data fetch
  try {
    // Fetch global statistics from the backend.
    const res = await fetch(`${API_BASE}?action=getStatsAll`);
    updateLoaderProgress(50); // Update progress
    const data = await res.json();

    // Check if the API call was successful and summary data is available.
    if (data.status === 'success' && data.summary) {
      // Calculate totals by reducing the summary array.
      const totals = data.summary.reduce((acc, user) => ({
        total: acc.total + (user.total || 0),
        onTime: acc.onTime + (user.onTime || 0),
        late: acc.late + (user.late || 0),
        pending: acc.pending + (user.pending || 0)
      }), { total: 0, onTime: 0, late: 0, pending: 0 });

      // Update the DOM elements with the calculated global statistics.
      document.getElementById('globalTotal').textContent = totals.total;
      document.getElementById('globalOnTime').textContent = totals.onTime;
      document.getElementById('globalLate').textContent = totals.late;
      document.getElementById('globalPending').textContent = totals.pending;
      updateLoaderProgress(100); // Progress complete
    } else {
      // Log and display an error if global performance data could not be loaded.
      console.error('Failed to load global performance stats:', data.message);
      showToast(`Failed to load global performance stats: ${data.message}`, 'error');
      // Set values to '0' or 'Error' if data is unavailable.
      document.getElementById('globalTotal').textContent = '0';
      document.getElementById('globalOnTime').textContent = '0';
      document.getElementById('globalLate').textContent = '0';
      document.getElementById('globalPending').textContent = '0';
    }
  } catch (error) {
    // Log and display any errors during global performance data fetching.
    console.error('Error fetching global performance stats:', error);
    showToast('An error occurred while fetching global performance stats.', 'error');
    document.getElementById('globalTotal').textContent = 'Error';
    document.getElementById('globalOnTime').textContent = 'Error';
    document.getElementById('globalLate').textContent = 'Error';
    document.getElementById('globalPending').textContent = 'Error';
  } finally {
    hideLoader(); // Hide loader
  }
}

/**
 * Populates the department filter dropdown with unique department names
 * fetched from the list of all employees.
 */
async function populateDepartmentFilter() {
    showLoader('Loading departments for filter...'); // Show loader
    try {
        const res = await fetch(`${API_BASE}?action=getAllEmployees`);
        updateLoaderProgress(50); // Update progress
        const data = await res.json();
        const departmentDropdown = document.getElementById('filterDepartment');
        departmentDropdown.innerHTML = '<option value="">All Departments</option>'; // Default option

        if (data.status === 'success' && data.employees) {
            // Extract unique department names and sort them alphabetically.
            const departments = [...new Set(data.employees.map(emp => emp.Department).filter(Boolean))];
            departments.sort().forEach(dept => {
                const opt = document.createElement('option');
                opt.value = dept.toLowerCase(); // Use lowercase for value for consistency
                opt.textContent = dept;
                departmentDropdown.appendChild(opt);
            });
            updateLoaderProgress(100); // Progress complete
        } else {
            console.error('Failed to load departments for filter:', data.message);
            showToast(`Failed to load departments for filter: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Error populating department filter:', error);
        showToast('An error occurred while populating department filter.', 'error');
    } finally {
        hideLoader(); // Hide loader
    }
}

/**
 * Loads filtered performance statistics based on provided filters (department, level, date range).
 * It dynamically constructs the API request and populates the filtered stats table.
 * @param {Object} filters - An object containing filter criteria (e.g., { department: 'HR', level: 'pass', from: '2023-01-01', to: '2023-12-31' }).
 */
async function loadFilteredStats(filters = {}) {
  showLoader('Loading filtered statistics...'); // Show loader
  try {
    // Construct URL search parameters from the filters object.
    const params = new URLSearchParams({
      action: 'getFilteredStats',
      ...filters
    });

    // Fetch filtered statistics from the backend.
    const res = await fetch(`${API_BASE}?${params}`);
    updateLoaderProgress(50); // Update progress
    const data = await res.json();

    const tbody = document.getElementById('filteredStatsTableBody');
    tbody.innerHTML = ''; // Clear existing rows.

    // Check if the API call was successful and data is available.
    if (data.status === 'success' && data.data) {
        // Iterate over each statistic and append a new row to the table.
        data.data.forEach(stat => {
            const row = `<tr>
                <td>${stat.name || ''}</td>
                <td>${stat.email || ''}</td>
                <td>${stat.department || ''}</td>
                <td>${stat.total || 0}</td>
                <td class="status-on-time">${stat.onTime || 0}</td>
                <td class="status-late">${stat.late || 0}</td>
                <td class="status-pending">${stat.pending || 0}</td>
                <td>${stat.percent || 0}%</td>
                <td>${stat.level || ''}</td>
            </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        updateLoaderProgress(100); // Progress complete
    } else {
      // Log and display an error if filtered stats could not be loaded.
      console.error('Failed to load filtered stats:', data.message);
      showToast(`Failed to load filtered stats: ${data.message}`, 'error');
    }
  } catch (error) {
    // Log and display any errors during filtered stats fetching.
    console.error('Error fetching filtered stats:', error);
    showToast('An error occurred while fetching filtered stats.', 'error');
  } finally {
    hideLoader(); // Hide loader
  }
}

// --- Event Listeners for Filter Controls ---

/**
 * Event listener for the "Apply Filters" button.
 * Gathers filter values from the dropdowns and date inputs, then calls
 * `loadFilteredStats` with the collected filters.
 */
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

    loadFilteredStats(filters); // Apply filters
});

/**
 * Event listener for the "Clear Filters" button.
 * Resets all filter input fields and then reloads all performance stats
 * by calling `loadFilteredStats` with an empty filters object.
 */
document.getElementById('clearFilterBtn').addEventListener('click', () => {
    document.getElementById('filterDepartment').value = '';
    document.getElementById('filterLevel').value = '';
    document.getElementById('filterFromDate').value = '';
    document.getElementById('filterToDate').value = '';
    loadFilteredStats({}); // Load all stats after clearing filters
});
