// Script to apply theme on initial load before React hydrates
(function () {
    try {
        // Check localStorage first
        const savedTheme = localStorage.getItem('theme');

        // If there's a saved theme, use it
        if (savedTheme === 'dark' || savedTheme === 'light') {
            document.documentElement.classList.add(savedTheme);
            return;
        }

        // Otherwise check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.add('light');
        }
    } catch (e) {
        // If localStorage is not available or any other error, default to light theme
        document.documentElement.classList.add('light');
    }
})(); 