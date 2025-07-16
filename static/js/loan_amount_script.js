// Global variables
let paymentBreakupChart;
let currentEmiScheme = 'arrears';
let currentTenureUnit = 'months'; // 'years' or 'months'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupScheduleControls();
    
    // Load shared parameters if present
    loadSharedParameters();
    
    calculateAndUpdate();
});

// Load parameters from URL for shared calculations
function loadSharedParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('emi')) {
        document.getElementById('emi').value = urlParams.get('emi');
        document.getElementById('emiSlider').value = urlParams.get('emi');
    }
    
    if (urlParams.has('rate')) {
        document.getElementById('interestRate').value = urlParams.get('rate');
        document.getElementById('interestRateSlider').value = urlParams.get('rate');
    }
    
    if (urlParams.has('tenure')) {
        const tenure = urlParams.get('tenure');
        const unit = urlParams.get('unit') || 'months';
        
        // Set tenure unit first
        setTenureMode(unit);
        
        // Then set the value
        document.getElementById('tenureValue').value = tenure;
        updateSliderFromInput();
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
        { input: 'emi', slider: 'emiSlider', max: 100000 },
        { input: 'interestRate', slider: 'interestRateSlider', max: 20 },
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
    
    // Update button states
    document.getElementById('emiAdvanceBtn').classList.toggle('active', scheme === 'advance');
    document.getElementById('emiArrearsBtn').classList.toggle('active', scheme === 'arrears');
    
    calculateAndUpdate();
}

function calculateAndUpdate() {
    // Get input values
    const emi = parseFloat(document.getElementById('emi').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 0;
    const feesCharges = parseFloat(document.getElementById('feesCharges').value) || 0;
    
    // Convert tenure to years and months for API call
    let tenureYears, tenureMonths;
    
    if (currentTenureUnit === 'years') {
        // Input is in years
        tenureYears = Math.floor(tenureValue);
        tenureMonths = Math.round((tenureValue - tenureYears) * 12);
    } else {
        // Input is in months
        tenureYears = Math.floor(tenureValue / 12);
        tenureMonths = Math.round(tenureValue % 12);
    }
    
    // Ensure minimum tenure of 1 month
    if (tenureYears === 0 && tenureMonths === 0) {
        tenureMonths = 1;
    }
    
    // Prepare data for API call
    const requestData = {
        emi: emi,
        interestRate: interestRate,
        tenureYears: tenureYears,
        tenureMonths: tenureMonths,
        feesCharges: feesCharges,
        emiScheme: currentEmiScheme
    };
    
    // Call the calculation API
    fetch('/calculate-loan-amount', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Calculation error:', data.error);
            return;
        }
        
        updateResults(data);
        updateChart(data);
        updatePaymentSchedule(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateResults(data) {
    // Update result values
    document.getElementById('principalAmount').textContent = formatCurrency(data.principalAmount);
    document.getElementById('loanApr').textContent = data.loanApr.toFixed(2) + ' %';
    document.getElementById('totalInterest').textContent = formatCurrency(data.totalInterest);
    document.getElementById('totalPayment').textContent = formatCurrency(data.totalPayment);
    
    // Update summary values
    document.getElementById('principalSummary').textContent = formatCurrency(data.principalAmount);
    document.getElementById('interestSummary').textContent = formatCurrency(data.totalInterest);
    document.getElementById('feesSummary').textContent = formatCurrency(data.feesCharges);
    document.getElementById('totalSummary').textContent = formatCurrency(data.totalPayment);
}

function updateChart(data) {
    const ctx = document.getElementById('paymentBreakupChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (paymentBreakupChart) {
        paymentBreakupChart.destroy();
    }
    
    const chartData = {
        labels: ['Principal', 'Interest', 'Fees & Charges'],
        datasets: [{
            data: [
                data.principalAmount,
                data.totalInterest,
                data.feesCharges
            ],
            backgroundColor: [
                '#48bb78', // Green for principal
                '#ed8936', // Orange for interest
                '#e53e3e'  // Red for fees
            ],
            borderWidth: 0,
            hoverBorderWidth: 2,
            hoverBorderColor: '#fff'
        }]
    };
    
    const chartOptions = {
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
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        layout: {
            padding: 10
        }
    };
    
    paymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: chartOptions
    });
}

function formatCurrency(amount) {
    // Convert to Indian currency format
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    return formatter.format(amount);
}

// Utility function to format numbers in Indian style (lakhs/crores)
function formatIndianCurrency(amount) {
    if (amount >= 10000000) { // 1 crore
        return '₹ ' + (amount / 10000000).toFixed(2) + ' Cr';
    } else if (amount >= 100000) { // 1 lakh
        return '₹ ' + (amount / 100000).toFixed(2) + ' L';
    } else if (amount >= 1000) { // 1 thousand
        return '₹ ' + (amount / 1000).toFixed(1) + ' K';
    } else {
        return '₹ ' + amount.toLocaleString('en-IN');
    }
}

// Payment Schedule Variables
let paymentScheduleChart = null;

function updatePaymentSchedule(data) {
    if (data.paymentSchedule && data.paymentSchedule.length > 0) {
        // Store payment schedule globally for download functions
        window.currentPaymentSchedule = data.paymentSchedule;
        updatePaymentScheduleChart(data.paymentSchedule);
        updatePaymentScheduleTable(data.paymentSchedule);
    }
}

function updatePaymentScheduleChart(schedule) {
    const ctx = document.getElementById('paymentScheduleChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (paymentScheduleChart) {
        paymentScheduleChart.destroy();
    }
    
    // Prepare data for the bar chart
    const years = schedule.map(item => item.year);
    const principalData = schedule.map(item => item.principal);
    const interestData = schedule.map(item => item.interest);
    const balanceData = schedule.map(item => item.balance);
    
    const chartData = {
        labels: years,
        datasets: [
            {
                label: 'Principal',
                data: principalData,
                backgroundColor: '#48bb78',
                borderColor: '#48bb78',
                borderWidth: 1,
                yAxisID: 'y'
            },
            {
                label: 'Interest',
                data: interestData,
                backgroundColor: '#ed8936',
                borderColor: '#ed8936',
                borderWidth: 1,
                yAxisID: 'y'
            },
            {
                label: 'Balance',
                data: balanceData,
                type: 'line',
                backgroundColor: 'transparent',
                borderColor: '#e53e3e',
                borderWidth: 3,
                pointBackgroundColor: '#e53e3e',
                pointBorderColor: '#e53e3e',
                pointRadius: 5,
                fill: false,
                yAxisID: 'y1'
            }
        ]
    };
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            title: {
                display: false
            },
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = formatCurrency(context.parsed.y);
                        return `${context.dataset.label}: ${value}`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Year'
                },
                grid: {
                    display: false
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Amount (₹)'
                },
                ticks: {
                    callback: function(value) {
                        return formatIndianCurrency(value);
                    }
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Balance (₹)'
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    callback: function(value) {
                        return formatIndianCurrency(value);
                    }
                }
            }
        }
    };
    
    paymentScheduleChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: chartOptions
    });
}

function updatePaymentScheduleTable(schedule) {
    const tableBody = document.getElementById('paymentScheduleTableBody');
    tableBody.innerHTML = '';
    
    schedule.forEach((row, index) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.dataset.yearIndex = index;
        
        yearRow.innerHTML = `
            <td class="year-cell" style="text-align: center; padding-left: 25px;">${row.year}</td>
            <td class="principal-cell">${formatCurrency(row.principal)}</td>
            <td class="interest-cell">${formatCurrency(row.interest)}</td>
            <td>${formatCurrency(row.totalPayment)}</td>
            <td class="balance-cell">${formatCurrency(row.balance)}</td>
            <td class="percentage-cell">${row.loanPaidPercentage}%</td>
        `;
        
        // Add click event for expansion
        yearRow.addEventListener('click', function() {
            toggleYearExpansion(index);
        });
        
        tableBody.appendChild(yearRow);
        
        // Create monthly details row
        if (row.monthlyDetails && row.monthlyDetails.length > 0) {
            const monthlyRow = document.createElement('tr');
            monthlyRow.className = 'monthly-details-row';
            monthlyRow.dataset.yearIndex = index;
            
            const monthlyCell = document.createElement('td');
            monthlyCell.className = 'monthly-details-cell';
            monthlyCell.colSpan = 6;
            
            // Create monthly breakdown table
            const monthlyTable = document.createElement('table');
            monthlyTable.className = 'monthly-table';
            
            // Monthly table without header
            monthlyTable.innerHTML = `
                <tbody>
                    ${row.monthlyDetails.map(month => `
                        <tr>
                            <td style="text-align: center;">${month.month}</td>
                            <td class="principal-cell">${formatCurrency(month.principal)}</td>
                            <td class="interest-cell">${formatCurrency(month.interest)}</td>
                            <td>${formatCurrency(month.totalPayment)}</td>
                            <td class="balance-cell">${formatCurrency(month.balance)}</td>
                            <td class="percentage-cell">${month.loanPaidPercentage}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            
            monthlyCell.appendChild(monthlyTable);
            monthlyRow.appendChild(monthlyCell);
            tableBody.appendChild(monthlyRow);
        }
    });
}

function toggleYearExpansion(yearIndex) {
    const yearRow = document.querySelector(`tr.year-row[data-year-index="${yearIndex}"]`);
    const monthlyRow = document.querySelector(`tr.monthly-details-row[data-year-index="${yearIndex}"]`);
    
    if (yearRow && monthlyRow) {
        const isExpanded = yearRow.classList.contains('expanded');
        
        if (isExpanded) {
            // Collapse
            yearRow.classList.remove('expanded');
            monthlyRow.classList.remove('show');
        } else {
            // Expand
            yearRow.classList.add('expanded');
            monthlyRow.classList.add('show');
        }
    }
}

// Initialize schedule controls
function setupScheduleControls() {
    const scheduleStartDate = document.getElementById('scheduleStartDate');
    const scheduleType = document.getElementById('scheduleType');
    
    // Set default start date to current month
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    scheduleStartDate.value = currentMonth;
    
    // Add event listeners for schedule controls
    scheduleStartDate.addEventListener('change', function() {
        // Recalculate when start date changes
        calculateAndUpdate();
    });
    
    scheduleType.addEventListener('change', function() {
        // Toggle between calendar year and financial year
        // This would require additional backend logic
        calculateAndUpdate();
    });
    
    // Setup download and share buttons
    setupDownloadButtons();
}

// Download and Share functionality
function setupDownloadButtons() {
    const pdfBtn = document.querySelector('.pdf-btn');
    const excelBtn = document.querySelector('.excel-btn');
    const shareBtn = document.querySelector('.share-btn');
    
    if (pdfBtn) {
        pdfBtn.addEventListener('click', downloadPDF);
    }
    
    if (excelBtn) {
        excelBtn.addEventListener('click', downloadExcel);
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', shareCalculation);
    }
}

function downloadPDF() {
    try {
        // Get current calculation data
        const data = getCurrentCalculationData();
        
        // Create PDF content
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.text('Loan Amount Calculator Results', 20, 20);
        
        // Add calculation summary
        doc.setFontSize(12);
        let yPos = 40;
        doc.text(`EMI: ${formatCurrency(data.emi)}`, 20, yPos);
        yPos += 10;
        doc.text(`Interest Rate: ${data.interestRate}%`, 20, yPos);
        yPos += 10;
        doc.text(`Loan Tenure: ${data.tenureDisplay}`, 20, yPos);
        yPos += 10;
        doc.text(`Fees & Charges: ${formatCurrency(data.feesCharges)}`, 20, yPos);
        yPos += 20;
        
        // Add results
        doc.setFontSize(14);
        doc.text('Results:', 20, yPos);
        yPos += 15;
        
        doc.setFontSize(12);
        doc.text(`Principal Loan Amount: ${document.getElementById('principalAmount').textContent}`, 20, yPos);
        yPos += 10;
        doc.text(`Loan APR: ${document.getElementById('loanApr').textContent}`, 20, yPos);
        yPos += 10;
        doc.text(`Total Interest: ${document.getElementById('totalInterest').textContent}`, 20, yPos);
        yPos += 10;
        doc.text(`Total Payment: ${document.getElementById('totalPayment').textContent}`, 20, yPos);
        
        // Save the PDF
        doc.save('loan-amount-calculation.pdf');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('PDF generation is not available. Please install jsPDF library.');
    }
}

function downloadExcel() {
    try {
        // Get current calculation data
        const data = getCurrentCalculationData();
        
        // Create Excel workbook
        const wb = XLSX.utils.book_new();
        
        // Summary sheet
        const summaryData = [
            ['Loan Amount Calculator Results'],
            [''],
            ['Input Parameters'],
            ['EMI', formatCurrency(data.emi)],
            ['Interest Rate', data.interestRate + '%'],
            ['Loan Tenure', data.tenureDisplay],
            ['Fees & Charges', formatCurrency(data.feesCharges)],
            ['EMI Scheme', data.emiScheme],
            [''],
            ['Results'],
            ['Principal Loan Amount', document.getElementById('principalAmount').textContent],
            ['Loan APR', document.getElementById('loanApr').textContent],
            ['Total Interest', document.getElementById('totalInterest').textContent],
            ['Total Payment', document.getElementById('totalPayment').textContent]
        ];
        
        const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
        
        // Payment schedule sheet
        if (data.paymentSchedule && data.paymentSchedule.length > 0) {
            const scheduleData = [
                ['Year', 'Principal', 'Interest', 'Total Payment', 'Balance', 'Loan Paid %']
            ];
            
            data.paymentSchedule.forEach(row => {
                scheduleData.push([
                    row.year,
                    row.principal,
                    row.interest,
                    row.totalPayment,
                    row.balance,
                    row.loanPaidPercentage + '%'
                ]);
            });
            
            const scheduleWS = XLSX.utils.aoa_to_sheet(scheduleData);
            XLSX.utils.book_append_sheet(wb, scheduleWS, 'Payment Schedule');
        }
        
        // Save the Excel file
        XLSX.writeFile(wb, 'loan-amount-calculation.xlsx');
        
    } catch (error) {
        console.error('Excel generation error:', error);
        alert('Excel generation is not available. Please install SheetJS library.');
    }
}

function shareCalculation() {
    // Get current input values
    const data = getCurrentCalculationData();
    
    // Create shareable URL with parameters
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
        emi: data.emi,
        rate: data.interestRate,
        tenure: data.tenureYears + (data.tenureMonths > 0 ? '.' + data.tenureMonths : ''),
        unit: data.tenureUnit,
        fees: data.feesCharges,
        scheme: data.emiScheme
    });
    
    const shareUrl = `${baseUrl}?${params.toString()}`;
    
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Shareable link copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            fallbackCopyToClipboard(shareUrl);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyToClipboard(shareUrl);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        alert('Shareable link copied to clipboard!');
    } catch (err) {
        console.error('Fallback copy failed:', err);
        // Show the URL in a prompt as last resort
        prompt('Copy this link to share:', text);
    }
    
    document.body.removeChild(textArea);
}

function getCurrentCalculationData() {
    // Get current input values
    const emi = parseFloat(document.getElementById('emi').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 0;
    const feesCharges = parseFloat(document.getElementById('feesCharges').value) || 0;
    
    // Convert tenure to years and months
    let tenureYears, tenureMonths, tenureDisplay;
    
    if (currentTenureUnit === 'years') {
        tenureYears = Math.floor(tenureValue);
        tenureMonths = Math.round((tenureValue - tenureYears) * 12);
        tenureDisplay = `${tenureValue} years`;
    } else {
        tenureYears = Math.floor(tenureValue / 12);
        tenureMonths = Math.round(tenureValue % 12);
        tenureDisplay = `${tenureValue} months`;
    }
    
    return {
        emi,
        interestRate,
        tenureValue,
        tenureYears,
        tenureMonths,
        tenureDisplay,
        tenureUnit: currentTenureUnit,
        feesCharges,
        emiScheme: currentEmiScheme,
        paymentSchedule: window.currentPaymentSchedule || []
    };
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