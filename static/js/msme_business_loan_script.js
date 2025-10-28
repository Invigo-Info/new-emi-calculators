// Global variables for MSME Business Loan Calculator
let msmePaymentBreakupChart;
let msmeAmortizationData = [];
let msmeYearlyData = [];
let msmeCurrentTenureUnit = 'years'; // 'years' or 'months'
let msmeCurrentScheduleView = 'monthly'; // 'monthly' or 'yearly'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupMsmeEventListeners();
    
    // Ensure initial slider synchronization
    updateMsmeSliderFromInput();
    
    calculateAndUpdateMsme();
});

function setupMsmeEventListeners() {
    // Input change listeners for sliders and number inputs
    const msmeInputs = [
        { input: 'msmeLoanAmount', slider: 'msmeLoanAmountSlider', min: 10000, max: 50000000 },
        { input: 'msmeInterestRate', slider: 'msmeInterestRateSlider', min: 0, max: 40 },
        { input: 'msmeProcessingFee', slider: 'msmeProcessingFeeSlider', min: 0, max: 10 },
        { input: 'msmeGstOnFee', slider: 'msmeGstOnFeeSlider', min: 0, max: 28 }
    ];
    
    msmeInputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                calculateAndUpdateMsme();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                calculateAndUpdateMsme();
            });
        }
    });

    // Setup tenure event listeners
    setupMsmeTenureEventListeners();

    // Setup schedule view toggle listeners
    setupMsmeScheduleToggleListeners();

    // Download CSV button
    const downloadBtn = document.getElementById('msmeDownloadCsv');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadMsmeAmortizationCsv);
    }
}

function setupMsmeTenureEventListeners() {
    const tenureValueInput = document.getElementById('msmeTenureValue');
    const tenureSlider = document.getElementById('msmeTenureSlider');
    const tenureYrBtn = document.getElementById('msmeTenureYrBtn');
    const tenureMoBtn = document.getElementById('msmeTenureMoBtn');
    
    // Initialize in years mode
    setMsmeTenureMode('years');
    
    // Input value changes
    if (tenureValueInput) {
        tenureValueInput.addEventListener('input', function() {
            updateMsmeTenureSliderFromInput();
            calculateAndUpdateMsme();
        });
    }
    
    // Slider changes
    if (tenureSlider) {
        tenureSlider.addEventListener('input', function() {
            updateMsmeTenureInputFromSlider();
            calculateAndUpdateMsme();
        });
    }
    
    // Year button click
    if (tenureYrBtn) {
        tenureYrBtn.addEventListener('click', function() {
            if (msmeCurrentTenureUnit !== 'years') {
                setMsmeTenureMode('years');
            }
        });
    }
    
    // Month button click
    if (tenureMoBtn) {
        tenureMoBtn.addEventListener('click', function() {
            if (msmeCurrentTenureUnit !== 'months') {
                setMsmeTenureMode('months');
            }
        });
    }
}

function setupMsmeScheduleToggleListeners() {
    const monthlyBtn = document.getElementById('msmeMonthlyScheduleBtn');
    const yearlyBtn = document.getElementById('msmeYearlyScheduleBtn');
    
    if (monthlyBtn) {
        monthlyBtn.addEventListener('click', function() {
            setMsmeScheduleView('monthly');
        });
    }
    
    if (yearlyBtn) {
        yearlyBtn.addEventListener('click', function() {
            setMsmeScheduleView('yearly');
        });
    }
}

function setMsmeTenureMode(unit) {
    const previousUnit = msmeCurrentTenureUnit;
    msmeCurrentTenureUnit = unit;
    
    const tenureValueInput = document.getElementById('msmeTenureValue');
    const tenureSlider = document.getElementById('msmeTenureSlider');
    const tenureYrBtn = document.getElementById('msmeTenureYrBtn');
    const tenureMoBtn = document.getElementById('msmeTenureMoBtn');
    const tenureSliderLabels = document.getElementById('msmeTenureSliderLabels');
    
    // Update button states
    if (tenureYrBtn && tenureMoBtn) {
        tenureYrBtn.classList.toggle('active', unit === 'years');
        tenureMoBtn.classList.toggle('active', unit === 'months');
    }
    
    // Get current value before conversion
    const currentValue = parseFloat(tenureValueInput.value) || (unit === 'years' ? 4 : 48);
    
    if (unit === 'years') {
        // Converting to years mode
        let years;
        if (previousUnit === 'months') {
            // Convert months to years
            years = Math.round(currentValue / 12 * 10) / 10; // Round to 1 decimal
            years = Math.max(1, Math.min(10, years)); // Ensure within bounds
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
        if (tenureSliderLabels) {
            tenureSliderLabels.innerHTML = `
                <span>1</span>
                <span>2</span>
                <span>4</span>
                <span>6</span>
                <span>8</span>
                <span>10</span>
            `;
        }
    } else {
        // Converting to months mode
        let months;
        if (previousUnit === 'years') {
            // Convert years to months
            months = Math.round(currentValue * 12);
            months = Math.max(6, Math.min(120, months)); // Ensure within bounds
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
        if (tenureSliderLabels) {
            tenureSliderLabels.innerHTML = `
                <span>6</span>
                <span>24</span>
                <span>48</span>
                <span>72</span>
                <span>96</span>
                <span>120</span>
            `;
        }
    }
    
    // Ensure slider is synchronized after mode change
    updateMsmeTenureSliderFromInput();
    
    // Recalculate after mode change
    calculateAndUpdateMsme();
}

function updateMsmeTenureSliderFromInput() {
    const tenureValueInput = document.getElementById('msmeTenureValue');
    const tenureSlider = document.getElementById('msmeTenureSlider');
    
    if (tenureValueInput && tenureSlider) {
        const value = parseFloat(tenureValueInput.value) || 0;
        const min = parseFloat(tenureSlider.min);
        const max = parseFloat(tenureSlider.max);
        
        tenureSlider.value = Math.min(Math.max(value, min), max);
    }
}

function updateMsmeTenureInputFromSlider() {
    const tenureValueInput = document.getElementById('msmeTenureValue');
    const tenureSlider = document.getElementById('msmeTenureSlider');
    
    if (tenureValueInput && tenureSlider) {
        tenureValueInput.value = tenureSlider.value;
    }
}

function setMsmeScheduleView(view) {
    msmeCurrentScheduleView = view;
    
    const monthlyBtn = document.getElementById('msmeMonthlyScheduleBtn');
    const yearlyBtn = document.getElementById('msmeYearlyScheduleBtn');
    
    if (monthlyBtn && yearlyBtn) {
        monthlyBtn.classList.toggle('active', view === 'monthly');
        yearlyBtn.classList.toggle('active', view === 'yearly');
    }
    
    // Update table header and data
    updateMsmeTableView();
}

function updateMsmeSliderFromInput() {
    const msmeInputs = [
        { input: 'msmeLoanAmount', slider: 'msmeLoanAmountSlider' },
        { input: 'msmeInterestRate', slider: 'msmeInterestRateSlider' },
        { input: 'msmeTenureMonths', slider: 'msmeTenureMonthsSlider' },
        { input: 'msmeProcessingFee', slider: 'msmeProcessingFeeSlider' },
        { input: 'msmeGstOnFee', slider: 'msmeGstOnFeeSlider' }
    ];
    
    msmeInputs.forEach(({ input, slider }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            const value = parseFloat(inputElement.value) || 0;
            const min = parseFloat(sliderElement.min);
            const max = parseFloat(sliderElement.max);
            
            sliderElement.value = Math.min(Math.max(value, min), max);
        }
    });
}

// Pure calculation functions as specified
function msmeEmi(P, annualRatePct, months) {
    const r = (annualRatePct / 12) / 100;
    if (r === 0) return P / months;
    return P * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
}

function msmeTotals(P, annualRatePct, months) {
    const E = msmeEmi(P, annualRatePct, months);
    const totalPayment = E * months;
    const totalInterest = totalPayment - P;
    return { emi: E, totalPayment, totalInterest };
}

function msmeFees(P, feePct = 0, gstPct = 0) {
    const proc = P * (feePct / 100);
    const gst = proc * (gstPct / 100);
    const net = P - (proc + gst);
    return { processingFee: proc, gstOnFee: gst, netDisbursal: net };
}

function calculateAndUpdateMsme() {
    const loanAmount = parseFloat(document.getElementById('msmeLoanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('msmeInterestRate').value) || 0;
    const tenureValue = parseFloat(document.getElementById('msmeTenureValue').value) || 0;
    const processingFeePercent = parseFloat(document.getElementById('msmeProcessingFee').value) || 0;
    const gstOnFeePercent = parseFloat(document.getElementById('msmeGstOnFee').value) || 0;
    
    // Convert tenure to months
    let tenureMonths;
    if (msmeCurrentTenureUnit === 'years') {
        tenureMonths = Math.round(tenureValue * 12);
    } else {
        tenureMonths = Math.round(tenureValue);
    }
    
    // Validate inputs
    if (!validateMsmeInputs(loanAmount, interestRate, tenureMonths)) {
        return;
    }
    
    if (loanAmount > 0 && tenureMonths > 0) {
        // Make API call to backend
        fetch('/calculate-msme-business-loan-emi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                loanAmount: loanAmount,
                annualInterestRate: interestRate,
                tenureMonths: tenureMonths,
                processingFeePercent: processingFeePercent,
                gstOnFeePercent: gstOnFeePercent
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                console.error('Calculation error:', data.error);
                // Fall back to client-side calculation
                performClientSideCalculation(loanAmount, interestRate, tenureMonths, processingFeePercent, gstOnFeePercent);
                return;
            }
            
            const resultData = {
                emi: data.emi,
                loanAmount: data.loanAmount,
                totalInterest: data.totalInterest,
                totalPayment: data.totalPayment,
                processingFee: data.processingFee,
                gstOnFee: data.gstOnFee,
                totalFees: data.totalFees,
                netDisbursal: data.netDisbursal,
                principalPercentage: data.principalPercentage,
                interestPercentage: data.interestPercentage
            };
            
            msmeAmortizationData = data.amortizationSchedule || [];
            msmeYearlyData = generateMsmeYearlyData(msmeAmortizationData);
            
            updateMsmeResults(resultData);
            updateMsmeChart(resultData);
            updateMsmeTableView();
        })
        .catch(error => {
            console.error('Error:', error);
            // Fallback to client-side calculation
            performClientSideCalculation(loanAmount, interestRate, tenureMonths, processingFeePercent, gstOnFeePercent);
        });
    }
}

function performClientSideCalculation(loanAmount, interestRate, tenureMonths, processingFeePercent, gstOnFeePercent) {
    const totals = msmeTotals(loanAmount, interestRate, tenureMonths);
    const fees = msmeFees(loanAmount, processingFeePercent, gstOnFeePercent);
    
    const resultData = {
        emi: totals.emi,
        loanAmount: loanAmount,
        totalInterest: totals.totalInterest,
        totalPayment: totals.totalPayment,
        processingFee: fees.processingFee,
        gstOnFee: fees.gstOnFee,
        totalFees: fees.processingFee + fees.gstOnFee,
        netDisbursal: fees.netDisbursal,
        principalPercentage: (loanAmount / totals.totalPayment) * 100,
        interestPercentage: (totals.totalInterest / totals.totalPayment) * 100
    };
    
    // Generate amortization schedule client-side
    msmeAmortizationData = generateMsmeAmortizationSchedule(loanAmount, interestRate, tenureMonths, totals.emi);
    msmeYearlyData = generateMsmeYearlyData(msmeAmortizationData);
    
    updateMsmeResults(resultData);
    updateMsmeChart(resultData);
    updateMsmeTableView();
}

function generateMsmeAmortizationSchedule(principal, annualRate, months, emi) {
    const schedule = [];
    const monthlyRate = (annualRate / 12) / 100;
    let remainingBalance = principal;
    
    for (let month = 1; month <= months; month++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = emi - interestPayment;
        remainingBalance = Math.max(0, remainingBalance - principalPayment);
        
        schedule.push({
            month: month,
            emi: Math.round(emi),
            principal: Math.round(principalPayment),
            interest: Math.round(interestPayment),
            balance: Math.round(remainingBalance)
        });
    }
    
    return schedule;
}

function validateMsmeInputs(loanAmount, interestRate, tenureMonths) {
    // Validate loan amount
    if (loanAmount < 10000) {
        showMsmeError('Loan amount must be at least ₹10,000');
        return false;
    }
    if (loanAmount > 50000000) {
        showMsmeError('Loan amount must not exceed ₹5,00,00,000');
        return false;
    }
    
    // Validate interest rate
    if (interestRate < 0 || interestRate > 40) {
        showMsmeError('Interest rate must be between 0% and 40%');
        return false;
    }
    
    // Validate tenure
    if (tenureMonths < 6 || tenureMonths > 120) {
        showMsmeError('Tenure must be between 6 and 120 months');
        return false;
    }
    
    return true;
}

function showMsmeError(message) {
    // Create or update error message display
    let errorDiv = document.getElementById('msme-error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'msme-error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fed7d7;
            color: #c53030;
            padding: 12px 16px;
            border-radius: 6px;
            border: 1px solid #feb2b2;
            z-index: 1000;
            font-size: 0.875rem;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        document.body.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.style.display = 'none';
        }
    }, 5000);
}

function updateMsmeResults(data) {
    document.getElementById('msmeEmi').textContent = formatMsmeCurrency(data.emi);
    document.getElementById('msmePrincipalAmount').textContent = formatMsmeCurrency(data.loanAmount);
    document.getElementById('msmeTotalInterest').textContent = formatMsmeCurrency(data.totalInterest);
    document.getElementById('msmeTotalPayment').textContent = formatMsmeCurrency(data.totalPayment);
    
    // Update fee details
    document.getElementById('msmeProcessingFeeAmount').textContent = formatMsmeCurrency(data.processingFee);
    document.getElementById('msmeGstAmount').textContent = formatMsmeCurrency(data.gstOnFee);
    document.getElementById('msmeNetDisbursal').textContent = formatMsmeCurrency(data.netDisbursal);
    
    // Update percentages
    document.getElementById('msmePrincipalPercentage').textContent = data.principalPercentage.toFixed(1) + '%';
    document.getElementById('msmeInterestPercentage').textContent = data.interestPercentage.toFixed(1) + '%';
}

function updateMsmeChart(data) {
    const ctx = document.getElementById('msmePaymentBreakupChart').getContext('2d');
    
    if (msmePaymentBreakupChart) {
        msmePaymentBreakupChart.destroy();
    }
    
    msmePaymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Amount', 'Total Interest'],
            datasets: [{
                data: [data.loanAmount, data.totalInterest],
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

function generateMsmeYearlyData(monthlyData) {
    if (!monthlyData || monthlyData.length === 0) return [];
    
    const yearlyData = [];
    let currentYear = 1;
    let yearStartMonth = 1;
    
    while (yearStartMonth <= monthlyData.length) {
        let yearEndMonth = Math.min(yearStartMonth + 11, monthlyData.length);
        let yearEmi = 0;
        let yearPrincipal = 0;
        let yearInterest = 0;
        
        for (let i = yearStartMonth - 1; i < yearEndMonth; i++) {
            yearEmi += monthlyData[i].emi;
            yearPrincipal += monthlyData[i].principal;
            yearInterest += monthlyData[i].interest;
        }
        
        const endBalance = monthlyData[yearEndMonth - 1].balance;
        
        yearlyData.push({
            year: currentYear,
            emi: Math.round(yearEmi),
            principal: Math.round(yearPrincipal),
            interest: Math.round(yearInterest),
            balance: Math.round(endBalance)
        });
        
        currentYear++;
        yearStartMonth += 12;
    }
    
    return yearlyData;
}

function updateMsmeTableView() {
    if (msmeCurrentScheduleView === 'monthly') {
        updateMsmeAmortizationTable(msmeAmortizationData);
    } else {
        updateMsmeYearlyAmortizationTable(msmeYearlyData);
    }
    
    // Update table header
    updateMsmeTableHeader();
}

function updateMsmeTableHeader() {
    const tableHeader = document.getElementById('msmeTableHeader');
    if (!tableHeader) return;
    
    if (msmeCurrentScheduleView === 'monthly') {
        tableHeader.innerHTML = `
            <tr>
                <th>Month</th>
                <th>EMI</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Balance</th>
            </tr>
        `;
    } else {
        tableHeader.innerHTML = `
            <tr>
                <th>Year</th>
                <th>Annual EMI</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Balance</th>
            </tr>
        `;
    }
}

function updateMsmeAmortizationTable(schedule) {
    const tableBody = document.getElementById('msmeAmortizationTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    schedule.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.month}</td>
            <td>₹${row.emi.toLocaleString('en-IN')}</td>
            <td>₹${row.principal.toLocaleString('en-IN')}</td>
            <td>₹${row.interest.toLocaleString('en-IN')}</td>
            <td>₹${row.balance.toLocaleString('en-IN')}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function updateMsmeYearlyAmortizationTable(schedule) {
    const tableBody = document.getElementById('msmeAmortizationTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    schedule.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.year}</td>
            <td>₹${row.emi.toLocaleString('en-IN')}</td>
            <td>₹${row.principal.toLocaleString('en-IN')}</td>
            <td>₹${row.interest.toLocaleString('en-IN')}</td>
            <td>₹${row.balance.toLocaleString('en-IN')}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function downloadMsmeAmortizationCsv() {
    let dataToDownload, csvContent, filename;
    
    if (msmeCurrentScheduleView === 'monthly') {
        if (!msmeAmortizationData || msmeAmortizationData.length === 0) {
            showMsmeError('No monthly amortization data available to download');
            return;
        }
        
        dataToDownload = msmeAmortizationData;
        csvContent = 'Month,EMI,Principal,Interest,Balance\n';
        filename = 'msme_business_loan_monthly_schedule.csv';
        
        dataToDownload.forEach(row => {
            csvContent += `${row.month},${row.emi},${row.principal},${row.interest},${row.balance}\n`;
        });
    } else {
        if (!msmeYearlyData || msmeYearlyData.length === 0) {
            showMsmeError('No yearly amortization data available to download');
            return;
        }
        
        dataToDownload = msmeYearlyData;
        csvContent = 'Year,Annual EMI,Principal,Interest,Balance\n';
        filename = 'msme_business_loan_yearly_schedule.csv';
        
        dataToDownload.forEach(row => {
            csvContent += `${row.year},${row.emi},${row.principal},${row.interest},${row.balance}\n`;
        });
    }
    
    // Create and download file
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

function formatMsmeCurrency(amount) {
    return '₹ ' + Math.round(amount).toLocaleString('en-IN');
}

// Mega Menu Functionality for MSME calculator
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

// Test scenarios as comments for verification:
/*
Test 1: ₹10,00,000 @ 13.5% for 48 months with 2% processing fee + 18% GST
Expected: EMI ≈ ₹27,076, Total Interest ≈ ₹2,99,664, Total Payment ≈ ₹12,99,664
Net Disbursal ≈ ₹9,76,400 (₹10,00,000 - ₹20,000 - ₹3,600)

Test 2: ₹25,00,000 @ 11% for 60 months
Expected: EMI ≈ ₹54,356, Total Interest ≈ ₹7,61,363, Total Payment ≈ ₹32,61,363
*/
