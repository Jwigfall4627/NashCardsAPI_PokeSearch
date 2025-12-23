/**
 * Authentication Module
 * Handles user login, signup, and session management
 * Uses localStorage for local data persistence
 */

const Auth = (() => {
    // Private variables
    const STORAGE_KEY = 'nashCards_users';
    const SESSION_KEY = 'nashCards_session';

    /**
     * Initialize authentication system
     */
    function init() {
        // Create default test users if not exists
        if (!getStoredUsers()) {
            setStoredUsers([
                {
                    id: '1',
                    name: 'Demo User',
                    email: 'demo@example.com',
                    password: 'password123'
                }
            ]);
        }

        // Check if user is already logged in
        const currentSession = getSession();
        if (currentSession) {
            console.log('User already logged in:', currentSession.name);
        }
    }

    /**
     * Get all stored users from localStorage
     */
    function getStoredUsers() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    }

    /**
     * Set users in localStorage
     */
    function setStoredUsers(users) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }

    /**
     * Create new user account
     * @param {string} name - Full name
     * @param {string} email - Email address
     * @param {string} password - Password
     * @returns {object} Result with success status and message
     */
    function signup(name, email, password) {
        // Validation
        if (!name || !email || !password) {
            return { success: false, message: 'All fields are required' };
        }

        if (!isValidEmail(email)) {
            return { success: false, message: 'Invalid email address' };
        }

        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters' };
        }

        const users = getStoredUsers() || [];

        // Check if email already exists
        if (users.some(user => user.email === email)) {
            return { success: false, message: 'Email already registered' };
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password // Note: In production, this should be hashed
        };

        users.push(newUser);
        setStoredUsers(users);

        // Auto-login after signup
        login(email, password);

        return { success: true, message: 'Account created successfully' };
    }

    /**
     * Login user
     * @param {string} email - Email address
     * @param {string} password - Password
     * @returns {object} Result with success status and user data
     */
    function login(email, password) {
        // Validation
        if (!email || !password) {
            return { success: false, message: 'Email and password are required' };
        }

        const users = getStoredUsers() || [];

        // Find user
        const user = users.find(u => u.email === email);

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        // Check password (in production, use bcrypt or similar)
        if (user.password !== password) {
            return { success: false, message: 'Invalid password' };
        }

        // Create session
        const session = {
            id: user.id,
            name: user.name,
            email: user.email,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(session));

        return {
            success: true,
            message: 'Login successful',
            user: session
        };
    }

    /**
     * Get current user session
     * @returns {object|null} Current session or null if not logged in
     */
    function getSession() {
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    }

    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    function isLoggedIn() {
        return getSession() !== null;
    }

    /**
     * Logout user
     */
    function logout() {
        localStorage.removeItem(SESSION_KEY);
        console.log('User logged out');
    }

    /**
     * Validate email format
     * @param {string} email
     * @returns {boolean}
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Get user profile
     * @returns {object} User profile or null
     */
    function getProfile() {
        const session = getSession();
        if (!session) return null;

        const users = getStoredUsers() || [];
        return users.find(u => u.id === session.id) || null;
    }

    // Public API
    return {
        init,
        signup,
        login,
        logout,
        getSession,
        isLoggedIn,
        getProfile
    };
})();

// Initialize auth on page load
Auth.init();
