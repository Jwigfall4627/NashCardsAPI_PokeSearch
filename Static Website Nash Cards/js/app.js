/**
 * Main Application Module
 * Coordinates between UI, API, and Auth modules
 */

const App = (() => {
    // Application state
    let currentCard = null;
    let searchInProgress = false;

    /**
     * Initialize the application
     */
    async function init() {
        console.log('Initializing Nash Cards Pokémon Valuation Tool...');

        // Initialize modules
        Auth.init();
        UI.init();

        // Check authentication status
        if (Auth.isLoggedIn()) {
            UI.showScreen('cardInput');
        } else {
            UI.showScreen('auth');
        }

        // Setup event listeners for async operations
        setupEventListeners();

        console.log('Application initialized successfully');
    }

    /**
     * Setup event listeners for async operations
     */
    function setupEventListeners() {
        // Listen for confirm search button
        document.getElementById('confirmSearchBtn').addEventListener('click', performSearch);
    }

    /**
     * Perform card search and fetch pricing
     */
    async function performSearch() {
        if (searchInProgress) return;

        // Check authentication first
        if (!Auth.isLoggedIn()) {
            UI.showError('You must be logged in to search for cards');
            setTimeout(() => {
                UI.showScreen('auth');
            }, 1000);
            return;
        }

        const cardData = JSON.parse(sessionStorage.getItem('cardData'));

        if (!cardData) {
            UI.showError('Card data not found');
            return;
        }

        searchInProgress = true;
        UI.disableSearch();
        UI.showLoading();

        try {
            // Simulate API latency for demo
            await delay(2000);

            // Search for card
            const searchResult = await API.searchCards(
                cardData.name,
                cardData.set,
                cardData.number
            );

            if (!searchResult.success) {
                // Use mock data for demo
                console.log('Using mock data for demo');
                currentCard = createMockCardResult(cardData);
            } else if (searchResult.data && searchResult.data.length > 0) {
                // Use first result (best match)
                console.log(`Found ${searchResult.data.length} matching cards, using first result`);
                currentCard = searchResult.data[0];
            } else {
                // No results found, use mock data
                currentCard = createMockCardResult(cardData);
            }

            // Enrich with pricing and condition
            const enrichedCard = API.enrichCardWithPricing(currentCard, cardData.condition);

            // Display results
            UI.showResults(enrichedCard);
        } catch (error) {
            console.error('Search error:', error);
            UI.showError('Failed to fetch card pricing. Please try again.');
        } finally {
            searchInProgress = false;
            UI.enableSearch();
        }
    }

    /**
     * Create mock card result for demo purposes
     * @param {object} cardData - Input card data
     * @returns {object} Mock card object
     */
    function createMockCardResult(cardData) {
        // Mock Pokémon TCG API response format
        return {
            id: `mock_${Date.now()}`,
            name: cardData.name,
            set: cardData.set,
            setCode: cardData.set.substring(0, 2).toUpperCase(),
            number: cardData.number || '1/102',
            imageUrl: generateMockImageUrl(cardData.name),
            rarity: 'Holo Rare',
            type: 'Varies',
            hp: '120',
            prices: {
                tcgplayer: {
                    avg: generateMockPrice(cardData.name)
                }
            }
        };
    }

    /**
     * Generate mock image URL
     * Using official Pokémon TCG API image CDN
     * @param {string} pokemonName - Name of Pokémon
     * @returns {string} Image URL
     */
    function generateMockImageUrl(pokemonName) {
        // Map common Pokémon to official TCG images
        const pokemonMap = {
            'charizard': 'https://images.pokemontcg.io/base1/4.png',
            'blastoise': 'https://images.pokemontcg.io/base1/2.png',
            'venusaur': 'https://images.pokemontcg.io/base1/1.png',
            'dragonite': 'https://images.pokemontcg.io/base1/5.png',
            'machamp': 'https://images.pokemontcg.io/base1/7.png',
            'golem': 'https://images.pokemontcg.io/base1/6.png',
            'arcanine': 'https://images.pokemontcg.io/base1/23.png',
            'lapras': 'https://images.pokemontcg.io/base1/16.png',
            'snorlax': 'https://images.pokemontcg.io/base1/27.png',
            'alakazam': 'https://images.pokemontcg.io/base1/1/1.png',
            'pikachu': 'https://images.pokemontcg.io/base1/25.png'
        };

        const normalizedName = pokemonName.toLowerCase();
        return pokemonMap[normalizedName] || 'https://images.pokemontcg.io/base1/4.png';
    }

    /**
     * Generate mock price based on card name
     * Deterministic but varies by input
     * @param {string} cardName - Card name
     * @returns {number} Mock price
     */
    function generateMockPrice(cardName) {
        // Use card name to generate consistent but varied prices
        const seed = cardName.charCodeAt(0) + cardName.charCodeAt(cardName.length - 1);
        // Generate price between $15 and $500
        return 15 + ((seed * 257) % 486);
    }

    /**
     * Utility function to delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise}
     */
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current card data
     * @returns {object} Current card or null
     */
    function getCurrentCard() {
        return currentCard;
    }

    /**
     * Reset application state
     */
    function reset() {
        currentCard = null;
        searchInProgress = false;
        UI.clearCardForm();
    }

    // Public API
    return {
        init,
        getCurrentCard,
        reset
    };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page is now visible
        console.log('Page is visible');
    } else {
        // Page is now hidden
        console.log('Page is hidden');
    }
});

// Handle before unload
window.addEventListener('beforeunload', () => {
    // Cleanup if needed
});
