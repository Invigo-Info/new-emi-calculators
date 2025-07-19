// SIP Calculator vs Interest Calculator JavaScript

let growthChart = null;
let pieChart = null;

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSipVsInterestCalculator();
    setupEventListeners();
    // loadFromUrlParameters(); // Commented out to prevent URL parameters
    calculateAndDisplay();
});

function initializeSipVsInterestCalculator() {
    // Setup mega menu functionality
    setupMegaMenu();
    
    // Initialize slider synchronization
    syncInputsWithSliders();
    
    // Initial calculation
    calculateAndDisplay();
}

function setupMegaMenu() {
    // Mega menu functionality
    const megaMenuContainers = document.querySelectorAll('.mega-menu-container');
    
    megaMenuContainers.forEach(container => {
        const trigger = container.querySelector('.mega-menu-trigger');
        const menu = container.querySelector('.mega-menu');
        const close = container.querySelector('.mega-menu-close');
        
        if (trigger && menu) {
            trigger.addEventListener('click', (e) => {
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
            
            if (close) {
                close.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    container.classList.remove('open');
                });
            }
        }
    });
    
    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.mega-menu-container')) {
            megaMenuContainers.forEach(container => {
                container.classList.remove('open');
            });
        }
    });
    
    // Close menus on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            megaMenuContainers.forEach(container => {
                container.classList.remove('open');
            });
        }
    });
}

function setupEventListeners() {
    // Input field event listeners
    const inputs = [
        'sipAmount', 'sipYears', 'sipReturn',
        'principalAmount', 'interestYears', 'interestRate', 'compoundingFrequency'
    ];
    
    inputs.forEach(inputId => {
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.addEventListener('input', handleInputChange);
            inputElement.addEventListener('change', handleInputChange);
        }
    });
    
    // Slider event listeners
    const sliders = [
        'sipAmountSlider', 'sipYearsSlider', 'sipReturnSlider',
        'principalAmountSlider', 'interestYearsSlider', 'interestRateSlider'
    ];
    
    sliders.forEach(sliderId => {
        const sliderElement = document.getElementById(sliderId);
        if (sliderElement) {
            sliderElement.addEventListener('input', handleSliderChange);
        }
    });
}

function handleInputChange(event) {
    const inputId = event.target.id;
    const sliderId = inputId + 'Slider';
    const sliderElement = document.getElementById(sliderId);
    
    if (sliderElement) {
        sliderElement.value = event.target.value;
    }
    
    // Validate input
    validateInput(event.target);
    
    // Debounced calculation
    debounceCalculation();
}

function handleSliderChange(event) {
    const sliderId = event.target.id;
    const inputId = sliderId.replace('Slider', '');
    const inputElement = document.getElementById(inputId);
    
    if (inputElement) {
        inputElement.value = event.target.value;
    }
    
    // Immediate calculation for sliders
    calculateAndDisplay();
}

function validateInput(inputElement) {
    const value = parseFloat(inputElement.value);
    const min = parseFloat(inputElement.min);
    const max = parseFloat(inputElement.max);
    
    if (isNaN(value) || value < min || value > max) {
        inputElement.style.borderColor = '#ef4444';
        return false;
    } else {
        inputElement.style.borderColor = '#e5e7eb';
        return true;
    }
}

function syncInputsWithSliders() {
    const inputSliderPairs = [
        { input: 'sipAmount', slider: 'sipAmountSlider' },
        { input: 'sipYears', slider: 'sipYearsSlider' },
        { input: 'sipReturn', slider: 'sipReturnSlider' },
        { input: 'principalAmount', slider: 'principalAmountSlider' },
        { input: 'interestYears', slider: 'interestYearsSlider' },
        { input: 'interestRate', slider: 'interestRateSlider' }
    ];
    
    inputSliderPairs.forEach(({ input, slider }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync initial values
            sliderElement.value = inputElement.value;
        }
    });
}

// Debounce calculation for input changes
let calculationTimeout;
function debounceCalculation() {
    clearTimeout(calculationTimeout);
    calculationTimeout = setTimeout(calculateAndDisplay, 300);
}

function calculateAndDisplay() {
    clearErrorMessage();
    
    try {
        // Get input values
        const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 0;
        const sipYears = parseInt(document.getElementById('sipYears').value) || 0;
        const sipReturn = parseFloat(document.getElementById('sipReturn').value) || 0;
        const principalAmount = parseFloat(document.getElementById('principalAmount').value) || 0;
        const interestYears = parseInt(document.getElementById('interestYears').value) || 0;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
        const compoundingFrequency = document.getElementById('compoundingFrequency').value;
        
        // Validate inputs
        if (!validateAllInputs()) {
            return;
        }
        
        // Prepare data for API call
        const requestData = {
            sipAmount: sipAmount,
            sipYears: sipYears,
            sipReturn: sipReturn,
            principalAmount: principalAmount,
            interestYears: interestYears,
            interestRate: interestRate,
            compoundingFrequency: compoundingFrequency
        };
        
        // Make API call to calculate
        fetch('/calculate-sip-vs-interest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayResults(data);
                updateCharts(data);
                updateComparisonTable(data);
                // updateUrlParameters(requestData); // Commented out to keep clean URLs
            } else {
                showErrorMessage(data.error || 'Calculation failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showErrorMessage('Network error occurred. Please try again.');
        });
        
    } catch (error) {
        showErrorMessage('Invalid input values. Please check your entries.');
    }
}

function validateAllInputs() {
    const inputs = [
        'sipAmount', 'sipYears', 'sipReturn',
        'principalAmount', 'interestYears', 'interestRate'
    ];
    
    let allValid = true;
    
    inputs.forEach(inputId => {
        const inputElement = document.getElementById(inputId);
        if (inputElement && !validateInput(inputElement)) {
            allValid = false;
        }
    });
    
    return allValid;
}

function displayResults(data) {
    // Update SIP Results
    document.getElementById('sipInvested').textContent = formatCurrency(data.sip_invested);
    document.getElementById('sipMaturity').textContent = formatCurrency(data.sip_maturity);
    document.getElementById('sipGain').textContent = formatCurrency(data.sip_gain);
    
    // Update Interest Results
    document.getElementById('principalInvested').textContent = formatCurrency(data.principal_amount);
    document.getElementById('interestMaturity').textContent = formatCurrency(data.interest_maturity);
    document.getElementById('interestEarned').textContent = formatCurrency(data.interest_earned);
    
    // Update Comparison Summary
    document.getElementById('betterOption').textContent = data.better_option;
    document.getElementById('returnDifference').textContent = formatCurrency(data.return_difference);
    
    // Update better option styling
    const betterOptionElement = document.getElementById('betterOption');
    betterOptionElement.className = data.better_option === 'SIP' ? 'sip-better' : 'interest-better';
}

function updateCharts(data) {
    updateGrowthComparisonChart(data);
    updatePieChart(data);
}

function updateGrowthComparisonChart(data) {
    const ctx = document.getElementById('growthComparisonChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (growthChart) {
        growthChart.destroy();
    }
    
    const years = data.yearly_breakdown.map(item => `Year ${item.year}`);
    const sipValues = data.yearly_breakdown.map(item => item.sip_value);
    const interestValues = data.yearly_breakdown.map(item => item.interest_value);
    
    growthChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'SIP Value',
                    data: sipValues,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                },
                {
                    label: 'Interest Value',
                    data: interestValues,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Growth Comparison Over Time',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
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
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#6b7280'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#6b7280',
                        callback: function(value) {
                            return formatCurrencyShort(value);
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            }
        }
    });
}

function updatePieChart(data) {
    const ctx = document.getElementById('sipPieChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (pieChart) {
        pieChart.destroy();
    }
    
    const sipInvested = data.sip_invested;
    const sipGains = data.sip_gain;
    
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Amount Invested', 'Returns Generated'],
            datasets: [{
                data: [sipInvested, sipGains],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)'
                ],
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'SIP Investment Breakdown',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '500'
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
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%',
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

function formatCurrency(amount) {
    if (amount >= 10000000) { // 1 Crore or more
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) { // 1 Lakh or more
        return `₹${(amount / 100000).toFixed(2)} L`;
    } else if (amount >= 1000) { // 1 Thousand or more
        return `₹${(amount / 1000).toFixed(2)} K`;
    } else {
        return `₹${Math.round(amount).toLocaleString('en-IN')}`;
    }
}

function formatCurrencyShort(amount) {
    if (amount >= 10000000) { // 1 Crore or more
        return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) { // 1 Lakh or more
        return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) { // 1 Thousand or more
        return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
        return `₹${Math.round(amount)}`;
    }
}

function updateUrlParameters(data) {
    const params = new URLSearchParams();
    params.set('sipAmount', data.sipAmount);
    params.set('sipYears', data.sipYears);
    params.set('sipReturn', data.sipReturn);
    params.set('principalAmount', data.principalAmount);
    params.set('interestYears', data.interestYears);
    params.set('interestRate', data.interestRate);
    params.set('compoundingFrequency', data.compoundingFrequency);
    
    // Update URL without refreshing the page
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const paramMapping = {
        sipAmount: 'sipAmount',
        sipYears: 'sipYears',
        sipReturn: 'sipReturn',
        principalAmount: 'principalAmount',
        interestYears: 'interestYears',
        interestRate: 'interestRate',
        compoundingFrequency: 'compoundingFrequency'
    };
    
    // Update inputs if URL parameters exist
    Object.keys(paramMapping).forEach(param => {
        const value = urlParams.get(param);
        if (value) {
            const inputElement = document.getElementById(paramMapping[param]);
            const sliderElement = document.getElementById(paramMapping[param] + 'Slider');
            
            if (inputElement) {
                if (param === 'compoundingFrequency') {
                    inputElement.value = value;
                } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                        inputElement.value = numValue;
                        if (sliderElement) {
                            sliderElement.value = numValue;
                        }
                    }
                }
            }
        }
    });
}

function showErrorMessage(message) {
    // Remove any existing error message
    clearErrorMessage();
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Insert at the top of results section
    const resultsSection = document.querySelector('.results-section');
    if (resultsSection) {
        resultsSection.insertBefore(errorDiv, resultsSection.firstChild);
    }
}

function clearErrorMessage() {
    const existingError = document.getElementById('error-message');
    if (existingError) {
        existingError.remove();
    }
}

// Input validation on blur
document.addEventListener('DOMContentLoaded', function() {
    const numericInputs = [
        'sipAmount', 'sipYears', 'sipReturn',
        'principalAmount', 'interestYears', 'interestRate'
    ];
    
    numericInputs.forEach(inputId => {
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.addEventListener('blur', function() {
                const value = parseFloat(this.value);
                const min = parseFloat(this.min);
                const max = parseFloat(this.max);
                
                if (isNaN(value)) {
                    this.value = this.defaultValue || min;
                } else if (value < min) {
                    this.value = min;
                } else if (value > max) {
                    this.value = max;
                }
                
                // Update corresponding slider
                const sliderElement = document.getElementById(this.id + 'Slider');
                if (sliderElement) {
                    sliderElement.value = this.value;
                }
                
                calculateAndDisplay();
            });
        }
    });
});

// Additional helper functions for enhanced UX
function resetToDefaults() {
    // Reset SIP inputs
    document.getElementById('sipAmount').value = 5000;
    document.getElementById('sipYears').value = 5;
    document.getElementById('sipReturn').value = 12;
    
    // Reset Interest inputs
    document.getElementById('principalAmount').value = 300000;
    document.getElementById('interestYears').value = 5;
    document.getElementById('interestRate').value = 6.5;
    document.getElementById('compoundingFrequency').value = 'quarterly';
    
    // Reset sliders
    document.getElementById('sipAmountSlider').value = 5000;
    document.getElementById('sipYearsSlider').value = 5;
    document.getElementById('sipReturnSlider').value = 12;
    document.getElementById('principalAmountSlider').value = 300000;
    document.getElementById('interestYearsSlider').value = 5;
    document.getElementById('interestRateSlider').value = 6.5;
    
    // Recalculate
    calculateAndDisplay();
}

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'INPUT') {
            calculateAndDisplay();
        }
    }
});

// Add smooth scrolling to results when calculation is complete
function scrollToResults() {
    const resultsSection = document.querySelector('.results-section');
    if (resultsSection && window.innerWidth <= 768) {
        resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

// Enhanced error handling for network issues
function handleNetworkError() {
    showErrorMessage('Network connection issue. Please check your internet connection and try again.');
}

// Add loading state management
function showLoadingState() {
    const resultCards = document.querySelectorAll('.result-card .card-value');
    resultCards.forEach(card => {
        card.textContent = 'Calculating...';
        card.style.opacity = '0.6';
    });
}

function hideLoadingState() {
    const resultCards = document.querySelectorAll('.result-card .card-value');
    resultCards.forEach(card => {
        card.style.opacity = '1';
    });
}

// Performance optimization: throttle slider input
function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

// Apply throttling to slider events
document.addEventListener('DOMContentLoaded', function() {
    const sliders = document.querySelectorAll('input[type="range"]');
    const throttledCalculation = throttle(calculateAndDisplay, 200);
    
    sliders.forEach(slider => {
        slider.addEventListener('input', throttledCalculation);
    });
});

// Table update function
function updateComparisonTable(data) {
    const tableBody = document.getElementById('comparisonTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 0;
    const sipYears = parseInt(document.getElementById('sipYears').value) || 0;
    const sipReturn = parseFloat(document.getElementById('sipReturn').value) || 0;
    const principalAmount = parseFloat(document.getElementById('principalAmount').value) || 0;
    const interestYears = parseInt(document.getElementById('interestYears').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    
    // Generate year-wise data
    const maxYears = Math.max(sipYears, interestYears);
    
    for (let year = 1; year <= maxYears; year++) {
        // SIP calculations
        let sipInvested = year <= sipYears ? sipAmount * 12 * year : sipAmount * 12 * sipYears;
        let sipBalance = 0;
        let sipReturns = 0;
        
        if (year <= sipYears) {
            // Calculate SIP balance for current year
            const monthlyReturn = sipReturn / 100 / 12;
            const months = year * 12;
            if (monthlyReturn > 0) {
                sipBalance = sipAmount * (((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn) * (1 + monthlyReturn));
            } else {
                sipBalance = sipAmount * months;
            }
            sipReturns = sipBalance - sipInvested;
        } else {
            // After SIP period, compound the final amount
            const finalSipAmount = data.sipMaturity || 0;
            const yearsAfterSip = year - sipYears;
            sipBalance = finalSipAmount * Math.pow(1 + sipReturn / 100, yearsAfterSip);
            sipInvested = sipAmount * 12 * sipYears;
            sipReturns = sipBalance - sipInvested;
        }
        
        // Interest calculations
        let interestPrincipal = year <= interestYears ? principalAmount : principalAmount;
        let interestBalance = 0;
        let interestEarned = 0;
        
        if (year <= interestYears) {
            // Calculate compound interest
            const annualRate = interestRate / 100;
            interestBalance = principalAmount * Math.pow(1 + annualRate, year);
            interestEarned = interestBalance - principalAmount;
        } else {
            // After investment period
            const finalInterestAmount = data.interestMaturity || 0;
            const yearsAfterInterest = year - interestYears;
            interestBalance = finalInterestAmount * Math.pow(1 + interestRate / 100, yearsAfterInterest);
            interestEarned = interestBalance - principalAmount;
        }
        
        // Determine better option
        const betterOption = sipBalance > interestBalance ? 'SIP' : 'Interest';
        const advantage = Math.abs(sipBalance - interestBalance);
        const betterOptionClass = betterOption === 'SIP' ? 'sip-better' : 'interest-better';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="year-cell">${year}</td>
            <td class="amount-cell">${formatCurrencyShort(sipInvested)}</td>
            <td class="amount-cell">${formatCurrencyShort(sipReturns)}</td>
            <td class="balance-cell">${formatCurrencyShort(sipBalance)}</td>
            <td class="amount-cell">${formatCurrencyShort(interestPrincipal)}</td>
            <td class="amount-cell">${formatCurrencyShort(interestEarned)}</td>
            <td class="balance-cell">${formatCurrencyShort(interestBalance)}</td>
            <td class="better-option-cell ${betterOptionClass}">${betterOption}</td>
            <td class="amount-cell">${formatCurrencyShort(advantage)}</td>
        `;
        
        tableBody.appendChild(row);
    }
}

// Download Functions
function downloadPDF() {
    try {
        if (typeof window.jsPDF === 'undefined') {
            showNotification('PDF library not loaded. Downloading Excel instead...');
            downloadExcel();
            return;
        }
        
        const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 0;
        const sipYears = parseInt(document.getElementById('sipYears').value) || 0;
        const sipReturn = parseFloat(document.getElementById('sipReturn').value) || 0;
        const principalAmount = parseFloat(document.getElementById('principalAmount').value) || 0;
        const interestYears = parseInt(document.getElementById('interestYears').value) || 0;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
        
        const sipMaturity = parseFloat(document.getElementById('sipMaturity').textContent.replace(/[₹,]/g, '')) || 0;
        const interestMaturity = parseFloat(document.getElementById('interestMaturity').textContent.replace(/[₹,]/g, '')) || 0;
        const betterOption = document.getElementById('betterOption').textContent || '';
        const returnDifference = parseFloat(document.getElementById('returnDifference').textContent.replace(/[₹,]/g, '')) || 0;
        
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF();
        
        doc.setFont('helvetica');
        doc.setFontSize(20);
        doc.setTextColor(44, 82, 130);
        doc.text('SIP vs Interest Calculator Report', 20, 25);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Generated on: ' + new Date().toLocaleDateString(), 20, 35);
        
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Investment Parameters', 20, 50);
        
        doc.setFontSize(10);
        let yPos = 60;
        doc.text('SIP Monthly Amount: ' + formatCurrency(sipAmount), 20, yPos);
        doc.text('SIP Expected Return: ' + sipReturn + '%', 20, yPos + 8);
        doc.text('SIP Duration: ' + sipYears + ' years', 20, yPos + 16);
        doc.text('Principal Amount: ' + formatCurrency(principalAmount), 20, yPos + 24);
        doc.text('Interest Rate: ' + interestRate + '%', 20, yPos + 32);
        doc.text('Interest Duration: ' + interestYears + ' years', 20, yPos + 40);
        
        yPos += 58;
        doc.setFontSize(14);
        doc.text('Results Summary', 20, yPos);
        
        yPos += 15;
        doc.setFontSize(10);
        
        doc.setTextColor(79, 172, 254);
        doc.text('SIP Results:', 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text('Total Invested: ' + formatCurrency(sipAmount * 12 * sipYears), 25, yPos + 8);
        doc.text('Maturity Value: ' + formatCurrency(sipMaturity), 25, yPos + 16);
        doc.text('Net Gain: ' + formatCurrency(sipMaturity - (sipAmount * 12 * sipYears)), 25, yPos + 24);
        
        yPos += 35;
        
        doc.setTextColor(240, 147, 251);
        doc.text('Interest Results:', 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text('Principal Invested: ' + formatCurrency(principalAmount), 25, yPos + 8);
        doc.text('Maturity Value: ' + formatCurrency(interestMaturity), 25, yPos + 16);
        doc.text('Interest Earned: ' + formatCurrency(interestMaturity - principalAmount), 25, yPos + 24);
        
        yPos += 35;
        
        doc.setTextColor(67, 233, 123);
        doc.text('Comparison:', 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text('Better Option: ' + betterOption, 25, yPos + 8);
        doc.text('Difference: ' + formatCurrency(returnDifference), 25, yPos + 16);
        
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('This report is generated for informational purposes only.', 20, 285);
        doc.text('Please consult with a financial advisor for investment decisions.', 20, 290);
        
        doc.save('sip_vs_interest_comparison.pdf');
        showNotification('PDF downloaded successfully!');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('PDF generation failed. Downloading Excel instead...');
        downloadExcel();
    }
}

function downloadExcel() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 0;
    const sipYears = parseInt(document.getElementById('sipYears').value) || 0;
    const sipReturn = parseFloat(document.getElementById('sipReturn').value) || 0;
    const principalAmount = parseFloat(document.getElementById('principalAmount').value) || 0;
    const interestYears = parseInt(document.getElementById('interestYears').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    
    const sipMaturity = parseFloat(document.getElementById('sipMaturity').textContent.replace(/[₹,]/g, '')) || 0;
    const interestMaturity = parseFloat(document.getElementById('interestMaturity').textContent.replace(/[₹,]/g, '')) || 0;
    const betterOption = document.getElementById('betterOption').textContent || '';
    const returnDifference = parseFloat(document.getElementById('returnDifference').textContent.replace(/[₹,]/g, '')) || 0;
    
    let csvContent = "SIP vs Interest Calculator Results\n";
    csvContent += "Calculation Date," + new Date().toLocaleDateString() + "\n\n";
    
    csvContent += "Input Parameters\n";
    csvContent += "SIP Monthly Amount," + formatCurrency(sipAmount) + "\n";
    csvContent += "SIP Expected Return," + sipReturn + "%\n";
    csvContent += "SIP Duration," + sipYears + " years\n";
    csvContent += "Principal Amount," + formatCurrency(principalAmount) + "\n";
    csvContent += "Interest Rate," + interestRate + "%\n";
    csvContent += "Interest Duration," + interestYears + " years\n\n";
    
    csvContent += "Summary Results\n";
    csvContent += "Investment Type,Total Invested,Maturity Value,Net Gain\n";
    csvContent += "SIP," + formatCurrency(sipAmount * 12 * sipYears) + "," + formatCurrency(sipMaturity) + "," + formatCurrency(sipMaturity - (sipAmount * 12 * sipYears)) + "\n";
    csvContent += "Interest," + formatCurrency(principalAmount) + "," + formatCurrency(interestMaturity) + "," + formatCurrency(interestMaturity - principalAmount) + "\n\n";
    
    csvContent += "Better Option," + betterOption + "\n";
    csvContent += "Difference," + formatCurrency(returnDifference) + "\n";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sip_vs_interest_comparison.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Excel file downloaded successfully!');
}

function shareResults() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 0;
    const sipYears = parseInt(document.getElementById('sipYears').value) || 0;
    const sipReturn = parseFloat(document.getElementById('sipReturn').value) || 0;
    const principalAmount = parseFloat(document.getElementById('principalAmount').value) || 0;
    const interestYears = parseInt(document.getElementById('interestYears').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    
    const sipMaturity = parseFloat(document.getElementById('sipMaturity').textContent.replace(/[₹,]/g, '')) || 0;
    const interestMaturity = parseFloat(document.getElementById('interestMaturity').textContent.replace(/[₹,]/g, '')) || 0;
    const betterOption = document.getElementById('betterOption').textContent || '';
    const returnDifference = parseFloat(document.getElementById('returnDifference').textContent.replace(/[₹,]/g, '')) || 0;
    
    const shareText = `SIP vs Interest Comparison Results:

📊 Investment Analysis:

🚀 SIP Investment:
• Monthly Investment: ${formatCurrency(sipAmount)}
• Duration: ${sipYears} years
• Expected Return: ${sipReturn}%
• Total Invested: ${formatCurrency(sipAmount * 12 * sipYears)}
• Maturity Value: ${formatCurrency(sipMaturity)}
• Net Gain: ${formatCurrency(sipMaturity - (sipAmount * 12 * sipYears))}

🏦 Interest Investment:
• Principal Amount: ${formatCurrency(principalAmount)}
• Duration: ${interestYears} years
• Interest Rate: ${interestRate}%
• Maturity Value: ${formatCurrency(interestMaturity)}
• Interest Earned: ${formatCurrency(interestMaturity - principalAmount)}

🏆 Comparison Result:
• Better Option: ${betterOption}
• Difference: ${formatCurrency(returnDifference)}

Calculate your own: [Your Website URL]`;

    if (navigator.share) {
        navigator.share({
            title: 'SIP vs Interest Calculator Results',
            text: shareText,
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Results copied to clipboard!');
        }).catch(() => {
            // Fallback: create a text area and copy
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('Results copied to clipboard!');
        });
    }
}

// Utility function for short currency formatting
function formatCurrencyShort(amount) {
    if (amount >= 10000000) {
        return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
    } else if (amount >= 100000) {
        return '₹' + (amount / 100000).toFixed(1) + 'L';
    } else if (amount >= 1000) {
        return '₹' + (amount / 1000).toFixed(1) + 'K';
    } else {
        return '₹' + Math.round(amount);
    }
}

// Notification function
function showNotification(message) {
    // Create or update notification
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4facfe;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 500;
            max-width: 300px;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.display = 'block';
    notification.style.opacity = '1';
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Export functions for potential external use
window.SipVsInterestCalculator = {
    calculate: calculateAndDisplay,
    reset: resetToDefaults,
    formatCurrency: formatCurrency,
    showError: showErrorMessage,
    clearError: clearErrorMessage
};