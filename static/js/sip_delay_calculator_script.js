// Global variables
let sipDelayBreakupChart;
let currentDelayUnit = 'months'; // Track current unit for delay period

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupDelayToggle();
    setupDownloadButtons();
    setupMegaMenu();
    loadFromUrlParameters();
    updateEarningsLostLabel(); // Set initial label
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'sipAmount', slider: 'sipAmountSlider', min: 0, max: 1000000 },
        { input: 'expectedReturn', slider: 'expectedReturnSlider', min: 0, max: 25 },
        { input: 'investmentPeriod', slider: 'investmentPeriodSlider', min: 1, max: 30 },
        { input: 'delayPeriod', slider: 'delayPeriodSlider', min: 0, max: 120 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                
                // Update earnings lost label if this is the delay period
                if (input === 'delayPeriod') {
                    updateEarningsLostLabel();
                }
                
                calculateAndUpdate();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                
                // Update earnings lost label if this is the delay period
                if (input === 'delayPeriod') {
                    updateEarningsLostLabel();
                }
                
                calculateAndUpdate();
            });
        }
    });
}

function setupDelayToggle() {
    const toggleButtons = document.querySelectorAll('.period-toggle-btn');
    const delayInput = document.getElementById('delayPeriod');
    const delaySlider = document.getElementById('delayPeriodSlider');
    const delaySuffix = document.getElementById('delayPeriodSuffix');
    const delayMinLabel = document.getElementById('delayMinLabel');
    const delayMaxLabel = document.getElementById('delayMaxLabel');
    const earningsLostLabel = document.getElementById('earningsLostLabel');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const newUnit = this.getAttribute('data-unit');
            const currentValue = parseFloat(delayInput.value) || 0;
            
            // Remove active class from all buttons
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Convert the value between units
            let convertedValue;
            if (currentDelayUnit === 'months' && newUnit === 'years') {
                // Convert months to years
                convertedValue = Math.round((currentValue / 12) * 10) / 10; // Round to 1 decimal
                
                // Update slider limits for years
                delaySlider.min = 0;
                delaySlider.max = 10;
                delaySlider.step = 0.1;
                delayMinLabel.textContent = '0Y';
                delayMaxLabel.textContent = '10Y';
                delaySuffix.textContent = 'Years';
                
            } else if (currentDelayUnit === 'years' && newUnit === 'months') {
                // Convert years to months
                convertedValue = Math.round(currentValue * 12);
                
                // Update slider limits for months
                delaySlider.min = 0;
                delaySlider.max = 120;
                delaySlider.step = 1;
                delayMinLabel.textContent = '0M';
                delayMaxLabel.textContent = '120M';
                delaySuffix.textContent = 'Months';
            } else {
                convertedValue = currentValue;
            }
            
            // Update the input and slider values
            delayInput.value = convertedValue;
            delaySlider.value = convertedValue;
            
            // Update the current unit
            currentDelayUnit = newUnit;
            
            // Update input step for decimal handling
            if (newUnit === 'years') {
                delayInput.step = 0.1;
                delayInput.max = 10;
            } else {
                delayInput.step = 1;
                delayInput.max = 120;
            }
            
            // Update earnings lost label
            updateEarningsLostLabel();
            
            // Recalculate
            calculateAndUpdate();
        });
    });
}

function updateEarningsLostLabel() {
    const delayInput = document.getElementById('delayPeriod');
    const earningsLostLabel = document.getElementById('earningsLostLabel');
    const delayValue = parseFloat(delayInput.value) || 0;
    
    if (delayValue === 0) {
        earningsLostLabel.textContent = 'Earnings Lost';
        return;
    }
    
    if (currentDelayUnit === 'months') {
        const months = Math.round(delayValue);
        const years = Math.round((months / 12) * 10) / 10;
        
        if (months === 0) {
            earningsLostLabel.textContent = 'Earnings Lost';
        } else if (months % 12 === 0 && months >= 12) {
            // Show both formats when it's exact years
            const exactYears = months / 12;
            earningsLostLabel.textContent = `Earnings Lost in ${months} Months/${exactYears} Year${exactYears !== 1 ? 's' : ''}`;
        } else {
            earningsLostLabel.textContent = `Earnings Lost in ${months} Month${months !== 1 ? 's' : ''}`;
        }
    } else {
        // Years mode
        const years = Math.round(delayValue * 10) / 10;
        const months = Math.round(years * 12);
        
        if (years === 0) {
            earningsLostLabel.textContent = 'Earnings Lost';
        } else if (years >= 1 && years % 1 === 0) {
            // Show both formats for whole years
            earningsLostLabel.textContent = `Earnings Lost in ${months} Months/${years} Year${years !== 1 ? 's' : ''}`;
        } else {
            earningsLostLabel.textContent = `Earnings Lost in ${years} Year${years !== 1 ? 's' : ''}`;
        }
    }
}

function calculateAndUpdate() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value) || 10;
    const delayPeriodValue = parseFloat(document.getElementById('delayPeriod').value) || 6;
    
    // Convert delay period to months for API call
    const delayMonths = currentDelayUnit === 'years' 
        ? Math.round(delayPeriodValue * 12) 
        : Math.round(delayPeriodValue);
    
    // Make API call
    fetch('/calculate-sip-delay', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sipAmount: sipAmount,
            expectedReturn: expectedReturn,
            investmentPeriod: investmentPeriod,
            delayMonths: delayMonths
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
    document.getElementById('noDelayInvestmentResult').textContent = formatCurrency(data.noDelayInvestment);
    document.getElementById('delayedInvestmentResult').textContent = formatCurrency(data.delayedInvestment);
    document.getElementById('noDelayFinalAmountResult').textContent = formatCurrency(data.noDelayFinalAmount);
    document.getElementById('delayedFinalAmountResult').textContent = formatCurrency(data.delayedFinalAmount);
    document.getElementById('delayImpactResult').textContent = formatCurrency(data.delayImpact);
    document.getElementById('earningsPotentialResult').textContent = formatCurrency(data.earningsPotential);
    
    // Update chart summary
    document.getElementById('noDelayAmountDisplay').textContent = formatCurrency(data.noDelayFinalAmount);
    document.getElementById('delayedAmountDisplay').textContent = formatCurrency(data.delayedFinalAmount);
    document.getElementById('delayImpactDisplay').textContent = formatCurrency(data.delayImpact);
}

function updateChart(data) {
    const ctx = document.getElementById('sipDelayBreakupChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (sipDelayBreakupChart) {
        sipDelayBreakupChart.destroy();
    }
    
    sipDelayBreakupChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['No Delay Amount', 'Delayed Amount', 'Impact of Delay'],
            datasets: [{
                data: [data.noDelayFinalAmount, data.delayedFinalAmount, data.delayImpact],
                backgroundColor: [
                    '#10b981',  // Green for no delay amount
                    '#f59e0b',  // Orange for delayed amount
                    '#ef4444'   // Red for delay impact
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
                            const totalValue = data.noDelayFinalAmount + data.delayImpact;
                            const percentage = ((context.parsed / totalValue) * 100).toFixed(1);
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
        yearRow.style.backgroundColor = '#f8fafc';
        yearRow.innerHTML = `
            <td><strong>Year ${yearData.year}</strong></td>
            <td style="text-align: right;">${formatCurrency(yearData.no_delay_invested)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.no_delay_value)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.delayed_invested)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.delayed_value)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.yearly_impact)}</td>
        `;
        
        tableBody.appendChild(yearRow);
    });
}

function setupMegaMenu() {
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenu = document.querySelector('.mega-menu');
    const megaMenuContent = document.querySelector('.mega-menu-content');
    
    if (megaMenuBtn && megaMenu && megaMenuContent) {
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
        
        // Prevent menu from closing when clicking inside
        megaMenuContent.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

function setupDownloadButtons() {
    // Download buttons functionality will be implemented here
}

function downloadPDF() {
    // Get current input values
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value) || 10;
    const delayPeriodValue = parseFloat(document.getElementById('delayPeriod').value) || 6;
    const delayMonths = currentDelayUnit === 'years' ? Math.round(delayPeriodValue * 12) : Math.round(delayPeriodValue);
    
    // Generate printable content
    const printableContent = generatePrintableContent();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>SIP Delay Calculator Results</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .summary { margin-bottom: 30px; }
                    .summary-item { margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .number { text-align: right; }
                </style>
            </head>
            <body>
                ${printableContent}
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

function downloadExcel() {
    // Get current values
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value) || 10;
    const delayPeriodValue = parseFloat(document.getElementById('delayPeriod').value) || 6;
    const delayMonths = currentDelayUnit === 'years' ? Math.round(delayPeriodValue * 12) : Math.round(delayPeriodValue);
    
    // Create Excel content
    let excelContent = `SIP Delay Calculator Results\n\n`;
    excelContent += `Input Parameters:\n`;
    excelContent += `Monthly SIP Amount,${formatCurrency(sipAmount)}\n`;
    excelContent += `Expected Return Rate,${expectedReturn}%\n`;
    excelContent += `Investment Period,${investmentPeriod} years\n`;
    excelContent += `Delay Period,${delayMonths} months\n\n`;
    
    // Add results
    const noDelayInvestment = document.getElementById('noDelayInvestmentResult').textContent;
    const delayedInvestment = document.getElementById('delayedInvestmentResult').textContent;
    const noDelayAmount = document.getElementById('noDelayFinalAmountResult').textContent;
    const delayedAmount = document.getElementById('delayedFinalAmountResult').textContent;
    const delayImpact = document.getElementById('delayImpactResult').textContent;
    const earningsLost = document.getElementById('earningsPotentialResult').textContent;
    
    excelContent += `Results:\n`;
    excelContent += `Total Investment Without Delay,${noDelayInvestment}\n`;
    excelContent += `Total Investment With Delay,${delayedInvestment}\n`;
    excelContent += `No Delay Amount,${noDelayAmount}\n`;
    excelContent += `Delayed Amount,${delayedAmount}\n`;
    excelContent += `Delay Impact,${delayImpact}\n`;
    excelContent += `Earnings Lost,${earningsLost}\n\n`;
    
    // Add yearly breakdown
    excelContent += `Yearly Breakdown:\n`;
    excelContent += `Year,No Delay Invested,No Delay Value,Delayed Invested,Delayed Value,Yearly Impact\n`;
    
    const tableRows = document.querySelectorAll('#yearlyBreakdownBody tr');
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            excelContent += `${cells[0].textContent},${cells[1].textContent},${cells[2].textContent},${cells[3].textContent},${cells[4].textContent},${cells[5].textContent}\n`;
        }
    });
    
    // Create and download file
    const blob = new Blob([excelContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sip_delay_calculator_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generatePrintableContent() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value) || 10;
    const delayPeriodValue = parseFloat(document.getElementById('delayPeriod').value) || 6;
    const delayMonths = currentDelayUnit === 'years' ? Math.round(delayPeriodValue * 12) : Math.round(delayPeriodValue);
    
    const noDelayInvestment = document.getElementById('noDelayInvestmentResult').textContent;
    const delayedInvestment = document.getElementById('delayedInvestmentResult').textContent;
    const noDelayAmount = document.getElementById('noDelayFinalAmountResult').textContent;
    const delayedAmount = document.getElementById('delayedFinalAmountResult').textContent;
    const delayImpact = document.getElementById('delayImpactResult').textContent;
    const earningsLost = document.getElementById('earningsPotentialResult').textContent;
    
    let content = `
        <div class="header">
            <h1>SIP Delay Calculator Results</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
            <h2>Input Parameters</h2>
            <div class="summary-item"><strong>Monthly SIP Amount:</strong> ${formatCurrency(sipAmount)}</div>
            <div class="summary-item"><strong>Expected Return Rate:</strong> ${expectedReturn}%</div>
            <div class="summary-item"><strong>Investment Period:</strong> ${investmentPeriod} years</div>
            <div class="summary-item"><strong>Delay Period:</strong> ${delayMonths} months</div>
        </div>
        
        <div class="summary">
            <h2>Results</h2>
            <div class="summary-item"><strong>Total Investment Without Delay:</strong> ${noDelayInvestment}</div>
            <div class="summary-item"><strong>Total Investment With Delay:</strong> ${delayedInvestment}</div>
            <div class="summary-item"><strong>No Delay Amount:</strong> ${noDelayAmount}</div>
            <div class="summary-item"><strong>Delayed Amount:</strong> ${delayedAmount}</div>
            <div class="summary-item"><strong>Delay Impact:</strong> ${delayImpact}</div>
            <div class="summary-item"><strong>Earnings Lost:</strong> ${earningsLost}</div>
        </div>
        
        <div>
            <h2>Yearly Breakdown</h2>
            <table>
                <thead>
                    <tr>
                        <th>Year</th>
                        <th>No Delay Invested</th>
                        <th>No Delay Value</th>
                        <th>Delayed Invested</th>
                        <th>Delayed Value</th>
                        <th>Yearly Impact</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    const tableRows = document.querySelectorAll('#yearlyBreakdownBody tr');
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            content += `<tr>`;
            cells.forEach(cell => {
                content += `<td class="number">${cell.textContent}</td>`;
            });
            content += `</tr>`;
        }
    });
    
    content += `
                </tbody>
            </table>
        </div>
    `;
    
    return content;
}

function shareLink() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value) || 10;
    const delayPeriodValue = parseFloat(document.getElementById('delayPeriod').value) || 6;
    const delayMonths = currentDelayUnit === 'years' ? Math.round(delayPeriodValue * 12) : Math.round(delayPeriodValue);
    
    const currentUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${currentUrl}?sipAmount=${sipAmount}&expectedReturn=${expectedReturn}&investmentPeriod=${investmentPeriod}&delayMonths=${delayMonths}&delayUnit=${currentDelayUnit}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'SIP Delay Calculator Results',
            text: `Check out my SIP delay calculation: ${formatCurrency(sipAmount)} monthly SIP with ${delayMonths} months delay`,
            url: shareUrl
        }).catch(console.error);
    } else {
        // Fallback for browsers that don't support Web Share API
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showNotification('Link copied to clipboard!', 'success');
            }).catch(() => {
                fallbackCopyTextToClipboard(shareUrl);
            });
        } else {
            fallbackCopyTextToClipboard(shareUrl);
        }
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Link copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Failed to copy link', 'error');
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
        padding: 12px 24px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('sipAmount')) {
        document.getElementById('sipAmount').value = urlParams.get('sipAmount');
        document.getElementById('sipAmountSlider').value = urlParams.get('sipAmount');
    }
    
    if (urlParams.get('expectedReturn')) {
        document.getElementById('expectedReturn').value = urlParams.get('expectedReturn');
        document.getElementById('expectedReturnSlider').value = urlParams.get('expectedReturn');
    }
    
    if (urlParams.get('investmentPeriod')) {
        document.getElementById('investmentPeriod').value = urlParams.get('investmentPeriod');
        document.getElementById('investmentPeriodSlider').value = urlParams.get('investmentPeriod');
    }
    
    if (urlParams.get('delayMonths')) {
        const delayMonths = parseInt(urlParams.get('delayMonths'));
        const delayUnit = urlParams.get('delayUnit') || 'months';
        
        // Set the unit first
        currentDelayUnit = delayUnit;
        
        // Update toggle buttons
        const toggleButtons = document.querySelectorAll('.period-toggle-btn');
        toggleButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-unit') === delayUnit) {
                btn.classList.add('active');
            }
        });
        
        // Convert and set the value based on unit
        let displayValue;
        if (delayUnit === 'years') {
            displayValue = Math.round((delayMonths / 12) * 10) / 10;
            // Update UI for years mode
            document.getElementById('delayPeriodSuffix').textContent = 'Years';
            document.getElementById('delayMinLabel').textContent = '0Y';
            document.getElementById('delayMaxLabel').textContent = '10Y';
            document.getElementById('delayPeriod').step = 0.1;
            document.getElementById('delayPeriod').max = 10;
            document.getElementById('delayPeriodSlider').min = 0;
            document.getElementById('delayPeriodSlider').max = 10;
            document.getElementById('delayPeriodSlider').step = 0.1;
        } else {
            displayValue = delayMonths;
            // Update UI for months mode
            document.getElementById('delayPeriodSuffix').textContent = 'Months';
            document.getElementById('delayMinLabel').textContent = '0M';
            document.getElementById('delayMaxLabel').textContent = '120M';
            document.getElementById('delayPeriod').step = 1;
            document.getElementById('delayPeriod').max = 120;
            document.getElementById('delayPeriodSlider').min = 0;
            document.getElementById('delayPeriodSlider').max = 120;
            document.getElementById('delayPeriodSlider').step = 1;
        }
        
        document.getElementById('delayPeriod').value = displayValue;
        document.getElementById('delayPeriodSlider').value = displayValue;
        
        // Update earnings lost label after setting the value
        updateEarningsLostLabel();
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
} 