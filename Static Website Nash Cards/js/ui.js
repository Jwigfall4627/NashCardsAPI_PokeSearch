/**
 * UI Module
 * Handles all user interface updates and screen transitions
 */

const UI = (() => {
    // Screen elements
    const screens = {
        auth: document.getElementById('authScreen'),
        cardInput: document.getElementById('cardInputScreen'),
        confirmation: document.getElementById('confirmationScreen'),
        loading: document.getElementById('loadingScreen'),
        results: document.getElementById('resultsScreen'),
        error: document.getElementById('errorScreen')
    };

    // Form elements
    const forms = {
        login: document.getElementById('loginForm'),
        signup: document.getElementById('signupForm')
    };

    // Input elements
    const inputs = {
        loginEmail: document.getElementById('loginEmail'),
        loginPassword: document.getElementById('loginPassword'),
        signupName: document.getElementById('signupName'),
        signupEmail: document.getElementById('signupEmail'),
        signupPassword: document.getElementById('signupPassword'),
        signupPassword2: document.getElementById('signupPassword2'),
        cardName: document.getElementById('cardName'),
        cardSet: document.getElementById('cardSet'),
        cardNumber: document.getElementById('cardNumber'),
        cardPhotoInput: document.getElementById('cardPhotoInput'),
        conditionRadios: document.querySelectorAll('input[name="condition"]')
    };

    // Buttons
    const buttons = {
        login: document.getElementById('loginBtn'),
        signup: document.getElementById('signupBtn'),
        showSignupLink: document.getElementById('showSignupLink'),
        showLoginLink: document.getElementById('showLoginLink'),
        search: document.getElementById('searchBtn'),
        confirmSearch: document.getElementById('confirmSearchBtn'),
        back: document.getElementById('backBtn'),
        newSearch: document.getElementById('newSearchBtn'),
        home: document.getElementById('homeBtn'),
        errorRetry: document.getElementById('errorRetryBtn'),
        errorHome: document.getElementById('errorHomeBtn'),
        userMenu: document.getElementById('userMenuBtn'),
        profile: document.getElementById('profileBtn'),
        logout: document.getElementById('logoutBtn'),
        clearPhoto: document.getElementById('clearPhotoBtn')
    };

    // Other elements
    const elements = {
        uploadArea: document.getElementById('uploadArea'),
        photoPreview: document.getElementById('photoPreview'),
        previewImage: document.getElementById('previewImage'),
        userDisplayName: document.getElementById('userDisplayName'),
        userMenu: document.getElementById('userMenu'),
        errorMessage: document.getElementById('errorMessage')
    };

    /**
     * Initialize UI event listeners
     */
    function init() {
        // Authentication
        buttons.login.addEventListener('click', handleLogin);
        buttons.signup.addEventListener('click', handleSignup);
        buttons.showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms();
        });
        buttons.showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms();
        });

        // Upload area
        setupUploadArea();

        // Card input
        buttons.search.addEventListener('click', handleSearch);
        buttons.back.addEventListener('click', () => showScreen('cardInput'));

        // Confirmation
        buttons.confirmSearch.addEventListener('click', handleConfirmSearch);

        // Results
        buttons.newSearch.addEventListener('click', () => showScreen('cardInput'));
        buttons.home.addEventListener('click', () => {
            showScreen('cardInput');
            clearCardForm();
        });

        // Error
        buttons.errorRetry.addEventListener('click', () => {
            const previousScreen = sessionStorage.getItem('previousScreen') || 'cardInput';
            showScreen(previousScreen);
        });
        buttons.errorHome.addEventListener('click', () => showScreen('cardInput'));

        // User menu
        buttons.userMenu.addEventListener('click', toggleUserMenu);
        buttons.logout.addEventListener('click', handleLogout);

        // Update user display
        updateUserDisplay();
    }

    /**
     * Show specific screen
     * @param {string} screenName - Name of screen to show
     */
    function showScreen(screenName) {
        // Check authentication for protected screens
        const protectedScreens = ['cardInput', 'confirmation', 'loading', 'results'];
        
        if (protectedScreens.includes(screenName) && !Auth.isLoggedIn()) {
            showError('Please log in first to continue');
            showScreen('auth');
            return;
        }

        // Hide all screens
        Object.values(screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });

        // Show selected screen
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
            sessionStorage.setItem('currentScreen', screenName);
        }

        // Close user menu
        if (elements.userMenu) {
            elements.userMenu.classList.add('hidden');
        }
    }

    /**
     * Toggle between login and signup forms
     */
    function toggleForms() {
        forms.login.classList.toggle('hidden');
        forms.signup.classList.toggle('hidden');
        clearAuthForm();
    }

    /**
     * Clear authentication form inputs
     */
    function clearAuthForm() {
        inputs.loginEmail.value = '';
        inputs.loginPassword.value = '';
        inputs.signupName.value = '';
        inputs.signupEmail.value = '';
        inputs.signupPassword.value = '';
        inputs.signupPassword2.value = '';
    }

    /**
     * Handle login button click
     */
    function handleLogin() {
        const email = inputs.loginEmail.value.trim();
        const password = inputs.loginPassword.value;

        if (!email || !password) {
            showError('Please enter email and password');
            return;
        }

        const result = Auth.login(email, password);

        if (result.success) {
            updateUserDisplay();
            clearAuthForm();
            showScreen('cardInput');
        } else {
            showError(result.message);
        }
    }

    /**
     * Handle signup button click
     */
    function handleSignup() {
        const name = inputs.signupName.value.trim();
        const email = inputs.signupEmail.value.trim();
        const password = inputs.signupPassword.value;
        const password2 = inputs.signupPassword2.value;

        if (!name || !email || !password || !password2) {
            showError('Please fill in all fields');
            return;
        }

        if (password !== password2) {
            showError('Passwords do not match');
            return;
        }

        const result = Auth.signup(name, email, password);

        if (result.success) {
            updateUserDisplay();
            clearAuthForm();
            showScreen('cardInput');
        } else {
            showError(result.message);
        }
    }

    /**
     * Handle logout
     */
    function handleLogout() {
        Auth.logout();
        updateUserDisplay();
        showScreen('auth');
        clearCardForm();
    }

    /**
     * Update user display in header
     */
    function updateUserDisplay() {
        const session = Auth.getSession();

        if (session) {
            elements.userDisplayName.textContent = session.name || 'User';
            buttons.userMenu.style.display = 'block';
        } else {
            elements.userDisplayName.textContent = 'Login';
            buttons.userMenu.style.display = 'none';
            showScreen('auth');
        }
    }

    /**
     * Toggle user menu dropdown
     */
    function toggleUserMenu() {
        elements.userMenu.classList.toggle('hidden');
    }

    /**
     * Setup upload area drag and drop
     */
    function setupUploadArea() {
        const uploadArea = elements.uploadArea;

        uploadArea.addEventListener('click', () => {
            inputs.cardPhotoInput.click();
        });

        inputs.cardPhotoInput.addEventListener('change', (e) => {
            handleFileUpload(e.target.files[0]);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        // Clear photo button
        buttons.clearPhoto.addEventListener('click', clearPhoto);
    }

    /**
     * Handle file upload
     * @param {File} file - Uploaded file
     */
    function handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            showError('Please upload an image file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showError('File size must be less than 10MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            showPhoto(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Show uploaded photo preview
     * @param {string} src - Image data URL
     */
    function showPhoto(src) {
        elements.previewImage.src = src;
        elements.photoPreview.classList.remove('hidden');
    }

    /**
     * Clear uploaded photo
     */
    function clearPhoto() {
        elements.previewImage.src = '';
        elements.photoPreview.classList.add('hidden');
        inputs.cardPhotoInput.value = '';
    }

    /**
     * Handle search button click
     */
    function handleSearch() {
        // Check if logged in first
        if (!Auth.isLoggedIn()) {
            showError('Please log in first to search for cards');
            return;
        }

        const hasPhoto = !elements.photoPreview.classList.contains('hidden');
        const cardName = inputs.cardName.value.trim();
        const cardSet = inputs.cardSet.value.trim();
        const condition = getSelectedCondition();

        if (!hasPhoto && !cardName && !cardSet) {
            showError('Please upload a photo or enter card details');
            return;
        }

        if (!cardName || !cardSet) {
            showError('Please enter card name and set');
            return;
        }

        if (!condition) {
            showError('Please select a card condition');
            return;
        }

        // Store search data
        sessionStorage.setItem('cardData', JSON.stringify({
            name: cardName,
            set: cardSet,
            number: inputs.cardNumber.value.trim(),
            condition: condition,
            photo: elements.previewImage.src
        }));

        showConfirmation();
    }

    /**
     * Show confirmation screen with card details
     */
    function showConfirmation() {
        const cardData = JSON.parse(sessionStorage.getItem('cardData'));

        document.getElementById('confirmCardName').textContent = cardData.name;
        document.getElementById('confirmCardSet').textContent = cardData.set;
        document.getElementById('confirmCardNumber').textContent = cardData.number || 'N/A';
        document.getElementById('confirmCondition').textContent = cardData.condition;

        if (cardData.photo) {
            document.getElementById('confirmCardImage').src = cardData.photo;
        } else {
            document.getElementById('confirmCardImage').src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"%3E%3Crect width="200" height="280" fill="%23f0f0f0"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
        }

        showScreen('confirmation');
    }

    /**
     * Handle confirm search button click
     */
    function handleConfirmSearch() {
        sessionStorage.setItem('previousScreen', 'confirmation');
        showScreen('loading');
        // The actual search will be handled by the app module
    }

    /**
     * Show loading screen
     */
    function showLoading() {
        showScreen('loading');
    }

    /**
     * Show results screen
     * @param {object} cardData - Card data with pricing
     */
    function showResults(cardData) {
        const priceValue = cardData.adjustedPrice || cardData.price || 'N/A';

        document.getElementById('resultsCardName').textContent = cardData.name;
        document.getElementById('resultsCardSet').textContent = cardData.set || cardData.setCode || 'N/A';
        document.getElementById('resultsCondition').textContent = cardData.selectedCondition || 'N/A';
        document.getElementById('resultsPrice').textContent = `$${priceValue}`;

        if (cardData.imageUrl) {
            document.getElementById('resultsCardImage').src = cardData.imageUrl;
        } else {
            document.getElementById('resultsCardImage').src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"%3E%3Crect width="200" height="280" fill="%23f0f0f0"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
        }

        // Show price breakdown if available
        if (cardData.priceBreakdown) {
            const breakdown = document.getElementById('priceBreakdown');
            breakdown.classList.remove('hidden');
            document.getElementById('breakdownLabel').textContent = `Base Price × ${cardData.priceBreakdown.conditionAdjustment}`;
            document.getElementById('breakdownPrice').textContent = `$${cardData.priceBreakdown.estimatedValue}`;
        }

        showScreen('results');
    }

    /**
     * Show error screen
     * @param {string} message - Error message
     */
    function showError(message) {
        elements.errorMessage.textContent = message;
        showScreen('error');
    }

    /**
     * Show error alert (temporary)
     * @param {string} message - Error message
     */
    function showErrorAlert(message) {
        // Use alert for simple errors, or implement a toast notification
        alert('Error: ' + message);
    }

    /**
     * Get selected condition radio button value
     * @returns {string} Selected condition
     */
    function getSelectedCondition() {
        for (const radio of inputs.conditionRadios) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return null;
    }

    /**
     * Clear card input form
     */
    function clearCardForm() {
        inputs.cardName.value = '';
        inputs.cardSet.value = '';
        inputs.cardNumber.value = '';
        inputs.conditionRadios.forEach(radio => radio.checked = false);
        clearPhoto();
    }

    /**
     * Disable search button
     */
    function disableSearch() {
        buttons.search.disabled = true;
    }

    /**
     * Enable search button
     */
    function enableSearch() {
        buttons.search.disabled = false;
    }

    // Public API
    return {
        init,
        showScreen,
        showLoading,
        showResults,
        showError,
        showErrorAlert,
        showConfirmation,
        clearCardForm,
        updateUserDisplay,
        disableSearch,
        enableSearch
    };
})();
