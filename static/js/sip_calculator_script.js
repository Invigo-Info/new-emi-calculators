// Global variables
let sipBreakupChart;

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
        { input: 'sipAmount', slider: 'sipAmountSlider', min: 500, max: 1000000 },
        { input: 'returnRate', slider: 'returnRateSlider', min: 8, max: 25 },
        { input: 'tenureYears', slider: 'tenureYearsSlider', min: 1, max: 30 },
        { input: 'inflationRate', slider: 'inflationRateSlider', min: 3, max: 12 }
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
    
    // SIP frequency dropdown change
    const frequencySelect = document.getElementById('sipFrequency');
    if (frequencySelect) {
        frequencySelect.addEventListener('change', function() {
            calculateAndUpdate();
        });
    }
}

function calculateAndUpdate() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const frequency = document.getElementById('sipFrequency').value || 'monthly';
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    // Make API call
    fetch('/calculate-sip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sipAmount: sipAmount,
            frequency: frequency,
            returnRate: returnRate,
            tenureYears: tenureYears,
            inflationRate: inflationRate
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateResults(data);
            updateChart(data);
            updateYearlyBreakdownTable(data.yearlyBreakdown);
        } else {
            console.error('Calculation error:', data.error);
        }
    })
    .catch(error => {
        console.error('Network error:', error);
    });
}

function updateResults(data) {
    // Update result cards
    document.getElementById('totalInvestedResult').textContent = formatCurrency(data.totalInvested);
    document.getElementById('totalReturnsResult').textContent = formatCurrency(data.totalReturns);
    document.getElementById('maturityAmountResult').textContent = formatCurrency(data.futureValue);
    document.getElementById('inflationAdjustedResult').textContent = formatCurrency(data.inflationAdjustedValue);
    
    // Update chart summary
    document.getElementById('investedAmountDisplay').textContent = formatCurrency(data.totalInvested);
    document.getElementById('returnsAmountDisplay').textContent = formatCurrency(data.totalReturns);
}

function updateChart(data) {
    const ctx = document.getElementById('sipBreakupChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (sipBreakupChart) {
        sipBreakupChart.destroy();
    }
    
    sipBreakupChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Total Invested', 'Expected Returns'],
            datasets: [{
                data: [data.totalInvested, data.totalReturns],
                backgroundColor: [
                    '#4facfe',  // Blue gradient for invested amount
                    '#43e97b'   // Green gradient for returns
                ],
                borderWidth: 0,
                hoverOffset: 15
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
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#fff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const percentage = ((context.parsed / data.futureValue) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1000,
                easing: 'easeOutCubic'
            }
        }
    });
}

function updateYearlyBreakdownTable(yearlyBreakdown) {
    const tableBody = document.getElementById('yearlyBreakdownBody');
    tableBody.innerHTML = '';
    
    yearlyBreakdown.forEach((yearData, index) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.style.cursor = 'pointer';
        yearRow.style.backgroundColor = '#f8fafc';
        yearRow.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">▶</span>
                <strong>Year ${yearData.year}</strong>
            </td>
            <td>${formatCurrency(yearData.yearly_invested)}</td>
            <td>${formatCurrency(yearData.cumulative_invested)}</td>
            <td>${formatCurrency(yearData.cumulative_value)}</td>
            <td>${formatCurrency(yearData.yearly_returns)}</td>
            <td>${formatCurrency(yearData.inflation_adjusted_value)}</td>
        `;
        
        // Add click event to show/hide monthly data
        yearRow.addEventListener('click', function() {
            toggleMonthlyRows(this, yearData, index);
        });
        
        tableBody.appendChild(yearRow);
    });
}

function toggleMonthlyRows(yearRow, yearData, yearIndex) {
    const expandIcon = yearRow.querySelector('.expand-icon');
    const isExpanded = expandIcon.textContent === '▼';
    
    if (isExpanded) {
        // Collapse - remove monthly rows
        let nextRow = yearRow.nextSibling;
        while (nextRow && nextRow.classList && nextRow.classList.contains('month-row')) {
            const rowToRemove = nextRow;
            nextRow = nextRow.nextSibling;
            rowToRemove.remove();
        }
        expandIcon.textContent = '▶';
        yearRow.style.backgroundColor = '#f8fafc';
    } else {
        // Expand - add monthly rows
        expandIcon.textContent = '▼';
        yearRow.style.backgroundColor = '#e2e8f0';
        
        // Generate monthly data for this year
        const monthlyData = generateMonthlyData(yearData, yearIndex);
        
        // Insert monthly rows after the year row
        let insertAfter = yearRow;
        monthlyData.forEach(monthData => {
            const monthRow = document.createElement('tr');
            monthRow.className = 'month-row';
            monthRow.style.backgroundColor = '#ffffff';
            monthRow.style.borderLeft = '4px solid #3182ce';
            monthRow.innerHTML = `
                <td style="padding-left: 30px;">${monthData.month}</td>
                <td>${formatCurrency(monthData.monthly_invested)}</td>
                <td>${formatCurrency(monthData.cumulative_invested)}</td>
                <td>${formatCurrency(monthData.cumulative_value)}</td>
                <td>${formatCurrency(monthData.monthly_returns)}</td>
                <td>${formatCurrency(monthData.inflation_adjusted_value)}</td>
            `;
            insertAfter.insertAdjacentElement('afterend', monthRow);
            insertAfter = monthRow;
        });
    }
}

function generateMonthlyData(yearData, yearIndex) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const frequency = document.getElementById('sipFrequency').value || 'monthly';
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    const monthlyData = [];
    const monthlyReturnRate = returnRate / (12 * 100);
    const monthlyInflationRate = inflationRate / (12 * 100);
    
    // Calculate running totals for more accurate monthly breakdown
    let runningInvested = yearIndex > 0 ? yearData.cumulative_invested - yearData.yearly_invested : 0;
    let runningValue = yearIndex > 0 ? (yearData.cumulative_invested - yearData.yearly_invested) * (1 + returnRate/100) : 0;
    
    for (let month = 0; month < 12; month++) {
        const monthNumber = (yearIndex * 12) + month + 1;
        
        // Determine monthly investment based on frequency
        let monthlyInvested = 0;
        if (frequency === 'monthly') {
            monthlyInvested = sipAmount;
        } else if (frequency === 'quarterly') {
            // Quarterly investments happen in months 0, 3, 6, 9 (Jan, Apr, Jul, Oct)
            monthlyInvested = (month % 3 === 0) ? sipAmount : 0;
        } else if (frequency === 'yearly') {
            // Yearly investment happens in the first month of the year
            monthlyInvested = (month === 0) ? sipAmount : 0;
        } else if (frequency === 'daily') {
            // For daily SIP, distribute monthly (approximate)
            monthlyInvested = sipAmount * 30;
        } else if (frequency === 'one-time') {
            // One-time investment only in the first month of first year
            monthlyInvested = (yearIndex === 0 && month === 0) ? sipAmount : 0;
        }
        
        // Add to running totals
        runningInvested += monthlyInvested;
        
        // Calculate compound growth on existing value plus new investment
        if (monthlyInvested > 0) {
            runningValue = (runningValue + monthlyInvested) * (1 + monthlyReturnRate);
        } else {
            runningValue = runningValue * (1 + monthlyReturnRate);
        }
        
        const monthlyReturns = runningValue - runningInvested;
        const inflationAdjustedValue = runningValue / Math.pow(1 + monthlyInflationRate, monthNumber);
        
        monthlyData.push({
            month: monthNames[month],
            monthly_invested: monthlyInvested,
            cumulative_invested: runningInvested,
            cumulative_value: runningValue,
            monthly_returns: monthlyReturns,
            inflation_adjusted_value: inflationAdjustedValue
        });
    }
    
    return monthlyData;
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
        
        // Close menu when clicking on a link
        const megaLinks = megaMenu.querySelectorAll('.mega-link');
        megaLinks.forEach(link => {
            link.addEventListener('click', function() {
                megaMenu.classList.remove('open');
            });
        });
        
        // Prevent menu from closing when clicking inside the content
        const megaMenuContent = megaMenu.querySelector('.mega-menu-content');
        if (megaMenuContent) {
            megaMenuContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
}

function setupDownloadButtons() {
    // Download buttons are set up with onclick handlers in HTML
}

function downloadPDF() {
    // Get current calculation results
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const frequency = document.getElementById('sipFrequency').value || 'monthly';
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    // Create printable content
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintableContent();
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>SIP Calculator Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2d3748; text-align: center; }
                .summary { margin: 20px 0; }
                .summary-item { margin: 10px 0; display: flex; justify-content: space-between; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #667eea; color: white; }
                .parameters { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
    }, 500);
    
    showNotification('PDF generation initiated! Use your browser\'s print dialog.', 'success');
}

function downloadExcel() {
    // Get table data
    const tableBody = document.getElementById('yearlyBreakdownBody');
    const rows = tableBody.querySelectorAll('tr.year-row');
    
    // Create CSV content
    let csvContent = "Year,Yearly Investment,Cumulative Investment,Expected Value,Returns Earned,Inflation Adjusted Value\n";
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const yearText = cells[0].textContent.replace('▶', '').replace('▼', '').trim();
        const csvRow = [
            yearText,
            cells[1].textContent.replace('₹', '').replace(/,/g, ''),
            cells[2].textContent.replace('₹', '').replace(/,/g, ''),
            cells[3].textContent.replace('₹', '').replace(/,/g, ''),
            cells[4].textContent.replace('₹', '').replace(/,/g, ''),
            cells[5].textContent.replace('₹', '').replace(/,/g, '')
        ].join(',');
        csvContent += csvRow + "\n";
    });
    
    // Add summary data
    csvContent += "\nSummary\n";
    csvContent += "Parameter,Value\n";
    csvContent += `SIP Amount,${document.getElementById('sipAmount').value}\n`;
    csvContent += `Frequency,${document.getElementById('sipFrequency').value}\n`;
    csvContent += `Return Rate,${document.getElementById('returnRate').value}%\n`;
    csvContent += `Investment Period,${document.getElementById('tenureYears').value} years\n`;
    csvContent += `Inflation Rate,${document.getElementById('inflationRate').value}%\n`;
    csvContent += `Total Invested,${document.getElementById('totalInvestedResult').textContent.replace('₹', '').replace(/,/g, '')}\n`;
    csvContent += `Expected Returns,${document.getElementById('totalReturnsResult').textContent.replace('₹', '').replace(/,/g, '')}\n`;
    csvContent += `Maturity Amount,${document.getElementById('maturityAmountResult').textContent.replace('₹', '').replace(/,/g, '')}\n`;
    csvContent += `Inflation Adjusted Value,${document.getElementById('inflationAdjustedResult').textContent.replace('₹', '').replace(/,/g, '')}\n`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sip_calculation_report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Excel file downloaded successfully!', 'success');
    } else {
        showNotification('Download not supported in this browser', 'error');
    }
}

function generatePrintableContent() {
    // Get current values
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const frequency = document.getElementById('sipFrequency').value || 'monthly';
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    // Get results
    const totalInvested = document.getElementById('totalInvestedResult').textContent;
    const totalReturns = document.getElementById('totalReturnsResult').textContent;
    const maturityAmount = document.getElementById('maturityAmountResult').textContent;
    const inflationAdjusted = document.getElementById('inflationAdjustedResult').textContent;
    
    // Get table data
    const tableBody = document.getElementById('yearlyBreakdownBody');
    const rows = tableBody.querySelectorAll('tr.year-row');
    
    let tableHTML = '<table><thead><tr><th>Year</th><th>Yearly Investment</th><th>Cumulative Investment</th><th>Expected Value</th><th>Returns Earned</th><th>Inflation Adjusted Value</th></tr></thead><tbody>';
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const yearText = cells[0].textContent.replace('▶', '').replace('▼', '').trim();
        tableHTML += `<tr>
            <td>${yearText}</td>
            <td>${cells[1].textContent}</td>
            <td>${cells[2].textContent}</td>
            <td>${cells[3].textContent}</td>
            <td>${cells[4].textContent}</td>
            <td>${cells[5].textContent}</td>
        </tr>`;
    });
    
    tableHTML += '</tbody></table>';
    
    return `
        <h1>SIP Calculator Report</h1>
        
        <div class="parameters">
            <h3>Investment Parameters</h3>
            <div class="summary-item"><span>SIP Amount:</span><span>${formatCurrency(sipAmount)}</span></div>
            <div class="summary-item"><span>Frequency:</span><span>${frequency.charAt(0).toUpperCase() + frequency.slice(1)}</span></div>
            <div class="summary-item"><span>Expected Return Rate:</span><span>${returnRate}% per annum</span></div>
            <div class="summary-item"><span>Investment Period:</span><span>${tenureYears} years</span></div>
            <div class="summary-item"><span>Inflation Rate:</span><span>${inflationRate}% per annum</span></div>
        </div>
        
        <div class="summary">
            <h3>Investment Summary</h3>
            <div class="summary-item"><span><strong>Total Invested:</strong></span><span><strong>${totalInvested}</strong></span></div>
            <div class="summary-item"><span><strong>Expected Returns:</strong></span><span><strong>${totalReturns}</strong></span></div>
            <div class="summary-item"><span><strong>Maturity Amount:</strong></span><span><strong>${maturityAmount}</strong></span></div>
            <div class="summary-item"><span><strong>Inflation Adjusted Value:</strong></span><span><strong>${inflationAdjusted}</strong></span></div>
        </div>
        
        <h3>Year-wise Investment Growth</h3>
        ${tableHTML}
        
        <div style="margin-top: 30px; font-size: 12px; color: #666;">
            <p>Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</p>
            <p>Disclaimer: This is an estimate based on the inputs provided. Actual returns may vary.</p>
        </div>
    `;
}

function shareLink() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const frequency = document.getElementById('sipFrequency').value || 'monthly';
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    // Create shareable URL with parameters
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
        amount: sipAmount,
        frequency: frequency,
        rate: returnRate,
        years: tenureYears,
        inflation: inflationRate
    });
    
    const shareUrl = `${baseUrl}?${params.toString()}`;
    
    // Try to copy to clipboard
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showNotification('Share link copied to clipboard!', 'success');
        }).catch((err) => {
            console.error('Clipboard error:', err);
            fallbackCopyTextToClipboard(shareUrl);
        });
    } else {
        fallbackCopyTextToClipboard(shareUrl);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'Share link copied to clipboard!' : 'Unable to copy to clipboard';
        const type = successful ? 'success' : 'error';
        showNotification(msg, type);
    } catch (err) {
        showNotification('Unable to copy to clipboard', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        max-width: 300px;
        word-wrap: break-word;
        animation: slideInFromRight 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInFromRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutToRight 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
    
    // Add slide-out animation
    const slideOutStyle = document.createElement('style');
    slideOutStyle.textContent = `
        @keyframes slideOutToRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(slideOutStyle);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Set values from URL parameters if they exist
    const amount = urlParams.get('amount');
    const frequency = urlParams.get('frequency');
    const rate = urlParams.get('rate');
    const years = urlParams.get('years');
    const inflation = urlParams.get('inflation');
    
    if (amount) {
        const sipAmountInput = document.getElementById('sipAmount');
        const sipAmountSlider = document.getElementById('sipAmountSlider');
        const value = Math.max(500, Math.min(1000000, parseFloat(amount)));
        sipAmountInput.value = value;
        sipAmountSlider.value = value;
    }
    
    if (frequency) {
        const frequencySelect = document.getElementById('sipFrequency');
        const validFrequencies = ['daily', 'monthly', 'quarterly', 'yearly', 'one-time'];
        if (validFrequencies.includes(frequency)) {
            frequencySelect.value = frequency;
        }
    }
    
    if (rate) {
        const returnRateInput = document.getElementById('returnRate');
        const returnRateSlider = document.getElementById('returnRateSlider');
        const value = Math.max(8, Math.min(25, parseFloat(rate)));
        returnRateInput.value = value;
        returnRateSlider.value = value;
    }
    
    if (years) {
        const tenureYearsInput = document.getElementById('tenureYears');
        const tenureYearsSlider = document.getElementById('tenureYearsSlider');
        const value = Math.max(1, Math.min(30, parseInt(years)));
        tenureYearsInput.value = value;
        tenureYearsSlider.value = value;
    }
    
    if (inflation) {
        const inflationRateInput = document.getElementById('inflationRate');
        const inflationRateSlider = document.getElementById('inflationRateSlider');
        const value = Math.max(3, Math.min(12, parseFloat(inflation)));
        inflationRateInput.value = value;
        inflationRateSlider.value = value;
    }
}

function formatCurrency(amount) {
    // Format numbers in Indian numbering system with commas
    return '₹' + Math.round(amount).toLocaleString('en-IN');
} 