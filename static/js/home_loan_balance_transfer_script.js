// Global variables for charts and data
let balanceTransferOutflowChart;
let balanceTransferBalanceChart;
let balanceTransferCurrentData = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeBalanceTransferCalculator();
    setupBalanceTransferEventListeners();
    calculateAndUpdateBalanceTransfer();
});

function initializeBalanceTransferCalculator() {
    // Sync sliders with input values
    syncBalanceTransferSliderWithInput('existingOutstandingSlider', 'existingOutstanding');
    syncBalanceTransferSliderWithInput('remainingTenureSlider', 'remainingTenure');
    syncBalanceTransferSliderWithInput('currentRateSlider', 'currentRate');
    syncBalanceTransferSliderWithInput('proposedRateSlider', 'proposedRate');
    syncBalanceTransferSliderWithInput('proposedTenureSlider', 'proposedTenure');
    syncBalanceTransferSliderWithInput('topupAmountSlider', 'topupAmount');
    syncBalanceTransferSliderWithInput('processingFeeSlider', 'processingFee');
    syncBalanceTransferSliderWithInput('foreclosureFeeSlider', 'foreclosureFee');
    syncBalanceTransferSliderWithInput('stampDutySlider', 'stampDuty');

    // Sliders use browser default styling
}

function setupBalanceTransferEventListeners() {
    // Slider event listeners
    const sliders = [
        'existingOutstandingSlider', 'remainingTenureSlider', 'currentRateSlider',
        'proposedRateSlider', 'proposedTenureSlider', 'topupAmountSlider',
        'processingFeeSlider', 'foreclosureFeeSlider', 'stampDutySlider'
    ];

    const inputs = [
        'existingOutstanding', 'remainingTenure', 'currentRate',
        'proposedRate', 'proposedTenure', 'topupAmount',
        'processingFee', 'foreclosureFee', 'stampDuty'
    ];

    // Setup slider-to-input sync
    sliders.forEach((sliderId, index) => {
        const slider = document.getElementById(sliderId);
        const input = document.getElementById(inputs[index]);
        
        if (slider && input) {
            slider.addEventListener('input', function() {
                input.value = this.value;
                debounceBalanceTransferCalculation();
            });
        }
    });

    // Setup input-to-slider sync
    inputs.forEach((inputId, index) => {
        const input = document.getElementById(inputId);
        const slider = document.getElementById(sliders[index]);
        
        if (input && slider) {
            input.addEventListener('input', function() {
                const value = parseFloat(this.value) || 0;
                if (value >= parseFloat(slider.min) && value <= parseFloat(slider.max)) {
                    slider.value = value;
                }
                debounceBalanceTransferCalculation();
            });
        }
    });

    // Fee type toggle buttons
    setupFeeTypeToggles();

    // Tenure type toggle buttons
    setupTenureTypeToggles();

    // Rate type selector
    const rateType = document.getElementById('rateType');
    if (rateType) {
        rateType.addEventListener('change', function() {
            updateFloatingRateNote();
            debounceBalanceTransferCalculation();
        });
    }

    // Download CSV button
    const downloadBtn = document.getElementById('downloadCsv');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadBalanceTransferAmortizationCsv);
    }
}

function setupFeeTypeToggles() {
    const feeToggleButtons = document.querySelectorAll('.fee-toggle-btn');
    
    feeToggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const feeType = this.dataset.fee;
            const toggleType = this.dataset.type;
            
            // Remove active class from siblings
            const siblings = this.parentElement.querySelectorAll('.fee-toggle-btn');
            siblings.forEach(sibling => sibling.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update the suffix and slider based on type
            updateFeeTypeDisplay(feeType, toggleType);
            debounceBalanceTransferCalculation();
        });
    });
}

function setupTenureTypeToggles() {
    const tenureToggleButtons = document.querySelectorAll('.tenure-toggle-btn');
    
    tenureToggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const fieldType = this.dataset.field; // 'remaining' or 'proposed'
            const toggleType = this.dataset.type; // 'years' or 'months'
            
            // Remove active class from siblings
            const siblings = this.parentElement.querySelectorAll('.tenure-toggle-btn');
            siblings.forEach(sibling => sibling.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update the display and convert values
            updateTenureTypeDisplay(fieldType, toggleType);
            debounceBalanceTransferCalculation();
        });
    });
}

function updateFeeTypeDisplay(feeType, toggleType) {
    const input = document.getElementById(feeType + 'Fee');
    const suffix = document.getElementById(feeType + 'FeeSuffix');
    const slider = document.getElementById(feeType + 'FeeSlider');
    
    if (toggleType === 'percentage') {
        suffix.textContent = '%';
        if (feeType === 'processing') {
            slider.min = '0';
            slider.max = '10';
            slider.step = '0.1';
            input.value = '0.5';
            slider.value = '0.5';
        } else {
            slider.min = '0';
            slider.max = '10';
            slider.step = '0.1';
            input.value = '0';
            slider.value = '0';
        }
        updateSliderLabels(slider, '0%', '10%');
    } else {
        suffix.textContent = '₹';
        slider.min = '0';
        slider.max = '1000000';
        slider.step = '1000';
        input.value = '0';
        slider.value = '0';
        updateSliderLabels(slider, '₹0', '₹10L');
    }
}

function updateTenureTypeDisplay(fieldType, toggleType) {
    const input = document.getElementById(fieldType + 'Tenure');
    const suffix = document.getElementById(fieldType + 'TenureSuffix');
    const slider = document.getElementById(fieldType + 'TenureSlider');
    const minLabel = document.getElementById(fieldType + 'TenureMinLabel');
    const maxLabel = document.getElementById(fieldType + 'TenureMaxLabel');
    
    const currentValue = parseFloat(input.value) || 0;
    
    if (toggleType === 'years') {
        // Convert from months to years and update ranges
        const yearsValue = Math.round(currentValue / 12 * 10) / 10; // Round to 1 decimal
        
        // Update input and slider for years
        input.value = yearsValue;
        input.min = '1';
        input.max = '30';
        input.step = '0.5';
        
        slider.min = '1';
        slider.max = '30';
        slider.step = '0.5';
        slider.value = yearsValue;
        
        // Update labels and suffix
        suffix.textContent = 'Years';
        if (minLabel) minLabel.textContent = '1Y';
        if (maxLabel) maxLabel.textContent = '30Y';
        
    } else {
        // Convert from years to months and update ranges
        const monthsValue = Math.round(currentValue * 12);
        
        // Update input and slider for months
        input.value = monthsValue;
        input.min = '12';
        input.max = '360';
        input.step = '1';
        
        slider.min = '12';
        slider.max = '360';
        slider.step = '1';
        slider.value = monthsValue;
        
        // Update labels and suffix
        suffix.textContent = 'Months';
        if (minLabel) minLabel.textContent = '1Y';
        if (maxLabel) maxLabel.textContent = '30Y';
    }
}

function updateSliderLabels(slider, minLabel, maxLabel) {
    const sliderContainer = slider.parentElement;
    const labels = sliderContainer.querySelector('.slider-labels');
    if (labels) {
        const spans = labels.querySelectorAll('span');
        if (spans.length >= 2) {
            spans[0].textContent = minLabel;
            spans[1].textContent = maxLabel;
        }
    }
}

function syncBalanceTransferSliderWithInput(sliderId, inputId) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);
    
    if (slider && input) {
        slider.value = input.value;
    }
}

function updateBalanceTransferSliderProgress() {
    // Slider progress is now handled by browser default styling
    // No custom track needed
}

function calculateAndUpdateBalanceTransfer() {
    try {
        const data = gatherBalanceTransferInputData();
        const results = calculateBalanceTransferResults(data);
        
        // Store current data globally
        balanceTransferCurrentData = { ...data, ...results };
        
        // Update displays
        updateBalanceTransferResultsDisplay(results);
        updateBalanceTransferCharts(results);
        updateBalanceTransferAmortizationTable(results);
        updateFloatingRateNote();
        
    } catch (error) {
        console.error('Calculation error:', error);
        displayBalanceTransferError('Calculation error. Please check your inputs.');
    }
}

function gatherBalanceTransferInputData() {
    // Get processing fee type
    const processingFeeActiveBtn = document.querySelector('.fee-toggle-btn[data-fee="processing"].active');
    const foreclosureFeeActiveBtn = document.querySelector('.fee-toggle-btn[data-fee="foreclosure"].active');
    
    const processingFeeType = processingFeeActiveBtn ? processingFeeActiveBtn.dataset.type : 'percentage';
    const foreclosureFeeType = foreclosureFeeActiveBtn ? foreclosureFeeActiveBtn.dataset.type : 'percentage';
    
    // Get tenure types and convert to months if needed
    const remainingTenureActiveBtn = document.querySelector('.tenure-toggle-btn[data-field="remaining"].active');
    const proposedTenureActiveBtn = document.querySelector('.tenure-toggle-btn[data-field="proposed"].active');
    
    const remainingTenureType = remainingTenureActiveBtn ? remainingTenureActiveBtn.dataset.type : 'months';
    const proposedTenureType = proposedTenureActiveBtn ? proposedTenureActiveBtn.dataset.type : 'months';
    
    let remainingTenureValue = parseFloat(document.getElementById('remainingTenure').value) || 0;
    let proposedTenureValue = parseFloat(document.getElementById('proposedTenure').value) || 0;
    
    // Convert to months for calculations
    if (remainingTenureType === 'years') {
        remainingTenureValue = Math.round(remainingTenureValue * 12);
    }
    
    if (proposedTenureType === 'years') {
        proposedTenureValue = Math.round(proposedTenureValue * 12);
    }
    
    return {
        existingOutstanding: parseFloat(document.getElementById('existingOutstanding').value) || 0,
        remainingTenure: remainingTenureValue,
        currentRate: parseFloat(document.getElementById('currentRate').value) || 0,
        proposedRate: parseFloat(document.getElementById('proposedRate').value) || 0,
        proposedTenure: proposedTenureValue,
        topupAmount: parseFloat(document.getElementById('topupAmount').value) || 0,
        processingFee: parseFloat(document.getElementById('processingFee').value) || 0,
        processingFeeType: processingFeeType,
        foreclosureFee: parseFloat(document.getElementById('foreclosureFee').value) || 0,
        foreclosureFeeType: foreclosureFeeType,
        stampDuty: parseFloat(document.getElementById('stampDuty').value) || 0,
        rateType: document.getElementById('rateType').value
    };
}

function calculateBalanceTransferResults(data) {
    // Calculate total principal (existing outstanding + top-up)
    const totalPrincipal = data.existingOutstanding + data.topupAmount;
    
    // Monthly interest rates
    const currentMonthlyRate = data.currentRate / 12 / 100;
    const proposedMonthlyRate = data.proposedRate / 12 / 100;
    
    // Calculate EMIs using the standard EMI formula
    const existingEmi = calculateEmi(totalPrincipal, currentMonthlyRate, data.remainingTenure);
    const proposedEmi = calculateEmi(totalPrincipal, proposedMonthlyRate, data.proposedTenure);
    
    // Calculate total outflows
    const remainingOutflow = existingEmi * data.remainingTenure;
    const newOutflowBeforeFees = proposedEmi * data.proposedTenure;
    
    // Calculate fees
    const processingFeeAmount = data.processingFeeType === 'percentage' 
        ? (data.processingFee / 100) * totalPrincipal 
        : data.processingFee;
    
    const foreclosureFeeAmount = data.foreclosureFeeType === 'percentage' 
        ? (data.foreclosureFee / 100) * data.existingOutstanding 
        : data.foreclosureFee;
    
    const stampDutyAmount = data.stampDuty;
    
    const totalFees = processingFeeAmount + foreclosureFeeAmount + stampDutyAmount;
    const newOutflowWithFees = newOutflowBeforeFees + totalFees;
    
    // Calculate savings
    const emiSaving = existingEmi - proposedEmi;
    const netCashOutflowSaving = remainingOutflow - newOutflowWithFees;
    
    // Calculate breakeven months
    const breakevenMonths = (totalFees > 0 && emiSaving > 0) 
        ? Math.ceil(totalFees / emiSaving) 
        : 0;
    
    // Generate amortization schedule for proposed loan
    const amortizationSchedule = generateAmortizationSchedule(
        totalPrincipal, 
        proposedMonthlyRate, 
        data.proposedTenure, 
        proposedEmi
    );
    
    return {
        totalPrincipal,
        existingEmi,
        proposedEmi,
        emiSaving,
        remainingOutflow,
        newOutflowBeforeFees,
        newOutflowWithFees,
        netCashOutflowSaving,
        processingFeeAmount,
        foreclosureFeeAmount,
        stampDutyAmount,
        totalFees,
        breakevenMonths,
        amortizationSchedule
    };
}

function calculateEmi(principal, monthlyRate, tenure) {
    if (monthlyRate === 0) {
        return principal / tenure;
    }
    
    const factor = Math.pow(1 + monthlyRate, tenure);
    return principal * (monthlyRate * factor) / (factor - 1);
}

function generateAmortizationSchedule(principal, monthlyRate, tenure, emi) {
    const schedule = [];
    let balance = principal;
    
    for (let month = 1; month <= tenure; month++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = emi - interestPayment;
        balance = Math.max(0, balance - principalPayment);
        
        schedule.push({
            month,
            emi: Math.round(emi),
            principal: Math.round(principalPayment),
            interest: Math.round(interestPayment),
            balance: Math.round(balance)
        });
        
        if (balance <= 0) break;
    }
    
    return schedule;
}

function updateBalanceTransferResultsDisplay(results) {
    // Update EMI comparison cards
    document.getElementById('existingEmi').textContent = formatCurrency(results.existingEmi);
    document.getElementById('proposedEmi').textContent = formatCurrency(results.proposedEmi);
    document.getElementById('emiSaving').innerHTML = formatCurrency(results.emiSaving) + '<span class="per-month">/month</span>';
    document.getElementById('netSavings').textContent = formatCurrency(results.netCashOutflowSaving);
    
    // Update outflow comparison
    document.getElementById('remainingOutflow').textContent = formatCurrency(results.remainingOutflow);
    document.getElementById('newOutflow').textContent = formatCurrency(results.newOutflowWithFees);
    
    // Update breakeven analysis
    const breakevenText = results.breakevenMonths > 0 
        ? `${results.breakevenMonths} months`
        : 'N/A';
    document.getElementById('breakevenMonths').textContent = breakevenText;
    
    const breakevenDesc = results.breakevenMonths > 0 
        ? `You will recover the transfer costs in ${results.breakevenMonths} months through monthly EMI savings.`
        : 'No breakeven period applicable (negative savings or zero fees).';
    document.getElementById('breakevenDescription').textContent = breakevenDesc;
    
    // Update fees breakdown
    document.getElementById('processingFeeAmount').textContent = formatCurrency(results.processingFeeAmount);
    document.getElementById('foreclosureFeeAmount').textContent = formatCurrency(results.foreclosureFeeAmount);
    document.getElementById('stampDutyAmount').textContent = formatCurrency(results.stampDutyAmount);
    document.getElementById('totalFees').textContent = formatCurrency(results.totalFees);
    
    // Update styling based on savings
    updateSavingsColors(results);
}

function updateSavingsColors(results) {
    const emiSavingElement = document.getElementById('emiSaving');
    const netSavingsElement = document.getElementById('netSavings');
    
    // Color code based on positive/negative savings
    if (results.emiSaving > 0) {
        emiSavingElement.style.color = '#059669';
    } else {
        emiSavingElement.style.color = '#dc2626';
    }
    
    if (results.netCashOutflowSaving > 0) {
        netSavingsElement.style.color = '#059669';
    } else {
        netSavingsElement.style.color = '#dc2626';
    }
}

function updateBalanceTransferCharts(results) {
    updateBalanceTransferOutflowChart(results);
    updateBalanceTransferBalanceChart(results);
}

function updateBalanceTransferOutflowChart(results) {
    const ctx = document.getElementById('outflowChart').getContext('2d');
    
    if (balanceTransferOutflowChart) {
        balanceTransferOutflowChart.destroy();
    }
    
    balanceTransferOutflowChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Current Loan', 'New Loan + Fees'],
            datasets: [{
                label: 'Total Outflow (₹)',
                data: [results.remainingOutflow, results.newOutflowWithFees],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
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
                            return `₹${context.parsed.y.toLocaleString('en-IN')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + (value / 100000).toFixed(1) + 'L';
                        }
                    }
                }
            }
        }
    });
}

function updateBalanceTransferBalanceChart(results) {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    
    if (balanceTransferBalanceChart) {
        balanceTransferBalanceChart.destroy();
    }
    
    // Sample data for first 5 years (60 months) for readability
    const sampleMonths = Math.min(60, results.amortizationSchedule.length);
    const labels = [];
    const balanceData = [];
    
    for (let i = 0; i < sampleMonths; i += 12) {
        const year = Math.floor(i / 12) + 1;
        labels.push(`Year ${year}`);
        balanceData.push(results.amortizationSchedule[i].balance);
    }
    
    balanceTransferBalanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Outstanding Balance (₹)',
                data: balanceData,
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6
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
                            return `Balance: ₹${context.parsed.y.toLocaleString('en-IN')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + (value / 100000).toFixed(1) + 'L';
                        }
                    }
                }
            }
        }
    });
}

function updateBalanceTransferAmortizationTable(results) {
    const tbody = document.getElementById('amortizationBody');
    tbody.innerHTML = '';
    
    const schedule = results.amortizationSchedule;
    const totalMonths = schedule.length;
    
    // Show first 12 months
    for (let i = 0; i < Math.min(12, totalMonths); i++) {
        const row = createAmortizationRow(schedule[i]);
        tbody.appendChild(row);
    }
    
    // Add separator if there are more months
    if (totalMonths > 24) {
        const separatorRow = document.createElement('tr');
        separatorRow.innerHTML = '<td colspan="5" style="text-align: center; font-style: italic; color: #666;">... (showing first and last 12 months) ...</td>';
        tbody.appendChild(separatorRow);
    }
    
    // Show last 12 months
    if (totalMonths > 12) {
        const startIndex = Math.max(12, totalMonths - 12);
        for (let i = startIndex; i < totalMonths; i++) {
            const row = createAmortizationRow(schedule[i]);
            tbody.appendChild(row);
        }
    }
}

function createAmortizationRow(data) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${data.month}</td>
        <td>₹${data.emi.toLocaleString('en-IN')}</td>
        <td>₹${data.principal.toLocaleString('en-IN')}</td>
        <td>₹${data.interest.toLocaleString('en-IN')}</td>
        <td>₹${data.balance.toLocaleString('en-IN')}</td>
    `;
    return row;
}

function downloadBalanceTransferAmortizationCsv() {
    if (!balanceTransferCurrentData.amortizationSchedule) {
        alert('No data available for download. Please calculate first.');
        return;
    }
    
    const schedule = balanceTransferCurrentData.amortizationSchedule;
    let csvContent = 'Month,EMI (₹),Principal (₹),Interest (₹),Outstanding Balance (₹)\n';
    
    schedule.forEach(row => {
        csvContent += `${row.month},${row.emi},${row.principal},${row.interest},${row.balance}\n`;
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'home_loan_balance_transfer_amortization.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function updateFloatingRateNote() {
    const rateType = document.getElementById('rateType').value;
    const noteElement = document.getElementById('floatingRateNote');
    
    if (rateType === 'floating') {
        noteElement.textContent = 'Floating rates are repo-linked and can vary during the loan tenure. The calculations assume constant rates for comparison purposes.';
    } else {
        noteElement.textContent = 'Fixed rates remain constant throughout the loan tenure. Calculations are based on the specified fixed rate.';
    }
}

function formatCurrency(amount) {
    if (amount >= 10000000) { // 1 crore
        return '₹' + (amount / 10000000).toFixed(1) + ' Cr';
    } else if (amount >= 100000) { // 1 lakh
        return '₹' + (amount / 100000).toFixed(1) + ' L';
    } else if (amount >= 1000) { // 1 thousand
        return '₹' + (amount / 1000).toFixed(1) + ' K';
    } else {
        return '₹' + Math.round(amount).toLocaleString('en-IN');
    }
}

function displayBalanceTransferError(message) {
    console.error(message);
    // Could implement a user-visible error display here
    alert(message);
}

// Performance optimization: debounce calculations
let balanceTransferCalculationTimeout;
function debounceBalanceTransferCalculation() {
    clearTimeout(balanceTransferCalculationTimeout);
    balanceTransferCalculationTimeout = setTimeout(calculateAndUpdateBalanceTransfer, 150);
}

// Accessibility improvements
document.addEventListener('keydown', function(e) {
    // Add keyboard navigation for sliders
    if (e.target.classList.contains('custom-slider')) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            const currentValue = parseFloat(e.target.value);
            const step = parseFloat(e.target.step) || 1;
            const newValue = Math.max(parseFloat(e.target.min), currentValue - step);
            e.target.value = newValue;
            
            // Trigger input event
            const inputEvent = new Event('input', { bubbles: true });
            e.target.dispatchEvent(inputEvent);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            const currentValue = parseFloat(e.target.value);
            const step = parseFloat(e.target.step) || 1;
            const newValue = Math.min(parseFloat(e.target.max), currentValue + step);
            e.target.value = newValue;
            
            // Trigger input event
            const inputEvent = new Event('input', { bubbles: true });
            e.target.dispatchEvent(inputEvent);
        }
    }
});
