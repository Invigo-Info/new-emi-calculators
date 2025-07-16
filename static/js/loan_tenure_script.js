// Global variables
let paymentBreakupChart;
let paymentScheduleChart;
let currentEmiScheme = 'arrears';
let currentPaymentSchedule = null;

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
    
    if (urlParams.has('rate')) {
        document.getElementById('interestRate').value = urlParams.get('rate');
        document.getElementById('interestRateSlider').value = urlParams.get('rate');
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
    
    // EMI Scheme button listeners
    document.getElementById('emiAdvanceBtn').addEventListener('click', function() {
        setEmiScheme('advance');
    });
    
    document.getElementById('emiArrearsBtn').addEventListener('click', function() {
        setEmiScheme('arrears');
    });
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
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const feesCharges = parseFloat(document.getElementById('feesCharges').value) || 0;

    // Validate inputs
    if (loanAmount <= 0 || emi <= 0) {
        // Show default values or error state
        const defaultData = {
            tenureMonths: 60,
            tenureYears: 5,
            tenureRemainingMonths: 0,
            loanApr: 11.20,
            totalInterest: 288585,
            totalPayment: 1270000,
            loanAmount: 971415,
            emi: 21000.00,
            feesCharges: 10000
        };
        updateResults(defaultData);
        return;
    }

    // Send calculation request to backend
    const data = {
        loanAmount: loanAmount,
        emi: emi,
        interestRate: interestRate,
        feesCharges: feesCharges,
        emiScheme: currentEmiScheme
    };

    fetch('/calculate-loan-tenure', {
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
                tenureMonths: 60,
                tenureYears: 5,
                tenureRemainingMonths: 0,
                loanApr: 11.20,
                totalInterest: 288585,
                totalPayment: 1270000,
                loanAmount: 971415,
                emi: 21000.00,
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
            tenureMonths: 60,
            tenureYears: 5,
            tenureRemainingMonths: 0,
            loanApr: 11.20,
            totalInterest: 288585,
            totalPayment: 1270000,
            loanAmount: 971415,
            emi: 21000.00,
            feesCharges: 10000
        };
        updateResults(defaultData);
    });
}

function updateResults(data) {
    // Update tenure display
    const tenureText = data.tenureYears > 0 
        ? `${data.tenureMonths} months (${data.tenureYears} years ${data.tenureRemainingMonths} months)`
        : `${data.tenureMonths} months`;
    
    document.getElementById('tenureResult').textContent = tenureText;
    
    // Update results
    document.getElementById('loanApr').textContent = `${data.loanApr.toFixed(2)} %`;
    document.getElementById('totalInterest').textContent = `₹ ${formatIndianCurrency(data.totalInterest)}`;
    document.getElementById('totalPayment').textContent = `₹ ${formatIndianCurrency(data.totalPayment)}`;
    
    // Update chart summary
    document.getElementById('principalSummary').textContent = `₹ ${formatIndianCurrency(data.loanAmount)}`;
    document.getElementById('interestSummary').textContent = `₹ ${formatIndianCurrency(data.totalInterest)}`;
    document.getElementById('feesSummary').textContent = `₹ ${formatIndianCurrency(data.feesCharges)}`;
    document.getElementById('totalSummary').innerHTML = `<strong>₹ ${formatIndianCurrency(data.totalPayment)}</strong>`;
    
    // Update charts
    updateChart(data);
    
    // Update payment schedule if available
    if (data.paymentSchedule) {
        currentPaymentSchedule = data.paymentSchedule;
        updatePaymentSchedule(data.paymentSchedule);
        updatePaymentScheduleTable(data.paymentSchedule);
    }
}

function updateChart(data) {
    const ctx = document.getElementById('paymentBreakupChart').getContext('2d');
    
    const chartData = {
        labels: ['Principal', 'Interest', 'Fees & Charges'],
        datasets: [{
            data: [data.loanAmount, data.totalInterest, data.feesCharges],
            backgroundColor: [
                '#48bb78', // Green for principal
                '#ed8936', // Orange for interest
                '#e53e3e'  // Red for fees
            ],
            borderWidth: 0,
            hoverBorderWidth: 3,
            hoverBorderColor: '#fff'
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#fff',
                borderWidth: 1,
                cornerRadius: 6,
                displayColors: true,
                callbacks: {
                    label: function(context) {
                        const label = context.label;
                        const value = formatIndianCurrency(context.raw);
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((context.raw / total) * 100).toFixed(1);
                        return `${label}: ₹${value} (${percentage}%)`;
                    }
                }
            }
        },
        animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1000
        }
    };

    // Destroy existing chart if it exists
    if (paymentBreakupChart) {
        paymentBreakupChart.destroy();
    }

    // Create new chart
    paymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: options
    });
}

function formatCurrency(amount) {
    // Format number in Indian numbering system
    const absAmount = Math.abs(amount);
    
    if (absAmount >= 10000000) { // 1 crore or more
        return (amount / 10000000).toFixed(2) + ' Cr';
    } else if (absAmount >= 100000) { // 1 lakh or more
        return (amount / 100000).toFixed(2) + ' L';
    } else if (absAmount >= 1000) { // 1 thousand or more
        return (amount / 1000).toFixed(2) + ' K';
    } else {
        return amount.toLocaleString('en-IN', {
            maximumFractionDigits: 0
        });
    }
}

// Format numbers in Indian numbering system for display
function formatIndianCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0
    }).format(amount);
}

// Show error message to user
function showErrorMessage(message) {
    // Remove existing error message if any
    hideErrorMessage();
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span class="error-text">${message}</span>
            <button class="error-close" onclick="hideErrorMessage()">×</button>
        </div>
    `;
    
    // Insert at the top of calculator container
    const calculatorContainer = document.querySelector('.calculator-container');
    calculatorContainer.insertBefore(errorDiv, calculatorContainer.firstChild);
}

// Hide error message
function hideErrorMessage() {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Update payment schedule chart
function updatePaymentSchedule(schedule) {
    const ctx = document.getElementById('paymentScheduleChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (paymentScheduleChart) {
        paymentScheduleChart.destroy();
    }
    
    // Prepare data for the chart
    const years = schedule.map(item => item.year);
    const principalData = schedule.map(item => item.principal);
    const interestData = schedule.map(item => item.interest);
    const balanceData = schedule.map(item => item.balance);
    
    const chartData = {
        labels: years,
        datasets: [
            {
                type: 'bar',
                label: 'Principal',
                data: principalData,
                backgroundColor: '#48bb78',
                borderColor: '#38a169',
                borderWidth: 1,
                yAxisID: 'y',
                order: 2
            },
            {
                type: 'bar',
                label: 'Interest',
                data: interestData,
                backgroundColor: '#ed8936',
                borderColor: '#dd6b20',
                borderWidth: 1,
                yAxisID: 'y',
                order: 3
            },
            {
                type: 'line',
                label: 'Balance',
                data: balanceData,
                borderColor: '#e53e3e',
                backgroundColor: 'rgba(229, 62, 62, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.1,
                yAxisID: 'y1',
                order: 1,
                pointBackgroundColor: '#e53e3e',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
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
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#fff',
                borderWidth: 1,
                cornerRadius: 6,
                callbacks: {
                    label: function(context) {
                        const label = context.dataset.label;
                        const value = formatIndianCurrency(context.raw);
                        return `${label}: ₹${value}`;
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
                        return '₹' + formatCurrency(value);
                    }
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Outstanding Balance (₹)'
                },
                grid: {
                    drawOnChartArea: false
                },
                ticks: {
                    callback: function(value) {
                        return '₹' + formatCurrency(value);
                    }
                }
            }
        }
    };

    // Create new chart
    paymentScheduleChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: options
    });
}

// Update payment schedule table
function updatePaymentScheduleTable(schedule) {
    const tableBody = document.getElementById('paymentScheduleTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    schedule.forEach((row, index) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.dataset.yearIndex = index;
        
        const expandIcon = row.monthlyDetails && row.monthlyDetails.length > 0 ? '▶' : '';
        
        yearRow.innerHTML = `
            <td class="year-cell" style="text-align: center; padding-left: 25px;">
                ${expandIcon ? `<span class="expand-icon">${expandIcon}</span>` : ''}
                ${row.year}
            </td>
            <td class="principal-cell">₹${formatIndianCurrency(row.principal)}</td>
            <td class="interest-cell">₹${formatIndianCurrency(row.interest)}</td>
            <td>₹${formatIndianCurrency(row.totalPayment)}</td>
            <td class="balance-cell">₹${formatIndianCurrency(row.balance)}</td>
            <td class="percentage-cell">${row.loanPaidPercentage}%</td>
        `;
        
        // Add click event for expansion if monthly details exist
        if (row.monthlyDetails && row.monthlyDetails.length > 0) {
            yearRow.addEventListener('click', function() {
                toggleYearExpansion(index);
            });
            yearRow.style.cursor = 'pointer';
        }
        
        tableBody.appendChild(yearRow);
        
        // Create monthly details row if data exists
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
            
            monthlyTable.innerHTML = `
                <tbody>
                    ${row.monthlyDetails.map(month => `
                        <tr>
                            <td style="text-align: center;">${month.month}</td>
                            <td class="principal-cell">₹${formatIndianCurrency(month.principal)}</td>
                            <td class="interest-cell">₹${formatIndianCurrency(month.interest)}</td>
                            <td>₹${formatIndianCurrency(month.totalPayment)}</td>
                            <td class="balance-cell">₹${formatIndianCurrency(month.balance)}</td>
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

// Toggle year expansion for monthly details
function toggleYearExpansion(yearIndex) {
    const yearRow = document.querySelector(`.year-row[data-year-index="${yearIndex}"]`);
    const monthlyRow = document.querySelector(`.monthly-details-row[data-year-index="${yearIndex}"]`);
    const expandIcon = yearRow.querySelector('.expand-icon');
    
    if (monthlyRow) {
        const isExpanded = monthlyRow.classList.contains('show');
        
        if (isExpanded) {
            monthlyRow.classList.remove('show');
            yearRow.classList.remove('expanded');
            if (expandIcon) expandIcon.textContent = '▶';
        } else {
            monthlyRow.classList.add('show');
            yearRow.classList.add('expanded');
            if (expandIcon) expandIcon.textContent = '▼';
        }
    }
}

// Download PDF function
function downloadPDF() {
    if (!currentPaymentSchedule) {
        alert('No calculation data available for download');
        return;
    }
    
    // Create a new window with printable content
    const printWindow = window.open('', '', 'height=600,width=800');
    const calculationData = getCurrentCalculationData();
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Loan Tenure Calculator - Payment Schedule</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                .summary-section { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 11px; }
                th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
                .year-row { background-color: #f0f0f0; font-weight: bold; }
                .principal-col { background-color: #d4edda; }
                .interest-col { background-color: #fff3cd; }
                .balance-col { background-color: #f8d7da; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Loan Tenure Calculator</h1>
                <h2>Payment Schedule & Summary</h2>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="summary">
                <div class="summary-section">
                    <h3>Loan Details</h3>
                    <p><strong>Loan Amount:</strong> ₹${formatIndianCurrency(calculationData.loanAmount)}</p>
                    <p><strong>EMI:</strong> ₹${formatIndianCurrency(calculationData.emi)}</p>
                    <p><strong>Interest Rate:</strong> ${calculationData.interestRate}% per annum</p>
                    <p><strong>Fees & Charges:</strong> ₹${formatIndianCurrency(calculationData.feesCharges)}</p>
                    <p><strong>EMI Scheme:</strong> ${calculationData.emiScheme}</p>
                </div>
                
                <div class="summary-section">
                    <h3>Payment Summary</h3>
                    <p><strong>Loan Tenure:</strong> ${calculationData.tenureMonths} months</p>
                    <p><strong>Loan APR:</strong> ${calculationData.loanApr}%</p>
                    <p><strong>Total Interest:</strong> ₹${formatIndianCurrency(calculationData.totalInterest)}</p>
                    <p><strong>Total Payment:</strong> ₹${formatIndianCurrency(calculationData.totalPayment)}</p>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Year</th>
                        <th class="principal-col">Principal (A)</th>
                        <th class="interest-col">Interest (B)</th>
                        <th>Total Payment (A + B)</th>
                        <th class="balance-col">Balance</th>
                        <th>Loan Paid To Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${generatePrintableTable()}
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// Download Excel function
function downloadExcel() {
    if (!currentPaymentSchedule) {
        alert('No calculation data available for download');
        return;
    }
    
    try {
        const calculationData = getCurrentCalculationData();
        
        // Create Excel workbook
        const wb = XLSX.utils.book_new();
        
        // Summary sheet
        const summaryData = [
            ['Loan Tenure Calculator Results'],
            [''],
            ['Input Parameters'],
            ['Loan Amount', `₹${formatIndianCurrency(calculationData.loanAmount)}`],
            ['EMI', `₹${formatIndianCurrency(calculationData.emi)}`],
            ['Interest Rate', `${calculationData.interestRate}%`],
            ['Fees & Charges', `₹${formatIndianCurrency(calculationData.feesCharges)}`],
            ['EMI Scheme', calculationData.emiScheme],
            [''],
            ['Results'],
            ['Loan Tenure', `${calculationData.tenureMonths} months`],
            ['Loan APR', `${calculationData.loanApr}%`],
            ['Total Interest', `₹${formatIndianCurrency(calculationData.totalInterest)}`],
            ['Total Payment', `₹${formatIndianCurrency(calculationData.totalPayment)}`]
        ];
        
        const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
        
        // Payment schedule sheet
        const scheduleData = [
            ['Year', 'Principal', 'Interest', 'Total Payment', 'Balance', 'Loan Paid %']
        ];
        
        currentPaymentSchedule.forEach(row => {
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
        
        // Download file
        XLSX.writeFile(wb, 'loan_tenure_payment_schedule.xlsx');
        
    } catch (error) {
        console.error('Error generating Excel file:', error);
        alert('Error generating Excel file. Please try again.');
    }
}

// Share calculation function
function shareCalculation() {
    const calculationData = getCurrentCalculationData();
    
    // Create shareable URL with parameters
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
        loanAmount: calculationData.loanAmount,
        emi: calculationData.emi,
        rate: calculationData.interestRate,
        fees: calculationData.feesCharges,
        scheme: calculationData.emiScheme
    });
    
    const shareUrl = `${baseUrl}?${params.toString()}`;
    
    // Copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Share link copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            prompt('Copy this link to share:', shareUrl);
        });
    } else {
        // Fallback for older browsers
        prompt('Copy this link to share:', shareUrl);
    }
}

// Get current calculation data
function getCurrentCalculationData() {
    return {
        loanAmount: parseFloat(document.getElementById('loanAmount').value) || 0,
        emi: parseFloat(document.getElementById('emi').value) || 0,
        interestRate: parseFloat(document.getElementById('interestRate').value) || 0,
        feesCharges: parseFloat(document.getElementById('feesCharges').value) || 0,
        emiScheme: currentEmiScheme,
        tenureMonths: document.getElementById('tenureResult').textContent.match(/\d+/)[0],
        loanApr: parseFloat(document.getElementById('loanApr').textContent.replace('%', '')) || 0,
        totalInterest: parseFloat(document.getElementById('totalInterest').textContent.replace(/[₹,]/g, '')) || 0,
        totalPayment: parseFloat(document.getElementById('totalPayment').textContent.replace(/[₹,]/g, '')) || 0
    };
}

// Generate printable table for PDF
function generatePrintableTable() {
    if (!currentPaymentSchedule) return '';
    
    return currentPaymentSchedule.map(row => `
        <tr class="year-row">
            <td>${row.year}</td>
            <td class="principal-col">₹${formatIndianCurrency(row.principal)}</td>
            <td class="interest-col">₹${formatIndianCurrency(row.interest)}</td>
            <td>₹${formatIndianCurrency(row.totalPayment)}</td>
            <td class="balance-col">₹${formatIndianCurrency(row.balance)}</td>
            <td>${row.loanPaidPercentage}%</td>
        </tr>
    `).join('');
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