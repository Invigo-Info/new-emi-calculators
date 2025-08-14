// Global variables for used car loan calculator
let usedCarPaymentBreakupChart;
let usedCarCurrentEmiScheme = 'arrears';
let usedCarCurrentTenureUnit = 'years'; // 'years' or 'months'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupUsedCarEventListeners();
    
    // Ensure initial slider synchronization
    updateUsedCarSliderFromInput();
    
    calculateAndUpdateUsedCar();
});

function setupUsedCarEventListeners() {
    // Input change listeners for sliders and number inputs
    const usedCarInputs = [
        { input: 'usedCarLoanAmount', slider: 'usedCarLoanAmountSlider', min: 50000, max: 1000000 },
        { input: 'usedCarInterestRate', slider: 'usedCarInterestRateSlider', min: 6, max: 20 }
    ];
    
    usedCarInputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                calculateAndUpdateUsedCar();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                calculateAndUpdateUsedCar();
            });
        }
    });
    
    // Special handling for tenure
    setupUsedCarTenureEventListeners();
}

function setupUsedCarTenureEventListeners() {
    const usedCarTenureValueInput = document.getElementById('usedCarTenureValue');
    const usedCarTenureSlider = document.getElementById('usedCarTenureSlider');
    const usedCarTenureYrBtn = document.getElementById('usedCarTenureYrBtn');
    const usedCarTenureMoBtn = document.getElementById('usedCarTenureMoBtn');
    
    // Initialize in years mode
    setUsedCarTenureMode('years');
    
    // Input value changes
    usedCarTenureValueInput.addEventListener('input', function() {
        updateUsedCarSliderFromInput();
        calculateAndUpdateUsedCar();
    });
    
    // Slider changes
    usedCarTenureSlider.addEventListener('input', function() {
        updateUsedCarInputFromSlider();
        calculateAndUpdateUsedCar();
    });
    
    // Year button click
    usedCarTenureYrBtn.addEventListener('click', function() {
        if (usedCarCurrentTenureUnit !== 'years') {
            setUsedCarTenureMode('years');
        }
    });
    
    // Month button click
    usedCarTenureMoBtn.addEventListener('click', function() {
        if (usedCarCurrentTenureUnit !== 'months') {
            setUsedCarTenureMode('months');
        }
    });
}

function setUsedCarTenureMode(unit) {
    const previousUnit = usedCarCurrentTenureUnit;
    usedCarCurrentTenureUnit = unit;
    
    const usedCarTenureValueInput = document.getElementById('usedCarTenureValue');
    const usedCarTenureSlider = document.getElementById('usedCarTenureSlider');
    const usedCarTenureYrBtn = document.getElementById('usedCarTenureYrBtn');
    const usedCarTenureMoBtn = document.getElementById('usedCarTenureMoBtn');
    const usedCarTenureSliderLabels = document.getElementById('usedCarTenureSliderLabels');
    
    // Update button states
    usedCarTenureYrBtn.classList.toggle('active', unit === 'years');
    usedCarTenureMoBtn.classList.toggle('active', unit === 'months');
    
    // Get current value before conversion
    const currentValue = parseFloat(usedCarTenureValueInput.value) || (unit === 'years' ? 4 : 48);
    
    if (unit === 'years') {
        // Converting to years mode
        let years;
        if (previousUnit === 'months') {
            // Convert months to years exactly
            years = Math.round(currentValue / 12 * 10) / 10; // Round to 1 decimal
        } else {
            years = currentValue;
        }
        
        usedCarTenureValueInput.value = years;
        usedCarTenureValueInput.step = '0.5';
        usedCarTenureValueInput.min = '1';
        usedCarTenureValueInput.max = '7';
        
        // Update slider for years (1-7 years)
        usedCarTenureSlider.min = '1';
        usedCarTenureSlider.max = '7';
        usedCarTenureSlider.step = '0.5';
        usedCarTenureSlider.value = years;
        
        // Update slider labels for years
        usedCarTenureSliderLabels.innerHTML = `
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
        
        usedCarTenureValueInput.value = months;
        usedCarTenureValueInput.step = '1';
        usedCarTenureValueInput.min = '12';
        usedCarTenureValueInput.max = '84';
        
        // Update slider for months (12-84 months)
        usedCarTenureSlider.min = '12';
        usedCarTenureSlider.max = '84';
        usedCarTenureSlider.step = '1';
        usedCarTenureSlider.value = months;
        
        // Update slider labels for months
        usedCarTenureSliderLabels.innerHTML = `
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
    updateUsedCarSliderFromInput();
    
    // Recalculate after mode change
    calculateAndUpdateUsedCar();
}

function updateUsedCarSliderFromInput() {
    const usedCarTenureValueInput = document.getElementById('usedCarTenureValue');
    const usedCarTenureSlider = document.getElementById('usedCarTenureSlider');
    
    const value = parseFloat(usedCarTenureValueInput.value) || 0;
    const min = parseFloat(usedCarTenureSlider.min);
    const max = parseFloat(usedCarTenureSlider.max);
    
    usedCarTenureSlider.value = Math.min(Math.max(value, min), max);
}

function updateUsedCarInputFromSlider() {
    const usedCarTenureValueInput = document.getElementById('usedCarTenureValue');
    const usedCarTenureSlider = document.getElementById('usedCarTenureSlider');
    
    usedCarTenureValueInput.value = usedCarTenureSlider.value;
}

function setUsedCarEmiScheme(scheme) {
    usedCarCurrentEmiScheme = scheme;
    calculateAndUpdateUsedCar();
}

function calculateAndUpdateUsedCar() {
    const usedCarLoanAmount = parseFloat(document.getElementById('usedCarLoanAmount').value) || 0;
    const usedCarInterestRate = parseFloat(document.getElementById('usedCarInterestRate').value) || 0;
    const usedCarTenureValue = parseFloat(document.getElementById('usedCarTenureValue').value) || 0;
    
    // Convert tenure to years and months
    let tenureYears = 0;
    let tenureMonths = 0;
    
    if (usedCarCurrentTenureUnit === 'years') {
        const totalMonths = Math.round(usedCarTenureValue * 12);
        tenureYears = Math.floor(totalMonths / 12);
        tenureMonths = totalMonths % 12;
    } else {
        tenureYears = Math.floor(usedCarTenureValue / 12);
        tenureMonths = usedCarTenureValue % 12;
    }
    
    // Prepare data for API call
    const requestData = {
        usedCarLoanAmount: usedCarLoanAmount,
        interestRate: usedCarInterestRate,
        tenureYears: tenureYears,
        tenureMonths: tenureMonths,
        emiScheme: usedCarCurrentEmiScheme
    };
    
    // Make API call to calculate EMI
    fetch('/calculate-used-car-loan-emi', {
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
        updateUsedCarResults(data);
        updateUsedCarChart(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateUsedCarResults(data) {
    // Update result values
    document.getElementById('usedCarLoanEmi').textContent = formatUsedCarCurrency(data.emi);
    document.getElementById('usedCarPrincipalAmount').textContent = formatUsedCarCurrency(data.principalAmount);
    document.getElementById('usedCarTotalInterest').textContent = formatUsedCarCurrency(data.totalInterest);
    document.getElementById('usedCarTotalPayment').textContent = formatUsedCarCurrency(data.totalPayment);
    
    // Update chart summary percentages
    document.getElementById('usedCarPrincipalPercentage').textContent = data.principalPercentage + '%';
    document.getElementById('usedCarInterestPercentage').textContent = data.interestPercentage + '%';
}

function updateUsedCarChart(data) {
    const ctx = document.getElementById('usedCarPaymentBreakupChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (usedCarPaymentBreakupChart) {
        usedCarPaymentBreakupChart.destroy();
    }
    
    // Create new chart
    usedCarPaymentBreakupChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Principal Loan Amount', 'Total Interest'],
            datasets: [{
                data: [data.principalAmount, data.totalInterest],
                backgroundColor: [
                    '#81c784', // Light green for principal
                    '#ffb74d'  // Light orange for interest
                ],
                borderColor: [
                    '#66bb6a',
                    '#ffa726'
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
                            const value = formatUsedCarCurrency(context.parsed);
                            const percentage = ((context.parsed / data.totalPayment) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function formatUsedCarCurrency(amount) {
    // Format numbers with Indian comma notation
    return '₹ ' + Math.round(amount).toLocaleString('en-IN');
} 

// Mega Menu Functionality for Used Car Loan Page
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
