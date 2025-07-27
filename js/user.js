/**
 * user.js
 * This script was likely an initial version for user task display.
 * Its functionalities (loading tasks, marking tasks done) have been largely
 * integrated into `performance.js` for a unified user experience.
 * This file might be redundant if `performance.js` is the primary user-facing script.
 * However, comments are added as requested for completeness.
 */

// Define the API base URL for the Google Apps Script deployment.
const API_BASE = 'https://script.google.com/macros/s/AKfycbwvthEU19w4Xs9qCdQOaetDqlanzd50pnHX4oL2AN1ns_Wuy1sSqnkN_fZ_cdcrweZu/exec';

// Variable to store the current user's email.
let userEmail = '';

// The `handleCredentialResponse` function was moved to `portal.js` as it's part of the
// initial authentication flow before redirecting to user/admin pages.

/**
 * Loads tasks assigned to the specified email and populates the task list display.
 * This function is similar to the one in `performance.js` and might be redundant
 * if `performance.js` is the main entry point for user tasks.
 * @param {string} email - The email of the user to load tasks for.
 */
async function loadTasks(email) {
  showLoader('Fetching your tasks...'); // Show loader during data fetch
  try {
    // Fetch user-specific tasks from the backend.
    const res = await fetch(`${API_BASE}?action=getUserTasks&email=${email}`);
    updateLoaderProgress(50); // Update progress
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

      // Construct the HTML content for the task card.
      taskCard.innerHTML = `
        <h3 class="text-lg font-semibold mb-1">${task.Task}</h3>
        <p><strong>Planned:</strong> ${task['Planned Date']}</p>
        <p><strong>Status:</strong> <span class="${statusColorClass}">${task.Status}</span></p>
        ${task.Status === 'Pending' ? `<button class="btn btn-mark-done"
          data-taskid="${task['Task ID']}"
          data-date="${task['Planned Date']}"><i class="fas fa-check fa-icon"></i> Mark Done</button>` : ''}
      `;

      container.appendChild(taskCard); // Add the task card to the container.
    });

    // Attach event listeners to all "Mark Done" buttons.
    document.querySelectorAll('.btn-mark-done').forEach(btn => {
      btn.addEventListener('click', () => {
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
 * Marks a specific task as done for the current user.
 * After marking, it reloads the tasks to reflect the changes.
 * This function is similar to the one in `performance.js`.
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

        const data = await res.json();
        if (data.status === 'success') {
            showToast(data.message, 'success'); // Show success toast
            updateLoaderProgress(75); // Update progress before reloading
            await loadTasks(userEmail); // Refresh tasks list.
            // If performance.js is used on the same page, you might want to call loadPerformance here too.
            // For now, assuming this is just for the user's task list.
            updateLoaderProgress(100); // Progress complete
        } else {
            showToast(data.message, 'error'); // Show error toast
        }
    } catch (error) {
        // Log and display any errors during the task marking process.
        console.error('Error marking task done:', error);
        showToast('An error occurred while marking the task done.', 'error');
    } finally {
        hideLoader(); // Hide loader
    }
}
