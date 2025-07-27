const API_BASE = 'https://script.google.com/macros/s/AKfycbwvthEU19w4Xs9qCdQOaetDqlanzd50pnHX4oL2AN1ns_Wuy1sSqnkN_fZ_cdcrweZu/exec';
let userEmail = '';

// Removed handleCredentialResponse as it's handled by portal.js for initial authentication flow

async function loadTasks(email) {
  showLoader();
  try {
    const res = await fetch(`${API_BASE}?action=getUserTasks&email=${email}`);
    const result = await res.json();

    if (result.status !== 'success') {
        console.error('Failed to load tasks:', result.message);
        showToast(`Failed to load tasks: ${result.message}`, 'error');
        return;
    }

    const container = document.getElementById('taskList');
    container.innerHTML = '';

    result.tasks.forEach(task => {
      const taskCard = document.createElement('div');
      taskCard.className = 'task-card'; // Use custom class

      const statusColorClass =
        task.Status === 'On Time' ? 'status-on-time' :
        task.Status === 'Late' ? 'status-late' :
        'status-pending';

      taskCard.innerHTML = `
        <h3 class="text-lg font-semibold mb-1">${task.Task}</h3>
        <p><strong>Planned:</strong> ${task['Planned Date']}</p>
        <p><strong>Status:</strong> <span class="${statusColorClass}">${task.Status}</span></p>
        ${task.Status === 'Pending' ? `<button class="btn btn-mark-done"
          data-taskid="${task['Task ID']}"
          data-date="${task['Planned Date']}"><i class="fas fa-check fa-icon"></i> Mark Done</button>` : ''}
      `;

      container.appendChild(taskCard);
    });

    document.querySelectorAll('.btn-mark-done').forEach(btn => {
      btn.addEventListener('click', () => {
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
  } finally {
    hideLoader();
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

        const data = await res.json();
        if (data.status === 'success') {
            showToast(data.message, 'success');
            await loadTasks(userEmail); // Refresh tasks
            // If performance.js is used on the same page, you might want to call loadPerformance here too.
            // For now, assuming this is just for the user's task list.
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Error marking task done:', error);
        showToast('An error occurred while marking the task done.', 'error');
    } finally {
        hideLoader();
    }
}
