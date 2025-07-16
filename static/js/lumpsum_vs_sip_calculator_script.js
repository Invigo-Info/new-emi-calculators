// Global variables
let lumpsumChart;
let sipChart;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupMegaMenu();
    syncInitialValues();
    loadFromUrlParameters();
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'investmentAmount', slider: 'investmentAmountSlider', min: 0, max: 50000000 },
        { input: 'monthlySip', slider: 'monthlySipSlider', min: 0, max: 500000 },
        { input: 'expectedReturn', slider: 'expectedReturnSlider', min: 1, max: 30 },
        { input: 'investmentPeriod', slider: 'investmentPeriodSlider', min: 1, max: 40 }
    ];
    
    inputs.forEach(({ input, slider, min, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                let value = parseFloat(this.value);
                
                // Handle empty or invalid input
                if (isNaN(value) || this.value === '') {
                    value = min;
                    this.value = min;
                }
                
                // Constrain value to slider range
                value = Math.max(Math.min(value, max), min);
                
                // Update input field if value was constrained
                if (value !== parseFloat(this.value)) {
                    this.value = value;
                }
                
                // Update slider
                sliderElement.value = value;
                calculateAndUpdate();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                const value = parseFloat(this.value);
                inputElement.value = value;
                calculateAndUpdate();
            });
            
            // Handle blur event to ensure valid values
            inputElement.addEventListener('blur', function() {
                let value = parseFloat(this.value);
                
                if (isNaN(value) || this.value === '' || value < min) {
                    value = min;
                    this.value = min;
                    sliderElement.value = min;
                } else if (value > max) {
                    value = max;
                    this.value = max;
                    sliderElement.value = max;
                }
                
                calculateAndUpdate();
            });
        }
    });
}

function calculateAndUpdate() {
    // Handle 0 values properly - don't use || fallback for amounts that can be 0
    const investmentAmountInput = document.getElementById('investmentAmount').value;
    const monthlySipInput = document.getElementById('monthlySip').value;
    const expectedReturnInput = document.getElementById('expectedReturn').value;
    const investmentPeriodInput = document.getElementById('investmentPeriod').value;
    
    const investmentAmount = investmentAmountInput === '' ? 500000 : parseFloat(investmentAmountInput);
    const monthlySip = monthlySipInput === '' ? 10000 : parseFloat(monthlySipInput);
    const expectedReturn = expectedReturnInput === '' ? 12.0 : parseFloat(expectedReturnInput);
    const investmentPeriod = investmentPeriodInput === '' ? 10 : parseInt(investmentPeriodInput);
    
    // Validate inputs
    if (isNaN(investmentAmount) || isNaN(monthlySip) || isNaN(expectedReturn) || isNaN(investmentPeriod)) {
        showErrorMessage('Please enter valid numbers');
        return;
    }
    
    if (investmentAmount < 0 || monthlySip < 0 || expectedReturn < 0 || investmentPeriod < 1) {
        showErrorMessage('Please enter positive values (investment period must be at least 1 year)');
        return;
    }
    
    // Special case: if both investment amount and SIP are 0, show error
    if (investmentAmount === 0 && monthlySip === 0) {
        showErrorMessage('Please enter either a lumpsum amount or SIP amount (or both)');
        return;
    }
    
    // Clear any previous error messages
    clearErrorMessage();
    
    // Make API call
    fetch('/calculate-lumpsum-vs-sip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            investmentAmount: investmentAmount,
            monthlySip: monthlySip,
            expectedReturn: expectedReturn,
            investmentPeriod: investmentPeriod
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateResults(data);
            updateCharts(data);
            updateComparisonTable(data.comparisonSchedule);
        } else {
            console.error('Calculation error:', data.error);
            showErrorMessage('Calculation error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Network error:', error);
        showErrorMessage('Network error. Please try again.');
    });
}

function updateResults(data) {
    // Update Lumpsum Investment column
    document.getElementById('lumpsumInvestmentResult').textContent = formatCurrency(data.lumpsumInvestment);
    document.getElementById('lumpsumMaturityResult').textContent = formatCurrency(data.lumpsumMaturityValue);
    document.getElementById('lumpsumGainsResult').textContent = formatCurrency(data.lumpsumGains);
    
    // Update SIP Investment column
    document.getElementById('sipInvestmentResult').textContent = formatCurrency(data.sipTotalInvestment);
    document.getElementById('sipMaturityResult').textContent = formatCurrency(data.sipMaturityValue);
    document.getElementById('sipGainsResult').textContent = formatCurrency(data.sipGains);
    
    // Update Comparison Summary section
    document.getElementById('betterOptionResult').textContent = data.betterOption;
    document.getElementById('advantageAmountResult').textContent = formatCurrency(data.difference);

    // Update chart summary
    document.getElementById('lumpsumPrincipalDisplay').textContent = formatCurrency(data.lumpsumInvestment);
    document.getElementById('lumpsumGainsDisplay').textContent = formatCurrency(data.lumpsumGains);
    document.getElementById('sipPrincipalDisplay').textContent = formatCurrency(data.sipTotalInvestment);
    document.getElementById('sipGainsDisplay').textContent = formatCurrency(data.sipGains);
    
    // Update better option card styling
    const betterOptionCard = document.querySelector('.better-option-card');
    const betterOptionElement = document.getElementById('betterOptionResult');
    
    if (data.betterOption === 'Lumpsum') {
        betterOptionElement.style.color = '#f59e0b';
        betterOptionCard.style.background = 'linear-gradient(135deg, #fef3c7, #fbbf24)';
    } else {
        betterOptionElement.style.color = '#10b981';
        betterOptionCard.style.background = 'linear-gradient(135deg, #d1fae5, #6ee7b7)';
    }
    
    // Add special messaging when one investment type is 0
    const investmentAmount = parseFloat(document.getElementById('investmentAmount').value) || 0;
    const monthlySip = parseFloat(document.getElementById('monthlySip').value) || 0;
    
    if (investmentAmount === 0) {
        document.getElementById('betterOptionResult').textContent = 'SIP Only';
        document.getElementById('advantageAmountResult').textContent = formatCurrency(data.sipMaturityValue);
    } else if (monthlySip === 0) {
        document.getElementById('betterOptionResult').textContent = 'Lumpsum Only';
        document.getElementById('advantageAmountResult').textContent = formatCurrency(data.lumpsumMaturityValue);
    }
}

function updateCharts(data) {
    updateLumpsumChart(data);
    updateSipChart(data);
}

function updateLumpsumChart(data) {
    const ctx = document.getElementById('lumpsumChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (lumpsumChart) {
        lumpsumChart.destroy();
    }

    // Handle case where lumpsum investment is 0
    let chartData, chartLabels, chartColors;
    
    if (data.lumpsumInvestment === 0) {
        chartData = [1]; // Dummy data to show "No Investment" message
        chartLabels = ['No Lumpsum Investment'];
        chartColors = ['#d1d5db'];
    } else {
        chartData = [data.lumpsumInvestment, data.lumpsumGains];
        chartLabels = ['Initial Investment', 'Investment Gains'];
        chartColors = ['#f59e0b', '#22c55e'];
    }
    
    lumpsumChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
                borderColor: ['#ffffff', '#ffffff'],
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#ffffff',
                    borderWidth: 1
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000
            }
        }
    });
}

function updateSipChart(data) {
    const ctx = document.getElementById('sipChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (sipChart) {
        sipChart.destroy();
    }

    // Handle case where SIP investment is 0
    let chartData, chartLabels, chartColors;
    
    if (data.sipTotalInvestment === 0) {
        chartData = [1]; // Dummy data to show "No Investment" message
        chartLabels = ['No SIP Investment'];
        chartColors = ['#d1d5db'];
    } else {
        chartData = [data.sipTotalInvestment, data.sipGains];
        chartLabels = ['Total Investment', 'Investment Gains'];
        chartColors = ['#3b82f6', '#10b981'];
    }
    
    sipChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
                borderColor: ['#ffffff', '#ffffff'],
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#ffffff',
                    borderWidth: 1
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000
            }
        }
    });
}

function updateComparisonTable(comparisonSchedule) {
    const tbody = document.getElementById('comparisonTableBody');
    tbody.innerHTML = '';

    comparisonSchedule.forEach((yearData) => {
        const row = document.createElement('tr');
        
        // Determine which option is better for styling
        const betterClass = yearData.betterOption === 'Lumpsum' ? 'lumpsum-better' : 'sip-better';
        
        row.innerHTML = `
            <td class="year-cell">${yearData.year}</td>
            <td class="amount-cell">${formatCurrency(yearData.lumpsumValue)}</td>
            <td class="amount-cell">${formatCurrency(yearData.lumpsumGains)}</td>
            <td class="amount-cell">${formatCurrency(yearData.sipTotalInvested)}</td>
            <td class="amount-cell">${formatCurrency(yearData.sipValue)}</td>
            <td class="amount-cell">${formatCurrency(yearData.sipGains)}</td>
            <td class="better-option-cell ${betterClass}">${yearData.betterOption}</td>
            <td class="advantage-cell" style="color: #16a34a; font-weight: 600;">${formatCurrency(yearData.advantage)}</td>
        `;
        tbody.appendChild(row);
    });
}

function setupMegaMenu() {
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenu = document.querySelector('.mega-menu');
    
    if (megaMenuBtn && megaMenu) {
        megaMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            megaMenu.classList.toggle('open');
        });
        
        // Close mega menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });
    }
}

function formatCurrency(amount) {
    if (amount >= 10000000) { // 1 crore
        return '₹' + (amount / 10000000).toFixed(2) + 'Cr';
    } else if (amount >= 100000) { // 1 lakh
        return '₹' + (amount / 100000).toFixed(2) + 'L';
    } else if (amount >= 1000) { // 1 thousand
        return '₹' + (amount / 1000).toFixed(2) + 'K';
    } else {
        return '₹' + amount.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const params = {
        investmentAmount: urlParams.get('investmentAmount'),
        monthlySip: urlParams.get('monthlySip'),
        expectedReturn: urlParams.get('expectedReturn'),
        investmentPeriod: urlParams.get('investmentPeriod')
    };
    
    // Update inputs if URL parameters exist
    Object.keys(params).forEach(key => {
        if (params[key]) {
            const inputElement = document.getElementById(key);
            const sliderElement = document.getElementById(key + 'Slider');
            
            const value = parseFloat(params[key]);
            if (!isNaN(value)) {
                if (inputElement) {
                    inputElement.value = value;
                }
                if (sliderElement) {
                    sliderElement.value = value;
                }
            }
        }
    });
}

function syncInitialValues() {
    // Sync initial values between inputs and sliders
    const inputs = [
        { input: 'investmentAmount', slider: 'investmentAmountSlider' },
        { input: 'monthlySip', slider: 'monthlySipSlider' },
        { input: 'expectedReturn', slider: 'expectedReturnSlider' },
        { input: 'investmentPeriod', slider: 'investmentPeriodSlider' }
    ];
    
    inputs.forEach(({ input, slider }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Use input value as source of truth for initial sync
            const inputValue = parseFloat(inputElement.value);
            if (!isNaN(inputValue)) {
                sliderElement.value = inputValue;
            }
        }
    });
}

// Error message functions
function showErrorMessage(message) {
    // Remove any existing error message
    clearErrorMessage();
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.style.cssText = `
        background: #fee2e2;
        color: #dc2626;
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid #fecaca;
        margin: 15px 0;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
    `;
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

// Add some additional CSS for better table styling
const additionalCSS = `
    .lumpsum-better {
        background-color: #fef3c7 !important;
        color: #92400e !important;
        font-weight: 600;
    }
    
    .sip-better {
        background-color: #d1fae5 !important;
        color: #065f46 !important;
        font-weight: 600;
    }
    
    .better-option-cell {
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.5px;
    }
    
    .advantage-cell {
        font-weight: 600;
    }
`;

// Inject additional CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalCSS;
document.head.appendChild(styleSheet); 