document.addEventListener('DOMContentLoaded', function () {
    const landingPage = document.getElementById('landing-page');
    const mainContent = document.getElementById('main-content');

   

    // Hide landing page on click
    landingPage.addEventListener('click', function () {
        landingPage.style.display = 'none'; // Hide the landing page
        mainContent.classList.remove('hidden'); // Show the main content
        document.body.style.overflow = 'auto'; // Restore scrolling
    });

  
});
