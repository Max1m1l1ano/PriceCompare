// PriceCompare JavaScript - Quebec Grocery Price Comparison

class PriceCompare {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.selectedStores = new Set(['metro', 'superc', 'iga']);
        this.searchTerm = '';
        this.watchedProducts = new Set();
        this.alertSettings = this.loadAlertSettings();
        this.notifications = [];
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.loadWatchedProducts();
        this.setupEventListeners();
        this.renderProducts();
        this.updateStats();
        this.checkForAlerts();
        this.displayNotifications();
    }
    
    async loadData() {
        try {
            // Try to load from data/products.json, fallback to sample data
            const response = await fetch('data/products.json');
            if (response.ok) {
                const data = await response.json();
                this.products = data.products || [];
                this.notifications = data.alerts?.notifications || [];
                this.processHistoricalData();
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
        
        // Alert settings modal
        const alertBtn = document.getElementById('alertSettingsBtn');
        if (alertBtn) {
            alertBtn.addEventListener('click', () => this.openAlertSettings());
        }
        
        // Notification close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('notification-close')) {
                this.dismissNotification(e.target.dataset.notificationId);
            }
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
            const isWatched = this.watchedProducts.has(product.id || product.name);
            const priceHistory = product.priceHistory || [];
            const analysis = product.priceAnalysis || {};
            const trend = this.calculateTrend(priceHistory);
            
            return `
                <div class="product-card ${analysis.priceVolatility || ''}">
                    <div class="product-header">
                        <div class="product-name-container">
                            <div class="product-name">${product.name}</div>
                            <button class="watch-btn ${isWatched ? 'watched' : ''}" 
                                    onclick="toggleWatch('${product.id || product.name}')" 
                                    title="${isWatched ? 'Arrêter de surveiller' : 'Surveiller ce produit'}">
                                <i class="fas fa-bell${isWatched ? '' : '-slash'}"></i>
                            </button>
                        </div>
                        <div class="product-category">${product.category}</div>
                        ${trend ? `<div class="price-trend ${trend.direction}">
                            <i class="fas fa-arrow-${trend.direction === 'up' ? 'up' : 'down'}"></i>
                            ${trend.text}
                        </div>` : ''}
                        ${analysis.lastPriceChange ? `<div class="price-alert">
                            Prix ${parseFloat(analysis.lastPriceChange.change) < 0 ? 'baissé' : 'augmenté'} de ${Math.abs(parseFloat(analysis.lastPriceChange.change)).toFixed(2)}$ chez ${this.getStoreName(analysis.lastPriceChange.store)}
                        </div>` : ''}
                    </div>
                    <div class="price-comparison">
                        ${priceHistory.length > 0 ? `
                            <div class="price-history-mini">
                                <canvas id="chart-${product.id || product.name.replace(/\s+/g, '-')}" 
                                        width="200" height="40" 
                                        title="Historique des prix (7 derniers jours)"></canvas>
                            </div>` : ''}
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
                                        ${priceData.onSale ? '<span class="sale-badge">SOLDE</span>' : ''}
                                    </div>
                                    <div class="unit-price">${priceData.unitPrice}</div>
                                    ${priceData.onSale && priceData.originalPrice ? 
                                        `<div class="original-price">Était ${priceData.originalPrice.toFixed(2)}$</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    ${analysis.seasonalPattern ? `
                        <div class="seasonal-info">
                            <i class="fas fa-info-circle"></i>
                            Meilleurs mois: ${analysis.seasonalPattern.bestMonths.join(', ')}
                        </div>` : ''}
                </div>
            `;
        }).join('');
        
        // Render mini price history charts after DOM update
        setTimeout(() => this.renderPriceCharts(), 100);
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
    
    // Price History and Alert System Methods
    loadAlertSettings() {
        const saved = localStorage.getItem('pricecompare-alert-settings');
        return saved ? JSON.parse(saved) : {
            enabled: true,
            priceDropThreshold: 10, // percentage
            significantChangeAmount: 0.50, // dollars
            newLowPriceAlert: true,
            bestTimeToBuyAlert: true,
            emailNotifications: false
        };
    }
    
    saveAlertSettings() {
        localStorage.setItem('pricecompare-alert-settings', JSON.stringify(this.alertSettings));
    }
    
    loadWatchedProducts() {
        const saved = localStorage.getItem('pricecompare-watched-products');
        if (saved) {
            this.watchedProducts = new Set(JSON.parse(saved));
        }
    }
    
    saveWatchedProducts() {
        localStorage.setItem('pricecompare-watched-products', JSON.stringify([...this.watchedProducts]));
    }
    
    processHistoricalData() {
        this.products.forEach(product => {
            if (product.priceHistory && product.priceHistory.length > 0) {
                this.calculatePriceTrends(product);
            }
        });
    }
    
    calculatePriceTrends(product) {
        const history = product.priceHistory;
        if (history.length < 2) return;
        
        // Get latest prices vs 7 days ago
        const latest = history[0];
        const weekAgo = history[Math.min(6, history.length - 1)];
        
        let weeklyChange = 0;
        let count = 0;
        
        Object.keys(latest.prices).forEach(store => {
            if (weekAgo.prices[store]) {
                const change = latest.prices[store] - weekAgo.prices[store];
                weeklyChange += change;
                count++;
            }
        });
        
        if (count > 0) {
            const avgWeeklyChange = weeklyChange / count;
            const percentage = ((avgWeeklyChange / (weeklyChange / count + weekAgo.prices[Object.keys(weekAgo.prices)[0]])) * 100);
            
            if (!product.priceAnalysis) product.priceAnalysis = {};
            product.priceAnalysis.calculatedWeeklyTrend = percentage.toFixed(1);
        }
    }
    
    calculateTrend(priceHistory) {
        if (!priceHistory || priceHistory.length < 2) return null;
        
        const latest = priceHistory[0];
        const previous = priceHistory[1];
        
        let avgLatest = 0, avgPrevious = 0, count = 0;
        
        Object.keys(latest.prices).forEach(store => {
            if (previous.prices[store]) {
                avgLatest += latest.prices[store];
                avgPrevious += previous.prices[store];
                count++;
            }
        });
        
        if (count === 0) return null;
        
        avgLatest /= count;
        avgPrevious /= count;
        
        const change = avgLatest - avgPrevious;
        const percentage = Math.abs((change / avgPrevious) * 100);
        
        if (Math.abs(change) < 0.05) return null; // No significant change
        
        return {
            direction: change > 0 ? 'up' : 'down',
            text: `${percentage.toFixed(1)}% depuis hier`,
            change: change.toFixed(2)
        };
    }
    
    checkForAlerts() {
        if (!this.alertSettings.enabled) return;
        
        this.products.forEach(product => {
            const isWatched = this.watchedProducts.has(product.id || product.name);
            const analysis = product.priceAnalysis;
            
            if (!analysis) return;
            
            // Check for significant price drops
            if (analysis.lastPriceChange && parseFloat(analysis.lastPriceChange.change) < 0) {
                const dropAmount = Math.abs(parseFloat(analysis.lastPriceChange.change));
                const percentage = Math.abs(parseFloat(analysis.weeklyTrend) || 0);
                
                if (percentage >= this.alertSettings.priceDropThreshold || 
                    dropAmount >= this.alertSettings.significantChangeAmount) {
                    
                    this.createAlert({
                        type: 'price_drop',
                        productId: product.id || product.name,
                        productName: product.name,
                        message: `Prix ${product.name} baissé de ${percentage.toFixed(1)}% chez ${this.getStoreName(analysis.lastPriceChange.store)}!`,
                        data: {
                            store: analysis.lastPriceChange.store,
                            oldPrice: null,
                            newPrice: analysis.lastPriceChange.change,
                            savings: dropAmount,
                            percentage: percentage
                        },
                        priority: percentage > 15 ? 'high' : 'medium'
                    });
                }
            }
            
            // Check for best time to buy recommendations
            if (this.alertSettings.bestTimeToBuyAlert && analysis.bestHistoricalPrice) {
                const currentPrices = product.prices || [];
                const bestCurrentPrice = Math.min(...currentPrices.map(p => p.price));
                
                if (bestCurrentPrice <= analysis.bestHistoricalPrice.price * 1.05) { // Within 5% of historical best
                    this.createAlert({
                        type: 'best_time_to_buy',
                        productId: product.id || product.name,
                        productName: product.name,
                        message: `C'est le moment d'acheter ${product.name} - près du meilleur prix historique!`,
                        data: {
                            currentPrice: bestCurrentPrice,
                            historicalBest: analysis.bestHistoricalPrice.price,
                            savings: analysis.bestHistoricalPrice.price - bestCurrentPrice
                        },
                        priority: 'medium'
                    });
                }
            }
        });
    }
    
    createAlert(alertData) {
        const existingAlert = this.notifications.find(n => 
            n.productId === alertData.productId && n.type === alertData.type
        );
        
        if (existingAlert) return; // Don't duplicate alerts
        
        const alert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            read: false,
            ...alertData
        };
        
        this.notifications.unshift(alert);
        
        // Keep only latest 20 notifications
        if (this.notifications.length > 20) {
            this.notifications = this.notifications.slice(0, 20);
        }
        
        this.saveNotifications();
    }
    
    saveNotifications() {
        localStorage.setItem('pricecompare-notifications', JSON.stringify(this.notifications));
    }
    
    loadNotifications() {
        const saved = localStorage.getItem('pricecompare-notifications');
        if (saved) {
            this.notifications = JSON.parse(saved);
        }
    }
    
    displayNotifications() {
        const unreadNotifications = this.notifications.filter(n => !n.read).slice(0, 3);
        const container = document.getElementById('notificationContainer');
        
        if (!container || unreadNotifications.length === 0) return;
        
        container.innerHTML = unreadNotifications.map(notification => `
            <div class="notification ${notification.priority || 'medium'}" data-notification-id="${notification.id}">
                <div class="notification-header">
                    <i class="fas ${
                        notification.type === 'price_drop' ? 'fa-arrow-down' :
                        notification.type === 'best_time_to_buy' ? 'fa-clock' :
                        'fa-info-circle'
                    }"></i>
                    <span class="notification-time">${this.formatTimeAgo(notification.timestamp)}</span>
                    <button class="notification-close" data-notification-id="${notification.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="notification-message">${notification.message}</div>
                ${notification.data ? `
                    <div class="notification-details">
                        ${notification.type === 'price_drop' && notification.data.savings ? 
                            `Économisez ${notification.data.savings.toFixed(2)}$` : ''}
                        ${notification.type === 'best_time_to_buy' && notification.data.currentPrice ? 
                            `Prix actuel: ${notification.data.currentPrice.toFixed(2)}$` : ''}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    dismissNotification(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.displayNotifications();
        }
    }
    
    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMinutes = Math.floor((now - time) / (1000 * 60));
        
        if (diffMinutes < 60) return `${diffMinutes}m`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
        return `${Math.floor(diffMinutes / 1440)}j`;
    }
    
    renderPriceCharts() {
        this.products.forEach(product => {
            if (!product.priceHistory || product.priceHistory.length === 0) return;
            
            const canvasId = `chart-${product.id || product.name.replace(/\s+/g, '-')}`;
            const canvas = document.getElementById(canvasId);
            
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            
            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            
            // Get price data for chart (last 7 days)
            const historyToShow = product.priceHistory.slice(0, 7).reverse();
            const prices = historyToShow.map(day => {
                const dayPrices = Object.values(day.prices);
                return dayPrices.reduce((sum, price) => sum + price, 0) / dayPrices.length;
            });
            
            if (prices.length < 2) return;
            
            // Find min/max for scaling
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const priceRange = maxPrice - minPrice;
            
            // Draw line chart
            const xStep = width / (prices.length - 1);
            
            ctx.strokeStyle = priceRange === 0 ? '#95a5a6' : (prices[prices.length - 1] < prices[0] ? '#27ae60' : '#e74c3c');
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            prices.forEach((price, index) => {
                const x = index * xStep;
                const y = priceRange === 0 ? height / 2 : height - ((price - minPrice) / priceRange * height);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Draw points
            ctx.fillStyle = ctx.strokeStyle;
            prices.forEach((price, index) => {
                const x = index * xStep;
                const y = priceRange === 0 ? height / 2 : height - ((price - minPrice) / priceRange * height);
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, 2 * Math.PI);
                ctx.fill();
            });
        });
    }
    
    openAlertSettings() {
        // Create modal for alert settings
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Paramètres d'alerte</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="alertsEnabled" ${this.alertSettings.enabled ? 'checked' : ''}>
                            Activer les alertes
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>Seuil de baisse de prix (%):</label>
                        <input type="number" id="priceDropThreshold" value="${this.alertSettings.priceDropThreshold}" min="1" max="50">
                    </div>
                    <div class="setting-item">
                        <label>Montant de changement significatif ($):</label>
                        <input type="number" id="significantChangeAmount" value="${this.alertSettings.significantChangeAmount}" min="0.10" max="10" step="0.10">
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="newLowPriceAlert" ${this.alertSettings.newLowPriceAlert ? 'checked' : ''}>
                            Alerter pour nouveaux prix bas
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="bestTimeToBuyAlert" ${this.alertSettings.bestTimeToBuyAlert ? 'checked' : ''}>
                            Recommandations "meilleur moment d'achat"
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
                    <button class="btn-primary" onclick="window.priceCompareApp.saveAlertSettingsFromModal()">Sauvegarder</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    saveAlertSettingsFromModal() {
        this.alertSettings = {
            enabled: document.getElementById('alertsEnabled').checked,
            priceDropThreshold: parseFloat(document.getElementById('priceDropThreshold').value),
            significantChangeAmount: parseFloat(document.getElementById('significantChangeAmount').value),
            newLowPriceAlert: document.getElementById('newLowPriceAlert').checked,
            bestTimeToBuyAlert: document.getElementById('bestTimeToBuyAlert').checked,
            emailNotifications: this.alertSettings.emailNotifications
        };
        
        this.saveAlertSettings();
        document.querySelector('.modal-overlay').remove();
        showNotification('Paramètres d\'alerte sauvegardés!', 'success');
    }
}

// Global functions for HTML onclick events
function toggleWatch(productId) {
    if (window.priceCompareApp.watchedProducts.has(productId)) {
        window.priceCompareApp.watchedProducts.delete(productId);
        showNotification('Produit retiré de la surveillance', 'info');
    } else {
        window.priceCompareApp.watchedProducts.add(productId);
        showNotification('Produit ajouté à la surveillance', 'success');
    }
    
    window.priceCompareApp.saveWatchedProducts();
    window.priceCompareApp.renderProducts();
}

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
    
    // Load notifications on startup
    window.priceCompareApp.loadNotifications();
    
    // Check for alerts every 5 minutes
    setInterval(() => {
        window.priceCompareApp.checkForAlerts();
        window.priceCompareApp.displayNotifications();
    }, 300000);
});