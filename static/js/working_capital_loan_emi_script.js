// Global variables
let wcPaymentBreakupChart;
let wcCurrentTenureUnit = 'years'; // 'years' or 'months'
let wcAmortizationData = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupWCEventListeners();
    
    // Ensure initial slider synchronization for all inputs
    const inputs = [
        { input: 'wcLoanAmount', slider: 'wcLoanAmountSlider' },
        { input: 'wcInterestRate', slider: 'wcInterestRateSlider' },
        { input: 'wcProcessingFee', slider: 'wcProcessingFeeSlider' },
        { input: 'wcGstOnFee', slider: 'wcGstOnFeeSlider' }
    ];
    
    inputs.forEach(({ input, slider }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            sliderElement.value = inputElement.value;
        }
    });
    
    calculateAndUpdateWC();
});

function setupWCEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'wcLoanAmount', slider: 'wcLoanAmountSlider', min: 10000, max: 50000000 },
        { input: 'wcInterestRate', slider: 'wcInterestRateSlider', min: 0, max: 40 },
        { input: 'wcProcessingFee', slider: 'wcProcessingFeeSlider', min: 0, max: 10 },
        { input: 'wcGstOnFee', slider: 'wcGstOnFeeSlider', min: 0, max: 30 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                calculateAndUpdateWC();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                calculateAndUpdateWC();
            });
        }
    });
    
    // Special handling for tenure
    setupWCTenureEventListeners();
    
    // Download button listeners
    setupWCDownloadListeners();
}

function setupWCTenureEventListeners() {
    const tenureValueInput = document.getElementById('wcTenureValue');
    const tenureSlider = document.getElementById('wcTenureSlider');
    const tenureYrBtn = document.getElementById('wcTenureYrBtn');
    const tenureMoBtn = document.getElementById('wcTenureMoBtn');
    
    // Initialize in years mode
    setWCTenureMode('years');
    
    // Input value changes - with proper validation
    tenureValueInput.addEventListener('input', function() {
        const value = parseFloat(this.value) || 0;
        const min = parseFloat(tenureSlider.min);
        const max = parseFloat(tenureSlider.max);
        
        // Clamp the value to valid range
        const clampedValue = Math.min(Math.max(value, min), max);
        
        // Update input if it was out of range
        if (clampedValue !== value) {
            this.value = clampedValue;
        }
        
        // Update slider
        tenureSlider.value = clampedValue;
        
        calculateAndUpdateWC();
    });
    
    // Slider changes - ensure input is updated
    tenureSlider.addEventListener('input', function() {
        tenureValueInput.value = this.value;
        calculateAndUpdateWC();
    });
    
    // Also handle 'change' event for better compatibility
    tenureSlider.addEventListener('change', function() {
        tenureValueInput.value = this.value;
        calculateAndUpdateWC();
    });
    
    // Year button click
    tenureYrBtn.addEventListener('click', function() {
        if (wcCurrentTenureUnit !== 'years') {
            setWCTenureMode('years');
        }
    });
    
    // Month button click
    tenureMoBtn.addEventListener('click', function() {
        if (wcCurrentTenureUnit !== 'months') {
            setWCTenureMode('months');
        }
    });
}

function setWCTenureMode(unit) {
    const previousUnit = wcCurrentTenureUnit;
    wcCurrentTenureUnit = unit;
    
    const tenureValueInput = document.getElementById('wcTenureValue');
    const tenureSlider = document.getElementById('wcTenureSlider');
    const tenureYrBtn = document.getElementById('wcTenureYrBtn');
    const tenureMoBtn = document.getElementById('wcTenureMoBtn');
    const tenureSliderLabels = document.getElementById('wcTenureSliderLabels');
    
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
        tenureValueInput.step = '1';
        tenureValueInput.min = '1';
        tenureValueInput.max = '10';
        
        // Update slider for years (1-10 years)
        tenureSlider.min = '1';
        tenureSlider.max = '10';
        tenureSlider.step = '1';
        tenureSlider.value = years;
        
        // Update slider labels for years
        tenureSliderLabels.innerHTML = `
            <span>1</span>
            <span>3</span>
            <span>5</span>
            <span>7</span>
            <span>10</span>
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
        tenureValueInput.max = '120';
        
        // Update slider for months (12-120 months)
        tenureSlider.min = '12';
        tenureSlider.max = '120';
        tenureSlider.step = '1';
        tenureSlider.value = months;
        
        // Update slider labels for months
        tenureSliderLabels.innerHTML = `
            <span>12</span>
            <span>36</span>
            <span>60</span>
            <span>84</span>
            <span>120</span>
        `;
    }
    
    // Ensure slider is synchronized after mode change
    // Force sync by setting slider value to match input
    const finalValue = parseFloat(tenureValueInput.value) || (unit === 'years' ? 5 : 60);
    const sliderMin = parseFloat(tenureSlider.min);
    const sliderMax = parseFloat(tenureSlider.max);
    const clampedValue = Math.min(Math.max(finalValue, sliderMin), sliderMax);
    
    tenureSlider.value = clampedValue;
    tenureValueInput.value = clampedValue;
    
    // Recalculate after mode change
    calculateAndUpdateWC();
}

// Helper functions removed - synchronization now handled directly in event listeners

// Calculation functions as specified
function wcMonthlyRate(annualPct) {
    return (annualPct / 12) / 100;
}

function wcEmi(P, annualPct, months) {
    const r = wcMonthlyRate(annualPct);
    if (months <= 0) return 0;
    if (r === 0) return P / months;
    const x = Math.pow(1 + r, months);
    return P * r * x / (x - 1);
}

function wcTotals(P, annualPct, months) {
    const E = wcEmi(P, annualPct, months);
    const totalPayment = E * months;
    const totalInterest = totalPayment - P;
    return { emi: E, totalPayment, totalInterest };
}

function wcFees(P, feePct = 0, gstPct = 0) {
    const processingFee = P * (feePct / 100);
    const gstOnFee = processingFee * (gstPct / 100);
    const netDisbursal = P - processingFee - gstOnFee;
    return { processingFee, gstOnFee, netDisbursal };
}

function wcFirstMonth(P, annualPct, months) {
    const r = wcMonthlyRate(annualPct);
    const E = wcEmi(P, annualPct, months);
    const interest = P * r;
    const principal = E - interest;
    const balance = P - principal;
    return { interest, principal, balance, emi: E };
}

function calculateAndUpdateWC() {
    const loanAmount = parseFloat(document.getElementById('wcLoanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('wcInterestRate').value) || 0;
    const tenureValue = parseFloat(document.getElementById('wcTenureValue').value) || 0;
    const processingFeePercent = parseFloat(document.getElementById('wcProcessingFee').value) || 0;
    const gstOnFeePercent = parseFloat(document.getElementById('wcGstOnFee').value) || 0;
    
    // Convert tenure to months
    let totalMonths = 0;
    if (wcCurrentTenureUnit === 'years') {
        totalMonths = Math.round(tenureValue * 12);
    } else {
        totalMonths = Math.round(tenureValue);
    }
    
    if (loanAmount > 0 && interestRate >= 0 && totalMonths > 0) {
        // Calculate using pure functions
        const totals = wcTotals(loanAmount, interestRate, totalMonths);
        const fees = wcFees(loanAmount, processingFeePercent, gstOnFeePercent);
        const firstMonth = wcFirstMonth(loanAmount, interestRate, totalMonths);
        
        // Update results
        updateWCResults({
            emi: totals.emi,
            principal: loanAmount,
            totalInterest: totals.totalInterest,
            totalPayment: totals.totalPayment,
            processingFee: fees.processingFee,
            gstOnFee: fees.gstOnFee,
            netDisbursal: fees.netDisbursal
        });
        
        // Update chart
        updateWCChart({
            principal: loanAmount,
            totalInterest: totals.totalInterest,
            totalPayment: totals.totalPayment
        });
        
        // Generate and display amortization table
        generateWCAmortizationSchedule(loanAmount, interestRate, totalMonths);
        
        // Show fees section if there are fees
        const feesSection = document.getElementById('wcFeesSection');
        if (processingFeePercent > 0 || gstOnFeePercent > 0) {
            feesSection.style.display = 'block';
        } else {
            feesSection.style.display = 'none';
        }
    }
}

function updateWCResults(data) {
    document.getElementById('wcLoanEmi').textContent = formatWCCurrency(data.emi);
    document.getElementById('wcPrincipalAmount').textContent = formatWCCurrency(data.principal);
    document.getElementById('wcTotalInterest').textContent = formatWCCurrency(data.totalInterest);
    document.getElementById('wcTotalPayment').textContent = formatWCCurrency(data.totalPayment);
    document.getElementById('wcProcessingFeeAmount').textContent = formatWCCurrency(data.processingFee);
    document.getElementById('wcGstOnFeeAmount').textContent = formatWCCurrency(data.gstOnFee);
    document.getElementById('wcNetDisbursal').textContent = formatWCCurrency(data.netDisbursal);
    
    // Update percentages
    const principalPercentage = (data.principal / data.totalPayment) * 100;
    const interestPercentage = (data.totalInterest / data.totalPayment) * 100;
    
    document.getElementById('wcPrincipalPercentage').textContent = principalPercentage.toFixed(1) + '%';
    document.getElementById('wcInterestPercentage').textContent = interestPercentage.toFixed(1) + '%';
}

function updateWCChart(data) {
    const ctx = document.getElementById('wcPaymentBreakupChart').getContext('2d');
    
    if (wcPaymentBreakupChart) {
        wcPaymentBreakupChart.destroy();
    }
    
    wcPaymentBreakupChart = new Chart(ctx, {
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

function generateWCAmortizationSchedule(principal, annualRate, months) {
    const monthlyRate = wcMonthlyRate(annualRate);
    const emi = wcEmi(principal, annualRate, months);
    let remainingBalance = principal;
    
    wcAmortizationData = [];
    
    for (let month = 1; month <= months; month++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = emi - interestPayment;
        remainingBalance = Math.max(0, remainingBalance - principalPayment);
        
        wcAmortizationData.push({
            month: month,
            principal: Math.round(principalPayment),
            interest: Math.round(interestPayment),
            emi: Math.round(emi),
            balance: Math.round(remainingBalance)
        });
    }
    
    // Update the table display
    updateWCAmortizationTable();
}

function updateWCAmortizationTable() {
    const tbody = document.getElementById('wcAmortizationBody');
    tbody.innerHTML = '';
    
    // Show first 12 months and last 12 months if there are more than 24 months
    let displayData = wcAmortizationData;
    if (wcAmortizationData.length > 24) {
        displayData = [
            ...wcAmortizationData.slice(0, 12),
            {
                month: '...',
                principal: '...',
                interest: '...',
                emi: '...',
                balance: '...'
            },
            ...wcAmortizationData.slice(-12)
        ];
    }
    
    displayData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.month}</td>
            <td>${row.principal === '...' ? '...' : formatWCCurrency(row.principal)}</td>
            <td>${row.interest === '...' ? '...' : formatWCCurrency(row.interest)}</td>
            <td>${row.emi === '...' ? '...' : formatWCCurrency(row.emi)}</td>
            <td>${row.balance === '...' ? '...' : formatWCCurrency(row.balance)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function setupWCDownloadListeners() {
    document.getElementById('wcDownloadCSV').addEventListener('click', downloadWCCSV);
    document.getElementById('wcDownloadPDF').addEventListener('click', downloadWCPDF);
}

function downloadWCCSV() {
    let csvContent = "Month,Principal,Interest,EMI,Balance\n";
    
    wcAmortizationData.forEach(row => {
        csvContent += `${row.month},${row.principal},${row.interest},${row.emi},${row.balance}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'working_capital_loan_amortization.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadWCPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get current values
    const loanAmount = parseFloat(document.getElementById('wcLoanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('wcInterestRate').value) || 0;
    const tenureValue = parseFloat(document.getElementById('wcTenureValue').value) || 0;
    const processingFeePercent = parseFloat(document.getElementById('wcProcessingFee').value) || 0;
    const gstOnFeePercent = parseFloat(document.getElementById('wcGstOnFee').value) || 0;
    
    // Convert tenure to months
    let totalMonths = wcCurrentTenureUnit === 'years' ? Math.round(tenureValue * 12) : Math.round(tenureValue);
    
    // Calculate values
    const totals = wcTotals(loanAmount, interestRate, totalMonths);
    const fees = wcFees(loanAmount, processingFeePercent, gstOnFeePercent);
    
    // Add title
    doc.setFontSize(20);
    doc.text('Working Capital Loan EMI Calculator', 20, 20);
    
    // Add loan details
    doc.setFontSize(14);
    doc.text('Loan Details:', 20, 40);
    doc.setFontSize(10);
    doc.text(`Loan Amount: ${formatWCCurrency(loanAmount)}`, 20, 50);
    doc.text(`Interest Rate: ${interestRate}% p.a.`, 20, 60);
    doc.text(`Tenure: ${tenureValue} ${wcCurrentTenureUnit}`, 20, 70);
    if (processingFeePercent > 0) {
        doc.text(`Processing Fee: ${processingFeePercent}%`, 20, 80);
        doc.text(`GST on Fee: ${gstOnFeePercent}%`, 20, 90);
    }
    
    // Add calculation results
    doc.setFontSize(14);
    doc.text('Results:', 20, 110);
    doc.setFontSize(10);
    doc.text(`Monthly EMI: ${formatWCCurrency(totals.emi)}`, 20, 120);
    doc.text(`Total Interest: ${formatWCCurrency(totals.totalInterest)}`, 20, 130);
    doc.text(`Total Payment: ${formatWCCurrency(totals.totalPayment)}`, 20, 140);
    
    if (processingFeePercent > 0 || gstOnFeePercent > 0) {
        doc.text(`Processing Fee Amount: ${formatWCCurrency(fees.processingFee)}`, 20, 150);
        doc.text(`GST Amount: ${formatWCCurrency(fees.gstOnFee)}`, 20, 160);
        doc.text(`Net Disbursal: ${formatWCCurrency(fees.netDisbursal)}`, 20, 170);
    }
    
    // Add amortization table
    const tableData = wcAmortizationData.map(row => [
        row.month,
        formatWCCurrency(row.principal),
        formatWCCurrency(row.interest),
        formatWCCurrency(row.emi),
        formatWCCurrency(row.balance)
    ]);
    
    doc.autoTable({
        head: [['Month', 'Principal', 'Interest', 'EMI', 'Balance']],
        body: tableData,
        startY: processingFeePercent > 0 ? 190 : 160,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [49, 130, 206] }
    });
    
    // Add disclaimer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text('Note: Indicative results. Actual terms depend on lender policy.', 20, finalY);
    
    doc.save('working_capital_loan_calculation.pdf');
}

function formatWCCurrency(amount) {
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
