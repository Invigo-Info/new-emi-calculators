// Global variables
let paymentBreakupChart;
let paymentScheduleChart;
let currentEmiScheme = 'arrears';
let currentPaymentSchedule = null;
let currentTenureUnit = 'years'; // Track current tenure unit (years/months) - default to years

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    
    // Load shared parameters if present
    loadSharedParameters();
    
    calculateAndUpdate();
});

// Load parameters from URL for shared calculations
function loadSharedParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('loanAmount')) {
        document.getElementById('loanAmount').value = urlParams.get('loanAmount');
        document.getElementById('loanAmountSlider').value = urlParams.get('loanAmount');
    }
    
    if (urlParams.has('emi')) {
        document.getElementById('emi').value = urlParams.get('emi');
        document.getElementById('emiSlider').value = urlParams.get('emi');
    }
    
    if (urlParams.has('tenure')) {
        document.getElementById('tenureValue').value = urlParams.get('tenure');
        document.getElementById('tenureSlider').value = urlParams.get('tenure');
    }
    
    if (urlParams.has('tenureUnit')) {
        setTenureMode(urlParams.get('tenureUnit'));
    }
    
    if (urlParams.has('fees')) {
        document.getElementById('feesCharges').value = urlParams.get('fees');
        document.getElementById('feesSlider').value = urlParams.get('fees');
    }
    
    if (urlParams.has('scheme')) {
        setEmiScheme(urlParams.get('scheme'));
    }
}

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'loanAmount', slider: 'loanAmountSlider', max: 20000000 },
        { input: 'emi', slider: 'emiSlider', max: 100000 },
        { input: 'feesCharges', slider: 'feesSlider', max: 100000 }
    ];
    
    inputs.forEach(({ input, slider, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.min(parseFloat(this.value) || 0, max);
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
    
    // EMI Scheme button listeners
    document.getElementById('emiAdvanceBtn').addEventListener('click', function() {
        setEmiScheme('advance');
    });
    
    document.getElementById('emiArrearsBtn').addEventListener('click', function() {
        setEmiScheme('arrears');
    });
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
            years = currentValue / 12;
        } else {
            years = currentValue;
        }
        
        tenureValueInput.value = years;
        tenureValueInput.step = '0.1';
        tenureValueInput.min = '1';
        tenureValueInput.max = '30';
        
        // Update slider for years (1-30 years)
        tenureSlider.min = '1';
        tenureSlider.max = '30';
        tenureSlider.step = '0.1';
        tenureSlider.value = years;
        
        // Update slider labels for years
        tenureSliderLabels.innerHTML = `
            <span>0</span>
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20</span>
            <span>25</span>
            <span>30</span>
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
        tenureValueInput.max = '360';
        
        // Update slider for months (12-360 months)
        tenureSlider.min = '12';
        tenureSlider.max = '360';
        tenureSlider.step = '1';
        tenureSlider.value = months;
        
        // Update slider labels for months
        tenureSliderLabels.innerHTML = `
            <span>0</span>
            <span>60</span>
            <span>120</span>
            <span>180</span>
            <span>240</span>
            <span>300</span>
            <span>360</span>
        `;
    }
    
    calculateAndUpdate();
}

function updateSliderFromInput() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    const value = parseFloat(tenureValueInput.value) || 0;
    
    if (currentTenureUnit === 'years') {
        // Input is in years, slider is in years
        tenureSlider.value = Math.min(Math.max(value, 1), 30);
    } else {
        // Input is in months, slider is in months
        tenureSlider.value = Math.min(Math.max(Math.round(value), 12), 360);
    }
}

function updateInputFromSlider() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    const sliderValue = parseFloat(tenureSlider.value);
    
    if (currentTenureUnit === 'years') {
        // Slider is in years, input is in years - keep decimal precision
        tenureValueInput.value = Math.round(sliderValue * 10) / 10; // Round to 1 decimal place
    } else {
        // Slider is in months, input is in months - whole numbers only
        tenureValueInput.value = Math.round(sliderValue);
    }
}

function setEmiScheme(scheme) {
    currentEmiScheme = scheme;
    const advanceBtn = document.getElementById('emiAdvanceBtn');
    const arrearsBtn = document.getElementById('emiArrearsBtn');
    
    if (scheme === 'advance') {
        advanceBtn.classList.add('active');
        arrearsBtn.classList.remove('active');
        advanceBtn.textContent = '✓ EMI in Advance';
        arrearsBtn.textContent = 'EMI in Arrears';
    } else {
        advanceBtn.classList.remove('active');
        arrearsBtn.classList.add('active');
        advanceBtn.textContent = 'EMI in Advance';
        arrearsBtn.textContent = '✓ EMI in Arrears';
    }
    
    calculateAndUpdate();
}

function calculateAndUpdate() {
    // Get input values
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const emi = parseFloat(document.getElementById('emi').value) || 0;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 0;
    const feesCharges = parseFloat(document.getElementById('feesCharges').value) || 0;

    // Convert tenure to months based on current unit
    let tenureMonths = 0;
    let tenureYears = 0;
    
    if (currentTenureUnit === 'years') {
        tenureYears = Math.floor(tenureValue);
        tenureMonths = Math.round((tenureValue - tenureYears) * 12);
        const totalMonths = Math.round(tenureValue * 12);
        tenureMonths = totalMonths;
    } else {
        const totalMonths = Math.round(tenureValue);
        tenureYears = Math.floor(totalMonths / 12);
        tenureMonths = totalMonths;
    }

    // Validate inputs
    if (loanAmount <= 0 || emi <= 0 || tenureMonths <= 0) {
        // Show default values or error state (exact values from emicalculator.net)
        const defaultData = {
            interestRate: 10.75,
            apr: 11.19,
            totalInterest: 297077,
            totalPayment: 1307077,
            loanAmount: 1000000,
            emi: 21617.95,
            feesCharges: 10000
        };
        updateResults(defaultData);
        return;
    }

    // Send calculation request to backend
    const data = {
        loanAmount: loanAmount,
        emi: emi,
        tenureYears: tenureYears,
        tenureMonths: tenureMonths % 12, // Remainder for months component
        feesCharges: feesCharges,
        emiScheme: currentEmiScheme
    };

    fetch('/calculate-interest-rate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Calculation error:', data.error);
            // Show error message to user
            showErrorMessage(data.error);
            // Show default values
            const defaultData = {
                interestRate: 10.75,
                apr: 11.19,
                totalInterest: 297077,
                totalPayment: 1307077,
                loanAmount: 1000000,
                emi: 21617.95,
                feesCharges: 10000
            };
            updateResults(defaultData);
        } else {
            hideErrorMessage();
            updateResults(data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorMessage('Calculation failed. Please check your inputs.');
        // Show default values
        const defaultData = {
            interestRate: 10.75,
            apr: 11.19,
            totalInterest: 297077,
            totalPayment: 1307077,
            loanAmount: 1000000,
            emi: 21617.95,
            feesCharges: 10000
        };
        updateResults(defaultData);
    });
}

function updateResults(data) {
    // Update results
    document.getElementById('interestRateResult').textContent = `${data.interestRate.toFixed(2)} %`;
    document.getElementById('loanApr').textContent = `${data.apr.toFixed(2)} %`;
    document.getElementById('totalInterest').textContent = `₹ ${formatIndianCurrency(data.totalInterest)}`;
    document.getElementById('totalPayment').textContent = `₹ ${formatIndianCurrency(data.totalPayment)}`;
    
    // Update chart summary
    document.getElementById('principalSummary').textContent = `₹ ${formatIndianCurrency(data.loanAmount)}`;
    document.getElementById('interestSummary').textContent = `₹ ${formatIndianCurrency(data.totalInterest)}`;
    document.getElementById('feesSummary').textContent = `₹ ${formatIndianCurrency(data.feesCharges)}`;
    document.getElementById('totalSummary').textContent = `₹ ${formatIndianCurrency(data.totalPayment)}`;
    
    // Update chart
    updateChart(data);
    
    // Update payment schedule if available
    if (data.paymentSchedule) {
        currentPaymentSchedule = data.paymentSchedule;
        updatePaymentSchedule(data.paymentSchedule);
    }
}

function updateChart(data) {
    const ctx = document.getElementById('paymentBreakupChart').getContext('2d');
    
    if (paymentBreakupChart) {
        paymentBreakupChart.destroy();
    }
    
    const principalAmount = data.loanAmount;
    const interestAmount = data.totalInterest;
    const feesAmount = data.feesCharges;
    const totalAmount = data.totalPayment;
    
    // Calculate percentages
    const principalPercentage = ((principalAmount / totalAmount) * 100).toFixed(1);
    const interestPercentage = ((interestAmount / totalAmount) * 100).toFixed(1);
    const feesPercentage = ((feesAmount / totalAmount) * 100).toFixed(1);
    
    paymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [
                `Principal (${principalPercentage}%)`,
                `Interest (${interestPercentage}%)`,
                `Fees & Charges (${feesPercentage}%)`
            ],
            datasets: [{
                data: [principalAmount, interestAmount, feesAmount],
                backgroundColor: [
                    '#68d391', // Principal - Green
                    '#f6ad55', // Interest - Orange
                    '#fc8181'  // Fees - Red
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
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
                            const value = context.raw;
                            const percentage = ((value / totalAmount) * 100).toFixed(1);
                            return `₹ ${formatIndianCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatIndianCurrency(amount) {
    // Convert to Indian numbering system
    return amount.toLocaleString('en-IN');
}

function showErrorMessage(message) {
    const errorElement = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideErrorMessage();
    }, 5000);
}

function hideErrorMessage() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.style.display = 'none';
}

function updatePaymentSchedule(schedule) {
    if (!schedule || schedule.length === 0) return;
    
    // Create yearly payment schedule for chart
    const yearlyData = {};
    schedule.forEach(payment => {
        const year = Math.ceil(payment.month / 12);
        
        if (!yearlyData[year]) {
            yearlyData[year] = {
                year: year,
                principal: 0,
                interest: 0,
                totalPayment: 0,
                balance: payment.balance,
                months: []
            };
        }
        
        yearlyData[year].principal += payment.principal;
        yearlyData[year].interest += payment.interest;
        yearlyData[year].totalPayment += payment.emi;
        yearlyData[year].balance = payment.balance;
        yearlyData[year].months.push(payment);
    });
    
    const yearlySchedule = Object.values(yearlyData);
    
    // Update chart
    updatePaymentScheduleChart(yearlySchedule);
    
    // Update table
    updatePaymentScheduleTable(yearlySchedule);
}

function updatePaymentScheduleChart(yearlySchedule) {
    const ctx = document.getElementById('paymentScheduleChart').getContext('2d');
    
    if (paymentScheduleChart) {
        paymentScheduleChart.destroy();
    }
    
    const labels = yearlySchedule.map(year => `Year ${year.year}`);
    const principalData = yearlySchedule.map(year => year.principal);
    const interestData = yearlySchedule.map(year => year.interest);
    
    paymentScheduleChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Principal',
                    data: principalData,
                    backgroundColor: '#68d391',
                    borderColor: '#48bb78',
                    borderWidth: 1
                },
                {
                    label: 'Interest',
                    data: interestData,
                    backgroundColor: '#f6ad55',
                    borderColor: '#ed8936',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Year'
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Amount (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹ ' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₹ ' + context.raw.toLocaleString('en-IN');
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function updatePaymentScheduleTable(yearlySchedule) {
    const tableBody = document.getElementById('scheduleTableBody');
    tableBody.innerHTML = '';
    
    yearlySchedule.forEach((year, index) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.onclick = () => toggleYearExpansion(index);
        
        const loanPaidPercentage = year.months.length > 0 ? year.months[year.months.length - 1].loan_paid_percentage : 0;
        
        yearRow.innerHTML = `
            <td><span class="expand-icon">▶</span>Year ${year.year}</td>
            <td>₹ ${formatIndianCurrency(Math.round(year.principal))}</td>
            <td>₹ ${formatIndianCurrency(Math.round(year.interest))}</td>
            <td>₹ ${formatIndianCurrency(Math.round(year.totalPayment))}</td>
            <td>₹ ${formatIndianCurrency(Math.round(year.balance))}</td>
            <td>${loanPaidPercentage.toFixed(1)}%</td>
        `;
        
        tableBody.appendChild(yearRow);
        
        // Create monthly details row
        const monthlyRow = document.createElement('tr');
        monthlyRow.className = 'monthly-details-row';
        monthlyRow.id = `monthly-details-${index}`;
        
        const monthlyCell = document.createElement('td');
        monthlyCell.colSpan = 6;
        monthlyCell.className = 'monthly-details-cell';
        
        // Create monthly table
        const monthlyTable = document.createElement('table');
        monthlyTable.className = 'monthly-table';
        
        let monthlyHTML = `
            <tr>
                <th style="text-align: left;">Month</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>EMI</th>
                <th>Balance</th>
                <th>Loan Paid</th>
            </tr>
        `;
        
        year.months.forEach(month => {
            const monthName = getMonthName(month.month);
            monthlyHTML += `
                <tr>
                    <td style="text-align: left;">${monthName}</td>
                    <td class="principal-cell">₹ ${formatIndianCurrency(Math.round(month.principal))}</td>
                    <td class="interest-cell">₹ ${formatIndianCurrency(Math.round(month.interest))}</td>
                    <td>₹ ${formatIndianCurrency(Math.round(month.emi))}</td>
                    <td class="balance-cell">₹ ${formatIndianCurrency(Math.round(month.balance))}</td>
                    <td class="percentage-cell">${month.loan_paid_percentage.toFixed(1)}%</td>
                </tr>
            `;
        });
        
        monthlyTable.innerHTML = monthlyHTML;
        monthlyCell.appendChild(monthlyTable);
        monthlyRow.appendChild(monthlyCell);
        
        tableBody.appendChild(monthlyRow);
    });
}

function getMonthName(monthNumber) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = ((monthNumber - 1) % 12);
    const year = Math.floor((monthNumber - 1) / 12) + 1;
    return `${months[monthIndex]} Y${year}`;
}

function toggleYearExpansion(yearIndex) {
    const monthlyRow = document.getElementById(`monthly-details-${yearIndex}`);
    const yearRow = monthlyRow.previousElementSibling;
    const expandIcon = yearRow.querySelector('.expand-icon');
    
    if (monthlyRow.classList.contains('show')) {
        monthlyRow.classList.remove('show');
        yearRow.classList.remove('expanded');
    } else {
        monthlyRow.classList.add('show');
        yearRow.classList.add('expanded');
    }
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Interest Rate Calculator Report', 20, 20);
    
    // Add calculation details
    doc.setFontSize(12);
    const loanAmount = document.getElementById('loanAmount').value;
    const emi = document.getElementById('emi').value;
    const tenureValue = document.getElementById('tenureValue').value;
    const feesCharges = document.getElementById('feesCharges').value;
    const interestRate = document.getElementById('interestRateResult').textContent;
    const apr = document.getElementById('loanApr').textContent;
    const totalInterest = document.getElementById('totalInterest').textContent;
    const totalPayment = document.getElementById('totalPayment').textContent;
    
    // Format tenure display
    let tenureDisplay = '';
    if (currentTenureUnit === 'years') {
        tenureDisplay = `${tenureValue} years`;
    } else {
        const years = Math.floor(tenureValue / 12);
        const months = tenureValue % 12;
        tenureDisplay = years > 0 ? `${years} years ${months} months` : `${months} months`;
    }
    
    let yPos = 40;
    doc.text(`Loan Amount: ₹ ${formatIndianCurrency(loanAmount)}`, 20, yPos);
    yPos += 10;
    doc.text(`EMI: ₹ ${formatIndianCurrency(emi)}`, 20, yPos);
    yPos += 10;
    doc.text(`Loan Tenure: ${tenureDisplay}`, 20, yPos);
    yPos += 10;
    doc.text(`Fees & Charges: ₹ ${formatIndianCurrency(feesCharges)}`, 20, yPos);
    yPos += 10;
    doc.text(`EMI Scheme: ${currentEmiScheme === 'advance' ? 'EMI in Advance' : 'EMI in Arrears'}`, 20, yPos);
    yPos += 20;
    
    doc.text(`Interest Rate: ${interestRate}`, 20, yPos);
    yPos += 10;
    doc.text(`Loan APR: ${apr}`, 20, yPos);
    yPos += 10;
    doc.text(`Total Interest Payable: ${totalInterest}`, 20, yPos);
    yPos += 10;
    doc.text(`Total Payment: ${totalPayment}`, 20, yPos);
    
    doc.save('interest-rate-calculation.pdf');
}

function downloadExcel() {
    if (!currentPaymentSchedule) {
        showErrorMessage('No payment schedule available to download.');
        return;
    }
    
    const wb = XLSX.utils.book_new();
    
    // Create summary sheet
    const tenureValue = document.getElementById('tenureValue').value;
    let tenureDisplay = '';
    if (currentTenureUnit === 'years') {
        tenureDisplay = `${tenureValue} years`;
    } else {
        const years = Math.floor(tenureValue / 12);
        const months = tenureValue % 12;
        tenureDisplay = years > 0 ? `${years} years ${months} months` : `${months} months`;
    }
    
    const summaryData = [
        ['Interest Rate Calculator Report'],
        [''],
        ['Loan Amount', document.getElementById('loanAmount').value],
        ['EMI', document.getElementById('emi').value],
        ['Loan Tenure', tenureDisplay],
        ['Fees & Charges', document.getElementById('feesCharges').value],
        ['EMI Scheme', currentEmiScheme === 'advance' ? 'EMI in Advance' : 'EMI in Arrears'],
        [''],
        ['Interest Rate', document.getElementById('interestRateResult').textContent],
        ['Loan APR', document.getElementById('loanApr').textContent],
        ['Total Interest Payable', document.getElementById('totalInterest').textContent],
        ['Total Payment', document.getElementById('totalPayment').textContent]
    ];
    
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
    
    // Create payment schedule sheet
    const scheduleData = [
        ['Month', 'Principal', 'Interest', 'EMI', 'Balance', 'Loan Paid %']
    ];
    
    currentPaymentSchedule.forEach(payment => {
        scheduleData.push([
            payment.month,
            payment.principal,
            payment.interest,
            payment.emi,
            payment.balance,
            payment.loan_paid_percentage.toFixed(2) + '%'
        ]);
    });
    
    const scheduleWS = XLSX.utils.aoa_to_sheet(scheduleData);
    XLSX.utils.book_append_sheet(wb, scheduleWS, 'Payment Schedule');
    
    XLSX.writeFile(wb, 'interest-rate-calculation.xlsx');
}

function shareCalculation() {
    const loanAmount = document.getElementById('loanAmount').value;
    const emi = document.getElementById('emi').value;
    const tenureValue = document.getElementById('tenureValue').value;
    const feesCharges = document.getElementById('feesCharges').value;
    
    const params = new URLSearchParams({
        loanAmount: loanAmount,
        emi: emi,
        tenure: tenureValue,
        tenureUnit: currentTenureUnit,
        fees: feesCharges,
        scheme: currentEmiScheme
    });
    
    const shareUrl = `${window.location.origin}/interest-rate-calculator/?${params.toString()}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Interest Rate Calculator',
            text: 'Check out this interest rate calculation',
            url: shareUrl
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Share link copied to clipboard!');
        }).catch(() => {
            // Show the URL in a prompt
            prompt('Copy this link:', shareUrl);
        });
    }
}

function getCurrentCalculationData() {
    return {
        loanAmount: document.getElementById('loanAmount').value,
        emi: document.getElementById('emi').value,
        tenure: document.getElementById('tenureValue').value,
        tenureUnit: currentTenureUnit,
        feesCharges: document.getElementById('feesCharges').value,
        emiScheme: currentEmiScheme,
        interestRate: document.getElementById('interestRateResult').textContent,
        apr: document.getElementById('loanApr').textContent,
        totalInterest: document.getElementById('totalInterest').textContent,
        totalPayment: document.getElementById('totalPayment').textContent
    };
}

function generatePrintableTable() {
    if (!currentPaymentSchedule) return '';
    
    let html = '<table border="1" style="border-collapse: collapse; width: 100%;">';
    html += '<tr><th>Month</th><th>Principal</th><th>Interest</th><th>EMI</th><th>Balance</th><th>Loan Paid %</th></tr>';
    
    currentPaymentSchedule.forEach(payment => {
        html += `<tr>
            <td>${payment.month}</td>
            <td>₹ ${formatIndianCurrency(Math.round(payment.principal))}</td>
            <td>₹ ${formatIndianCurrency(Math.round(payment.interest))}</td>
            <td>₹ ${formatIndianCurrency(Math.round(payment.emi))}</td>
            <td>₹ ${formatIndianCurrency(Math.round(payment.balance))}</td>
            <td>${payment.loan_paid_percentage.toFixed(1)}%</td>
        </tr>`;
    });
    
    html += '</table>';
    return html;
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