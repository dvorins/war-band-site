document.addEventListener('DOMContentLoaded', function () {
    const landingPage = document.getElementById('landing-page');
    const mainContent = document.getElementById('main-content');

    // Check if the current file is index.html
    if (window.location.pathname.endsWith('index.html')) {
        // Hide landing page on click
        landingPage.addEventListener('click', function () {
            landingPage.style.display = 'none'; // Hide the landing page
            mainContent.classList.remove('hidden'); // Show the main content
            document.body.style.overflow = 'auto'; // Restore scrolling
        });
    } else {
        // For other files, make sure main content is visible and disable landing page behavior
        mainContent.classList.remove('hidden');
        document.body.style.overflow = 'auto';
    }
});
