// Global variables
let lumpSumBreakupChart;

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
        { input: 'lumpSumAmount', slider: 'lumpSumAmountSlider', min: 1000, max: 10000000 },
        { input: 'returnRate', slider: 'returnRateSlider', min: 0, max: 25 },
        { input: 'tenureYears', slider: 'tenureYearsSlider', min: 1, max: 30 }
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
    const lumpSumAmount = parseFloat(document.getElementById('lumpSumAmount').value) || 100000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    
    // Make API call
    fetch('/calculate-lump-sum-sip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            lumpSumAmount: lumpSumAmount,
            returnRate: returnRate,
            tenureYears: tenureYears
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
    
    // Update chart summary
    document.getElementById('investedAmountDisplay').textContent = formatCurrency(data.totalInvested);
    document.getElementById('returnsAmountDisplay').textContent = formatCurrency(data.totalReturns);
}

function updateChart(data) {
    const ctx = document.getElementById('lumpSumBreakupChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (lumpSumBreakupChart) {
        lumpSumBreakupChart.destroy();
    }
    
    lumpSumBreakupChart = new Chart(ctx, {
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
        `;
        
        tableBody.appendChild(yearRow);
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
        
        // Close mega menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });
        
        // Close mega menu when clicking on a link
        const megaLinks = document.querySelectorAll('.mega-link');
        megaLinks.forEach(link => {
            link.addEventListener('click', function() {
                megaMenu.classList.remove('open');
            });
        });
    }
}

function setupDownloadButtons() {
    // Download buttons setup will be implemented here
}

function downloadPDF() {
    const lumpSumAmount = parseFloat(document.getElementById('lumpSumAmount').value) || 100000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    
    const content = generatePrintableContent();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Lump Sum SIP Calculator Results</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .results-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
                .result-card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                .result-label { font-size: 14px; color: #666; margin-bottom: 5px; }
                .result-value { font-size: 18px; font-weight: bold; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; border: 1px solid #ddd; text-align: center; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .calculation-details { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 8px; }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function downloadExcel() {
    const lumpSumAmount = parseFloat(document.getElementById('lumpSumAmount').value) || 100000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    
    // Get yearly breakdown data
    const tableRows = document.querySelectorAll('#yearlyBreakdownBody tr');
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header
    csvContent += "Lump Sum SIP Calculator Results\n\n";
    csvContent += `Investment Amount:,${formatCurrency(lumpSumAmount)}\n`;
    csvContent += `Expected Return Rate:,${returnRate}%\n`;
    csvContent += `Investment Period:,${tenureYears} years\n\n`;
    
    // Add results summary
    csvContent += "Results Summary\n";
    csvContent += "Total Invested," + document.getElementById('totalInvestedResult').textContent + "\n";
    csvContent += "Expected Returns," + document.getElementById('totalReturnsResult').textContent + "\n";
    csvContent += "Maturity Amount," + document.getElementById('maturityAmountResult').textContent + "\n\n";
    
    // Add yearly breakdown header
    csvContent += "Year-wise Breakdown\n";
    csvContent += "Year,Yearly Investment,Cumulative Investment,Expected Value,Returns Earned\n";
    
    // Add yearly breakdown data
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            const rowData = Array.from(cells).map(cell => {
                return cell.textContent.trim().replace(/,/g, '');
            });
            csvContent += rowData.join(',') + "\n";
        }
    });
    
    // Download the file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lump_sum_sip_calculation.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Excel file downloaded successfully!', 'success');
}

function generatePrintableContent() {
    const lumpSumAmount = parseFloat(document.getElementById('lumpSumAmount').value) || 100000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    
    return `
        <div class="header">
            <h1>Lump Sum SIP Calculator Results</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="calculation-details">
            <h3>Investment Details</h3>
            <p><strong>Investment Amount:</strong> ${formatCurrency(lumpSumAmount)}</p>
            <p><strong>Expected Return Rate:</strong> ${returnRate}% per annum</p>
            <p><strong>Investment Period:</strong> ${tenureYears} years</p>
        </div>
        
        <div class="results-grid">
            <div class="result-card">
                <div class="result-label">Total Invested</div>
                <div class="result-value">${document.getElementById('totalInvestedResult').textContent}</div>
            </div>
            <div class="result-card">
                <div class="result-label">Expected Returns</div>
                <div class="result-value">${document.getElementById('totalReturnsResult').textContent}</div>
            </div>
            <div class="result-card">
                <div class="result-label">Maturity Amount</div>
                <div class="result-value">${document.getElementById('maturityAmountResult').textContent}</div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Year</th>
                    <th>Yearly Investment</th>
                    <th>Cumulative Investment</th>
                    <th>Expected Value</th>
                    <th>Returns Earned</th>
                </tr>
            </thead>
            <tbody>
                ${Array.from(document.querySelectorAll('#yearlyBreakdownBody tr')).map(row => {
                    const cells = Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.trim());
                    return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
}

function shareLink() {
    const lumpSumAmount = parseFloat(document.getElementById('lumpSumAmount').value) || 100000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    
    const params = new URLSearchParams({
        amount: lumpSumAmount,
        rate: returnRate,
        tenure: tenureYears
    });
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    // Try to use the modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(shareUrl);
        });
    } else {
        fallbackCopyTextToClipboard(shareUrl);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Link copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Unable to copy link. Please copy manually: ' + text, 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.3s ease;
    `;
    
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
    }
    
    notification.textContent = message;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
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
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
        if (style.parentNode) {
            style.remove();
        }
    }, 3000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('amount')) {
        const lumpSumAmountInput = document.getElementById('lumpSumAmount');
        const lumpSumAmountSlider = document.getElementById('lumpSumAmountSlider');
        const amount = parseFloat(urlParams.get('amount'));
        if (lumpSumAmountInput && lumpSumAmountSlider && amount) {
            lumpSumAmountInput.value = amount;
            lumpSumAmountSlider.value = amount;
        }
    }
    
    if (urlParams.get('rate')) {
        const returnRateInput = document.getElementById('returnRate');
        const returnRateSlider = document.getElementById('returnRateSlider');
        const rate = parseFloat(urlParams.get('rate'));
        if (returnRateInput && returnRateSlider && rate) {
            returnRateInput.value = rate;
            returnRateSlider.value = rate;
        }
    }
    
    if (urlParams.get('tenure')) {
        const tenureInput = document.getElementById('tenureYears');
        const tenureSlider = document.getElementById('tenureYearsSlider');
        const tenure = parseInt(urlParams.get('tenure'));
        if (tenureInput && tenureSlider && tenure) {
            tenureInput.value = tenure;
            tenureSlider.value = tenure;
        }
    }
    

}

function formatCurrency(amount) {
    // Convert to Indian currency format with commas
    return '₹' + amount.toLocaleString('en-IN', { 
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    });
} 