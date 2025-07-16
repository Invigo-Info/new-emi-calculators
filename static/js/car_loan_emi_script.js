// Global variables
let paymentBreakupChart;
let currentEmiScheme = 'arrears';
let currentTenureUnit = 'years'; // 'years' or 'months'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    
    // Ensure initial slider synchronization
    updateSliderFromInput();
    
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'carLoanAmount', slider: 'carLoanAmountSlider', min: 100000, max: 1500000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 5, max: 17.5 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                calculateAndUpdate();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                calculateAndUpdate();
            });
        }
    });
    
    // Special handling for tenure
    setupTenureEventListeners();
}

function setupTenureEventListeners() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    const tenureYrBtn = document.getElementById('tenureYrBtn');
    const tenureMoBtn = document.getElementById('tenureMoBtn');
    
    // Initialize in years mode
    setTenureMode('years');
    
    // Input value changes
    tenureValueInput.addEventListener('input', function() {
        updateSliderFromInput();
        calculateAndUpdate();
    });
    
    // Slider changes
    tenureSlider.addEventListener('input', function() {
        updateInputFromSlider();
        calculateAndUpdate();
    });
    
    // Year button click
    tenureYrBtn.addEventListener('click', function() {
        if (currentTenureUnit !== 'years') {
            setTenureMode('years');
        }
    });
    
    // Month button click
    tenureMoBtn.addEventListener('click', function() {
        if (currentTenureUnit !== 'months') {
            setTenureMode('months');
        }
    });
}

function setTenureMode(unit) {
    const previousUnit = currentTenureUnit;
    currentTenureUnit = unit;
    
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    const tenureYrBtn = document.getElementById('tenureYrBtn');
    const tenureMoBtn = document.getElementById('tenureMoBtn');
    const tenureSliderLabels = document.getElementById('tenureSliderLabels');
    
    // Update button states
    tenureYrBtn.classList.toggle('active', unit === 'years');
    tenureMoBtn.classList.toggle('active', unit === 'months');
    
    // Get current value before conversion
    const currentValue = parseFloat(tenureValueInput.value) || (unit === 'years' ? 5 : 60);
    
    if (unit === 'years') {
        // Converting to years mode
        let years;
        if (previousUnit === 'months') {
            // Convert months to years exactly
            years = Math.round(currentValue / 12 * 10) / 10; // Round to 1 decimal
        } else {
            years = currentValue;
        }
        
        tenureValueInput.value = years;
        tenureValueInput.step = '0.5';
        tenureValueInput.min = '1';
        tenureValueInput.max = '7';
        
        // Update slider for years (1-7 years)
        tenureSlider.min = '1';
        tenureSlider.max = '7';
        tenureSlider.step = '0.5';
        tenureSlider.value = years;
        
        // Update slider labels for years
        tenureSliderLabels.innerHTML = `
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
        `;
    } else {
        // Converting to months mode
        let months;
        if (previousUnit === 'years') {
            // Convert years to months exactly
            months = Math.round(currentValue * 12);
        } else {
            months = Math.round(currentValue);
        }
        
        tenureValueInput.value = months;
        tenureValueInput.step = '1';
        tenureValueInput.min = '12';
        tenureValueInput.max = '84';
        
        // Update slider for months (12-84 months)
        tenureSlider.min = '12';
        tenureSlider.max = '84';
        tenureSlider.step = '1';
        tenureSlider.value = months;
        
        // Update slider labels for months
        tenureSliderLabels.innerHTML = `
            <span>12</span>
            <span>24</span>
            <span>36</span>
            <span>48</span>
            <span>60</span>
            <span>72</span>
            <span>84</span>
        `;
    }
    
    // Ensure slider is synchronized after mode change
    updateSliderFromInput();
    
    // Recalculate after mode change
    calculateAndUpdate();
}

function updateSliderFromInput() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    
    const value = parseFloat(tenureValueInput.value) || 0;
    const min = parseFloat(tenureSlider.min);
    const max = parseFloat(tenureSlider.max);
    
    tenureSlider.value = Math.min(Math.max(value, min), max);
}

function updateInputFromSlider() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    
    tenureValueInput.value = tenureSlider.value;
}

function setEmiScheme(scheme) {
    currentEmiScheme = scheme;
    calculateAndUpdate();
}

function calculateAndUpdate() {
    const carLoanAmount = parseFloat(document.getElementById('carLoanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 0;
    
    // Convert tenure to years and months
    let tenureYears = 0;
    let tenureMonths = 0;
    
    if (currentTenureUnit === 'years') {
        const totalMonths = Math.round(tenureValue * 12);
        tenureYears = Math.floor(totalMonths / 12);
        tenureMonths = totalMonths % 12;
    } else {
        tenureYears = Math.floor(tenureValue / 12);
        tenureMonths = tenureValue % 12;
    }
    
    // Prepare data for API call
    const requestData = {
        carLoanAmount: carLoanAmount,
        interestRate: interestRate,
        tenureYears: tenureYears,
        tenureMonths: tenureMonths,
        emiScheme: currentEmiScheme
    };
    
    // Make API call to calculate EMI
    fetch('/calculate-car-loan-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'error') {
            console.error('Calculation error:', data.error);
            return;
        }
        updateResults(data);
        updateChart(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateResults(data) {
    // Update result values
    document.getElementById('loanEmi').textContent = formatCurrency(data.emi);
    document.getElementById('principalAmount').textContent = formatCurrency(data.principalAmount);
    document.getElementById('totalInterest').textContent = formatCurrency(data.totalInterest);
    document.getElementById('totalPayment').textContent = formatCurrency(data.totalPayment);
    
    // Update chart summary percentages
    document.getElementById('principalPercentage').textContent = data.principalPercentage + '%';
    document.getElementById('interestPercentage').textContent = data.interestPercentage + '%';
}

function updateChart(data) {
    const ctx = document.getElementById('paymentBreakupChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (paymentBreakupChart) {
        paymentBreakupChart.destroy();
    }
    
    // Create new chart
    paymentBreakupChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Principal Loan Amount', 'Total Interest'],
            datasets: [{
                data: [data.principalAmount, data.totalInterest],
                backgroundColor: [
                    '#9ae6b4', // Light green for principal
                    '#fbb6ce'  // Light pink for interest
                ],
                borderColor: [
                    '#68d391',
                    '#f687b3'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false // We'll use custom legend
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const percentage = ((context.parsed / data.totalPayment) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function formatCurrency(amount) {
    // Format numbers with Indian comma notation
    return '₹ ' + Math.round(amount).toLocaleString('en-IN');
} 

// Mega Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const megaMenu = document.querySelector('.mega-menu');
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenuContent = document.querySelector('.mega-menu-content');

    if (megaMenuBtn && megaMenu) {
        // Toggle mega menu on button click
        megaMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            megaMenu.classList.toggle('active');
        });

        // Close mega menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('active');
            }
        });

        // Close mega menu when clicking on any link inside
        if (megaMenuContent) {
            const megaLinks = megaMenuContent.querySelectorAll('.mega-link');
            megaLinks.forEach(function(link) {
                link.addEventListener('click', function() {
                    megaMenu.classList.remove('active');
                });
            });
        }

        // Prevent closing when clicking inside the mega menu content
        if (megaMenuContent) {
            megaMenuContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
});