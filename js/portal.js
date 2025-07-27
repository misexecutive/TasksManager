/**
 * portal.js
 * This script handles the Google Sign-In authentication flow for the Task Management App.
 * It decodes the Google credential, stores user information, and redirects users
 * to the appropriate portal (admin or performance) based on their role fetched from the backend.
 */

// Define the API base URL for the Google Apps Script deployment.
const API_BASE = 'https://script.google.com/macros/s/AKfycbwvthEU19w4Xs9qCdQOaetDqlanzd50pnHX4oL2AN1ns_Wuy1sSqnkN_fZ_cdcrweZu/exec';

/**
 * Handles the Google credential response after a successful sign-in.
 * It decodes the JWT (JSON Web Token) received from Google, extracts the user's email and name,
 * stores them in sessionStorage, and then queries the backend to determine the user's role.
 * Based on the role, it redirects the user to either the admin panel or the user performance page.
 * @param {Object} response - The Google credential response object, containing the JWT.
 */
async function handleCredentialResponse(response) {
  showLoader('Authenticating...'); // Show loader during authentication process
  try {
    // Decode the JWT credential to get user data.
    const data = jwt_decode(response.credential);
    const userEmail = data.email;

    // Store the user's email and name in sessionStorage.
    // This allows other pages (admin.html, performance.html) to access user info.
    sessionStorage.setItem('userEmail', userEmail);
    sessionStorage.setItem('userName', data.name);
    updateLoaderProgress(30); // Update progress after decoding credential

    // Fetch the user's role from the backend API.
    const res = await fetch(`${API_BASE}?action=getUserRole&email=${userEmail}`);
    updateLoaderProgress(60); // Update progress after fetching role
    const result = await res.json();

    // Check if the role fetching was successful and a role is provided.
    if (result.status === 'success' && result.role) {
      updateLoaderProgress(90); // Update progress before redirection
      // Redirect based on the determined user role.
      if (result.role === 'Admin') {
        window.location.href = 'admin.html'; // Redirect to admin page
      } else if (result.role === 'User') {
        window.location.href = 'performance.html'; // Redirect to user performance page
      } else {
        // Handle unexpected roles by logging an error and showing a modal.
        console.error('Unknown user role:', result.role);
        showCustomModal(
            'Authentication Failed',
            'Unknown user role. Please contact support.',
            [{ text: 'OK', className: 'btn btn-primary', onClick: () => {} }]
        );
      }
    } else {
      // Handle cases where role fetching failed.
      console.error('Failed to get user role:', result.message);
      showCustomModal(
          'Authentication Failed',
          'Could not determine user role. Please try again.',
          [{ text: 'OK', className: 'btn btn-primary', onClick: () => {} }]
      );
    }
  } catch (error) {
    // Catch and handle any errors during the sign-in or role determination process.
    console.error('Error during Google sign-in or role determination:', error);
    showCustomModal(
        'Authentication Error',
        'An error occurred during authentication. Please try again.',
        [{ text: 'OK', className: 'btn btn-primary', onClick: () => {} }]
    );
  } finally {
    hideLoader(); // Hide loader regardless of success or failure
  }
}

// No other functions like loadTasks or document.getElementById('userName').textContent
// are needed here, as portal.html is now strictly for authentication and redirection.
