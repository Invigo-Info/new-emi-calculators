// Global variables
let paymentBreakupChart;
let currentTenureUnit = 'months'; // 'years' or 'months'

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
        { input: 'loanRequired', slider: 'loanRequiredSlider', min: 100000, max: 10000000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 9, max: 20 }
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
    
    // Setup repayment option listeners
    setupRepaymentOptionListeners();
}

function setupTenureEventListeners() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    const tenureYrBtn = document.getElementById('tenureYrBtn');
    const tenureMoBtn = document.getElementById('tenureMoBtn');
    
    // Initialize in months mode
    setTenureMode('months');
    
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

function setupRepaymentOptionListeners() {
    const repaymentOptions = document.querySelectorAll('input[name="repaymentOption"]');
    
    repaymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            if (this.checked) {
                calculateAndUpdate();
            }
        });
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
    const currentValue = parseFloat(tenureValueInput.value) || (unit === 'years' ? 8 : 96);
    
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
        tenureValueInput.min = '0.5';
        tenureValueInput.max = '15';
        
        // Update slider for years (0.5-15 years)
        tenureSlider.min = '0.5';
        tenureSlider.max = '15';
        tenureSlider.step = '0.5';
        tenureSlider.value = years;
        
        // Update slider labels for years
        tenureSliderLabels.innerHTML = `
            <span>0.5 Years</span>
            <span>15 Years</span>
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
        tenureValueInput.min = '6';
        tenureValueInput.max = '180';
        
        // Update slider for months (6-180 months)
        tenureSlider.min = '6';
        tenureSlider.max = '180';
        tenureSlider.step = '1';
        tenureSlider.value = months;
        
        // Update slider labels for months
        tenureSliderLabels.innerHTML = `
            <span>6 Months</span>
            <span>180 Months</span>
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

function calculateAndUpdate() {
    const loanRequired = parseFloat(document.getElementById('loanRequired').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 0;
    const repaymentOption = document.querySelector('input[name="repaymentOption"]:checked')?.value || 'full_emi';
    
    // Convert tenure to months
    let tenureMonths = 0;
    if (currentTenureUnit === 'years') {
        tenureMonths = Math.round(tenureValue * 12);
    } else {
        tenureMonths = Math.round(tenureValue);
    }
    
    // Call Python backend for accurate calculations
    fetch('/calculate-education-loan-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            loanRequired: loanRequired,
            interestRate: interestRate,
            tenureMonths: tenureMonths,
            repaymentOption: repaymentOption
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'error') {
            console.error('Error:', data.error);
            // Fallback to frontend calculation if backend fails
            const emiData = calculateEducationLoanEMI(loanRequired, interestRate, tenureMonths, repaymentOption);
            updateResults(emiData);
            updateChart(emiData);
        } else {
            // Use Python backend results
            const emiData = {
                emi: data.emi,
                principal: data.principalAmount,
                totalInterest: data.totalInterest,
                totalPayment: data.totalPayment,
                tenureMonths: tenureMonths,
                interestRate: interestRate,
                repaymentOption: repaymentOption
            };
            
            updateResults(emiData);
            updateChart(emiData);
        }
    })
    .catch(error => {
        console.error('Network error:', error);
        // Fallback to frontend calculation if network fails
        const emiData = calculateEducationLoanEMI(loanRequired, interestRate, tenureMonths, repaymentOption);
        updateResults(emiData);
        updateChart(emiData);
    });
}

function calculateEducationLoanEMI(principal, annualRate, tenureMonths, repaymentOption) {
    const monthlyRate = annualRate / (12 * 100);
    let emi = 0;
    let totalInterest = 0;
    let totalPayment = 0;
    
    if (monthlyRate === 0) {
        emi = principal / tenureMonths;
        totalInterest = 0;
        totalPayment = principal;
    } else {
        switch (repaymentOption) {
            case 'complete_moratorium':
                // Complete Moratorium: No payments during study period, interest capitalizes
                // Typical study period is 4 years (48 months) for education loans
                const studyPeriodMonths = 48;
                
                // If tenure is less than study period, use standard EMI
                if (tenureMonths <= studyPeriodMonths) {
                    emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
                          (Math.pow(1 + monthlyRate, tenureMonths) - 1);
                    totalPayment = emi * tenureMonths;
                    totalInterest = totalPayment - principal;
                } else {
                    // Calculate capitalized principal after study period
                    const capitalizedPrincipal = principal * Math.pow(1 + monthlyRate, studyPeriodMonths);
                    const repaymentMonths = tenureMonths - studyPeriodMonths;
                    
                    // EMI calculated on capitalized principal for remaining tenure
                    emi = capitalizedPrincipal * monthlyRate * Math.pow(1 + monthlyRate, repaymentMonths) / 
                          (Math.pow(1 + monthlyRate, repaymentMonths) - 1);
                    
                    // Total payment is EMI for repayment period only
                    totalPayment = emi * repaymentMonths;
                    totalInterest = totalPayment - principal;
                }
                break;
                
            case 'principal_moratorium':
                // Principal Moratorium: Only interest payments during study period
                const studyPeriod = 48;
                
                if (tenureMonths <= studyPeriod) {
                    // If tenure is within study period, only interest payments
                    emi = principal * monthlyRate;
                    totalPayment = emi * tenureMonths;
                    totalInterest = totalPayment;
                } else {
                    // Interest-only payments during study period
                    const interestOnlyEMI = principal * monthlyRate;
                    const interestDuringStudy = interestOnlyEMI * studyPeriod;
                    
                    // Principal + Interest EMI for remaining tenure
                    const repaymentMonths = tenureMonths - studyPeriod;
                    const principalEMI = principal * monthlyRate * Math.pow(1 + monthlyRate, repaymentMonths) / 
                                        (Math.pow(1 + monthlyRate, repaymentMonths) - 1);
                    
                    // EMI shown is the principal repayment EMI (post-study period)
                    emi = principalEMI;
                    
                    // Total interest = interest during study + interest during repayment
                    const interestDuringRepayment = (principalEMI * repaymentMonths) - principal;
                    totalInterest = interestDuringStudy + interestDuringRepayment;
                    totalPayment = principal + totalInterest;
                }
                break;
                
            case 'full_emi':
                // Full EMI: Standard loan calculation from day 1
                emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
                      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
                totalPayment = emi * tenureMonths;
                totalInterest = totalPayment - principal;
                break;
        }
    }
    
    return {
        emi: Math.round(emi),
        principal: principal,
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment),
        tenureMonths: tenureMonths,
        interestRate: annualRate,
        repaymentOption: repaymentOption
    };
}

function updateResults(data) {
    document.getElementById('displayLoanRequired').textContent = formatCurrency(data.principal);
    document.getElementById('displayEmi').textContent = formatCurrency(data.emi);
    document.getElementById('displayTotalInterest').textContent = formatCurrency(data.totalInterest);
    document.getElementById('displayTotalPayment').textContent = formatCurrency(data.totalPayment);
    
    // Calculate percentages for chart
    const principalPercentage = (data.principal / data.totalPayment * 100).toFixed(1);
    const interestPercentage = (data.totalInterest / data.totalPayment * 100).toFixed(1);
    
    document.getElementById('principalPercentage').textContent = principalPercentage + '%';
    document.getElementById('interestPercentage').textContent = interestPercentage + '%';
}

function updateChart(data) {
    const ctx = document.getElementById('paymentBreakupChart').getContext('2d');
    
    if (paymentBreakupChart) {
        paymentBreakupChart.destroy();
    }
    
    paymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Loan Amount', 'Total Interest'],
            datasets: [{
                data: [data.principal, data.totalInterest],
                backgroundColor: ['#14B8A6', '#F59E0B'],
                borderWidth: 0,
                cutout: '60%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
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
    // Always use Indian numbering system with commas
    return '₹ ' + amount.toLocaleString('en-IN');
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
