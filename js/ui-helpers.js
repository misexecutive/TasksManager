/**
 * ui-helpers.js
 * This script provides helper functions for displaying UI elements like loaders,
 * toast messages, and custom modals, centralizing their logic and styling.
 */

// --- Loader Functions ---
const loaderOverlay = document.getElementById('loader-overlay');

/**
 * Shows the global loader overlay.
 */
function showLoader() {
    if (loaderOverlay) {
        loaderOverlay.classList.add('show');
    }
}

/**
 * Hides the global loader overlay.
 */
function hideLoader() {
    if (loaderOverlay) {
        loaderOverlay.classList.remove('show');
    }
}

// --- Toast Functions ---
const toastContainer = document.getElementById('toast-container');

/**
 * Displays a toast message.
 * @param {string} message - The message to display.
 * @param {'success'|'error'|'info'} type - The type of toast (controls color).
 * @param {number} duration - How long the toast should be visible in ms (default: 3000).
 */
function showToast(message, type = 'info', duration = 3000) {
    if (!toastContainer) {
        console.warn("Toast container not found.");
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let iconHtml = '';
    if (type === 'success') {
        iconHtml = '<i class="fas fa-check-circle fa-icon"></i>';
    } else if (type === 'error') {
        iconHtml = '<i class="fas fa-times-circle fa-icon"></i>';
    } else { // info
        iconHtml = '<i class="fas fa-info-circle fa-icon"></i>';
    }
    toast.innerHTML = `${iconHtml}<span>${message}</span>`;

    toastContainer.appendChild(toast);

    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10); // Small delay for CSS transition

    // Hide and remove the toast after duration
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide'); // Add hide class for exit animation
        toast.addEventListener('transitionend', () => {
            toast.remove();
        }, { once: true }); // Remove listener after it fires
    }, duration);
}

// --- Custom Modal Functions ---
const customModalOverlay = document.getElementById('custom-modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalButtons = document.getElementById('modal-buttons');

/**
 * Shows a custom modal dialog.
 * @param {string} title - The title of the modal.
 * @param {string} message - The message content of the modal.
 * @param {Array<{text: string, className: string, onClick: function}>} buttons - An array of button configurations.
 * Each object should have:
 * - text: The button text.
 * - className: CSS class for styling (e.g., 'btn btn-primary', 'btn btn-danger').
 * - onClick: The function to execute when the button is clicked.
 */
function showCustomModal(title, message, buttons) {
    if (!customModalOverlay || !modalTitle || !modalMessage || !modalButtons) {
        console.warn("One or more modal elements not found.");
        return;
    }

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalButtons.innerHTML = ''; // Clear previous buttons

    buttons.forEach(btnConfig => {
        const button = document.createElement('button');
        button.textContent = btnConfig.text;
        button.className = btnConfig.className || 'btn'; // Default button style
        button.addEventListener('click', () => {
            hideCustomModal();
            if (typeof btnConfig.onClick === 'function') {
                btnConfig.onClick();
            }
        });
        modalButtons.appendChild(button);
    });

    customModalOverlay.classList.add('show');
}

/**
 * Hides the custom modal dialog.
 */
function hideCustomModal() {
    if (customModalOverlay) {
        customModalOverlay.classList.remove('show');
    }
}

// Expose these functions globally so they can be used by other scripts
window.showLoader = showLoader;
window.hideLoader = hideLoader;
window.showToast = showToast;
window.showCustomModal = showCustomModal;
window.hideCustomModal = hideCustomModal;

