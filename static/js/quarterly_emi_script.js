// Global variables
let paymentChart;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateTenureLabels(); // Initialize with default labels
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'loanAmount', slider: 'loanAmountSlider', min: 100000, max: 20000000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 5, max: 20 },
        { input: 'loanTenure', slider: 'tenureSlider', min: 1, max: 120 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                let value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                
                // For tenure, always store as quarters internally in slider
                if (input === 'loanTenure') {
                    const isQuarters = document.getElementById('quarterBtn').classList.contains('active');
                    if (!isQuarters) {
                        // Convert years to quarters for internal storage
                        value = Math.min(value * 4, 120);
                    }
                    sliderElement.value = value;
                } else {
                    sliderElement.value = value;
                }
                calculateAndUpdate();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                let value = parseInt(this.value);
                
                // For tenure, convert from internal quarters to display value
                if (input === 'loanTenure') {
                    const isQuarters = document.getElementById('quarterBtn').classList.contains('active');
                    if (!isQuarters) {
                        // Convert quarters to years for display
                        value = Math.floor(value / 4);
                        if (value === 0) value = 1; // Minimum 1 year
                    }
                }
                
                inputElement.value = value;
                calculateAndUpdate();
            });
        }
    });
    
    // Tenure toggle buttons
    const yearBtn = document.getElementById('yearBtn');
    const quarterBtn = document.getElementById('quarterBtn');
    const tenureInput = document.getElementById('loanTenure');
    const tenureSlider = document.getElementById('tenureSlider');
    
    yearBtn.addEventListener('click', function() {
        if (yearBtn.classList.contains('active')) return; // Already active
        
        yearBtn.classList.add('active');
        quarterBtn.classList.remove('active');
        
        // Convert current quarters to years
        const currentQuarters = parseInt(tenureSlider.value);
        const years = Math.max(1, Math.floor(currentQuarters / 4));
        tenureInput.value = years;
        
        // Update slider range for years (but keep internal quarters)
        tenureSlider.min = 4; // 1 year = 4 quarters
        tenureSlider.max = 120; // 30 years = 120 quarters
        
        updateTenureLabels();
        calculateAndUpdate();
    });
    
    quarterBtn.addEventListener('click', function() {
        if (quarterBtn.classList.contains('active')) return; // Already active
        
        quarterBtn.classList.add('active');
        yearBtn.classList.remove('active');
        
        // Convert current years to quarters
        const currentYears = parseInt(tenureInput.value);
        const quarters = currentYears * 4;
        tenureInput.value = quarters;
        tenureSlider.value = quarters;
        
        // Update slider range for quarters
        tenureSlider.min = 1;
        tenureSlider.max = 120;
        
        updateTenureLabels();
        calculateAndUpdate();
    });
}

function updateTenureLabels() {
    const isQuarters = document.getElementById('quarterBtn').classList.contains('active');
    const labelsContainer = document.querySelector('#tenureSlider').parentElement.querySelector('.range-labels');
    
    if (isQuarters) {
        labelsContainer.innerHTML = `
            <span>0</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
            <span>120</span>
        `;
    } else {
        labelsContainer.innerHTML = `
            <span>0</span>
            <span>5Y</span>
            <span>10Y</span>
            <span>15Y</span>
            <span>20Y</span>
            <span>25Y</span>
            <span>30Y</span>
        `;
    }
}

function calculateAndUpdate() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    let tenureValue = parseInt(document.getElementById('loanTenure').value) || 0;
    
    // Check if tenure is in years or quarters
    const isQuarters = document.getElementById('quarterBtn').classList.contains('active');
    const tenureQuarters = isQuarters ? tenureValue : tenureValue * 4;
    
    if (loanAmount <= 0 || tenureQuarters <= 0) {
        // Set default values if invalid
        updateResultsWithDefaults();
        return;
    }
    
    // Calculate quarterly EMI
    const quarterlyRate = interestRate / (4 * 100);
    let quarterlyEmi, totalInterest;
    
    if (quarterlyRate === 0) {
        quarterlyEmi = loanAmount / tenureQuarters;
        totalInterest = 0;
    } else {
        quarterlyEmi = loanAmount * quarterlyRate * Math.pow(1 + quarterlyRate, tenureQuarters) / 
                     (Math.pow(1 + quarterlyRate, tenureQuarters) - 1);
        totalInterest = (quarterlyEmi * tenureQuarters) - loanAmount;
    }
    
    const totalPayment = quarterlyEmi * tenureQuarters;
    
    // Generate amortization schedule (limit to first 20 quarters for performance)
    const amortizationSchedule = [];
    let remainingPrincipal = loanAmount;
    
    for (let quarter = 1; quarter <= Math.min(tenureQuarters, 20); quarter++) {
        const interestPayment = remainingPrincipal * quarterlyRate;
        const principalPayment = quarterlyEmi - interestPayment;
        remainingPrincipal = Math.max(0, remainingPrincipal - principalPayment);
        
        amortizationSchedule.push({
            quarter: quarter,
            principal: principalPayment,
            interest: interestPayment,
            quarterlyPayment: quarterlyEmi,
            balance: remainingPrincipal
        });
    }
    
    const data = {
        principal: loanAmount,
        quarterlyEmi: quarterlyEmi,
        totalInterest: totalInterest,
        totalPayment: totalPayment,
        amortizationSchedule: amortizationSchedule
    };
    
    updateResults(data);
    updateChart(data);
    updateScheduleTable(data);
}

function updateResultsWithDefaults() {
    document.getElementById('quarterlyEmiResult').textContent = '₹0';
    document.getElementById('totalInterestResult').textContent = '₹0';
    document.getElementById('totalPaymentResult').textContent = '₹0';
    document.getElementById('principalAmount').textContent = '₹0';
    document.getElementById('interestAmount').textContent = '₹0';
    
    // Clear table
    document.getElementById('scheduleTableBody').innerHTML = '';
    
    // Clear chart
    if (paymentChart) {
        paymentChart.destroy();
        paymentChart = null;
    }
}

function updateResults(data) {
    document.getElementById('quarterlyEmiResult').textContent = formatCurrency(data.quarterlyEmi);
    document.getElementById('totalInterestResult').textContent = formatCurrency(data.totalInterest);
    document.getElementById('totalPaymentResult').textContent = formatCurrency(data.totalPayment);
    document.getElementById('principalAmount').textContent = formatCurrency(data.principal);
    document.getElementById('interestAmount').textContent = formatCurrency(data.totalInterest);
}

function updateChart(data) {
    const ctx = document.getElementById('paymentChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (paymentChart) {
        paymentChart.destroy();
    }
    
    paymentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Interest'],
            datasets: [{
                data: [data.principal, data.totalInterest],
                backgroundColor: ['#22c55e', '#f97316'],
                borderWidth: 0,
                cutout: '60%'
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
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return context.label + ': ₹' + formatNumber(value) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function updateScheduleTable(data) {
    const tableBody = document.getElementById('scheduleTableBody');
    tableBody.innerHTML = '';
    
    if (data.amortizationSchedule && data.amortizationSchedule.length > 0) {
        data.amortizationSchedule.forEach(quarterData => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${quarterData.quarter}</td>
                <td>₹${formatNumber(quarterData.principal)}</td>
                <td>₹${formatNumber(quarterData.interest)}</td>
                <td>₹${formatNumber(quarterData.quarterlyPayment)}</td>
                <td>₹${formatNumber(quarterData.balance)}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function formatCurrency(amount) {
    return '₹' + formatNumber(amount);
}

function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    
    // Handle Indian number formatting
    const roundedNum = Math.round(num);
    return roundedNum.toLocaleString('en-IN');
}

// Input validation
document.addEventListener('blur', function(e) {
    if (e.target.type === 'number') {
        const value = parseFloat(e.target.value);
        const min = parseFloat(e.target.min);
        const max = parseFloat(e.target.max);
        
        if (!isNaN(value) && !isNaN(min) && !isNaN(max)) {
            if (value < min) {
                e.target.value = min;
                calculateAndUpdate();
            } else if (value > max) {
                e.target.value = max;
                calculateAndUpdate();
            }
        }
    }
}, true); 