// Global variables
let reverseSipChart;

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
        { input: 'targetAmount', slider: 'targetAmountSlider', min: 10000, max: 50000000 },
        { input: 'expectedReturn', slider: 'expectedReturnSlider', min: 1, max: 30 },
        { input: 'investmentPeriod', slider: 'investmentPeriodSlider', min: 1, max: 40 }
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
    const sipFrequencySelect = document.getElementById('sipFrequency');
    if (sipFrequencySelect) {
        sipFrequencySelect.addEventListener('change', function() {
            calculateAndUpdate();
        });
    }
}

function calculateAndUpdate() {
    const targetAmount = parseFloat(document.getElementById('targetAmount').value) || 1000000;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value) || 10;
    const sipFrequency = document.getElementById('sipFrequency').value || 'monthly';
    
    // Make API call
    fetch('/calculate-reverse-sip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            targetAmount: targetAmount,
            expectedReturn: expectedReturn,
            investmentPeriod: investmentPeriod,
            sipFrequency: sipFrequency
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
    document.getElementById('requiredSipResult').textContent = formatCurrency(data.sipAmount);
    document.getElementById('targetAmountResult').textContent = formatCurrency(data.targetAmount);
    document.getElementById('totalInvestmentResult').textContent = formatCurrency(data.totalInvestment);
    document.getElementById('totalReturnsResult').textContent = formatCurrency(data.totalReturns);
    document.getElementById('maturityValueResult').textContent = formatCurrency(data.finalAmount);
    
    // Update chart summary
    document.getElementById('totalInvestmentDisplay').textContent = formatCurrency(data.totalInvestment);
    document.getElementById('totalReturnsDisplay').textContent = formatCurrency(data.totalReturns);
}

function updateChart(data) {
    const ctx = document.getElementById('reverseSipChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (reverseSipChart) {
        reverseSipChart.destroy();
    }

    reverseSipChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Total Investment', 'Total Returns'],
            datasets: [{
                data: [data.totalInvestment, data.totalReturns],
                backgroundColor: [
                    '#4facfe',  // Blue for total investment
                    '#43e97b'   // Green for total returns
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
                            const total = data.totalInvestment + data.totalReturns;
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
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
        const row = document.createElement('tr');
        row.className = 'year-row';
        
        row.innerHTML = `
            <td style="text-align: center;"><strong>Year ${yearData.year}</strong></td>
            <td style="text-align: right;">${formatCurrency(yearData.sipAmount)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.yearlyInvestment)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.cumulativeInvestment)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.yearEndValue)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.totalReturns)}</td>
        `;
        
        tableBody.appendChild(row);
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
        
        // Close menu when clicking on a link
        const megaLinks = document.querySelectorAll('.mega-link');
        megaLinks.forEach(link => {
            link.addEventListener('click', function() {
                megaMenu.classList.remove('open');
            });
        });
    }
}

function setupDownloadButtons() {
    // Download button functionality will be implemented here
}

function downloadPDF() {
    // Create a comprehensive PDF content
    const content = generatePrintableContent();
    
    // For now, show an alert - in production, you'd implement actual PDF generation
    alert('PDF download functionality will be implemented. Data ready for export.');
    console.log('PDF Content:', content);
}

function downloadExcel() {
    try {
        // Get current calculation data
        const targetAmount = parseFloat(document.getElementById('targetAmount').value) || 1000000;
        const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
        const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value) || 10;
        const sipFrequency = document.getElementById('sipFrequency').value || 'monthly';
        
        // Get results from the page
        const sipAmount = document.getElementById('requiredSipResult').textContent;
        const totalInvestment = document.getElementById('totalInvestmentResult').textContent;
        const totalReturns = document.getElementById('totalReturnsResult').textContent;
        const maturityValue = document.getElementById('maturityValueResult').textContent;
        
        // Create CSV content
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Add headers and summary
        csvContent += "Reverse SIP Calculator Results\n";
        csvContent += "Generated on: " + new Date().toLocaleDateString() + "\n\n";
        
        csvContent += "Input Parameters\n";
        csvContent += "Target Amount," + targetAmount + "\n";
        csvContent += "Expected Return," + expectedReturn + "%\n";
        csvContent += "Investment Period," + investmentPeriod + " years\n";
        csvContent += "SIP Frequency," + sipFrequency + "\n\n";
        
        csvContent += "Results Summary\n";
        csvContent += "Required SIP Amount," + sipAmount + "\n";
        csvContent += "Total Investment," + totalInvestment + "\n";
        csvContent += "Total Returns," + totalReturns + "\n";
        csvContent += "Maturity Value," + maturityValue + "\n\n";
        
        // Add yearly breakdown if available
        const yearlyRows = document.querySelectorAll('#yearlyBreakdownBody tr');
        if (yearlyRows.length > 0) {
            csvContent += "Year-wise Breakdown\n";
            csvContent += "Year,Required SIP,Annual Investment,Cumulative Investment,Year-end Value,Total Returns\n";
            
            yearlyRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6) {
                    const rowData = Array.from(cells).map(cell => {
                        return '"' + cell.textContent.trim().replace(/"/g, '""') + '"';
                    }).join(',');
                    csvContent += rowData + "\n";
                }
            });
        }
        
        // Create and trigger download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "reverse_sip_calculation.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('Excel download error:', error);
        alert('Error generating Excel file. Please try again.');
    }
}

function generatePrintableContent() {
    const targetAmount = document.getElementById('targetAmount').value;
    const expectedReturn = document.getElementById('expectedReturn').value;
    const investmentPeriod = document.getElementById('investmentPeriod').value;
    const sipFrequency = document.getElementById('sipFrequency').value;
    
    const sipAmount = document.getElementById('requiredSipResult').textContent;
    const totalInvestment = document.getElementById('totalInvestmentResult').textContent;
    const totalReturns = document.getElementById('totalReturnsResult').textContent;
    const maturityValue = document.getElementById('maturityValueResult').textContent;
    
    return {
        title: 'Reverse SIP Calculator Results',
        date: new Date().toLocaleDateString(),
        inputs: {
            targetAmount,
            expectedReturn,
            investmentPeriod,
            sipFrequency
        },
        results: {
            sipAmount,
            totalInvestment,
            totalReturns,
            maturityValue
        },
        yearlyBreakdown: getYearlyBreakdownData()
    };
}

function getYearlyBreakdownData() {
    const rows = document.querySelectorAll('#yearlyBreakdownBody tr');
    return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        return {
            year: cells[0]?.textContent.trim(),
            sipAmount: cells[1]?.textContent.trim(),
            annualInvestment: cells[2]?.textContent.trim(),
            cumulativeInvestment: cells[3]?.textContent.trim(),
            yearEndValue: cells[4]?.textContent.trim(),
            totalReturns: cells[5]?.textContent.trim()
        };
    });
}

function shareLink() {
    const currentUrl = window.location.href;
    const params = new URLSearchParams();
    
    // Get current input values
    params.set('target', document.getElementById('targetAmount').value);
    params.set('return', document.getElementById('expectedReturn').value);
    params.set('period', document.getElementById('investmentPeriod').value);
    params.set('frequency', document.getElementById('sipFrequency').value);
    
    const shareUrl = currentUrl.split('?')[0] + '?' + params.toString();
    
    // Try to use the modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareUrl).then(function() {
            showNotification('Link copied to clipboard!', 'success');
        }, function(err) {
            console.error('Could not copy text: ', err);
            fallbackCopyTextToClipboard(shareUrl);
        });
    } else {
        // Fallback for older browsers
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
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Link copied to clipboard!', 'success');
        } else {
            showNotification('Unable to copy link. Please copy manually.', 'error');
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        showNotification('Unable to copy link. Please copy manually.', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        transition: all 0.3s ease;
        ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function loadFromUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('target')) {
        document.getElementById('targetAmount').value = params.get('target');
        document.getElementById('targetAmountSlider').value = params.get('target');
    }
    if (params.has('return')) {
        document.getElementById('expectedReturn').value = params.get('return');
        document.getElementById('expectedReturnSlider').value = params.get('return');
    }
    if (params.has('period')) {
        document.getElementById('investmentPeriod').value = params.get('period');
        document.getElementById('investmentPeriodSlider').value = params.get('period');
    }
    if (params.has('frequency')) {
        document.getElementById('sipFrequency').value = params.get('frequency');
    }
}

function formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return '₹0';
    
    return '₹' + num.toLocaleString('en-IN', {
        maximumFractionDigits: 0
    });
} 