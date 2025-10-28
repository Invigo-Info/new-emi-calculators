// Global variables for Udyogini Loan EMI Calculator
let udyoginiPaymentBreakupChart;
let udyoginiCurrentTenureUnit = 'years'; // 'years' or 'months'
let udyoginiCurrentAmortizationView = 'yearly'; // 'yearly' or 'monthly'
let udyoginiAmortizationData = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    udyoginiSetupEventListeners();
    udyoginiSetupTenureEventListeners();
    udyoginiSetupAmortizationEventListeners();
    udyoginiCalculateAndUpdate();
});

function udyoginiSetupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'udyoginiLoanAmount', slider: 'udyoginiLoanAmountSlider', min: 100000, max: 300000 },
        { input: 'udyoginiInterestRate', slider: 'udyoginiInterestRateSlider', min: 5, max: 20 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                udyoginiCalculateAndUpdate();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                udyoginiCalculateAndUpdate();
            });
        }
    });
    
    // Category change listener
    const categorySelect = document.getElementById('udyoginiCategory');
    if (categorySelect) {
        categorySelect.addEventListener('change', udyoginiCalculateAndUpdate);
    }
    
    // Subsidy checkbox listener
    const subsidyCheckbox = document.getElementById('udyoginiApplySubsidy');
    if (subsidyCheckbox) {
        subsidyCheckbox.addEventListener('change', udyoginiCalculateAndUpdate);
    }
}

// Tenure event listeners setup
function udyoginiSetupTenureEventListeners() {
    const tenureValueInput = document.getElementById('udyoginiTenureValue');
    const tenureSlider = document.getElementById('udyoginiTenureSlider');
    const tenureYrBtn = document.getElementById('udyoginiTenureYrBtn');
    const tenureMoBtn = document.getElementById('udyoginiTenureMoBtn');
    
    // Initialize in years mode
    udyoginiSetTenureMode('years');
    
    // Input value changes
    if (tenureValueInput) {
        tenureValueInput.addEventListener('input', function() {
            udyoginiUpdateSliderFromInput();
            udyoginiCalculateAndUpdate();
        });
    }
    
    // Slider changes
    if (tenureSlider) {
        tenureSlider.addEventListener('input', function() {
            udyoginiUpdateInputFromSlider();
            udyoginiCalculateAndUpdate();
        });
    }
    
    // Year button click
    if (tenureYrBtn) {
        tenureYrBtn.addEventListener('click', function() {
            if (udyoginiCurrentTenureUnit !== 'years') {
                udyoginiSetTenureMode('years');
            }
        });
    }
    
    // Month button click
    if (tenureMoBtn) {
        tenureMoBtn.addEventListener('click', function() {
            if (udyoginiCurrentTenureUnit !== 'months') {
                udyoginiSetTenureMode('months');
            }
        });
    }
}

function udyoginiSetTenureMode(unit) {
    const previousUnit = udyoginiCurrentTenureUnit;
    udyoginiCurrentTenureUnit = unit;
    
    const tenureValueInput = document.getElementById('udyoginiTenureValue');
    const tenureSlider = document.getElementById('udyoginiTenureSlider');
    const tenureYrBtn = document.getElementById('udyoginiTenureYrBtn');
    const tenureMoBtn = document.getElementById('udyoginiTenureMoBtn');
    const tenureSliderLabels = document.getElementById('udyoginiTenureSliderLabels');
    
    if (!tenureValueInput || !tenureSlider || !tenureYrBtn || !tenureMoBtn || !tenureSliderLabels) {
        return;
    }
    
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
    udyoginiUpdateSliderFromInput();
    
    // Recalculate after mode change
    udyoginiCalculateAndUpdate();
}

function udyoginiUpdateSliderFromInput() {
    const tenureValueInput = document.getElementById('udyoginiTenureValue');
    const tenureSlider = document.getElementById('udyoginiTenureSlider');
    
    if (!tenureValueInput || !tenureSlider) return;
    
    const value = parseFloat(tenureValueInput.value) || 0;
    const min = parseFloat(tenureSlider.min);
    const max = parseFloat(tenureSlider.max);
    
    tenureSlider.value = Math.min(Math.max(value, min), max);
}

function udyoginiUpdateInputFromSlider() {
    const tenureValueInput = document.getElementById('udyoginiTenureValue');
    const tenureSlider = document.getElementById('udyoginiTenureSlider');
    
    if (!tenureValueInput || !tenureSlider) return;
    
    tenureValueInput.value = tenureSlider.value;
}

// Amortization event listeners setup
function udyoginiSetupAmortizationEventListeners() {
    const yearlyBtn = document.getElementById('udyoginiAmortizationYearlyBtn');
    const monthlyBtn = document.getElementById('udyoginiAmortizationMonthlyBtn');
    
    if (yearlyBtn) {
        yearlyBtn.addEventListener('click', function() {
            udyoginiSetAmortizationView('yearly');
        });
    }
    
    if (monthlyBtn) {
        monthlyBtn.addEventListener('click', function() {
            udyoginiSetAmortizationView('monthly');
        });
    }
}

function udyoginiSetAmortizationView(view) {
    udyoginiCurrentAmortizationView = view;
    
    const yearlyBtn = document.getElementById('udyoginiAmortizationYearlyBtn');
    const monthlyBtn = document.getElementById('udyoginiAmortizationMonthlyBtn');
    
    if (yearlyBtn && monthlyBtn) {
        yearlyBtn.classList.toggle('active', view === 'yearly');
        monthlyBtn.classList.toggle('active', view === 'monthly');
    }
    
    // Update the amortization table display
    udyoginiUpdateAmortizationTable();
}

// Subsidy calculation function
function udyoginiSubsidyAmt(category, P) {
    if (category === "SC/ST") {
        return Math.min(P * 0.50, 150000); // 50% cap ₹1,50,000
    }
    return Math.min(P * 0.30, 90000); // 30% cap ₹90,000
}

// EMI calculation function
function udyoginiEmi(P, annualRatePct, months) {
    const r = (annualRatePct / 12) / 100;
    if (r === 0) return P / months;
    return P * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
}

function udyoginiCalculateAndUpdate() {
    const loanAmount = parseFloat(document.getElementById('udyoginiLoanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('udyoginiInterestRate').value) || 0;
    const tenureValue = parseFloat(document.getElementById('udyoginiTenureValue').value) || 0;
    const category = document.getElementById('udyoginiCategory').value;
    const applySubsidy = document.getElementById('udyoginiApplySubsidy').checked;
    
    // Convert tenure to months
    let tenureMonths = 0;
    if (udyoginiCurrentTenureUnit === 'years') {
        tenureMonths = Math.round(tenureValue * 12);
    } else {
        tenureMonths = Math.round(tenureValue);
    }
    
    if (loanAmount > 0 && interestRate > 0 && tenureMonths > 0) {
        // Make API call to backend for accurate calculations
        fetch('/calculate-udyogini-loan-emi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                loanAmount: loanAmount,
                interestRate: interestRate,
                tenureMonths: tenureMonths,
                category: category,
                applySubsidy: applySubsidy
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                console.error('Calculation error:', data.error);
                return;
            }
            
            const resultData = {
                // Gross values
                grossEmi: data.grossEmi,
                grossPrincipal: data.grossPrincipal,
                grossTotalInterest: data.grossTotalInterest,
                grossTotalPayment: data.grossTotalPayment,
                
                // Subsidy and effective values
                subsidyAmount: data.subsidyAmount,
                effectivePrincipal: data.effectivePrincipal,
                effectiveEmi: data.effectiveEmi,
                effectiveTotalInterest: data.effectiveTotalInterest,
                effectiveTotalPayment: data.effectiveTotalPayment,
                
                // Chart data (using gross values)
                principal: data.grossPrincipal,
                totalInterest: data.grossTotalInterest,
                totalPayment: data.grossTotalPayment,
                
                // Additional data
                tenureMonths: tenureMonths
            };
            
            // Store amortization data if available
            if (data.amortizationSchedule) {
                udyoginiAmortizationData = data.amortizationSchedule;
            }
            
            udyoginiUpdateResults(resultData);
            udyoginiUpdateChart(resultData);
            udyoginiUpdateAmortizationSummary(resultData);
            udyoginiUpdateAmortizationTable();
        })
        .catch(error => {
            console.error('Error:', error);
            // Fallback to client-side calculation
            udyoginiCalculateClientSide();
        });
    }
}

function udyoginiCalculateClientSide() {
    const loanAmount = parseFloat(document.getElementById('udyoginiLoanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('udyoginiInterestRate').value) || 0;
    const tenureValue = parseFloat(document.getElementById('udyoginiTenureValue').value) || 0;
    const category = document.getElementById('udyoginiCategory').value;
    const applySubsidy = document.getElementById('udyoginiApplySubsidy').checked;
    
    // Convert tenure to months
    let tenure = 0;
    if (udyoginiCurrentTenureUnit === 'years') {
        tenure = Math.round(tenureValue * 12);
    } else {
        tenure = Math.round(tenureValue);
    }
    
    // Calculate subsidy amount
    const subsidyAmount = udyoginiSubsidyAmt(category, loanAmount);
    
    // Calculate gross values (without subsidy)
    const grossEmi = udyoginiEmi(loanAmount, interestRate, tenure);
    const grossTotalPayment = grossEmi * tenure;
    const grossTotalInterest = grossTotalPayment - loanAmount;
    
    // Calculate effective values (with subsidy if applied)
    let effectivePrincipal = loanAmount;
    let effectiveEmi = grossEmi;
    let effectiveTotalPayment = grossTotalPayment;
    let effectiveTotalInterest = grossTotalInterest;
    
    if (applySubsidy) {
        effectivePrincipal = loanAmount - subsidyAmount;
        effectiveEmi = udyoginiEmi(effectivePrincipal, interestRate, tenure);
        effectiveTotalPayment = effectiveEmi * tenure;
        effectiveTotalInterest = effectiveTotalPayment - effectivePrincipal;
    }
    
    const resultData = {
        // Gross values
        grossEmi: grossEmi,
        grossPrincipal: loanAmount,
        grossTotalInterest: grossTotalInterest,
        grossTotalPayment: grossTotalPayment,
        
        // Subsidy and effective values
        subsidyAmount: subsidyAmount,
        effectivePrincipal: effectivePrincipal,
        effectiveEmi: effectiveEmi,
        effectiveTotalInterest: effectiveTotalInterest,
        effectiveTotalPayment: effectiveTotalPayment,
        
        // Chart data (using gross values)
        principal: loanAmount,
        totalInterest: grossTotalInterest,
        totalPayment: grossTotalPayment,
        
        // Additional data
        tenureMonths: tenure
    };
    
    // Generate client-side amortization data
    udyoginiAmortizationData = udyoginiGenerateAmortizationData(loanAmount, interestRate, tenure, grossEmi);
    
    udyoginiUpdateResults(resultData);
    udyoginiUpdateChart(resultData);
    udyoginiUpdateAmortizationSummary(resultData);
    udyoginiUpdateAmortizationTable();
}

function udyoginiUpdateResults(data) {
    // Update gross EMI results
    document.getElementById('udyoginiGrossEmi').textContent = udyoginiFormatCurrency(data.grossEmi);
    document.getElementById('udyoginiGrossPrincipal').textContent = udyoginiFormatCurrency(data.grossPrincipal);
    document.getElementById('udyoginiGrossInterest').textContent = udyoginiFormatCurrency(data.grossTotalInterest);
    document.getElementById('udyoginiGrossTotal').textContent = udyoginiFormatCurrency(data.grossTotalPayment);
    
    // Update subsidy information
    document.getElementById('udyoginiSubsidyAmount').textContent = udyoginiFormatCurrency(data.subsidyAmount);
    document.getElementById('udyoginiEffectivePrincipal').textContent = udyoginiFormatCurrency(data.effectivePrincipal);
    
    // Update effective EMI results
    document.getElementById('udyoginiEffectiveEmi').textContent = udyoginiFormatCurrency(data.effectiveEmi);
    document.getElementById('udyoginiEffectivePrincipalResult').textContent = udyoginiFormatCurrency(data.effectivePrincipal);
    document.getElementById('udyoginiEffectiveInterest').textContent = udyoginiFormatCurrency(data.effectiveTotalInterest);
    document.getElementById('udyoginiEffectiveTotal').textContent = udyoginiFormatCurrency(data.effectiveTotalPayment);
    
    // Update percentages for chart (based on gross values)
    const principalPercentage = (data.principal / data.totalPayment) * 100;
    const interestPercentage = (data.totalInterest / data.totalPayment) * 100;
    
    document.getElementById('udyoginiPrincipalPercentage').textContent = principalPercentage.toFixed(1) + '%';
    document.getElementById('udyoginiInterestPercentage').textContent = interestPercentage.toFixed(1) + '%';
}

function udyoginiUpdateChart(data) {
    const ctx = document.getElementById('udyoginiPaymentBreakupChart').getContext('2d');
    
    if (udyoginiPaymentBreakupChart) {
        udyoginiPaymentBreakupChart.destroy();
    }
    
    udyoginiPaymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Amount', 'Total Interest'],
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
                            const value = context.parsed;
                            const percentage = ((value / data.totalPayment) * 100).toFixed(1);
                            return context.label + ': ₹' + value.toLocaleString('en-IN') + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function udyoginiFormatCurrency(amount) {
    return '₹ ' + Math.round(amount).toLocaleString('en-IN');
}

// Generate amortization data client-side
function udyoginiGenerateAmortizationData(principal, annualRate, months, emi) {
    const monthlyRate = (annualRate / 12) / 100;
    const monthly = [];
    const yearly = [];
    
    let balance = principal;
    let currentYear = 1;
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    let yearlyPayment = 0;
    let yearStartBalance = principal;
    
    for (let month = 1; month <= months; month++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = emi - interestPayment;
        const newBalance = Math.max(0, balance - principalPayment);
        
        // Monthly data
        monthly.push({
            month: month,
            openingBalance: balance,
            emi: emi,
            principal: principalPayment,
            interest: interestPayment,
            closingBalance: newBalance
        });
        
        // Accumulate yearly data
        yearlyPrincipal += principalPayment;
        yearlyInterest += interestPayment;
        yearlyPayment += emi;
        
        balance = newBalance;
        
        // Check if year is complete or it's the last month
        if (month % 12 === 0 || month === months) {
            yearly.push({
                year: currentYear,
                openingBalance: yearStartBalance,
                totalPayment: yearlyPayment,
                totalPrincipal: yearlyPrincipal,
                totalInterest: yearlyInterest,
                closingBalance: balance
            });
            
            // Reset for next year
            currentYear++;
            yearStartBalance = balance;
            yearlyPrincipal = 0;
            yearlyInterest = 0;
            yearlyPayment = 0;
        }
    }
    
    return {
        monthly: monthly,
        yearly: yearly
    };
}

// Amortization functions
function udyoginiUpdateAmortizationSummary(data) {
    const totalEmiEl = document.getElementById('udyoginiTotalEmiPayments');
    const totalInterestEl = document.getElementById('udyoginiAmortizationTotalInterest');
    const totalAmountEl = document.getElementById('udyoginiAmortizationTotalAmount');
    
    if (totalEmiEl) totalEmiEl.textContent = data.tenureMonths;
    if (totalInterestEl) totalInterestEl.textContent = udyoginiFormatCurrency(data.grossTotalInterest);
    if (totalAmountEl) totalAmountEl.textContent = udyoginiFormatCurrency(data.grossTotalPayment);
}

function udyoginiUpdateAmortizationTable() {
    const tableBody = document.getElementById('udyoginiAmortizationTableBody');
    if (!tableBody || !udyoginiAmortizationData) {
        return;
    }
    
    // Clear existing table
    tableBody.innerHTML = '';
    
    let scheduleData = [];
    
    if (udyoginiCurrentAmortizationView === 'yearly') {
        scheduleData = udyoginiAmortizationData.yearly || [];
    } else {
        scheduleData = udyoginiAmortizationData.monthly || [];
    }
    
    scheduleData.forEach((item, index) => {
        const row = tableBody.insertRow();
        
        // Period
        const periodCell = row.insertCell(0);
        if (udyoginiCurrentAmortizationView === 'yearly') {
            periodCell.textContent = `Year ${item.year}`;
        } else {
            periodCell.textContent = `Month ${item.month || (index + 1)}`;
        }
        
        // Opening Balance
        const openingCell = row.insertCell(1);
        openingCell.textContent = udyoginiFormatCurrency(item.openingBalance || item.opening_balance || 0);
        openingCell.className = 'balance-col';
        
        // EMI
        const emiCell = row.insertCell(2);
        emiCell.textContent = udyoginiFormatCurrency(item.emi || item.totalPayment || 0);
        
        // Principal
        const principalCell = row.insertCell(3);
        principalCell.textContent = udyoginiFormatCurrency(item.principal || item.totalPrincipal || 0);
        principalCell.className = 'principal-col';
        
        // Interest
        const interestCell = row.insertCell(4);
        interestCell.textContent = udyoginiFormatCurrency(item.interest || item.totalInterest || 0);
        interestCell.className = 'interest-col';
        
        // Closing Balance
        const closingCell = row.insertCell(5);
        closingCell.textContent = udyoginiFormatCurrency(item.closingBalance || item.closing_balance || 0);
        closingCell.className = 'balance-col';
    });
    
    // If no data available, show a message
    if (scheduleData.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 6;
        cell.textContent = 'Amortization data not available';
        cell.style.textAlign = 'center';
        cell.style.padding = '20px';
        cell.style.color = '#666';
    }
}

// Mega Menu Functionality (reuse from other calculators)
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
