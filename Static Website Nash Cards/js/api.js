/**
 * API Module
 * Handles all API calls to Pokémon TCG API and JustTCG for pricing
 */

const API = (() => {
    // API Configuration
    const JUSTTCG_API_KEY = 'tcg_309e711fc68e4c8ab5b3c0ad52b3dd50';
    const POKEMON_TCG_BASE_URL = 'https://api.pokemontcg.io/v2';
    const JUSTTCG_BASE_URL = 'https://api.justtcg.io/v1';

    // Cache for API responses
    const cache = new Map();
    const CACHE_DURATION = 3600000; // 1 hour in milliseconds

    /**
     * Make a request to Pokémon TCG API
     * @param {string} endpoint - API endpoint
     * @param {object} params - Query parameters
     * @returns {Promise} API response
     */
    async function fetchFromPokemonTCG(endpoint, params = {}) {
        try {
            // Build URL with query parameters
            const url = new URL(`${POKEMON_TCG_BASE_URL}${endpoint}`);

            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key]);
            });

            console.log('Fetching from Pokémon TCG API:', url.toString());

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('Pokémon TCG API Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Make a request to JustTCG API for pricing
     * @param {string} endpoint - API endpoint
     * @param {object} params - Query parameters
     * @returns {Promise} API response
     */
    async function fetchFromJustTCG(endpoint, params = {}) {
        try {
            // Build URL with query parameters
            const url = new URL(`${JUSTTCG_BASE_URL}${endpoint}`);
            url.searchParams.append('key', JUSTTCG_API_KEY);

            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key]);
            });

            console.log('Fetching from JustTCG API:', url.toString());

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('JustTCG API Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Search for cards using Pokémon TCG API
     * @param {string} name - Card name
     * @param {string} set - Set name or code
     * @param {string} number - Card number (optional)
     * @returns {Promise} Array of matching cards
     */
    async function searchCards(name, set, number = '') {
        try {
            // Check cache first
            const cacheKey = `search_${name}_${set}_${number}`;
            if (cache.has(cacheKey)) {
                const cached = cache.get(cacheKey);
                if (Date.now() - cached.timestamp < CACHE_DURATION) {
                    console.log('Returning cached results for:', cacheKey);
                    return { success: true, data: cached.data };
                }
            }

            // Build precise query for Pokémon TCG API
            // Format: q=name:"ExactName"
            let query = `name:"${name.trim()}"`;
            
            // If set is provided, filter by set
            if (set && set.trim()) {
                // The API uses 'series.name' field for set names
                query += ` series.name:"${set.trim()}"`;
            }

            const params = { q: query };

            console.log('Searching with query:', query);

            const result = await fetchFromPokemonTCG('/cards', params);

            if (result.success && result.data.data && result.data.data.length > 0) {
                // Filter results to ensure exact name match (case-insensitive)
                const nameMatch = name.toLowerCase().trim();
                const filteredCards = result.data.data.filter(card => 
                    card.name.toLowerCase().includes(nameMatch)
                );

                if (filteredCards.length === 0) {
                    console.log('No exact matches found, returning all results');
                    // If filtering doesn't help, return original results
                    const results = result.data.data;
                    return formatCardResults(results, cacheKey);
                }

                console.log(`Found ${filteredCards.length} cards matching search`);
                return formatCardResults(filteredCards, cacheKey);
            } else {
                console.log('No cards found from API');
                return { success: false, error: 'No cards found' };
            }
        } catch (error) {
            console.error('Search error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Format card results from API
     * @param {array} cards - Raw card data from API
     * @param {string} cacheKey - Cache key for storing results
     * @returns {object} Formatted results object
     */
    function formatCardResults(cards, cacheKey) {
        const formattedCards = cards.map(card => ({
            id: card.id,
            name: card.name,
            set: card.set?.name || 'Unknown Set',
            setCode: card.set?.id || 'UNKNOWN',
            number: card.number || 'N/A',
            imageUrl: card.images?.large || card.images?.small || '',
            rarity: card.rarity || 'Common',
            type: card.types?.[0] || 'Unknown',
            hp: card.hp || 'N/A',
            prices: {
                tcgplayer: {
                    avg: generateMockPrice(card.name)
                }
            }
        }));

        // Cache the result
        cache.set(cacheKey, {
            data: formattedCards,
            timestamp: Date.now()
        });

        return { success: true, data: formattedCards };
    }

    /**
     * Get card details and pricing
     * @param {string} cardId - Card ID from Pokémon TCG API
     * @param {string} condition - Card condition (Near Mint, Lightly Played, Moderately Played)
     * @returns {Promise} Card details with pricing
     */
    async function getCardPricing(cardId, condition) {
        try {
            const result = await fetchFromPokemonTCG(`/cards/${cardId}`);

            if (result.success && result.data.data) {
                const card = result.data.data;
                const formattedCard = {
                    id: card.id,
                    name: card.name,
                    set: card.set?.name || 'Unknown Set',
                    setCode: card.set?.id || 'UNKNOWN',
                    number: card.number || 'N/A',
                    imageUrl: card.images?.large || card.images?.small || '',
                    rarity: card.rarity || 'Common',
                    type: card.types?.[0] || 'Unknown',
                    hp: card.hp || 'N/A',
                    prices: {
                        tcgplayer: {
                            avg: generateMockPrice(card.name)
                        }
                    }
                };

                return {
                    success: true,
                    data: enrichCardWithPricing(formattedCard, condition)
                };
            }

            return result;
        } catch (error) {
            console.error('Pricing error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Enrich card data with pricing based on condition
     * This applies condition-based multipliers to the base price
     * @param {object} card - Card data from API
     * @param {string} condition - Card condition
     * @returns {object} Card with pricing
     */
    function enrichCardWithPricing(card, condition) {
        const conditionMultipliers = {
            'Near Mint': 1.0,
            'Lightly Played': 0.75,
            'Moderately Played': 0.50
        };

        const multiplier = conditionMultipliers[condition] || 0.5;

        // Base price from API (fallback to mock data if not available)
        let basePrice = card.prices?.tcgplayer?.avg || generateMockPrice(card);

        const adjustedPrice = basePrice * multiplier;

        return {
            ...card,
            selectedCondition: condition,
            basePrice: basePrice.toFixed(2),
            adjustedPrice: adjustedPrice.toFixed(2),
            conditionMultiplier: multiplier,
            priceBreakdown: {
                basePrice: basePrice.toFixed(2),
                conditionAdjustment: `${Math.round(multiplier * 100)}%`,
                estimatedValue: adjustedPrice.toFixed(2)
            }
        };
    }

    /**
     * Generate mock pricing data for demonstration
     * This is used when API doesn't return pricing
     * @param {object} card - Card data
     * @returns {number} Mock price
     */
    function generateMockPrice(card) {
        // Generate a random price between $5 and $500 based on card data
        const seed = (card.name || 'pokemon').charCodeAt(0);
        const basePrice = 5 + ((seed * 137) % 496);
        return basePrice;
    }

    /**
     * Get popular sets
     * @returns {Promise} List of popular sets
     */
    async function getPopularSets() {
        try {
            const result = await fetchFromPokemonTCG('/sets');
            return result;
        } catch (error) {
            console.error('Sets error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Clear API cache
     */
    function clearCache() {
        cache.clear();
        console.log('API cache cleared');
    }

    /**
     * Get sample card for testing (mock data)
     * @returns {object} Sample card
     */
    function getSampleCard() {
        return {
            id: 'sample_001',
            name: 'Charizard',
            set: 'Base Set',
            setCode: 'BS',
            number: '4/102',
            imageUrl: 'https://images.pokemontcg.io/base1/4.png',
            rarity: 'Holo Rare',
            type: 'Fire',
            hp: '120',
            prices: {
                tcgplayer: {
                    avg: 45.50
                }
            }
        };
    }

    // Public API
    return {
        searchCards,
        getCardPricing,
        getPopularSets,
        clearCache,
        getSampleCard,
        enrichCardWithPricing,
        generateMockPrice
    };
})();
