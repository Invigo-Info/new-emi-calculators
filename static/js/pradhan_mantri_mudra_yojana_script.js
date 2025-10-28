// Global variables
let paymentBreakupChart;
let currentTenureUnit = 'months'; // 'years' or 'months'
let amortizationData = [];
let currentAmortizationView = 'monthly'; // 'monthly' or 'yearly'

// PMMY Category limits
const PMMY_CATEGORIES = {
    'Shishu': { min: 1, max: 50000 },
    'Kishore': { min: 50001, max: 500000 },
    'Tarun': { min: 500001, max: 1000000 },
    'Tarun Plus': { min: 1000001, max: 2000000 }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    
    // Ensure initial slider synchronization
    updateSliderFromInput();
    
    // Set initial tenure mode to months
    setTenureMode('months');
    
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'loanAmount', slider: 'loanAmountSlider', min: 10000, max: 2000000 },
        { input: 'annualInterestRatePercent', slider: 'interestRateSlider', min: 5, max: 15 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                validateCategoryLimits();
                calculateAndUpdate();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                validateCategoryLimits();
                calculateAndUpdate();
            });
        }
    });
    
    // Special handling for tenure
    setupTenureEventListeners();
    
    // PMMY Category dropdown
    const categoryDropdown = document.getElementById('pmmyCategory');
    if (categoryDropdown) {
        categoryDropdown.addEventListener('change', function() {
            handleCategoryChange(this.value);
            validateCategoryLimits();
            calculateAndUpdate();
        });
    }
    
    // Download CSV button
    const downloadBtn = document.getElementById('downloadCsvBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadAmortizationCSV);
    }
    
    // Amortization view toggle buttons
    const monthlyAmortizationBtn = document.getElementById('monthlyAmortizationBtn');
    const yearlyAmortizationBtn = document.getElementById('yearlyAmortizationBtn');
    
    if (monthlyAmortizationBtn) {
        monthlyAmortizationBtn.addEventListener('click', function() {
            setAmortizationView('monthly');
        });
    }
    
    if (yearlyAmortizationBtn) {
        yearlyAmortizationBtn.addEventListener('click', function() {
            setAmortizationView('yearly');
        });
    }
}

function setupTenureEventListeners() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    const tenureYrBtn = document.getElementById('tenureYrBtn');
    const tenureMoBtn = document.getElementById('tenureMoBtn');
    
    // Input value changes
    if (tenureValueInput) {
        tenureValueInput.addEventListener('input', function() {
            updateSliderFromInput();
            calculateAndUpdate();
        });
    }
    
    // Slider changes
    if (tenureSlider) {
        tenureSlider.addEventListener('input', function() {
            updateInputFromSlider();
            calculateAndUpdate();
        });
    }
    
    // Year button click
    if (tenureYrBtn) {
        tenureYrBtn.addEventListener('click', function() {
            if (currentTenureUnit !== 'years') {
                setTenureMode('years');
            }
        });
    }
    
    // Month button click
    if (tenureMoBtn) {
        tenureMoBtn.addEventListener('click', function() {
            if (currentTenureUnit !== 'months') {
                setTenureMode('months');
            }
        });
    }
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
    if (tenureYrBtn && tenureMoBtn) {
        tenureYrBtn.classList.toggle('active', unit === 'years');
        tenureMoBtn.classList.toggle('active', unit === 'months');
    }
    
    // Get current value before conversion
    const currentValue = parseFloat(tenureValueInput.value) || (unit === 'years' ? 3 : 36);
    
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
        if (tenureSliderLabels) {
            tenureSliderLabels.innerHTML = `
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
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
        if (tenureSliderLabels) {
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
    }
    
    // Ensure slider is synchronized after mode change
    updateSliderFromInput();
    
    // Recalculate after mode change
    calculateAndUpdate();
}

function updateSliderFromInput() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    
    if (tenureValueInput && tenureSlider) {
        const value = parseFloat(tenureValueInput.value) || 0;
        const min = parseFloat(tenureSlider.min);
        const max = parseFloat(tenureSlider.max);
        
        tenureSlider.value = Math.min(Math.max(value, min), max);
    }
}

function updateInputFromSlider() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    
    if (tenureValueInput && tenureSlider) {
        tenureValueInput.value = tenureSlider.value;
    }
}

function handleCategoryChange(category) {
    const categoryHints = document.querySelectorAll('.category-hint');
    const loanAmountInput = document.getElementById('loanAmount');
    const currentAmount = parseFloat(loanAmountInput.value) || 500000;
    
    // Remove active class from all hints
    categoryHints.forEach(hint => hint.classList.remove('active'));
    
    if (category && PMMY_CATEGORIES[category]) {
        // Add active class to selected category hint
        const categoryClass = category.toLowerCase().replace(' ', '');
        const activeHint = document.querySelector(`.category-hint.${categoryClass}`);
        if (activeHint) {
            activeHint.classList.add('active');
        }
        
        // Adjust loan amount if it's outside the category range
        const categoryLimits = PMMY_CATEGORIES[category];
        let adjustedAmount = currentAmount;
        
        if (currentAmount < categoryLimits.min) {
            adjustedAmount = categoryLimits.min;
        } else if (currentAmount > categoryLimits.max) {
            adjustedAmount = categoryLimits.max;
        }
        
        if (adjustedAmount !== currentAmount) {
            loanAmountInput.value = adjustedAmount;
            document.getElementById('loanAmountSlider').value = adjustedAmount;
            
            // Show a brief notification that the amount was adjusted
            showValidationMessage('loanAmountValidation', 
                `Loan amount adjusted to fit ${category} category (₹${formatIndianNumber(categoryLimits.min)} - ₹${formatIndianNumber(categoryLimits.max)})`, 
                'warning');
        }
    }
}

function validateCategoryLimits() {
    const category = document.getElementById('pmmyCategory').value;
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const validationElement = document.getElementById('loanAmountValidation');
    
    if (category && PMMY_CATEGORIES[category]) {
        const limits = PMMY_CATEGORIES[category];
        
        if (loanAmount < limits.min || loanAmount > limits.max) {
            showValidationMessage('loanAmountValidation', 
                `${category} category allows loans from ₹${formatIndianNumber(limits.min)} to ₹${formatIndianNumber(limits.max)}`, 
                'error');
            return false;
        } else {
            hideValidationMessage('loanAmountValidation');
            return true;
        }
    } else {
        hideValidationMessage('loanAmountValidation');
        return true;
    }
}

function showValidationMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `validation-message ${type}`;
    }
}

function hideValidationMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.className = 'validation-message';
    }
}

function setAmortizationView(view) {
    currentAmortizationView = view;
    
    const monthlyBtn = document.getElementById('monthlyAmortizationBtn');
    const yearlyBtn = document.getElementById('yearlyAmortizationBtn');
    
    // Update button states
    if (monthlyBtn && yearlyBtn) {
        monthlyBtn.classList.toggle('active', view === 'monthly');
        yearlyBtn.classList.toggle('active', view === 'yearly');
    }
    
    // Update table headers
    updateAmortizationTableHeaders(view);
    
    // Refresh the table with current data
    if (amortizationData && amortizationData.length > 0) {
        updateAmortizationTable(amortizationData);
    }
}

function updateAmortizationTableHeaders(view) {
    const headerRow = document.getElementById('amortizationTableHeader');
    if (!headerRow) return;
    
    if (view === 'yearly') {
        headerRow.innerHTML = `
            <th>Year</th>
            <th>Total EMI</th>
            <th>Principal</th>
            <th>Interest</th>
            <th>Balance</th>
        `;
    } else {
        headerRow.innerHTML = `
            <th>Month</th>
            <th>EMI</th>
            <th>Principal</th>
            <th>Interest</th>
            <th>Balance</th>
        `;
    }
}

function generateYearlyAmortizationData(monthlyData) {
    if (!monthlyData || monthlyData.length === 0) return [];
    
    const yearlyData = [];
    let currentYear = 1;
    let yearlyEmi = 0;
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    let yearEndBalance = 0;
    
    monthlyData.forEach((monthData, index) => {
        const monthInYear = (index % 12) + 1;
        
        yearlyEmi += monthData.emi;
        yearlyPrincipal += monthData.principal;
        yearlyInterest += monthData.interest;
        yearEndBalance = monthData.balance;
        
        // If it's the last month of the year or the last month overall
        if (monthInYear === 12 || index === monthlyData.length - 1) {
            yearlyData.push({
                year: currentYear,
                totalEmi: yearlyEmi,
                principal: yearlyPrincipal,
                interest: yearlyInterest,
                balance: yearEndBalance
            });
            
            // Reset for next year
            currentYear++;
            yearlyEmi = 0;
            yearlyPrincipal = 0;
            yearlyInterest = 0;
        }
    });
    
    return yearlyData;
}

function calculateAndUpdate() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const annualInterestRatePercent = parseFloat(document.getElementById('annualInterestRatePercent').value) || 0;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 0;
    const pmmyCategory = document.getElementById('pmmyCategory').value;
    
    // Convert tenure to months
    let tenureMonths = 0;
    
    if (currentTenureUnit === 'years') {
        tenureMonths = Math.round(tenureValue * 12);
    } else {
        tenureMonths = Math.round(tenureValue);
    }
    
    if (loanAmount > 0 && annualInterestRatePercent > 0 && tenureMonths > 0) {
        // Validate category limits before making API call
        if (!validateCategoryLimits()) {
            return; // Don't calculate if validation fails
        }
        
        // Make API call to backend
        fetch('/calculate-pmmy-emi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                loanAmount: loanAmount,
                annualInterestRatePercent: annualInterestRatePercent,
                tenureMonths: tenureMonths,
                pmmyCategory: pmmyCategory
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                console.error('Calculation error:', data.error);
                showValidationMessage('loanAmountValidation', data.error, 'error');
                return;
            }
            
            const resultData = {
                emi: data.emi,
                principal: data.principalAmount,
                totalInterest: data.totalInterest,
                totalPayment: data.totalPayment,
                principalPercentage: data.principalPercentage,
                interestPercentage: data.interestPercentage
            };
            
            // Store amortization data
            amortizationData = data.amortizationSchedule || [];
            
            updateResults(resultData);
            updateChart(resultData);
            updateAmortizationTable(amortizationData);
        })
        .catch(error => {
            console.error('Error:', error);
            // Fallback to client-side calculation
            const monthlyRate = annualInterestRatePercent / (12 * 100);
            let emi;
            
            if (monthlyRate > 0) {
                emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
            } else {
                emi = loanAmount / tenureMonths;
            }
            
            const totalPayment = emi * tenureMonths;
            const totalInterest = totalPayment - loanAmount;
            
            const resultData = {
                emi: emi,
                principal: loanAmount,
                totalInterest: totalInterest,
                totalPayment: totalPayment
            };
            
            // Generate fallback amortization
            amortizationData = generateAmortizationSchedule(loanAmount, emi, monthlyRate, tenureMonths);
            
            updateResults(resultData);
            updateChart(resultData);
            updateAmortizationTable(amortizationData);
        });
    }
}

function generateAmortizationSchedule(principal, emi, monthlyRate, tenureMonths) {
    const schedule = [];
    let balance = principal;
    
    for (let month = 1; month <= tenureMonths; month++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = emi - interestPayment;
        balance -= principalPayment;
        
        if (balance < 0) balance = 0;
        
        schedule.push({
            month: month,
            principal: Math.round(principalPayment * 100) / 100,
            interest: Math.round(interestPayment * 100) / 100,
            emi: Math.round(emi * 100) / 100,
            balance: Math.round(balance * 100) / 100
        });
    }
    
    return schedule;
}

function updateResults(data) {
    document.getElementById('monthlyEmi').textContent = formatCurrency(data.emi);
    document.getElementById('principalAmount').textContent = formatCurrency(data.principal);
    document.getElementById('totalInterest').textContent = formatCurrency(data.totalInterest);
    document.getElementById('totalPayment').textContent = formatCurrency(data.totalPayment);
    
    // Update percentages
    const principalPercentage = (data.principal / data.totalPayment) * 100;
    const interestPercentage = (data.totalInterest / data.totalPayment) * 100;
    
    document.getElementById('principalPercentage').textContent = principalPercentage.toFixed(1) + '%';
    document.getElementById('interestPercentage').textContent = interestPercentage.toFixed(1) + '%';
}

function updateChart(data) {
    const ctx = document.getElementById('paymentBreakupChart').getContext('2d');
    
    if (paymentBreakupChart) {
        paymentBreakupChart.destroy();
    }
    
    paymentBreakupChart = new Chart(ctx, {
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

function updateAmortizationTable(data) {
    const tableBody = document.getElementById('amortizationTableBody');
    if (!tableBody || !data || data.length === 0) return;
    
    tableBody.innerHTML = '';
    
    if (currentAmortizationView === 'yearly') {
        const yearlyData = generateYearlyAmortizationData(data);
        yearlyData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.year}</td>
                <td>₹${formatIndianNumber(Math.round(row.totalEmi))}</td>
                <td>₹${formatIndianNumber(Math.round(row.principal))}</td>
                <td>₹${formatIndianNumber(Math.round(row.interest))}</td>
                <td>₹${formatIndianNumber(Math.round(row.balance))}</td>
            `;
            tableBody.appendChild(tr);
        });
    } else {
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.month}</td>
                <td>₹${formatIndianNumber(Math.round(row.emi))}</td>
                <td>₹${formatIndianNumber(Math.round(row.principal))}</td>
                <td>₹${formatIndianNumber(Math.round(row.interest))}</td>
                <td>₹${formatIndianNumber(Math.round(row.balance))}</td>
            `;
            tableBody.appendChild(tr);
        });
    }
}

function downloadAmortizationCSV() {
    if (!amortizationData || amortizationData.length === 0) {
        alert('No amortization data available to download.');
        return;
    }
    
    let headers, csvData, filename;
    
    if (currentAmortizationView === 'yearly') {
        headers = ['Year', 'Total EMI (₹)', 'Principal (₹)', 'Interest (₹)', 'Balance (₹)'];
        csvData = [headers.join(',')];
        
        const yearlyData = generateYearlyAmortizationData(amortizationData);
        yearlyData.forEach(row => {
            const csvRow = [
                row.year,
                Math.round(row.totalEmi),
                Math.round(row.principal),
                Math.round(row.interest),
                Math.round(row.balance)
            ];
            csvData.push(csvRow.join(','));
        });
        
        filename = 'pmmy_amortization_yearly.csv';
    } else {
        headers = ['Month', 'EMI (₹)', 'Principal (₹)', 'Interest (₹)', 'Balance (₹)'];
        csvData = [headers.join(',')];
        
        amortizationData.forEach(row => {
            const csvRow = [
                row.month,
                Math.round(row.emi),
                Math.round(row.principal),
                Math.round(row.interest),
                Math.round(row.balance)
            ];
            csvData.push(csvRow.join(','));
        });
        
        filename = 'pmmy_amortization_monthly.csv';
    }
    
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function formatCurrency(amount) {
    return '₹ ' + formatIndianNumber(Math.round(amount));
}

function formatIndianNumber(number) {
    return number.toLocaleString('en-IN');
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
