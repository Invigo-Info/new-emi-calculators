// Global variables
let noCostEmiChart;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupDownloadButtons();
    setupMegaMenu();
    loadFromUrlParameters();
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'mrpPrice', slider: 'mrpPriceSlider', min: 1000, max: 10000000 },
        { input: 'tenureMonths', slider: 'tenureMonthsSlider', min: 3, max: 60 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 0.1, max: 36 }
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
}

function calculateAndUpdate() {
    const mrpPrice = parseFloat(document.getElementById('mrpPrice').value) || 50000;
    const tenureMonths = parseInt(document.getElementById('tenureMonths').value) || 12;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 12.0;
    
    // Make API call
    fetch('/calculate-no-cost-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mrpPrice: mrpPrice,
            tenureMonths: tenureMonths,
            interestRate: interestRate
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateResults(data);
            updateChart(data);
            updateComparisonTable(data);
            updatePaymentScheduleTable(data.paymentSchedule);
        } else {
            console.error('Calculation error:', data.error);
        }
    })
    .catch(error => {
        console.error('Network error:', error);
        // Fallback to client-side calculation
        const data = calculateNoCostEmiClientSide(mrpPrice, tenureMonths, interestRate);
        updateResults(data);
        updateChart(data);
        updateComparisonTable(data);
        updatePaymentScheduleTable(data.paymentSchedule);
    });
}

function calculateNoCostEmiClientSide(mrpPrice, tenureMonths, interestRate) {
    // Regular EMI calculation (compound interest)
    const monthlyRate = interestRate / (12 * 100);
    let regularEmi;
    if (monthlyRate > 0) {
        regularEmi = (mrpPrice * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    } else {
        regularEmi = mrpPrice / tenureMonths;
    }
    
    // No Cost EMI is same as Regular EMI (that's the "trick")
    const noCostEmi = regularEmi;
    
    // Calculate what the inflated price would need to be
    const inflatedPrice = noCostEmi * tenureMonths;
    
    // Calculate totals
    const regularTotal = regularEmi * tenureMonths;
    const noCostTotal = inflatedPrice;
    
    // Hidden markup calculation
    const hiddenMarkup = inflatedPrice - mrpPrice;
    
    // Effective interest rate calculation
    // This represents the hidden interest rate embedded in the price inflation
    let effectiveRate = 0;
    if (hiddenMarkup > 0) {
        // Calculate the annualized rate of the hidden markup
        const years = tenureMonths / 12;
        effectiveRate = ((inflatedPrice / mrpPrice) ** (1 / years) - 1) * 100;
    }
    
    // Since no-cost EMI and regular EMI have same monthly payment, savings is zero
    const betterOption = 'Both are equivalent';
    const savings = 0;
    
    // Generate payment schedule
    const paymentSchedule = [];
    let outstandingBalance = inflatedPrice;
    
    for (let month = 1; month <= tenureMonths; month++) {
        outstandingBalance -= noCostEmi;
        paymentSchedule.push({
            month: month,
            emiAmount: noCostEmi,
            outstandingBalance: Math.max(0, outstandingBalance),
            paymentStatus: 'Pending'
        });
    }
    
    return {
        status: 'success',
        noCostEmi: Math.round(noCostEmi),
        regularEmi: Math.round(regularEmi),
        hiddenCost: Math.round(hiddenMarkup),
        effectiveRate: Math.round(effectiveRate * 100) / 100,
        inflatedPrice: Math.round(inflatedPrice),
        betterOption: betterOption,
        savings: Math.round(savings),
        mrpPrice: mrpPrice,
        noCostPrice: Math.round(inflatedPrice),
        processingFee: 0,
        paymentSchedule: paymentSchedule,
        regularTotal: Math.round(regularTotal),
        noCostTotal: Math.round(noCostTotal)
    };
}

function updateResults(data) {
    // Update main result cards
    document.getElementById('noCostEmiResult').textContent = formatCurrency(data.noCostEmi);
    document.getElementById('regularEmiResult').textContent = formatCurrency(data.regularEmi);
    document.getElementById('hiddenCostResult').textContent = formatCurrency(data.hiddenCost);
    document.getElementById('effectiveRateResult').textContent = data.effectiveRate.toFixed(1) + '%';
    document.getElementById('inflatedPriceResult').textContent = formatCurrency(data.inflatedPrice);
    document.getElementById('savingsResult').textContent = data.betterOption;

    // Update chart summary
    document.getElementById('actualCostDisplay').textContent = formatCurrency(data.mrpPrice);
    document.getElementById('hiddenChargesDisplay').textContent = formatCurrency(data.hiddenCost);
}

function updateChart(data) {
    const ctx = document.getElementById('noCostEmiChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (noCostEmiChart) {
        noCostEmiChart.destroy();
    }

    const chartData = [data.mrpPrice, data.hiddenCost];
    const chartLabels = ['Actual Product Cost', 'Hidden Charges'];
    const chartColors = ['#4facfe', '#e53e3e'];
    
    noCostEmiChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
                borderColor: ['#ffffff', '#ffffff', '#ffffff'],
                borderWidth: 2,
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
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#ffffff',
                    borderWidth: 1
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000
            }
        }
    });
}

function updateComparisonTable(data) {
    const tbody = document.getElementById('comparisonTableBody');
    tbody.innerHTML = '';

    const comparisonData = [
        {
            parameter: 'Monthly EMI',
            noCostEmi: formatCurrency(data.noCostEmi),
            regularEmi: formatCurrency(data.regularEmi),
            difference: formatCurrency(Math.abs(data.noCostEmi - data.regularEmi))
        },
        {
            parameter: 'Product Price',
            noCostEmi: formatCurrency(data.inflatedPrice),
            regularEmi: formatCurrency(data.mrpPrice),
            difference: formatCurrency(data.hiddenCost)
        },

        {
            parameter: 'Total Amount Payable',
            noCostEmi: formatCurrency(data.noCostTotal),
            regularEmi: formatCurrency(data.regularTotal),
            difference: formatCurrency(Math.abs(data.noCostTotal - data.regularTotal))
        },
        {
            parameter: 'Interest Rate',
            noCostEmi: data.effectiveRate.toFixed(1) + '%',
            regularEmi: '12.0%',
            difference: Math.abs(data.effectiveRate - 12.0).toFixed(1) + '%'
        }
    ];

    comparisonData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="parameter-cell">${row.parameter}</td>
            <td class="amount-cell">${row.noCostEmi}</td>
            <td class="amount-cell">${row.regularEmi}</td>
            <td class="difference-cell">${row.difference}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updatePaymentScheduleTable(paymentSchedule) {
    const tbody = document.getElementById('amortizationTableBody');
    tbody.innerHTML = '';

    paymentSchedule.forEach(payment => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="month-cell">${payment.month}</td>
            <td class="amount-cell">${formatCurrency(payment.emiAmount)}</td>
            <td class="amount-cell">${formatCurrency(payment.outstandingBalance)}</td>
            <td class="status-cell">${payment.paymentStatus}</td>
        `;
        tbody.appendChild(tr);
    });
}

function setupMegaMenu() {
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenu = document.querySelector('.mega-menu');
    
    if (megaMenuBtn && megaMenu) {
        megaMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            megaMenu.classList.toggle('open');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });
        
        // Close menu when pressing Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                megaMenu.classList.remove('open');
            }
        });
    }
}

function setupDownloadButtons() {
    const downloadPDFBtn = document.getElementById('downloadPDF');
    const downloadExcelBtn = document.getElementById('downloadExcel');
    const shareLinkBtn = document.getElementById('shareLink');
    
    if (downloadPDFBtn) downloadPDFBtn.addEventListener('click', downloadPDF);
    if (downloadExcelBtn) downloadExcelBtn.addEventListener('click', downloadExcel);
    if (shareLinkBtn) shareLinkBtn.addEventListener('click', shareLink);
}

function downloadPDF() {
    try {
        const content = generatePrintableContent();
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>No Cost EMI Calculator Results</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                    .result-item { padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                    .result-label { font-weight: bold; color: #333; }
                    .result-value { font-size: 18px; color: #007bff; margin-top: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                ${content}
                <div class="footer">
                    <p>Generated on ${new Date().toLocaleDateString()} - No Cost EMI Calculator</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
        
        showNotification('PDF generation initiated. Please use your browser\'s print dialog.', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Error generating PDF. Please try again.', 'error');
    }
}

function downloadExcel() {
    try {
        const mrpPrice = parseFloat(document.getElementById('mrpPrice').value) || 50000;
        const tenureMonths = parseInt(document.getElementById('tenureMonths').value) || 12;
        
        const data = calculateNoCostEmiClientSide(mrpPrice, tenureMonths, 12.0);
        
        // Create CSV content
        let csvContent = "No Cost EMI Calculator Results\n\n";
        csvContent += "Summary\n";
        csvContent += "Parameter,Value\n";
        csvContent += `Product MRP,${formatCurrency(data.mrpPrice)}\n`;
        csvContent += `Equivalent Inflated Price,${formatCurrency(data.inflatedPrice)}\n`;
        csvContent += `Tenure,${tenureMonths} months\n`;
        csvContent += `No Cost EMI,${formatCurrency(data.noCostEmi)}\n`;
        csvContent += `Regular EMI,${formatCurrency(data.regularEmi)}\n`;
        csvContent += `Hidden Cost,${formatCurrency(data.hiddenCost)}\n`;
        csvContent += `Effective Rate,${data.effectiveRate}%\n`;
        csvContent += `Better Option,${data.betterOption}\n\n`;
        
        csvContent += "Payment Schedule\n";
        csvContent += "Month,EMI Amount,Outstanding Balance,Status\n";
        data.paymentSchedule.forEach(payment => {
            csvContent += `${payment.month},${payment.emiAmount},${payment.outstandingBalance},${payment.paymentStatus}\n`;
        });
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'no_cost_emi_calculation.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Excel file downloaded successfully!', 'success');
    } catch (error) {
        console.error('Excel generation error:', error);
        showNotification('Error generating Excel file. Please try again.', 'error');
    }
}

function generatePrintableContent() {
    const mrpPrice = parseFloat(document.getElementById('mrpPrice').value) || 50000;
    const tenureMonths = parseInt(document.getElementById('tenureMonths').value) || 12;
    
    const data = calculateNoCostEmiClientSide(mrpPrice, tenureMonths, 12.0);
    
    return `
        <div class="header">
            <h1>No Cost EMI Calculator Results</h1>
        </div>
        
        <div class="results-grid">
            <div class="result-item">
                <div class="result-label">No Cost EMI</div>
                <div class="result-value">${formatCurrency(data.noCostEmi)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Regular EMI</div>
                <div class="result-value">${formatCurrency(data.regularEmi)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Hidden Cost</div>
                <div class="result-value">${formatCurrency(data.hiddenCost)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Effective Rate</div>
                <div class="result-value">${data.effectiveRate}%</div>
            </div>
            <div class="result-item">
                <div class="result-label">Inflated Price</div>
                <div class="result-value">${formatCurrency(data.inflatedPrice)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Better Option</div>
                <div class="result-value">${data.betterOption}</div>
            </div>
        </div>
        
        <h3>Payment Schedule</h3>
        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th>EMI Amount</th>
                    <th>Outstanding Balance</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${data.paymentSchedule.map(payment => `
                    <tr>
                        <td>${payment.month}</td>
                        <td>${formatCurrency(payment.emiAmount)}</td>
                        <td>${formatCurrency(payment.outstandingBalance)}</td>
                        <td>${payment.paymentStatus}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function shareLink() {
    try {
        const mrpPrice = document.getElementById('mrpPrice').value;
        const tenureMonths = document.getElementById('tenureMonths').value;
        const interestRate = document.getElementById('interestRate').value;
        
        const params = new URLSearchParams({
            mrp: mrpPrice,
            tenure: tenureMonths,
            rate: interestRate
        });
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        
        // Try to use the Web Share API first
        if (navigator.share) {
            navigator.share({
                title: 'No Cost EMI Calculator',
                text: 'Check out this No Cost EMI calculation',
                url: shareUrl
            }).then(() => {
                showNotification('Link shared successfully!', 'success');
            }).catch(err => {
                console.log('Error sharing:', err);
                fallbackCopyTextToClipboard(shareUrl);
            });
        } else {
            fallbackCopyTextToClipboard(shareUrl);
        }
    } catch (error) {
        console.error('Share error:', error);
        showNotification('Error sharing link. Please try again.', 'error');
    }
}

function fallbackCopyTextToClipboard(text) {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Link copied to clipboard!', 'success');
        } else {
            showNotification('Unable to copy link. Please copy manually: ' + text, 'error');
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        showNotification('Unable to copy link. Please copy manually: ' + text, 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('mrp')) {
        document.getElementById('mrpPrice').value = urlParams.get('mrp');
        document.getElementById('mrpPriceSlider').value = urlParams.get('mrp');
    }

    if (urlParams.get('tenure')) {
        document.getElementById('tenureMonths').value = urlParams.get('tenure');
        document.getElementById('tenureMonthsSlider').value = urlParams.get('tenure');
    }

    if (urlParams.get('rate')) {
        document.getElementById('interestRate').value = urlParams.get('rate');
        document.getElementById('interestRateSlider').value = urlParams.get('rate');
    }
}

function formatCurrency(amount) {
    if (amount >= 10000000) {
        return '₹' + (amount / 10000000).toFixed(2) + 'Cr';
    } else if (amount >= 100000) {
        return '₹' + (amount / 100000).toFixed(2) + 'L';
    } else if (amount >= 1000) {
        return '₹' + (amount / 1000).toFixed(0) + 'K';
    } else {
        return '₹' + Math.round(amount).toLocaleString('en-IN');
    }
} 