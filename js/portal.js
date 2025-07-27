// Define the API base URL
const API_BASE = 'https://script.google.com/macros/s/AKfycbwvthEU19w4Xs9qCdQOaetDqlanzd50pnHX4oL2AN1ns_Wuy1sSqnkN_fZ_cdcrweZu/exec';

/**
 * Handles the Google credential response after successful sign-in.
 * It decodes the JWT, extracts the user's email, stores it in sessionStorage,
 * and then determines the user's role to redirect them to the correct page.
 * @param {Object} response The Google credential response object.
 */
async function handleCredentialResponse(response) {
  try {
    const data = jwt_decode(response.credential);
    const userEmail = data.email;

    // Store the user email in sessionStorage for access on other pages
    sessionStorage.setItem('userEmail', userEmail);
    // Optionally store user name if needed for display on performance/admin pages
    sessionStorage.setItem('userName', data.name);

    // Fetch the user's role from the backend
    const res = await fetch(`${API_BASE}?action=getUserRole&email=${userEmail}`);
    const result = await res.json();

    if (result.status === 'success' && result.role) {
      if (result.role === 'Admin') {
        window.location.href = 'admin.html'; // Redirect to admin page
      } else if (result.role === 'User') {
        window.location.href = 'performance.html'; // Redirect to user performance page
      } else {
        // Handle unexpected role or display an error
        console.error('Unknown user role:', result.role);
        // Potentially redirect to an error page or show a message
        alert('Authentication failed: Unknown user role.');
      }
    } else {
      console.error('Failed to get user role:', result.message);
      alert('Authentication failed: Could not determine user role.');
    }
  } catch (error) {
    console.error('Error during Google sign-in or role determination:', error);
    alert('An error occurred during authentication. Please try again.');
  }
}

// No other functions like loadTasks or document.getElementById('userName').textContent
// are needed here, as portal.html is now strictly for authentication and redirection.
