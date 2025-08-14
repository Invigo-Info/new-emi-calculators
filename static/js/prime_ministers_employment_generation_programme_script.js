// Global variables for PMEGP calculator
let pmegpPaymentBreakupChart;
let pmegpAmortizationData = [];
let pmegpYearlyAmortizationData = [];
let pmegpCurrentTenureUnit = 'years'; // 'years' or 'months'
let pmegpCurrentAmortizationView = 'monthly'; // 'monthly' or 'yearly'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupPmegpEventListeners();
    
    // Ensure initial slider synchronization
    updatePmegpSliderFromInput();
    
    // Initial calculation
    calculatePmegpAndUpdate();
});

function setupPmegpEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'pmegpLoanAmount', slider: 'pmegpLoanAmountSlider', min: 10000, max: 20000000 },
        { input: 'pmegpInterestRate', slider: 'pmegpInterestRateSlider', min: 8, max: 18 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                validatePmegpInputs();
                calculatePmegpAndUpdate();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                validatePmegpInputs();
                calculatePmegpAndUpdate();
            });
        }
    });
    
    // Setup tenure event listeners
    setupPmegpTenureEventListeners();
    
    // Setup download CSV button
    const downloadBtn = document.getElementById('pmegpDownloadCsv');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadPmegpAmortizationCsv);
    }
    
    // Setup amortization toggle buttons
    setupPmegpAmortizationToggle();
}

function setupPmegpTenureEventListeners() {
    const tenureValueInput = document.getElementById('pmegpTenureValue');
    const tenureSlider = document.getElementById('pmegpTenureSlider');
    const tenureYrBtn = document.getElementById('pmegpTenureYrBtn');
    const tenureMoBtn = document.getElementById('pmegpTenureMoBtn');
    
    // Initialize in years mode
    setPmegpTenureMode('years');
    
    // Input value changes
    if (tenureValueInput) {
        tenureValueInput.addEventListener('input', function() {
            updatePmegpSliderFromTenureInput();
            calculatePmegpAndUpdate();
        });
    }
    
    // Slider changes
    if (tenureSlider) {
        tenureSlider.addEventListener('input', function() {
            updatePmegpInputFromTenureSlider();
            calculatePmegpAndUpdate();
        });
    }
    
    // Year button click
    if (tenureYrBtn) {
        tenureYrBtn.addEventListener('click', function() {
            if (pmegpCurrentTenureUnit !== 'years') {
                setPmegpTenureMode('years');
            }
        });
    }
    
    // Month button click
    if (tenureMoBtn) {
        tenureMoBtn.addEventListener('click', function() {
            if (pmegpCurrentTenureUnit !== 'months') {
                setPmegpTenureMode('months');
            }
        });
    }
}

function setupPmegpAmortizationToggle() {
    const monthlyToggle = document.getElementById('pmegpMonthlyToggle');
    const yearlyToggle = document.getElementById('pmegpYearlyToggle');
    
    if (monthlyToggle) {
        monthlyToggle.addEventListener('click', function() {
            setPmegpAmortizationView('monthly');
        });
    }
    
    if (yearlyToggle) {
        yearlyToggle.addEventListener('click', function() {
            setPmegpAmortizationView('yearly');
        });
    }
}

function setPmegpAmortizationView(view) {
    pmegpCurrentAmortizationView = view;
    
    const monthlyToggle = document.getElementById('pmegpMonthlyToggle');
    const yearlyToggle = document.getElementById('pmegpYearlyToggle');
    const periodHeader = document.getElementById('pmegpPeriodHeader');
    
    // Update button states
    if (monthlyToggle) monthlyToggle.classList.toggle('active', view === 'monthly');
    if (yearlyToggle) yearlyToggle.classList.toggle('active', view === 'yearly');
    
    // Update table header
    if (periodHeader) {
        periodHeader.textContent = view === 'monthly' ? 'Month' : 'Year';
    }
    
    // Regenerate table data
    displayPmegpAmortizationTable();
}

function setPmegpTenureMode(unit) {
    const previousUnit = pmegpCurrentTenureUnit;
    pmegpCurrentTenureUnit = unit;
    
    const tenureValueInput = document.getElementById('pmegpTenureValue');
    const tenureSlider = document.getElementById('pmegpTenureSlider');
    const tenureYrBtn = document.getElementById('pmegpTenureYrBtn');
    const tenureMoBtn = document.getElementById('pmegpTenureMoBtn');
    const tenureSliderLabels = document.getElementById('pmegpTenureSliderLabels');
    
    // Update button states
    if (tenureYrBtn) tenureYrBtn.classList.toggle('active', unit === 'years');
    if (tenureMoBtn) tenureMoBtn.classList.toggle('active', unit === 'months');
    
    // Get current value before conversion
    const currentValue = parseFloat(tenureValueInput?.value) || (unit === 'years' ? 5 : 60);
    
    if (unit === 'years') {
        // Converting to years mode
        let years;
        if (previousUnit === 'months') {
            // Convert months to years exactly
            years = Math.round(currentValue / 12 * 10) / 10; // Round to 1 decimal
        } else {
            years = currentValue;
        }
        
        if (tenureValueInput) {
            tenureValueInput.value = Math.min(Math.max(years, 1), 10);
            tenureValueInput.step = '1';
            tenureValueInput.min = '1';
            tenureValueInput.max = '10';
        }
        
        // Update slider for years (1-10 years)
        if (tenureSlider) {
            tenureSlider.min = '1';
            tenureSlider.max = '10';
            tenureSlider.step = '1';
            tenureSlider.value = Math.min(Math.max(years, 1), 10);
        }
        
        // Update slider labels for years
        if (tenureSliderLabels) {
            tenureSliderLabels.innerHTML = `
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
                <span>8</span>
                <span>9</span>
                <span>10</span>
            `;
        }
    } else {
        // Converting to months mode
        let months;
        if (previousUnit === 'years') {
            // Convert years to months exactly
            months = Math.round(currentValue * 12);
        } else {
            months = Math.round(currentValue);
        }
        
        if (tenureValueInput) {
            tenureValueInput.value = Math.min(Math.max(months, 12), 120);
            tenureValueInput.step = '1';
            tenureValueInput.min = '12';
            tenureValueInput.max = '120';
        }
        
        // Update slider for months (12-120 months)
        if (tenureSlider) {
            tenureSlider.min = '12';
            tenureSlider.max = '120';
            tenureSlider.step = '6';
            tenureSlider.value = Math.min(Math.max(months, 12), 120);
        }
        
        // Update slider labels for months
        if (tenureSliderLabels) {
            tenureSliderLabels.innerHTML = `
                <span>12</span>
                <span>24</span>
                <span>36</span>
                <span>48</span>
                <span>60</span>
                <span>72</span>
                <span>84</span>
                <span>96</span>
                <span>108</span>
                <span>120</span>
            `;
        }
    }
    
    // Ensure slider is synchronized after mode change
    updatePmegpSliderFromTenureInput();
    
    // Recalculate after mode change
    calculatePmegpAndUpdate();
}

function updatePmegpSliderFromInput() {
    const loanAmountInput = document.getElementById('pmegpLoanAmount');
    const loanAmountSlider = document.getElementById('pmegpLoanAmountSlider');
    const interestRateInput = document.getElementById('pmegpInterestRate');
    const interestRateSlider = document.getElementById('pmegpInterestRateSlider');
    
    if (loanAmountInput && loanAmountSlider) {
        const loanValue = parseFloat(loanAmountInput.value) || 500000;
        loanAmountSlider.value = Math.min(Math.max(loanValue, 10000), 20000000);
    }
    
    if (interestRateInput && interestRateSlider) {
        const rateValue = parseFloat(interestRateInput.value) || 12;
        interestRateSlider.value = Math.min(Math.max(rateValue, 8), 18);
    }
}

function updatePmegpSliderFromTenureInput() {
    const tenureValueInput = document.getElementById('pmegpTenureValue');
    const tenureSlider = document.getElementById('pmegpTenureSlider');
    
    if (tenureValueInput && tenureSlider) {
        const value = parseFloat(tenureValueInput.value) || 0;
        const min = parseFloat(tenureSlider.min);
        const max = parseFloat(tenureSlider.max);
        
        tenureSlider.value = Math.min(Math.max(value, min), max);
    }
}

function updatePmegpInputFromTenureSlider() {
    const tenureValueInput = document.getElementById('pmegpTenureValue');
    const tenureSlider = document.getElementById('pmegpTenureSlider');
    
    if (tenureValueInput && tenureSlider) {
        tenureValueInput.value = tenureSlider.value;
    }
}

function validatePmegpInputs() {
    const loanAmount = parseFloat(document.getElementById('pmegpLoanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('pmegpInterestRate').value) || 0;
    const validationMessage = document.getElementById('pmegpValidationMessage');
    
    let isValid = true;
    let message = '';
    
    if (loanAmount < 10000) {
        isValid = false;
        message = 'Loan amount must be at least ₹10,000';
    } else if (loanAmount > 20000000) {
        isValid = false;
        message = 'Loan amount cannot exceed ₹2,00,00,000';
    } else if (interestRate < 8) {
        isValid = false;
        message = 'Interest rate must be at least 8%';
    } else if (interestRate > 18) {
        isValid = false;
        message = 'Interest rate cannot exceed 18%';
    }
    
    if (validationMessage) {
        validationMessage.textContent = message;
        validationMessage.classList.toggle('show', !isValid);
    }
    
    return isValid;
}

function calculatePmegpAndUpdate() {
    const loanAmount = parseFloat(document.getElementById('pmegpLoanAmount').value) || 0;
    const annualInterestRate = parseFloat(document.getElementById('pmegpInterestRate').value) || 0;
    const tenureValue = parseFloat(document.getElementById('pmegpTenureValue').value) || 5;
    
    // Convert tenure to years
    let tenureYears = 0;
    if (pmegpCurrentTenureUnit === 'years') {
        tenureYears = tenureValue;
    } else {
        tenureYears = tenureValue / 12;
    }
    
    if (!validatePmegpInputs()) {
        return;
    }
    
    if (loanAmount > 0 && annualInterestRate > 0 && tenureYears > 0) {
        // Calculate EMI using the formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
        const monthlyRate = annualInterestRate / (12 * 100); // Convert to monthly decimal
        const totalMonths = tenureYears * 12;
        
        let emi;
        if (monthlyRate > 0) {
            const powerTerm = Math.pow(1 + monthlyRate, totalMonths);
            emi = (loanAmount * monthlyRate * powerTerm) / (powerTerm - 1);
        } else {
            emi = loanAmount / totalMonths;
        }
        
        const totalPayment = emi * totalMonths;
        const totalInterest = totalPayment - loanAmount;
        
        // Test case assertion (₹5,00,000 @ 12% for 5 years)
        if (Math.abs(loanAmount - 500000) < 1 && Math.abs(annualInterestRate - 12) < 0.1 && tenureYears === 5) {
            console.log('Test case validation:');
            console.log('EMI:', Math.round(emi), '(Expected: ~11,122)');
            console.log('Total Interest:', Math.round(totalInterest), '(Expected: ~1,67,333)');
            console.log('Total Payment:', Math.round(totalPayment), '(Expected: ~6,67,333)');
        }
        
        const resultData = {
            emi: emi,
            principal: loanAmount,
            totalInterest: totalInterest,
            totalPayment: totalPayment
        };
        
        updatePmegpResults(resultData);
        updatePmegpChart(resultData);
        generatePmegpAmortizationTable(loanAmount, monthlyRate, totalMonths, emi);
    }
}

function updatePmegpResults(data) {
    // Update result values with Indian currency formatting
    document.getElementById('pmegpMonthlyEmi').textContent = formatIndianCurrency(data.emi);
    document.getElementById('pmegpPrincipalAmount').textContent = formatIndianCurrency(data.principal);
    document.getElementById('pmegpTotalInterest').textContent = formatIndianCurrency(data.totalInterest);
    document.getElementById('pmegpTotalPayment').textContent = formatIndianCurrency(data.totalPayment);
    
    // Update percentages
    const principalPercentage = (data.principal / data.totalPayment) * 100;
    const interestPercentage = (data.totalInterest / data.totalPayment) * 100;
    
    document.getElementById('pmegpPrincipalPercentage').textContent = principalPercentage.toFixed(1) + '%';
    document.getElementById('pmegpInterestPercentage').textContent = interestPercentage.toFixed(1) + '%';
}

function updatePmegpChart(data) {
    const ctx = document.getElementById('pmegpPaymentBreakupChart').getContext('2d');
    
    if (pmegpPaymentBreakupChart) {
        pmegpPaymentBreakupChart.destroy();
    }
    
    pmegpPaymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Amount', 'Total Interest'],
            datasets: [{
                data: [data.principal, data.totalInterest],
                backgroundColor: ['#3182ce', '#e53e3e'],
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
                            const value = context.parsed;
                            const percentage = ((value / data.totalPayment) * 100).toFixed(1);
                            return context.label + ': ' + formatIndianCurrency(value) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function generatePmegpAmortizationTable(principal, monthlyRate, totalMonths, emi) {
    pmegpAmortizationData = [];
    pmegpYearlyAmortizationData = [];
    
    let remainingBalance = principal;
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    let currentYear = 1;
    
    for (let month = 1; month <= totalMonths; month++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = emi - interestPayment;
        remainingBalance = Math.max(0, remainingBalance - principalPayment);
        
        // Store monthly data
        pmegpAmortizationData.push({
            month: month,
            principal: Math.round(principalPayment),
            interest: Math.round(interestPayment),
            balance: Math.round(remainingBalance)
        });
        
        // Accumulate yearly data
        yearlyPrincipal += principalPayment;
        yearlyInterest += interestPayment;
        
        // If it's end of year or end of loan
        if (month % 12 === 0 || month === totalMonths) {
            pmegpYearlyAmortizationData.push({
                year: currentYear,
                principal: Math.round(yearlyPrincipal),
                interest: Math.round(yearlyInterest),
                balance: Math.round(remainingBalance)
            });
            
            // Reset for next year
            yearlyPrincipal = 0;
            yearlyInterest = 0;
            currentYear++;
        }
    }
    
    // Display the table based on current view
    displayPmegpAmortizationTable();
}

function displayPmegpAmortizationTable() {
    const amortizationBody = document.getElementById('pmegpAmortizationBody');
    
    if (!amortizationBody) return;
    
    let html = '';
    
    if (pmegpCurrentAmortizationView === 'monthly') {
        // Display monthly data (show first 12 months)
        const displayCount = Math.min(pmegpAmortizationData.length, 12);
        
        for (let i = 0; i < displayCount; i++) {
            const row = pmegpAmortizationData[i];
            html += `
                <tr>
                    <td>${row.month}</td>
                    <td>${formatIndianCurrency(row.principal)}</td>
                    <td>${formatIndianCurrency(row.interest)}</td>
                    <td>${formatIndianCurrency(row.balance)}</td>
                </tr>
            `;
        }
        
        if (pmegpAmortizationData.length > 12) {
            html += `
                <tr style="font-style: italic; color: #666;">
                    <td colspan="4">... and ${pmegpAmortizationData.length - 12} more months (Download CSV for full schedule)</td>
                </tr>
            `;
        }
    } else {
        // Display yearly data
        pmegpYearlyAmortizationData.forEach(row => {
            html += `
                <tr>
                    <td>${row.year}</td>
                    <td>${formatIndianCurrency(row.principal)}</td>
                    <td>${formatIndianCurrency(row.interest)}</td>
                    <td>${formatIndianCurrency(row.balance)}</td>
                </tr>
            `;
        });
    }
    
    amortizationBody.innerHTML = html;
}

function downloadPmegpAmortizationCsv() {
    if (pmegpAmortizationData.length === 0) {
        return;
    }
    
    // Create CSV content with both monthly and yearly data
    let csvContent = 'MONTHLY SCHEDULE\n';
    csvContent += 'Month,Principal Payment,Interest Payment,Remaining Balance\n';
    
    pmegpAmortizationData.forEach(row => {
        csvContent += `${row.month},${row.principal},${row.interest},${row.balance}\n`;
    });
    
    csvContent += '\n\nYEARLY SCHEDULE\n';
    csvContent += 'Year,Principal Payment,Interest Payment,Remaining Balance\n';
    
    pmegpYearlyAmortizationData.forEach(row => {
        csvContent += `${row.year},${row.principal},${row.interest},${row.balance}\n`;
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'pmegp_amortization_schedule.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function formatIndianCurrency(amount) {
    // Round to nearest rupee and format with Indian number system
    const roundedAmount = Math.round(amount);
    
    // Convert to string and handle Indian lakh/crore formatting
    const numberStr = roundedAmount.toString();
    const length = numberStr.length;
    
    if (length <= 3) {
        return '₹ ' + numberStr;
    }
    
    let result = '';
    let count = 0;
    
    for (let i = length - 1; i >= 0; i--) {
        if (count === 3) {
            result = ',' + result;
            count = 0;
        } else if (count > 3 && (count - 3) % 2 === 0) {
            result = ',' + result;
        }
        result = numberStr[i] + result;
        count++;
    }
    
    return '₹ ' + result;
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
