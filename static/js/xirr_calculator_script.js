// XIRR Calculator JavaScript
// Using unique function names to avoid conflicts with existing calculators

// Global variables for XIRR calculator
let xirrCashFlowChart;
let xirrRowCounter = 0;
let isXirrCalculating = false;
let calculationTimeout = null;

// Debounce function for automatic calculations
function debounceCalculation(func, delay) {
    return function(...args) {
        clearTimeout(calculationTimeout);
        calculationTimeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Create debounced version of calculateXIRRAnalysis
const debouncedCalculateXIRR = debounceCalculation(calculateXIRRAnalysis, 600);

// Initialize XIRR calculator when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeXirrCalculator();
    setupNavigationListeners();
});

function initializeXirrCalculator() {
    console.log('Initializing XIRR Calculator');
    
    // Add initial cash flow rows
    addInitialXirrRows();
    
    // Initialize chart
    initializeXirrChart();
    
    // Setup mega menu
    setupXirrMegaMenu();
    
    // Perform initial calculation with a longer delay to ensure DOM is ready
    setTimeout(() => {
        if (validateXirrInputs()) {
            calculateXIRRAnalysis();
        } else {
            clearXirrResults();
        }
    }, 1000);
}

function addInitialXirrRows() {
    // Add 3 initial rows with sample data
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, today.getDate());
    
    addXirrCashFlowRow(twoMonthsAgo.toISOString().split('T')[0], -10000);
    addXirrCashFlowRow(oneMonthAgo.toISOString().split('T')[0], -5000);
    addXirrCashFlowRow(today.toISOString().split('T')[0], 16000);
}

function addCashFlowRow(date = '', amount = '') {
    addXirrCashFlowRow(date, amount);
}

function addXirrCashFlowRow(date = '', amount = '') {
    xirrRowCounter++;
    
    const container = document.getElementById('cashFlowsContainer');
    const rowDiv = document.createElement('div');
    rowDiv.className = 'cash-flow-row fade-in';
    rowDiv.setAttribute('data-row-id', xirrRowCounter);
    
    rowDiv.innerHTML = `
        <div class="input-group">
            <label class="input-label">Date</label>
            <input type="date" 
                   class="input-field date-input" 
                   value="${date}"
                   required>
        </div>
        
        <div class="input-group">
            <label class="input-label">Amount (₹)</label>
            <input type="number" 
                   class="input-field amount-input" 
                   value="${amount}"
                   placeholder="Enter amount"
                   step="0.01"
                   required>
        </div>
        
        <button type="button" 
                class="remove-row-btn" 
                onclick="removeXirrCashFlowRow(${xirrRowCounter})"
                ${xirrRowCounter <= 2 ? 'style="display: none;"' : ''}>
            🗑️ Remove
        </button>
    `;
    
    container.appendChild(rowDiv);
    
    // Add event listeners for real-time calculation
    const dateInput = rowDiv.querySelector('.date-input');
    const amountInput = rowDiv.querySelector('.amount-input');
    
    [dateInput, amountInput].forEach(input => {
        input.addEventListener('input', () => {
            validateXirrInputs();
            debouncedCalculateXIRR();
        });
        input.addEventListener('change', () => {
            validateXirrInputs();
            debouncedCalculateXIRR();
        });
    });
    
    // Auto-focus the amount input for new rows
    if (!amount) {
        setTimeout(() => amountInput.focus(), 100);
    }
}

function removeXirrCashFlowRow(rowId) {
    const row = document.querySelector(`[data-row-id="${rowId}"]`);
    if (row) {
        row.remove();
        updateXirrRemoveButtons();
        validateXirrInputs();
        // Trigger recalculation after removing a row
        debouncedCalculateXIRR();
    }
}

function updateXirrRemoveButtons() {
    const rows = document.querySelectorAll('.cash-flow-row');
    const removeButtons = document.querySelectorAll('.remove-row-btn');
    
    removeButtons.forEach((btn, index) => {
        if (rows.length <= 2) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'block';
        }
    });
}

function validateXirrInputs() {
    const rows = document.querySelectorAll('.cash-flow-row');
    let hasValidData = false;
    let hasPositive = false;
    let hasNegative = false;
    
    rows.forEach(row => {
        const dateInput = row.querySelector('.date-input');
        const amountInput = row.querySelector('.amount-input');
        
        if (dateInput.value && amountInput.value && parseFloat(amountInput.value) !== 0) {
            hasValidData = true;
            
            const amount = parseFloat(amountInput.value);
            if (amount > 0) hasPositive = true;
            if (amount < 0) hasNegative = true;
        }
    });
    
    // Return validation status for automatic calculation
    return hasValidData && hasPositive && hasNegative && rows.length >= 2;
}

async function calculateXIRRAnalysis() {
    if (isXirrCalculating) return;
    
    try {
        isXirrCalculating = true;
        
        // Collect cash flow data
        const cashFlows = collectXirrCashFlows();
        
        if (!cashFlows || cashFlows.length < 2) {
            // Clear results if insufficient data
            clearXirrResults();
            return;
        }
        
        // Validate cash flows
        if (!validateXirrCashFlows(cashFlows)) {
            return;
        }
        
        // Show loading state in results
        showXirrLoadingState();
        
        // Send data to Flask backend
        const response = await fetch('/calculate-xirr-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cashFlows: cashFlows
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
            showXirrError(data.error);
            return;
        }
        
        // Update results display
        updateXirrResults(data);
        
    } catch (error) {
        console.error('XIRR calculation error:', error);
        showXirrError('Error calculating XIRR. Please check your inputs and try again.');
    } finally {
        isXirrCalculating = false;
    }
}

function collectXirrCashFlows() {
    const cashFlows = [];
    const rows = document.querySelectorAll('.cash-flow-row');
    
    rows.forEach(row => {
        const dateInput = row.querySelector('.date-input');
        const amountInput = row.querySelector('.amount-input');
        
        if (dateInput.value && amountInput.value) {
            const amount = parseFloat(amountInput.value);
            if (amount !== 0) {
                cashFlows.push({
                    date: dateInput.value,
                    amount: amount
                });
            }
        }
    });
    
    // Sort by date
    cashFlows.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return cashFlows;
}

function validateXirrCashFlows(cashFlows) {
    if (cashFlows.length < 2) {
        clearXirrResults();
        return false;
    }
    
    const hasPositive = cashFlows.some(cf => cf.amount > 0);
    const hasNegative = cashFlows.some(cf => cf.amount < 0);
    
    if (!hasPositive || !hasNegative) {
        clearXirrResults();
        return false;
    }
    
    return true;
}

// Helper functions for result management
function clearXirrResults() {
    // Clear all summary card values
    document.getElementById('totalInvestedDisplay').textContent = '₹0';
    document.getElementById('totalWithdrawnDisplay').textContent = '₹0';
    document.getElementById('netGainLossDisplay').textContent = '₹0';
    document.getElementById('xirrDisplay').textContent = '--%';
    
    // Reset styling
    const netElement = document.getElementById('netGainLossDisplay');
    const gainCard = netElement.closest('.summary-card');
    gainCard.style.borderLeftColor = '#e2e8f0';
    netElement.style.color = '#64748b';
    
    const xirrElement = document.getElementById('xirrDisplay');
    xirrElement.style.color = '#64748b';
    
    // Clear chart
    if (xirrCashFlowChart) {
        xirrCashFlowChart.data.labels = [];
        xirrCashFlowChart.data.datasets[0].data = [];
        xirrCashFlowChart.update();
    }
    
    // Clear any error/success messages
    clearXirrMessages();
}

function showXirrLoadingState() {
    // Show loading indicators in result cards
    document.getElementById('totalInvestedDisplay').textContent = '...';
    document.getElementById('totalWithdrawnDisplay').textContent = '...';
    document.getElementById('netGainLossDisplay').textContent = '...';
    document.getElementById('xirrDisplay').textContent = '...';
}

function clearXirrMessages() {
    // Remove any existing message elements
    const existingMessages = document.querySelectorAll('.xirr-message');
    existingMessages.forEach(msg => msg.remove());
}

function updateXirrResults(data) {
    // Clear any previous messages
    clearXirrMessages();
    
    // Update summary cards
    document.getElementById('totalInvestedDisplay').textContent = formatXirrCurrency(data.total_invested);
    document.getElementById('totalWithdrawnDisplay').textContent = formatXirrCurrency(data.total_withdrawn);
    
    const netGainLoss = data.net_gain_loss;
    const netElement = document.getElementById('netGainLossDisplay');
    netElement.textContent = formatXirrCurrency(Math.abs(netGainLoss));
    
    // Update gain/loss card styling
    const gainCard = netElement.closest('.summary-card');
    if (netGainLoss >= 0) {
        gainCard.style.borderLeftColor = '#10b981';
        netElement.style.color = '#10b981';
    } else {
        gainCard.style.borderLeftColor = '#dc2626';
        netElement.style.color = '#dc2626';
        netElement.textContent = '-' + netElement.textContent;
    }
    
    // Update XIRR display
    const xirrElement = document.getElementById('xirrDisplay');
    if (data.xirr_percentage !== null && data.xirr_percentage !== undefined) {
        xirrElement.textContent = data.xirr_percentage.toFixed(2) + '%';
        
        // Color code XIRR
        if (data.xirr_percentage >= 0) {
            xirrElement.style.color = 'white';
        } else {
            xirrElement.style.color = '#fecaca';
        }
    } else {
        xirrElement.textContent = 'N/A';
        xirrElement.style.color = '#fecaca';
    }
    
    // Update chart
    updateXirrChart(data);
    
    // Show success message briefly for automatic calculations
    if (data.cash_flow_count >= 2) {
        showXirrSuccess(`XIRR: ${data.xirr_percentage ? data.xirr_percentage.toFixed(2) + '%' : 'N/A'} (${data.cash_flow_count} transactions)`);
    }
}

function initializeXirrChart() {
    const ctx = document.getElementById('cashFlowChart');
    if (!ctx) return;
    
    xirrCashFlowChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Cumulative Cash Flow',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            return 'Cumulative: ' + formatXirrCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 12,
                            weight: 500
                        }
                    }
                },
                y: {
                    grid: {
                        color: '#f3f4f6',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 12,
                            weight: 500
                        },
                        callback: function(value) {
                            return formatXirrCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function updateXirrChart(data) {
    if (!xirrCashFlowChart || !data.cumulative_flows) return;
    
    const labels = data.cumulative_flows.map(item => item.label);
    const values = data.cumulative_flows.map(item => item.amount);
    
    xirrCashFlowChart.data.labels = labels;
    xirrCashFlowChart.data.datasets[0].data = values;
    
    // Update colors based on final value
    const finalValue = values[values.length - 1] || 0;
    if (finalValue >= 0) {
        xirrCashFlowChart.data.datasets[0].borderColor = '#10b981';
        xirrCashFlowChart.data.datasets[0].backgroundColor = 'rgba(16, 185, 129, 0.1)';
        xirrCashFlowChart.data.datasets[0].pointBackgroundColor = '#10b981';
    } else {
        xirrCashFlowChart.data.datasets[0].borderColor = '#dc2626';
        xirrCashFlowChart.data.datasets[0].backgroundColor = 'rgba(220, 38, 38, 0.1)';
        xirrCashFlowChart.data.datasets[0].pointBackgroundColor = '#dc2626';
    }
    
    xirrCashFlowChart.update('active');
}

// Utility functions
function formatXirrCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '₹0';
    }
    
    const absAmount = Math.abs(amount);
    
    if (absAmount >= 10000000) {
        return '₹' + (amount / 10000000).toFixed(2) + 'Cr';
    } else if (absAmount >= 100000) {
        return '₹' + (amount / 100000).toFixed(2) + 'L';
    } else if (absAmount >= 1000) {
        return '₹' + (amount / 1000).toFixed(1) + 'K';
    } else {
        return '₹' + amount.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }
}

function showXirrError(message) {
    removeXirrMessages();
    
    const container = document.querySelector('.cash-flow-section');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error fade-in';
    errorDiv.textContent = message;
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function showXirrSuccess(message) {
    removeXirrMessages();
    
    const container = document.querySelector('.cash-flow-section');
    const successDiv = document.createElement('div');
    successDiv.className = 'success fade-in';
    successDiv.textContent = message;
    container.insertBefore(successDiv, container.firstChild);
    
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

function removeXirrMessages() {
    const messages = document.querySelectorAll('.error, .success');
    messages.forEach(msg => msg.remove());
}

// Mega menu functionality
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

function setupXirrMegaMenu() {
    // This function is kept for compatibility but navigation is now handled by setupNavigationListeners
    console.log('Navigation handled by setupNavigationListeners');
}

// Export functions for global access (if needed)
window.addCashFlowRow = addCashFlowRow;
window.calculateXIRRAnalysis = calculateXIRRAnalysis;
window.toggleMegaMenu = toggleMegaMenu;