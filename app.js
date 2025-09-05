// PriceCompare JavaScript - Quebec Grocery Price Comparison

class PriceCompare {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.selectedStores = new Set(['metro', 'superc', 'iga']);
        this.searchTerm = '';
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderProducts();
        this.updateStats();
    }
    
    async loadData() {
        try {
            // Try to load from data/products.json, fallback to sample data
            const response = await fetch('data/products.json');
            if (response.ok) {
                const data = await response.json();
                this.products = data.products || [];
            } else {
                // Use sample data if file doesn't exist
                this.products = this.getSampleData();
            }
        } catch (error) {
            console.log('Loading sample data:', error.message);
            this.products = this.getSampleData();
        }
    }
    
    getSampleData() {
        return [
            {
                name: "Lait 2% - 2L",
                category: "Produits laitiers",
                prices: [
                    { store: "metro", price: 4.49, unitPrice: "2.25$/L", lastUpdated: "2024-09-05" },
                    { store: "superc", price: 4.29, unitPrice: "2.15$/L", lastUpdated: "2024-09-05" },
                    { store: "iga", price: 4.59, unitPrice: "2.30$/L", lastUpdated: "2024-09-05" }
                ]
            },
            {
                name: "Pain Wonder Blanc 675g",
                category: "Boulangerie",
                prices: [
                    { store: "metro", price: 2.99, unitPrice: "0.44$/100g", lastUpdated: "2024-09-05" },
                    { store: "superc", price: 2.79, unitPrice: "0.41$/100g", lastUpdated: "2024-09-05" },
                    { store: "iga", price: 3.19, unitPrice: "0.47$/100g", lastUpdated: "2024-09-05" }
                ]
            },
            {
                name: "Pommes Gala - 3lb",
                category: "Fruits et légumes",
                prices: [
                    { store: "metro", price: 3.99, unitPrice: "2.93$/kg", lastUpdated: "2024-09-05" },
                    { store: "superc", price: 3.49, unitPrice: "2.56$/kg", lastUpdated: "2024-09-05" },
                    { store: "iga", price: 4.19, unitPrice: "3.08$/kg", lastUpdated: "2024-09-05" }
                ]
            },
            {
                name: "Œufs Extra-gros (12)",
                category: "Produits laitiers",
                prices: [
                    { store: "metro", price: 3.79, unitPrice: "0.32$/œuf", lastUpdated: "2024-09-05" },
                    { store: "superc", price: 3.99, unitPrice: "0.33$/œuf", lastUpdated: "2024-09-05" },
                    { store: "iga", price: 3.59, unitPrice: "0.30$/œuf", lastUpdated: "2024-09-05" }
                ]
            },
            {
                name: "Beurre Lactantia 454g",
                category: "Produits laitiers",
                prices: [
                    { store: "metro", price: 5.99, unitPrice: "1.32$/100g", lastUpdated: "2024-09-05" },
                    { store: "superc", price: 5.79, unitPrice: "1.28$/100g", lastUpdated: "2024-09-05" },
                    { store: "iga", price: 6.19, unitPrice: "1.36$/100g", lastUpdated: "2024-09-05" }
                ]
            },
            {
                name: "Poulet entier - kg",
                category: "Viande et volaille",
                prices: [
                    { store: "metro", price: 4.99, unitPrice: "4.99$/kg", lastUpdated: "2024-09-05" },
                    { store: "superc", price: 4.79, unitPrice: "4.79$/kg", lastUpdated: "2024-09-05" },
                    { store: "iga", price: 5.29, unitPrice: "5.29$/kg", lastUpdated: "2024-09-05" }
                ]
            },
            {
                name: "Fromage Cheddar fort 400g",
                category: "Produits laitiers",
                prices: [
                    { store: "metro", price: 6.49, unitPrice: "1.62$/100g", lastUpdated: "2024-09-05" },
                    { store: "superc", price: 5.99, unitPrice: "1.50$/100g", lastUpdated: "2024-09-05" },
                    { store: "iga", price: 6.79, unitPrice: "1.70$/100g", lastUpdated: "2024-09-05" }
                ]
            },
            {
                name: "Bananes - kg",
                category: "Fruits et légumes",
                prices: [
                    { store: "metro", price: 1.79, unitPrice: "1.79$/kg", lastUpdated: "2024-09-05" },
                    { store: "superc", price: 1.59, unitPrice: "1.59$/kg", lastUpdated: "2024-09-05" },
                    { store: "iga", price: 1.99, unitPrice: "1.99$/kg", lastUpdated: "2024-09-05" }
                ]
            }
        ];
    }
    
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterResults();
        });
        
        // Store checkboxes
        ['metro', 'superc', 'iga'].forEach(store => {
            const checkbox = document.getElementById(store);
            checkbox.addEventListener('change', () => this.filterResults());
        });
    }
    
    filterResults() {
        // Update selected stores
        this.selectedStores.clear();
        ['metro', 'superc', 'iga'].forEach(store => {
            if (document.getElementById(store).checked) {
                this.selectedStores.add(store);
            }
        });
        
        // Filter products
        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(this.searchTerm) ||
                                product.category.toLowerCase().includes(this.searchTerm);
            
            const hasSelectedStore = product.prices.some(price => 
                this.selectedStores.has(price.store)
            );
            
            return matchesSearch && hasSelectedStore;
        });
        
        this.renderProducts();
        this.updateStats();
    }
    
    renderProducts() {
        const productGrid = document.getElementById('productGrid');
        const noResults = document.getElementById('noResults');
        
        if (this.filteredProducts.length === 0) {
            productGrid.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }
        
        noResults.style.display = 'none';
        
        productGrid.innerHTML = this.filteredProducts.map(product => {
            const availablePrices = product.prices.filter(price => 
                this.selectedStores.has(price.store)
            );
            
            const bestPrice = Math.min(...availablePrices.map(p => p.price));
            
            return `
                <div class="product-card">
                    <div class="product-header">
                        <div class="product-name">${product.name}</div>
                        <div class="product-category">${product.category}</div>
                    </div>
                    <div class="price-comparison">
                        ${availablePrices.map(priceData => `
                            <div class="price-row">
                                <div class="store-info">
                                    <div class="store-logo ${priceData.store}">
                                        ${this.getStoreInitial(priceData.store)}
                                    </div>
                                    <span>${this.getStoreName(priceData.store)}</span>
                                </div>
                                <div class="price-info">
                                    <div class="price ${priceData.price === bestPrice ? 'best-price' : ''}">
                                        ${priceData.price.toFixed(2)}$
                                        ${priceData.price === bestPrice ? '<span class="best-price-badge">MEILLEUR</span>' : ''}
                                    </div>
                                    <div class="unit-price">${priceData.unitPrice}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updateStats() {
        const totalProducts = document.getElementById('totalProducts');
        const avgSavings = document.getElementById('avgSavings');
        const lastUpdate = document.getElementById('lastUpdate');
        
        totalProducts.textContent = this.filteredProducts.length;
        
        // Calculate average savings
        let totalSavings = 0;
        let productCount = 0;
        
        this.filteredProducts.forEach(product => {
            const availablePrices = product.prices.filter(price => 
                this.selectedStores.has(price.store)
            );
            
            if (availablePrices.length >= 2) {
                const prices = availablePrices.map(p => p.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                totalSavings += (maxPrice - minPrice);
                productCount++;
            }
        });
        
        const averageSavings = productCount > 0 ? totalSavings / productCount : 0;
        avgSavings.textContent = averageSavings > 0 ? `${averageSavings.toFixed(2)}$` : '0.00$';
        
        // Last update (use current date for sample data)
        const now = new Date();
        lastUpdate.textContent = now.toLocaleDateString('fr-CA', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    getStoreInitial(store) {
        const initials = {
            'metro': 'M',
            'superc': 'SC',
            'iga': 'IGA'
        };
        return initials[store] || store.charAt(0).toUpperCase();
    }
    
    getStoreName(store) {
        const names = {
            'metro': 'Metro',
            'superc': 'Super C',
            'iga': 'IGA'
        };
        return names[store] || store;
    }
}

// Global functions for HTML onclick events
function refreshData() {
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    
    loading.style.display = 'block';
    results.style.display = 'none';
    
    setTimeout(() => {
        loading.style.display = 'none';
        results.style.display = 'block';
        
        // Re-initialize to reload data
        window.priceCompareApp.loadData().then(() => {
            window.priceCompareApp.filterResults();
        });
        
        // Show notification
        showNotification('Données mises à jour!', 'success');
    }, 1500);
}

function filterResults() {
    window.priceCompareApp.filterResults();
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 500;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.priceCompareApp = new PriceCompare();
});