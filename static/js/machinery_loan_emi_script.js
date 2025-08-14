// Global variables
let paymentBreakupChart;
let currentInputMode = 'loan_amount';
let currentTenureUnit = 'years'; // 'years' or 'months'
let currentAmortizationView = 'monthly'; // 'monthly' or 'yearly'
let amortizationData = [];
let yearlyAmortizationData = [];

// Calculation functions as specified
function monthlyRate(annualPct) {
    return (annualPct / 12) / 100;
}

function emi(P, annualPct, months) {
    const r = monthlyRate(annualPct);
    if (months <= 0) return 0;
    if (r === 0) return P / months;
    const x = Math.pow(1 + r, months);
    return P * r * x / (x - 1);
}

function totals(P, annualPct, months) {
    const E = emi(P, annualPct, months);
    const totalPayment = E * months;
    const totalInterest = totalPayment - P;
    return { emi: E, totalPayment, totalInterest };
}

function fees(P, feePct = 0, gstPct = 0) {
    const processing = P * (feePct / 100);
    const gst = processing * (gstPct / 100);
    const netDisbursal = P - processing - gst;
    return { processingFee: processing, gstOnFee: gst, netDisbursal };
}

function firstMonthSplit(P, annualPct, months) {
    const r = monthlyRate(annualPct);
    const E = emi(P, annualPct, months);
    const interest = P * r;
    const principal = E - interest;
    const balance = P - principal;
    return { interest, principal, balance, emi: E };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    // Don't call updateSliderValues() here as tenure setup handles its own slider
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input mode toggle
    const loanAmountModeBtn = document.getElementById('loanAmountModeBtn');
    const costMarginModeBtn = document.getElementById('costMarginModeBtn');
    
    loanAmountModeBtn.addEventListener('click', () => setInputMode('loan_amount'));
    costMarginModeBtn.addEventListener('click', () => setInputMode('cost_margin'));

    // Input change listeners for all inputs and their corresponding sliders
    const inputSliderPairs = [
        { input: 'loanAmount', slider: 'loanAmountSlider' },
        { input: 'equipmentCost', slider: 'equipmentCostSlider' },
        { input: 'marginPercent', slider: 'marginPercentSlider' },
        { input: 'annualInterestRate', slider: 'interestRateSlider' },
        { input: 'processingFeePercent', slider: 'processingFeeSlider' },
        { input: 'gstOnFeePercent', slider: 'gstOnFeeSlider' }
    ];
    
    inputSliderPairs.forEach(({ input, slider }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = parseFloat(this.value) || 0;
                const min = parseFloat(this.min) || 0;
                const max = parseFloat(this.max) || 100000000;
                const clampedValue = Math.max(Math.min(value, max), min);
                
                sliderElement.value = clampedValue;
                this.value = clampedValue;
                
                handleInputChange();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                handleInputChange();
            });
        }
    });

    // Special handling for tenure
    setupTenureEventListeners();

    // Download CSV button
    const downloadCsvBtn = document.getElementById('downloadCsvBtn');
    if (downloadCsvBtn) {
        downloadCsvBtn.addEventListener('click', downloadAmortizationCsv);
    }

    // Amortization view toggle
    const monthlyViewBtn = document.getElementById('monthlyViewBtn');
    const yearlyViewBtn = document.getElementById('yearlyViewBtn');
    
    if (monthlyViewBtn) {
        monthlyViewBtn.addEventListener('click', () => setAmortizationView('monthly'));
    }
    if (yearlyViewBtn) {
        yearlyViewBtn.addEventListener('click', () => setAmortizationView('yearly'));
    }
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
        updateSliderFromTenureInput();
        handleInputChange();
    });
    
    // Slider changes
    tenureSlider.addEventListener('input', function() {
        updateInputFromTenureSlider();
        handleInputChange();
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
            years = Math.max(1, Math.min(years, 10)); // Clamp to valid range
        } else {
            years = currentValue;
        }
        
        tenureValueInput.value = years;
        tenureValueInput.step = '0.5';
        tenureValueInput.min = '1';
        tenureValueInput.max = '10';
        
        // Update slider for years (1-10 years)
        tenureSlider.min = '1';
        tenureSlider.max = '10';
        tenureSlider.step = '0.5';
        tenureSlider.value = years;
        
        // Update slider labels for years
        tenureSliderLabels.innerHTML = `
            <span>1</span>
            <span>2.5</span>
            <span>5</span>
            <span>7.5</span>
            <span>10</span>
        `;
    } else {
        // Converting to months mode
        let months;
        if (previousUnit === 'years') {
            // Convert years to months exactly
            months = Math.round(currentValue * 12);
            months = Math.max(6, Math.min(months, 120)); // Clamp to valid range
        } else {
            months = Math.round(currentValue);
        }
        
        tenureValueInput.value = months;
        tenureValueInput.step = '1';
        tenureValueInput.min = '6';
        tenureValueInput.max = '120';
        
        // Update slider for months (6-120 months)
        tenureSlider.min = '6';
        tenureSlider.max = '120';
        tenureSlider.step = '1';
        tenureSlider.value = months;
        
        // Update slider labels for months
        tenureSliderLabels.innerHTML = `
            <span>6</span>
            <span>30</span>
            <span>60</span>
            <span>90</span>
            <span>120</span>
        `;
    }
    
    // Ensure slider is synchronized after mode change
    updateSliderFromTenureInput();
    
    // Recalculate after mode change
    handleInputChange();
}

function updateSliderFromTenureInput() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    
    const value = parseFloat(tenureValueInput.value) || 0;
    const min = parseFloat(tenureSlider.min);
    const max = parseFloat(tenureSlider.max);
    
    tenureSlider.value = Math.min(Math.max(value, min), max);
}

function updateInputFromTenureSlider() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    
    tenureValueInput.value = tenureSlider.value;
}

function setInputMode(mode) {
    currentInputMode = mode;
    
    const loanAmountModeBtn = document.getElementById('loanAmountModeBtn');
    const costMarginModeBtn = document.getElementById('costMarginModeBtn');
    const loanAmountInputs = document.getElementById('loanAmountInputs');
    const costMarginInputs = document.getElementById('costMarginInputs');
    
    // Update button states
    loanAmountModeBtn.classList.toggle('active', mode === 'loan_amount');
    costMarginModeBtn.classList.toggle('active', mode === 'cost_margin');
    
    // Show/hide input sections
    if (mode === 'loan_amount') {
        loanAmountInputs.style.display = 'grid';
        costMarginInputs.style.display = 'none';
    } else {
        loanAmountInputs.style.display = 'none';
        costMarginInputs.style.display = 'grid';
    }
    
    handleInputChange();
}

function handleInputChange() {
    if (currentInputMode === 'cost_margin') {
        updateDerivedLoanAmount();
    }
    calculateAndUpdate();
}

function updateDerivedLoanAmount() {
    const equipmentCost = parseFloat(document.getElementById('equipmentCost').value) || 0;
    const marginPercent = parseFloat(document.getElementById('marginPercent').value) || 0;
    
    const derivedAmount = equipmentCost * (1 - marginPercent / 100);
    document.getElementById('derivedLoanAmount').value = formatCurrency(derivedAmount);
}

function updateSliderValues() {
    // Sync all sliders with their input values
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        const sliderId = input.id + 'Slider';
        const slider = document.getElementById(sliderId);
        if (slider && input.id !== 'tenureValue') { // Skip tenure as it has special handling
            slider.value = input.value;
        }
    });
    
    // Handle tenure slider separately
    updateSliderFromTenureInput();
}

function getCurrentLoanAmount() {
    if (currentInputMode === 'loan_amount') {
        return parseFloat(document.getElementById('loanAmount').value) || 0;
    } else {
        const equipmentCost = parseFloat(document.getElementById('equipmentCost').value) || 0;
        const marginPercent = parseFloat(document.getElementById('marginPercent').value) || 0;
        return equipmentCost * (1 - marginPercent / 100);
    }
}

function getCurrentTenureInMonths() {
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 0;
    
    if (currentTenureUnit === 'years') {
        return Math.round(tenureValue * 12);
    } else {
        return Math.round(tenureValue);
    }
}

function calculateAndUpdate() {
    const loanAmount = getCurrentLoanAmount();
    const annualInterestRate = parseFloat(document.getElementById('annualInterestRate').value) || 0;
    const tenureMonths = getCurrentTenureInMonths();
    const processingFeePercent = parseFloat(document.getElementById('processingFeePercent').value) || 0;
    const gstOnFeePercent = parseFloat(document.getElementById('gstOnFeePercent').value) || 0;

    // Validation
    if (!validateInputs(loanAmount, annualInterestRate, tenureMonths)) {
        return;
    }

    // Calculate EMI and totals
    const emiCalc = emi(loanAmount, annualInterestRate, tenureMonths);
    const totalsCalc = totals(loanAmount, annualInterestRate, tenureMonths);
    const feesCalc = fees(loanAmount, processingFeePercent, gstOnFeePercent);
    const firstMonth = firstMonthSplit(loanAmount, annualInterestRate, tenureMonths);

    // Generate amortization schedule
    amortizationData = generateAmortizationSchedule(loanAmount, annualInterestRate, tenureMonths);
    yearlyAmortizationData = generateYearlyAmortizationSchedule(amortizationData);

    // Update UI
    updateResults({
        emi: emiCalc,
        totalInterest: totalsCalc.totalInterest,
        totalPayment: totalsCalc.totalPayment,
        loanAmount: loanAmount
    });

    updateFeeDetails(feesCalc, processingFeePercent);
    updateFirstMonthBreakdown(firstMonth);
    updateChart(loanAmount, totalsCalc.totalInterest);
    updateAmortizationDisplay();
}

function validateInputs(loanAmount, annualInterestRate, tenureMonths) {
    // Reset any previous error styling
    clearValidationErrors();

    let isValid = true;
    const errors = [];

    if (loanAmount < 50000) {
        errors.push('Loan amount must be at least ₹50,000');
        highlightError('loanAmount');
        isValid = false;
    }

    if (loanAmount > 100000000) {
        errors.push('Loan amount cannot exceed ₹10,00,00,000');
        highlightError('loanAmount');
        isValid = false;
    }

    if (tenureMonths < 6 || tenureMonths > 120) {
        errors.push('Tenure must be between 6 and 120 months');
        highlightError('tenureValue');
        isValid = false;
    }

    if (annualInterestRate < 0 || annualInterestRate > 40) {
        errors.push('Interest rate must be between 0% and 40%');
        highlightError('annualInterestRate');
        isValid = false;
    }

    if (currentInputMode === 'cost_margin') {
        const marginPercent = parseFloat(document.getElementById('marginPercent').value) || 0;
        if (marginPercent < 0 || marginPercent > 80) {
            errors.push('Margin percentage must be between 0% and 80%');
            highlightError('marginPercent');
            isValid = false;
        }

        const equipmentCost = parseFloat(document.getElementById('equipmentCost').value) || 0;
        if (equipmentCost < loanAmount) {
            errors.push('Equipment cost must be greater than loan amount');
            highlightError('equipmentCost');
            isValid = false;
        }
    }

    if (errors.length > 0) {
        showValidationErrors(errors);
    }

    return isValid;
}

function clearValidationErrors() {
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.parentElement.classList.remove('error');
    });
    
    const errorContainer = document.getElementById('validationErrors');
    if (errorContainer) {
        errorContainer.remove();
    }
}

function highlightError(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.parentElement.classList.add('error');
    }
}

function showValidationErrors(errors) {
    let errorContainer = document.getElementById('validationErrors');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'validationErrors';
        errorContainer.className = 'validation-errors';
        document.querySelector('.input-sections').prepend(errorContainer);
    }
    
    errorContainer.innerHTML = `
        <div class="error-list">
            <h4>Please fix the following errors:</h4>
            <ul>
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        </div>
    `;
}

function generateAmortizationSchedule(P, annualPct, months) {
    const monthlyRateVal = monthlyRate(annualPct);
    const emiVal = emi(P, annualPct, months);
    const schedule = [];
    let balance = P;

    for (let month = 1; month <= months; month++) {
        const interestPayment = balance * monthlyRateVal;
        const principalPayment = emiVal - interestPayment;
        balance = Math.max(0, balance - principalPayment);

        schedule.push({
            month: month,
            principal: principalPayment,
            interest: interestPayment,
            balance: balance
        });
    }

    return schedule;
}

function updateResults(data) {
    document.getElementById('monthlyEmi').textContent = formatCurrency(data.emi);
    document.getElementById('totalInterest').textContent = formatCurrency(data.totalInterest);
    document.getElementById('totalPayment').textContent = formatCurrency(data.totalPayment);
}

function updateFeeDetails(feesData, processingFeePercent) {
    const feeDetails = document.getElementById('feeDetails');
    
    if (processingFeePercent > 0) {
        feeDetails.style.display = 'block';
        document.getElementById('processingFeeAmount').textContent = formatCurrency(feesData.processingFee);
        document.getElementById('gstAmount').textContent = formatCurrency(feesData.gstOnFee);
        document.getElementById('netDisbursal').textContent = formatCurrency(feesData.netDisbursal);
    } else {
        feeDetails.style.display = 'none';
    }
}

function updateFirstMonthBreakdown(firstMonth) {
    document.getElementById('firstMonthPrincipal').textContent = formatCurrency(firstMonth.principal);
    document.getElementById('firstMonthInterest').textContent = formatCurrency(firstMonth.interest);
    document.getElementById('firstMonthBalance').textContent = formatCurrency(firstMonth.balance);
}

function updateChart(principal, totalInterest) {
    const ctx = document.getElementById('paymentBreakupChart').getContext('2d');
    
    if (paymentBreakupChart) {
        paymentBreakupChart.destroy();
    }
    
    const totalPayment = principal + totalInterest;
    const principalPercentage = (principal / totalPayment) * 100;
    const interestPercentage = (totalInterest / totalPayment) * 100;
    
    // Update percentage displays
    document.getElementById('principalPercentage').textContent = principalPercentage.toFixed(1) + '%';
    document.getElementById('interestPercentage').textContent = interestPercentage.toFixed(1) + '%';
    
    paymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Amount', 'Total Interest'],
            datasets: [{
                data: [principal, totalInterest],
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
                            const percentage = ((value / totalPayment) * 100).toFixed(1);
                            return context.label + ': ₹' + value.toLocaleString('en-IN') + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function setAmortizationView(view) {
    currentAmortizationView = view;
    
    const monthlyViewBtn = document.getElementById('monthlyViewBtn');
    const yearlyViewBtn = document.getElementById('yearlyViewBtn');
    const periodHeader = document.getElementById('periodHeader');
    
    // Update button states
    monthlyViewBtn.classList.toggle('active', view === 'monthly');
    yearlyViewBtn.classList.toggle('active', view === 'yearly');
    
    // Update table header
    periodHeader.textContent = view === 'monthly' ? 'Month' : 'Year';
    
    // Update table content
    updateAmortizationDisplay();
}

function generateYearlyAmortizationSchedule(monthlyData) {
    const yearlyData = [];
    let currentYear = 1;
    let yearPrincipal = 0;
    let yearInterest = 0;
    let lastBalance = 0;
    
    monthlyData.forEach((month, index) => {
        yearPrincipal += month.principal;
        yearInterest += month.interest;
        lastBalance = month.balance;
        
        // Every 12 months or at the end, create a yearly summary
        if ((index + 1) % 12 === 0 || index === monthlyData.length - 1) {
            yearlyData.push({
                year: currentYear,
                principal: yearPrincipal,
                interest: yearInterest,
                balance: lastBalance
            });
            
            currentYear++;
            yearPrincipal = 0;
            yearInterest = 0;
        }
    });
    
    return yearlyData;
}

function updateAmortizationDisplay() {
    const data = currentAmortizationView === 'monthly' ? amortizationData : yearlyAmortizationData;
    const tbody = document.getElementById('amortizationTableBody');
    tbody.innerHTML = '';
    
    if (!data || data.length === 0) {
        return;
    }
    
    // For monthly view, limit display to first 120 rows for performance
    const displayLimit = currentAmortizationView === 'monthly' ? 120 : data.length;
    const displayData = data.slice(0, displayLimit);
    
    displayData.forEach(row => {
        const tr = document.createElement('tr');
        const periodValue = currentAmortizationView === 'monthly' ? row.month : row.year;
        
        tr.innerHTML = `
            <td>${periodValue}</td>
            <td>${formatCurrency(row.principal)}</td>
            <td>${formatCurrency(row.interest)}</td>
            <td>${formatCurrency(row.balance)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add a note if monthly data is truncated
    if (currentAmortizationView === 'monthly' && data.length > displayLimit) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="4" style="text-align: center; font-style: italic; color: #666;">
                ... and ${data.length - displayLimit} more rows (download CSV for complete schedule)
            </td>
        `;
        tbody.appendChild(tr);
    }
}

function downloadAmortizationCsv() {
    const data = currentAmortizationView === 'monthly' ? amortizationData : yearlyAmortizationData;
    
    if (!data || data.length === 0) {
        alert('No amortization data available. Please calculate first.');
        return;
    }
    
    const periodHeader = currentAmortizationView === 'monthly' ? 'Month' : 'Year';
    let csvContent = `${periodHeader},Principal,Interest,Balance\n`;
    
    data.forEach(row => {
        const periodValue = currentAmortizationView === 'monthly' ? row.month : row.year;
        csvContent += `${periodValue},${row.principal.toFixed(2)},${row.interest.toFixed(2)},${row.balance.toFixed(2)}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const viewType = currentAmortizationView === 'monthly' ? 'monthly' : 'yearly';
    link.download = `machinery_loan_amortization_${viewType}.csv`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function formatCurrency(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) {
        return '₹0';
    }
    return '₹' + Math.round(amount).toLocaleString('en-IN');
}

// Add error styling for validation
const style = document.createElement('style');
style.textContent = `
    .input-field-container.error {
        border-color: #e53e3e !important;
        box-shadow: 0 0 0 1px #e53e3e !important;
    }
    
    .validation-errors {
        background: #fed7d7;
        border: 1px solid #e53e3e;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 20px;
    }
    
    .validation-errors h4 {
        color: #742a2a;
        margin-bottom: 10px;
        font-size: 1rem;
    }
    
    .validation-errors ul {
        margin: 0;
        padding-left: 20px;
    }
    
    .validation-errors li {
        color: #742a2a;
        margin-bottom: 5px;
    }
`;
document.head.appendChild(style);

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
