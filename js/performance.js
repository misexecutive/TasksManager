const API_BASE = 'https://script.google.com/macros/s/AKfycbwvthEU19w4Xs9qCdQOaetDqlanzd50pnHX4oL2AN1ns_Wuy1sSqnkN_fZ_cdcrweZu/exec';

let userEmail = ''; // This variable will be set from sessionStorage

/**
 * Initializes the performance page by retrieving the user's email from sessionStorage.
 * If no email is found, it redirects the user to the login page.
 * Otherwise, it loads the user's tasks and performance data.
 */
async function initializePerformancePage() {
  userEmail = sessionStorage.getItem('userEmail');
  const userName = sessionStorage.getItem('userName');

  if (!userEmail) {
    // If no user email, redirect to login page
    window.location.href = 'portal.html';
    return;
  }

  // Display user name
  document.getElementById('userName').textContent = userName || 'User';

  // Load tasks and performance for the authenticated user
  showLoader(); // Show loader before fetching data
  await loadTasks(userEmail);
  await loadPerformance(userEmail);
  hideLoader(); // Hide loader after data is loaded
}

/**
 * Loads tasks assigned to the specified email.
 * @param {string} email The email of the user to load tasks for.
 */
async function loadTasks(email) {
  try {
    const res = await fetch(`${API_BASE}?action=getUserTasks&email=${email}`);
    const result = await res.json();

    if (result.status !== 'success') {
      console.error('Failed to load tasks:', result.message);
      showToast(`Failed to load tasks: ${result.message}`, 'error');
      return;
    }

    const container = document.getElementById('taskList');
    container.innerHTML = ''; // Clear previous tasks

    result.tasks.forEach(task => {
      const taskCard = document.createElement('div');
      taskCard.className = 'task-card'; // Use custom class

      const statusColorClass =
        task.Status === 'On Time' ? 'status-on-time' :
        task.Status === 'Late' ? 'status-late' :
        'status-pending';

      // Format the planned date to dd-mmm-yyyy
      const plannedDate = new Date(task['Planned Date']);
      const formattedPlannedDate = plannedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace(/ /g, '-'); // Replace spaces with hyphens for dd-mmm-yyyy format


      taskCard.innerHTML = `
        <h3 class="text-lg font-semibold mb-1">${task.Task}</h3>
        <p><strong>Planned:</strong> ${formattedPlannedDate}</p>
        <p><strong>Status:</strong> <span class="${statusColorClass}">${task.Status}</span></p>
        ${task.Status === 'Pending' ? `<button class="btn btn-mark-done"
          data-taskid="${task['Task ID']}"
          data-date="${task['Planned Date']}"><i class="fas fa-check fa-icon"></i> Mark Done</button>` : ''}
      `;

      container.appendChild(taskCard);
    });

    // Attach event listeners to "Mark Done" buttons
    document.querySelectorAll('.btn-mark-done').forEach(btn => {
      btn.addEventListener('click', async () => {
        const taskID = btn.dataset.taskid;
        const date = btn.dataset.date;
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
  } catch (error) {
    console.error('Error loading tasks:', error);
    showToast('An error occurred while loading tasks.', 'error');
  }
}

/**
 * Loads performance statistics for the specified email.
 * @param {string} email The email of the user to load performance for.
 */
async function loadPerformance(email) {
  try {
    const res = await fetch(`${API_BASE}?action=getMyPerformance&email=${email}`);
    const data = await res.json();

    if (data.status !== 'success') {
      console.error('Failed to load performance data:', data.message);
      showToast(`Failed to load performance: ${data.message}`, 'error');
      return;
    }

    document.getElementById('total').textContent = data.total;
    document.getElementById('onTime').textContent = data.onTime;
    document.getElementById('late').textContent = data.late;
    document.getElementById('pending').textContent = data.pending;
    document.getElementById('targetPercent').textContent = data.target; // Using 'target' from Code.gs
    document.getElementById('achieved').textContent = data.achieved;

    const statusMessageElement = document.getElementById('statusMessage');
    statusMessageElement.classList.remove('status-on-time', 'status-late', 'status-pending'); // Clear previous classes

    if (data.achieved >= data.target) { // Using 'target' from Code.gs
      statusMessageElement.textContent = "✅ Target Achieved!";
      statusMessageElement.classList.add('status-on-time');
    } else {
      statusMessageElement.textContent = "⚠️ Below Target";
      statusMessageElement.classList.add('status-late');
    }
  } catch (error) {
    console.error('Error loading performance:', error);
    showToast('An error occurred while loading performance data.', 'error');
  }
}

/**
 * Marks a task as done for the current user.
 * @param {string} taskID The ID of the task to mark as done.
 * @param {string} date The planned date of the task.
 */
async function markTaskAsDone(taskID, date) {
  showLoader();
  try {
    const params = new URLSearchParams({
      action: 'markTaskDone',
      email: userEmail,
      taskID: taskID,
      plannedDate: date // Corrected parameter name to match Code.gs
    });

    const res = await fetch(API_BASE, {
      method: 'POST',
      body: params
    });

    const result = await res.json();
    if (result.status === 'success') {
      showToast('Task marked as done!', 'success');
      await loadTasks(userEmail); // Reload tasks to update status
      await loadPerformance(userEmail); // Reload performance to update stats
    } else {
      console.error('Failed to mark task done:', result.message);
      showToast(`Failed to mark task done: ${result.message}`, 'error');
    }
  } catch (error) {
    console.error('Error marking task done:', error);
    showToast('An error occurred while marking the task done.', 'error');
  } finally {
    hideLoader();
  }
}

// Initial call to load data when the page loads
// This is now triggered by the onload event in performance.html body
// document.addEventListener('DOMContentLoaded', initializePerformancePage);
