/**
 * performance.js
 * This script manages the user's weekly performance page, including:
 * - Displaying personal tasks.
 * - Allowing users to mark tasks as done.
 * - Showing personal performance statistics (total, on-time, late, pending, achieved %).
 * - Redirecting unauthorized users to the login portal.
 * It interacts with a Google Apps Script backend for data operations.
 */

// Define the API base URL for the Google Apps Script deployment.
const API_BASE = 'https://script.google.com/macros/s/AKfycbwvthEU19w4Xs9qCdQOaetDqlanzd50pnHX4oL2AN1ns_Wuy1sSqnkN_fZ_cdcrweZu/exec';

// Variable to store the current user's email, retrieved from sessionStorage.
let userEmail = '';

/**
 * Initializes the performance page by retrieving the user's email and name from sessionStorage.
 * If no email is found, it redirects the user to the login page.
 * Otherwise, it loads the user's tasks and performance data.
 */
async function initializePerformancePage() {
  userEmail = sessionStorage.getItem('userEmail');
  const userName = sessionStorage.getItem('userName');

  // If no user email is found, redirect to the portal (login page).
  if (!userEmail) {
    window.location.href = 'portal.html';
    return;
  }

  // Display the user's name on the page.
  document.getElementById('userName').textContent = userName || 'User';

  showLoader('Loading your tasks and performance...'); // Show loader before fetching data
  try {
    // Load tasks and performance data concurrently for the authenticated user.
    await Promise.all([
      loadTasks(userEmail),
      loadPerformance(userEmail)
    ]);
    updateLoaderProgress(100); // Progress complete
  } catch (error) {
    console.error('Error during performance page initialization:', error);
    showToast('An error occurred during page setup.', 'error');
  } finally {
    hideLoader(); // Hide loader after data is loaded
  }
}

/**
 * Loads tasks assigned to the specified email and populates the task list display.
 * @param {string} email - The email of the user to load tasks for.
 */
async function loadTasks(email) {
  showLoader('Fetching your tasks...'); // Show loader specifically for tasks
  try {
    // Fetch user-specific tasks from the backend.
    const res = await fetch(`${API_BASE}?action=getUserTasks&email=${email}`);
    updateLoaderProgress(30); // Update progress
    const result = await res.json();

    // Check for API call success.
    if (result.status !== 'success') {
      console.error('Failed to load tasks:', result.message);
      showToast(`Failed to load tasks: ${result.message}`, 'error');
      return;
    }

    const container = document.getElementById('taskList');
    container.innerHTML = ''; // Clear any previously loaded tasks.

    // Iterate over each task and create a task card for display.
    result.tasks.forEach(task => {
      const taskCard = document.createElement('div');
      taskCard.className = 'task-card'; // Apply custom styling class.

      // Determine the CSS class for task status based on its value.
      const statusColorClass =
        task.Status === 'On Time' ? 'status-on-time' :
        task.Status === 'Late' ? 'status-late' :
        'status-pending';

      // Format the planned date to dd-mmm-yyyy for better readability.
      const plannedDate = new Date(task['Planned Date']);
      const formattedPlannedDate = plannedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace(/ /g, '-'); // Replace spaces with hyphens.

      // Construct the HTML content for the task card.
      taskCard.innerHTML = `
        <h3 class="text-lg font-semibold mb-1">${task.Task}</h3>
        <p><strong>Planned:</strong> ${formattedPlannedDate}</p>
        <p><strong>Status:</strong> <span class="${statusColorClass}">${task.Status}</span></p>
        ${task.Status === 'Pending' ? `<button class="btn btn-mark-done"
          data-taskid="${task['Task ID']}"
          data-date="${task['Planned Date']}"><i class="fas fa-check fa-icon"></i> Mark Done</button>` : ''}
      `;

      container.appendChild(taskCard); // Add the task card to the container.
    });

    // Attach event listeners to all "Mark Done" buttons.
    document.querySelectorAll('.btn-mark-done').forEach(btn => {
      btn.addEventListener('click', async () => {
        const taskID = btn.dataset.taskid;
        const date = btn.dataset.date;
        // Show a custom confirmation modal before marking the task as done.
        showCustomModal(
            'Confirm Task Completion',
            `Are you sure you want to mark "${taskID}" as done?`,
            [
                { text: 'Cancel', className: 'btn btn-danger', onClick: () => console.log('Mark done cancelled') },
                { text: 'Confirm', className: 'btn btn-success', onClick: () => markTaskAsDone(taskID, date) }
            ]
        );
      });
    });
    updateLoaderProgress(100); // Progress complete
  } catch (error) {
    // Log and display any errors during task loading.
    console.error('Error loading tasks:', error);
    showToast('An error occurred while loading tasks.', 'error');
  } finally {
    hideLoader(); // Hide loader
  }
}

/**
 * Loads performance statistics for the specified email and updates the summary box.
 * @param {string} email - The email of the user to load performance for.
 */
async function loadPerformance(email) {
  showLoader('Fetching your performance data...'); // Show loader specifically for performance
  try {
    // Fetch user-specific performance data from the backend.
    const res = await fetch(`${API_BASE}?action=getMyPerformance&email=${email}`);
    updateLoaderProgress(70); // Update progress
    const data = await res.json();

    // Check for API call success.
    if (data.status !== 'success') {
      console.error('Failed to load performance data:', data.message);
      showToast(`Failed to load performance: ${data.message}`, 'error');
      return;
    }

    // Update the DOM elements with the fetched performance statistics.
    document.getElementById('total').textContent = data.total;
    document.getElementById('onTime').textContent = data.onTime;
    document.getElementById('late').textContent = data.late;
    document.getElementById('pending').textContent = data.pending;
    document.getElementById('targetPercent').textContent = data.target; // Using 'target' from Code.gs
    document.getElementById('achieved').textContent = data.achieved;

    const statusMessageElement = document.getElementById('statusMessage');
    // Clear previous status classes to ensure correct styling.
    statusMessageElement.classList.remove('status-on-time', 'status-late', 'status-pending');

    // Set the status message and apply appropriate styling based on achieved percentage vs. target.
    if (data.achieved >= data.target) {
      statusMessageElement.textContent = "✅ Target Achieved!";
      statusMessageElement.classList.add('status-on-time');
    } else {
      statusMessageElement.textContent = "⚠️ Below Target";
      statusMessageElement.classList.add('status-late');
    }
    updateLoaderProgress(100); // Progress complete
  } catch (error) {
    // Log and display any errors during performance data loading.
    console.error('Error loading performance:', error);
    showToast('An error occurred while loading performance data.', 'error');
  } finally {
    hideLoader(); // Hide loader
  }
}

/**
 * Marks a specific task as done for the current user.
 * After marking, it reloads the tasks and performance data to reflect the changes.
 * @param {string} taskID - The ID of the task to mark as done.
 * @param {string} date - The planned date of the task, used for identifying the specific task instance.
 */
async function markTaskAsDone(taskID, date) {
  showLoader('Marking task as done...'); // Show loader during task completion
  try {
    // Prepare parameters for the API request.
    const params = new URLSearchParams({
      action: 'markTaskDone',
      email: userEmail,
      taskID: taskID,
      plannedDate: date // Ensure parameter name matches backend expectation
    });

    // Send a POST request to the API to mark the task as done.
    const res = await fetch(API_BASE, {
      method: 'POST',
      body: params
    });
    updateLoaderProgress(50); // Update progress

    const result = await res.json();
    if (result.status === 'success') {
      showToast('Task marked as done!', 'success'); // Show success toast
      updateLoaderProgress(75); // Update progress before reloading
      // Reload tasks and performance to update the UI.
      await loadTasks(userEmail);
      await loadPerformance(userEmail);
      updateLoaderProgress(100); // Progress complete
    } else {
      console.error('Failed to mark task done:', result.message);
      showToast(`Failed to mark task done: ${result.message}`, 'error');
    }
  } catch (error) {
    // Log and display any errors during the task marking process.
    console.error('Error marking task done:', error);
    showToast('An error occurred while marking the task done.', 'error');
  } finally {
    hideLoader(); // Hide loader
  }
}
