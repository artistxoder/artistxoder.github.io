// --- Google Translate Initialization ---
// This function is called by the Google Translate script in the HTML files.
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'en',
    includedLanguages: 'en,es,fr,de,ja,ko',
    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
    autoDisplay: false
  }, 'google_translate_element');
}

// --- Glitch Effect Stopper ---
// This stops the glitch animation on the homepage after 5 seconds
// to prevent it from being too distracting.
document.addEventListener('DOMContentLoaded', (event) => {
    const glitchElement = document.querySelector('.glitch');
    if (glitchElement) {
        setTimeout(() => {
            glitchElement.style.animation = 'none';
        }, 5000);
    }
});
