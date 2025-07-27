/**
 * ui-helpers.js
 * This script provides helper functions for displaying UI elements like loaders,
 * toast messages, and custom modals, centralizing their logic and styling.
 * It also handles theme switching and loading customization data.
 */

// --- Global UI Element References ---
const loaderOverlay = document.getElementById('loader-overlay');
const progressBar = document.getElementById('loaderProgressBar');
const progressText = document.getElementById('loaderProgressText');
const toastContainer = document.getElementById('toast-container');
const customModalOverlay = document.getElementById('custom-modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalButtons = document.getElementById('modal-buttons');

// --- Loader Functions (Progress Bar) ---
let loaderInterval;
let currentProgress = 0;
let targetProgress = 0;

/**
 * Shows the global loader overlay with a progress bar.
 * @param {string} message - The message to display (e.g., "Loading data...").
 */
function showLoader(message = "Loading...") {
    if (loaderOverlay) {
        loaderOverlay.classList.add('show');
        if (progressText) {
            progressText.textContent = message;
        }
        currentProgress = 0;
        targetProgress = 0;
        if (progressBar) {
            progressBar.style.width = '0%';
        }

        // Simulate progress for a professional look
        clearInterval(loaderInterval);
        loaderInterval = setInterval(() => {
            if (currentProgress < targetProgress) {
                currentProgress += 1;
                if (progressBar) {
                    progressBar.style.width = `${currentProgress}%`;
                }
            }
        }, 20); // Update every 20ms
    }
}

/**
 * Updates the progress of the loader bar.
 * @param {number} percentage - The percentage of progress (0-100).
 */
function updateLoaderProgress(percentage) {
    if (progressBar) {
        targetProgress = Math.min(100, Math.max(0, percentage)); // Ensure percentage is between 0 and 100
    }
}

/**
 * Hides the global loader overlay.
 */
function hideLoader() {
    if (loaderOverlay) {
        // Ensure progress completes before hiding
        targetProgress = 100;
        setTimeout(() => {
            loaderOverlay.classList.remove('show');
            clearInterval(loaderInterval);
            currentProgress = 0;
            targetProgress = 0;
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        }, 300); // Give a small delay for the progress bar to reach 100%
    }
}


// --- Toast Functions ---
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

// --- Theme Management Functions ---
const THEMES = ['default', 'dark', 'light'];
let currentThemeIndex = 0;

/**
 * Sets the active theme for the application.
 * @param {string} themeName - The name of the theme ('default', 'dark', 'light').
 */
function setTheme(themeName) {
    document.body.classList.remove(...THEMES.map(t => `theme-${t}`)); // Remove all theme classes
    if (themeName !== 'default') {
        document.body.classList.add(`theme-${themeName}`); // Add the selected theme class
    }
    localStorage.setItem('appTheme', themeName); // Save preference
    currentThemeIndex = THEMES.indexOf(themeName); // Update current index
}

/**
 * Toggles to the next theme in the sequence.
 */
function toggleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    setTheme(THEMES[currentThemeIndex]);
}

/**
 * Loads the theme preference from localStorage on page load.
 */
function loadThemePreference() {
    const savedTheme = localStorage.getItem('appTheme') || 'default';
    setTheme(savedTheme); // Apply the saved or default theme
}

// --- Customization Data Functions ---
let customizationData = {};

/**
 * Fetches customization data from assets/customize.txt.
 * @returns {Promise<Object>} A promise that resolves with the parsed customization data.
 */
async function fetchCustomizationData() {
    try {
        const response = await fetch('assets/customize.txt');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const lines = text.split('\n');
        const data = {};
        lines.forEach(line => {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join(':').trim().replace(/"/g, ''); // Join back and remove quotes
                data[key] = value;
            }
        });
        customizationData = data; // Store globally
        return data;
    } catch (error) {
        console.error('Error fetching customization data:', error);
        showToast('Failed to load customization data.', 'error');
        return {}; // Return empty object on error
    }
}

/**
 * Applies the fetched customization data to the HTML elements.
 * This function should be called after the DOM is loaded and customizationData is available.
 */
function applyCustomizationData() {
    // Apply logo
    const appLogo = document.getElementById('appLogo');
    if (appLogo) {
        appLogo.src = 'assets/image/logo.png';
        appLogo.alt = customizationData.Org || 'App Logo';
    }

    // Apply organization info
    const orgInfoDiv = document.getElementById('orgInfo');
    if (orgInfoDiv) {
        orgInfoDiv.innerHTML = `
            <h2 class="text-xl font-semibold">${customizationData.Org || 'Task Manager'}</h2>
            <p class="text-sm text-gray-600">${customizationData.Tagline || 'Manage your tasks efficiently'}</p>
        `;
    }

    // Apply contact info (footer)
    const contactInfoDiv = document.getElementById('contactInfo');
    if (contactInfoDiv) {
        contactInfoDiv.innerHTML = `
            <p>Mobile: ${customizationData.Mobile || 'N/A'}</p>
            <p>Address: ${customizationData.Address || 'N/A'}</p>
        `;
    }
}


// Expose these functions globally so they can be used by other scripts
window.showLoader = showLoader;
window.updateLoaderProgress = updateLoaderProgress;
window.hideLoader = hideLoader;
window.showToast = showToast;
window.showCustomModal = showCustomModal;
window.hideCustomModal = hideCustomModal;
window.setTheme = setTheme;
window.toggleTheme = toggleTheme;
window.loadThemePreference = loadThemePreference;
window.fetchCustomizationData = fetchCustomizationData;
window.applyCustomizationData = applyCustomizationData;

// Initialize theme on script load
loadThemePreference();
