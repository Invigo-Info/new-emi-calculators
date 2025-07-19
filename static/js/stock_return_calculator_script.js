// Stock Return Calculator JavaScript

let stockReturnChart = null;

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeStockReturnCalculator();
    setupEventListeners();
    setupNavigationListeners();
    calculateStockReturns(); // Initial calculation
});

function initializeStockReturnCalculator() {
    // Set default values if not already set
    const defaultValues = {
        buyPrice: 1000,
        sellPrice: 1600,
        numShares: 10,
        holdingYears: 3,
        dividends: 500
    };

    Object.entries(defaultValues).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element && !element.value) {
            element.value = value;
        }
    });
}

function setupEventListeners() {
    // Add event listeners to all input fields
    const inputFields = ['buyPrice', 'sellPrice', 'numShares', 'holdingYears', 'dividends'];
    
    inputFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.addEventListener('input', debounce(calculateStockReturns, 300));
            element.addEventListener('change', calculateStockReturns);
            element.addEventListener('blur', validateInput);
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function validateInput(event) {
    const input = event.target;
    const value = parseFloat(input.value);
    
    // Remove existing validation classes
    input.classList.remove('error', 'success');
    
    // Validate based on field type
    let isValid = true;
    
    if (input.id === 'dividends') {
        // Dividends can be 0 or positive
        isValid = value >= 0;
    } else {
        // All other fields must be positive
        isValid = value > 0;
    }
    
    // Apply validation styling
    if (isValid) {
        input.classList.add('success');
    } else {
        input.classList.add('error');
    }
    
    return isValid;
}

function calculateStockReturns() {
    // Get input values
    const buyPrice = parseFloat(document.getElementById('buyPrice').value) || 0;
    const sellPrice = parseFloat(document.getElementById('sellPrice').value) || 0;
    const numShares = parseInt(document.getElementById('numShares').value) || 0;
    const holdingYears = parseFloat(document.getElementById('holdingYears').value) || 0;
    const dividends = parseFloat(document.getElementById('dividends').value) || 0;

    // Validate inputs
    if (buyPrice <= 0 || sellPrice <= 0 || numShares <= 0 || holdingYears <= 0) {
        displayError('Please enter valid positive values for all required fields.');
        return;
    }

    // Prepare data for API call
    const requestData = {
        buyPrice: buyPrice,
        sellPrice: sellPrice,
        numShares: numShares,
        holdingYears: holdingYears,
        dividends: dividends
    };

    // Show loading state
    showLoadingState(true);

    // Make API call to calculate stock returns
    fetch('/calculate-stock-return', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        showLoadingState(false);
        
        if (data.status === 'success') {
            updateStockReturnResults(data);
            updateStockReturnChart(data);
        } else {
            displayError(data.error || 'Calculation failed. Please check your inputs.');
        }
    })
    .catch(error => {
        showLoadingState(false);
        console.error('Calculation error:', error);
        displayError('Network error occurred. Please try again.');
    });
}

function updateStockReturnResults(data) {
    // Update result cards with calculated values
    document.getElementById('totalInvestedResult').textContent = formatCurrency(data.total_invested);
    document.getElementById('totalValueResult').textContent = formatCurrency(data.total_value);
    document.getElementById('netProfitResult').textContent = formatCurrency(data.net_profit);
    document.getElementById('absoluteReturnResult').textContent = formatPercentage(data.absolute_return);
    document.getElementById('cagrResult').textContent = formatPercentage(data.cagr);

    // Update chart summary
    document.getElementById('investedAmountDisplay').textContent = formatCurrency(data.total_invested);
    document.getElementById('profitGeneratedDisplay').textContent = formatCurrency(data.net_profit);

    // Apply profit/loss styling to result cards
    const resultCards = document.querySelectorAll('.result-card');
    resultCards.forEach(card => {
        card.classList.remove('profitable', 'loss');
        if (data.is_profitable) {
            card.classList.add('profitable');
        } else {
            card.classList.add('loss');
        }
        card.classList.add('animate');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            card.classList.remove('animate');
        }, 500);
    });
}

function updateStockReturnChart(data) {
    const ctx = document.getElementById('stockReturnChart').getContext('2d');

    // Destroy existing chart if it exists
    if (stockReturnChart) {
        stockReturnChart.destroy();
    }

    // Prepare chart data
    const chartData = {
        labels: ['Initial Investment', 'Total Value'],
        datasets: [{
            label: 'Amount (₹)',
            data: [data.total_invested, data.total_value],
            backgroundColor: [
                '#667eea',
                data.is_profitable ? '#48bb78' : '#f56565'
            ],
            borderColor: [
                '#5a67d8',
                data.is_profitable ? '#38a169' : '#e53e3e'
            ],
            borderWidth: 2,
            hoverBackgroundColor: [
                '#5a67d8',
                data.is_profitable ? '#38a169' : '#e53e3e'
            ],
            hoverBorderColor: [
                '#4c51bf',
                data.is_profitable ? '#2f855a' : '#c53030'
            ]
        }]
    };

    // Chart configuration
    const chartConfig = {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 14,
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.raw);
                            const percentage = ((context.raw / data.total_value) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000,
                easing: 'easeOutQuart'
            },
            elements: {
                arc: {
                    borderWidth: 2,
                    hoverBorderWidth: 3
                }
            }
        },
        plugins: [{
            id: 'centerText',
            beforeDraw: function(chart) {
                if (chart.config.type === 'doughnut') {
                    const ctx = chart.ctx;
                    const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
                    const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Main text (Profit/Loss)
                    ctx.font = 'bold 18px Inter';
                    ctx.fillStyle = data.is_profitable ? '#48bb78' : '#f56565';
                    ctx.fillText(
                        data.is_profitable ? 'PROFIT' : 'LOSS',
                        centerX,
                        centerY - 10
                    );

                    // Value text
                    ctx.font = 'bold 16px Inter';
                    ctx.fillStyle = '#2d3748';
                    ctx.fillText(
                        formatCurrency(Math.abs(data.net_profit)),
                        centerX,
                        centerY + 15
                    );

                    ctx.restore();
                }
            }
        }]
    };

    // Create new chart
    stockReturnChart = new Chart(ctx, chartConfig);
}



function showLoadingState(isLoading) {
    const resultCards = document.querySelectorAll('.result-card');
    const chartSection = document.querySelector('.chart-section');
    
    if (isLoading) {
        resultCards.forEach(card => card.classList.add('loading'));
        if (chartSection) chartSection.classList.add('loading');
    } else {
        resultCards.forEach(card => card.classList.remove('loading'));
        if (chartSection) chartSection.classList.remove('loading');
    }
}

function displayError(message) {
    // Create or update error message element
    let errorElement = document.getElementById('errorMessage');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'errorMessage';
        errorElement.style.cssText = `
            background: #fed7d7;
            color: #c53030;
            padding: 12px 16px;
            border-radius: 8px;
            margin: 10px 0;
            border: 1px solid #feb2b2;
            font-weight: 500;
            text-align: center;
        `;
        
        const inputSections = document.querySelector('.input-sections');
        if (inputSections) {
            inputSections.appendChild(errorElement);
        }
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }, 5000);
}

function formatCurrency(amount) {
    if (amount === 0) return '₹0';
    
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    
    if (absAmount >= 10000000) { // 1 Crore
        return `${sign}₹${(absAmount / 10000000).toFixed(2)} Cr`;
    } else if (absAmount >= 100000) { // 1 Lakh
        return `${sign}₹${(absAmount / 100000).toFixed(2)} L`;
    } else if (absAmount >= 1000) { // 1 Thousand
        return `${sign}₹${(absAmount / 1000).toFixed(2)} K`;
    } else {
        return `${sign}₹${absAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    }
}

function formatPercentage(value) {
    if (value === 0) return '0.00%';
    const sign = value < 0 ? '-' : '';
    return `${sign}${Math.abs(value).toFixed(2)}%`;
}

// Keyboard navigation support
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && event.target.type === 'number') {
        calculateStockReturns();
    }
});

// Window resize handler for chart responsiveness
window.addEventListener('resize', debounce(function() {
    if (stockReturnChart) {
        stockReturnChart.resize();
    }
}, 250));

function setupNavigationListeners() {
    // Setup mega menu functionality for all menu containers
    const megaMenuContainers = document.querySelectorAll('.mega-menu-container');
    
    megaMenuContainers.forEach(container => {
        const trigger = container.querySelector('.mega-menu-trigger');
        const menu = container.querySelector('.mega-menu');
        const overlay = container.querySelector('.mega-menu-overlay');
        const closeBtn = container.querySelector('.mega-menu-close');
        
        if (trigger && menu) {
            // Toggle menu on trigger click
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other open menus
                megaMenuContainers.forEach(otherContainer => {
                    if (otherContainer !== container) {
                        otherContainer.classList.remove('open');
                    }
                });
                
                // Toggle current menu
                container.classList.toggle('open');
            });
            
            // Close menu on overlay click (if exists)
            if (overlay) {
                overlay.addEventListener('click', function() {
                    container.classList.remove('open');
                });
            }
            
            // Close menu on close button click (if exists)
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    container.classList.remove('open');
                });
            }
            
            // Close menu when clicking on links
            const megaLinks = menu.querySelectorAll('.mega-menu-link');
            megaLinks.forEach(link => {
                link.addEventListener('click', function() {
                    container.classList.remove('open');
                });
            });
        }
    });
    
    // Close all menus when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.mega-menu-container')) {
            megaMenuContainers.forEach(container => {
                container.classList.remove('open');
            });
        }
    });
    
    // Close menus on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            megaMenuContainers.forEach(container => {
                container.classList.remove('open');
            });
        }
    });
}