// Global variables
let paymentBreakupChart;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupDownloadButtons();
    loadFromUrlParameters();
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'transactionAmount', slider: 'transactionAmountSlider', min: 1000, max: 500000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 12, max: 42 },
        { input: 'processingFees', slider: 'processingFeesSlider', min: 0, max: 10000 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
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
}

function setupTenureEventListeners() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    
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
}

function updateSliderFromInput() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    
    const value = parseFloat(tenureValueInput.value) || 0;
    const min = parseFloat(tenureSlider.min);
    const max = parseFloat(tenureSlider.max);
    
    tenureSlider.value = Math.min(Math.max(value, min), max);
}

function updateInputFromSlider() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    
    tenureValueInput.value = tenureSlider.value;
}

function calculateAndUpdate() {
    const transactionAmount = parseFloat(document.getElementById('transactionAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const tenureMonths = parseFloat(document.getElementById('tenureValue').value) || 0;
    const processingFees = parseFloat(document.getElementById('processingFees').value) || 0;
    
    // Make API call
    fetch('/calculate-credit-card-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            transactionAmount: transactionAmount,
            interestRate: interestRate,
            tenureMonths: tenureMonths,
            processingFees: processingFees
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'error') {
            console.error('Error:', data.error);
            return;
        }
        updateResults(data);
        updateChart(data);
        updateAmortizationTable(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateResults(data) {
    document.getElementById('transactionAmountResult').textContent = `₹ ${formatCurrency(data.transactionAmount)}`;
    document.getElementById('monthlyEmi').textContent = `₹ ${formatCurrency(data.monthlyEmi)}`;
    document.getElementById('totalInterestResult').textContent = `₹ ${formatCurrency(data.totalInterest)}`;
    document.getElementById('totalPayment').textContent = `₹ ${formatCurrency(data.totalPayment)}`;
    document.getElementById('transactionAmountDisplay').textContent = `₹ ${formatCurrency(data.transactionAmount)}`;
    document.getElementById('processingFeesGstDisplay').textContent = `₹ ${formatCurrency(data.processingFeesWithGst)}`;
    document.getElementById('totalInterestDisplay').textContent = `₹ ${formatCurrency(data.totalInterest)}`;
    document.getElementById('gstOnInterestDisplay').textContent = `₹ ${formatCurrency(data.gstOnInterest)}`;
}

function updateChart(data) {
    const ctx = document.getElementById('paymentBreakupChart').getContext('2d');
    
    if (paymentBreakupChart) {
        paymentBreakupChart.destroy();
    }
    
    paymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Transaction Amount', 'Processing Fees + GST', 'Total Interest', 'GST on Interest'],
            datasets: [{
                data: [
                    data.transactionAmount, 
                    data.processingFeesWithGst, 
                    data.totalInterest, 
                    data.gstOnInterest
                ],
                backgroundColor: ['#3182ce', '#38a169', '#e53e3e', '#d69e2e'],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = ((value / data.totalPayment) * 100).toFixed(1);
                            return `${context.label}: ₹${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function updateAmortizationTable(data) {
    const tableBody = document.getElementById('amortizationTableBody');
    tableBody.innerHTML = '';
    
    if (data.amortizationSchedule && data.amortizationSchedule.length > 0) {
        // Add yearly summary row first
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.innerHTML = `
            <td class="year-cell" onclick="toggleMonthlyRows(this)">📅 2025</td>
            <td class="amount-cell">₹ ${formatCurrency(data.transactionAmount)}</td>
            <td class="amount-cell">₹ ${formatCurrency(data.totalInterest)}</td>
            <td class="amount-cell">₹ ${formatCurrency(data.gstOnInterest)}</td>
            <td class="amount-cell">₹ ${formatCurrency(data.totalPayment - data.processingFeesWithGst)}</td>
            <td class="amount-cell">₹ 0</td>
            <td class="percentage-cell">100.00%</td>
        `;
        tableBody.appendChild(yearRow);
        
        // Add monthly breakdown rows (initially hidden)
        data.amortizationSchedule.forEach((payment, index) => {
            const row = document.createElement('tr');
            row.className = 'month-row';
            row.innerHTML = `
                <td class="month-cell">${payment.month}</td>
                <td class="amount-cell">₹ ${formatCurrency(payment.principal)}</td>
                <td class="amount-cell">₹ ${formatCurrency(payment.interest)}</td>
                <td class="amount-cell">₹ ${formatCurrency(payment.gstOnInterest)}</td>
                <td class="amount-cell">₹ ${formatCurrency(payment.totalPayment)}</td>
                <td class="amount-cell">₹ ${formatCurrency(payment.balance)}</td>
                <td class="percentage-cell">${payment.loanPaidPercentage}%</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function toggleMonthlyRows(yearCell) {
    const monthRows = document.querySelectorAll('.month-row');
    const isExpanded = yearCell.classList.contains('expanded');
    
    if (isExpanded) {
        // Collapse - hide monthly rows
        monthRows.forEach(row => {
            row.classList.remove('show');
            setTimeout(() => {
                row.style.display = 'none';
            }, 300);
        });
        yearCell.classList.remove('expanded');
    } else {
        // Expand - show monthly rows
        monthRows.forEach(row => {
            row.style.display = 'table-row';
            setTimeout(() => {
                row.classList.add('show');
            }, 10);
        });
        yearCell.classList.add('expanded');
    }
}

function setupDownloadButtons() {
    // PDF Download Button
    document.querySelector('.pdf-btn').addEventListener('click', function() {
        downloadPDF();
    });
    
    // Excel Download Button
    document.querySelector('.excel-btn').addEventListener('click', function() {
        downloadExcel();
    });
    
    // Share Link Button
    document.querySelector('.share-btn').addEventListener('click', function() {
        shareLink();
    });
}

function downloadPDF() {
    // Get current calculation values
    const transactionAmount = document.getElementById('transactionAmount').value;
    const interestRate = document.getElementById('interestRate').value;
    const tenureMonths = document.getElementById('tenureValue').value;
    const processingFees = document.getElementById('processingFees').value;
    
    // Create a printable version
    const printContent = generatePrintableContent();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Credit Card EMI Calculator - Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary { margin-bottom: 30px; }
                .calculation-params { margin-bottom: 30px; }
                .results { margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #f2f2f2; }
                .amount { text-align: right; }
                .label { font-weight: bold; }
            </style>
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function downloadExcel() {
    // Get amortization data
    const monthRows = document.querySelectorAll('.month-row');
    let csvContent = "Month,Principal (A),Interest (B),GST on Interest (C),Total Payment (A+B+C),Balance,Loan Paid To Date\n";
    
    // Add yearly summary
    const yearData = [
        "2025",
        document.getElementById('transactionAmountResult').textContent.replace('₹ ', '').replace(',', ''),
        document.getElementById('totalInterestResult').textContent.replace('₹ ', '').replace(',', ''),
        document.getElementById('gstOnInterestDisplay').textContent.replace('₹ ', '').replace(',', ''),
        document.getElementById('totalPayment').textContent.replace('₹ ', '').replace(',', ''),
        "0",
        "100.00%"
    ];
    csvContent += yearData.join(',') + '\n';
    
    // Add monthly data
    monthRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = Array.from(cells).map(cell => {
            return cell.textContent.replace('₹ ', '').replace(',', '');
        });
        csvContent += rowData.join(',') + '\n';
    });
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'credit_card_emi_schedule.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function shareLink() {
    // Get current input values
    const transactionAmount = document.getElementById('transactionAmount').value;
    const interestRate = document.getElementById('interestRate').value;
    const tenureMonths = document.getElementById('tenureValue').value;
    const processingFees = document.getElementById('processingFees').value;
    
    // Create shareable URL with parameters
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
        amount: transactionAmount,
        rate: interestRate,
        tenure: tenureMonths,
        fees: processingFees
    });
    
    const shareableUrl = `${baseUrl}?${params.toString()}`;
    
    // Copy to clipboard
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareableUrl).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(shareableUrl);
        });
    } else {
        fallbackCopyTextToClipboard(shareableUrl);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Link copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Failed to copy link. Please copy manually: ' + text, 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        transition: all 0.3s ease;
        ${type === 'success' ? 'background-color: #48bb78;' : 'background-color: #f56565;'}
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function generatePrintableContent() {
    const transactionAmount = document.getElementById('transactionAmountResult').textContent;
    const monthlyEmi = document.getElementById('monthlyEmi').textContent;
    const totalInterest = document.getElementById('totalInterestResult').textContent;
    const totalPayment = document.getElementById('totalPayment').textContent;
    
    return `
        <div class="header">
            <h1>Credit Card EMI Calculator Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="calculation-params">
            <h2>Calculation Parameters</h2>
            <table>
                <tr><td class="label">Transaction Amount</td><td class="amount">${document.getElementById('transactionAmount').value}</td></tr>
                <tr><td class="label">Interest Rate</td><td class="amount">${document.getElementById('interestRate').value}%</td></tr>
                <tr><td class="label">Tenure</td><td class="amount">${document.getElementById('tenureValue').value} months</td></tr>
                <tr><td class="label">Processing Fees</td><td class="amount">${document.getElementById('processingFees').value}</td></tr>
            </table>
        </div>
        
        <div class="results">
            <h2>Calculation Results</h2>
            <table>
                <tr><td class="label">Transaction Amount</td><td class="amount">${transactionAmount}</td></tr>
                <tr><td class="label">Monthly EMI</td><td class="amount">${monthlyEmi}</td></tr>
                <tr><td class="label">Total Interest Payable</td><td class="amount">${totalInterest}</td></tr>
                <tr><td class="label">Total of all Payments</td><td class="amount">${totalPayment}</td></tr>
            </table>
        </div>
        
        <div class="amortization">
            <h2>Payment Schedule</h2>
            ${generateAmortizationTableHTML()}
        </div>
    `;
}

function generateAmortizationTableHTML() {
    const monthRows = document.querySelectorAll('.month-row');
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Principal (A)</th>
                    <th>Interest (B)</th>
                    <th>GST on Interest (C)</th>
                    <th>Total Payment (A+B+C)</th>
                    <th>Balance</th>
                    <th>Loan Paid To Date</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    monthRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        tableHTML += '<tr>';
        cells.forEach(cell => {
            tableHTML += `<td>${cell.textContent}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    return tableHTML;
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('amount')) {
        const amount = urlParams.get('amount');
        document.getElementById('transactionAmount').value = amount;
        document.getElementById('transactionAmountSlider').value = amount;
    }
    
    if (urlParams.has('rate')) {
        const rate = urlParams.get('rate');
        document.getElementById('interestRate').value = rate;
        document.getElementById('interestRateSlider').value = rate;
    }
    
    if (urlParams.has('tenure')) {
        const tenure = urlParams.get('tenure');
        document.getElementById('tenureValue').value = tenure;
        document.getElementById('tenureSlider').value = tenure;
    }
    
    if (urlParams.has('fees')) {
        const fees = urlParams.get('fees');
        document.getElementById('processingFees').value = fees;
        document.getElementById('processingFeesSlider').value = fees;
    }
}

function formatCurrency(amount) {
    return Math.round(amount).toLocaleString('en-IN');
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