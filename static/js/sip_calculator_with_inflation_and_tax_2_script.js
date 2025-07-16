// Global variables
let investmentVsWealthChart;

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
        { input: 'presentGoalValue', slider: 'presentGoalValueSlider', min: 1000, max: 100000000 },
        { input: 'yearsToGoal', slider: 'yearsToGoalSlider', min: 1, max: 50 },
        { input: 'inflationRate', slider: 'inflationRateSlider', min: 0, max: 25 },
        { input: 'expectedReturn', slider: 'expectedReturnSlider', min: 1, max: 30 },
        { input: 'taxRate', slider: 'taxRateSlider', min: 0, max: 50 }
    ];
    
    inputs.forEach(({ input, slider, min, max }) => {
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

    // Compounding frequency dropdown
    const compoundingFrequency = document.getElementById('compoundingFrequency');
    if (compoundingFrequency) {
        compoundingFrequency.addEventListener('change', function() {
            calculateAndUpdate();
        });
    }
}

function calculateAndUpdate() {
    const presentGoalValue = parseFloat(document.getElementById('presentGoalValue').value) || 500000;
    const yearsToGoal = parseInt(document.getElementById('yearsToGoal').value) || 15;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 10;
    const compoundingFrequency = document.getElementById('compoundingFrequency').value || 'monthly';
    
    // Make API call
    fetch('/calculate-goal-sip-with-inflation-and-tax', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            present_goal_value: presentGoalValue,
            years_to_goal: yearsToGoal,
            inflation_rate: inflationRate,
            expected_return: expectedReturn,
            tax_rate: taxRate,
            compounding_frequency: compoundingFrequency
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateResults(data);
            updateChart(data);
            updateYearlyBreakdownTable(data.yearly_breakdown);
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
    document.getElementById('inflationAdjustedGoalResult').textContent = formatCurrency(data.inflation_adjusted_goal);
    document.getElementById('netPostTaxReturnResult').textContent = data.net_post_tax_return + '%';
    document.getElementById('monthlySipRequiredResult').textContent = formatCurrency(data.monthly_sip_required);
    document.getElementById('totalInvestedResult').textContent = formatCurrency(data.total_invested);
    document.getElementById('maturityValueResult').textContent = formatCurrency(data.maturity_value);
    document.getElementById('totalGainResult').textContent = formatCurrency(data.gain);
    
    // Update chart summary
    document.getElementById('investedAmountDisplay').textContent = formatCurrency(data.total_invested);
    document.getElementById('wealthGeneratedDisplay').textContent = formatCurrency(data.gain);
}

function updateChart(data) {
    const ctx = document.getElementById('investmentVsWealthChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (investmentVsWealthChart) {
        investmentVsWealthChart.destroy();
    }
    
    // Prepare data for line chart showing investment vs wealth over time
    const years = data.yearly_breakdown.map(item => `Year ${item.year}`);
    const cumulativeInvestment = data.yearly_breakdown.map(item => item.cumulative_investment);
    const portfolioValue = data.yearly_breakdown.map(item => item.portfolio_value);
    
    investmentVsWealthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Total Invested',
                data: cumulativeInvestment,
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Portfolio Value',
                data: portfolioValue,
                borderColor: '#43e97b',
                backgroundColor: 'rgba(67, 233, 123, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
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
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyShort(value);
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutCubic'
            }
        }
    });
}

function updateYearlyBreakdownTable(yearlyBreakdown) {
    const tbody = document.getElementById('yearlyBreakdownBody');
    tbody.innerHTML = '';
    
    yearlyBreakdown.forEach(yearData => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${yearData.year}</td>
            <td>${formatCurrency(yearData.yearly_investment)}</td>
            <td>${formatCurrency(yearData.cumulative_investment)}</td>
            <td>${formatCurrency(yearData.portfolio_value)}</td>
            <td>${formatCurrency(yearData.gains)}</td>
        `;
        tbody.appendChild(row);
    });
}

function setupMegaMenu() {
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenuContent = document.querySelector('.mega-menu-content');
    
    if (megaMenuBtn && megaMenuContent) {
        megaMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            megaMenuContent.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenuBtn.contains(e.target) && !megaMenuContent.contains(e.target)) {
                megaMenuContent.classList.remove('active');
            }
        });
    }
}

function setupDownloadButtons() {
    // Download functionality will be implemented here
}

function downloadPDF() {
    // Get current calculation data
    const presentGoalValue = parseFloat(document.getElementById('presentGoalValue').value) || 500000;
    const yearsToGoal = parseInt(document.getElementById('yearsToGoal').value) || 15;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 10;
    const compoundingFrequency = document.getElementById('compoundingFrequency').value || 'monthly';
    
    // Generate PDF content
    const printContent = generatePrintableContent();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Goal-Based SIP Calculator Results</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .results-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
                .result-item { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
                .result-label { font-weight: bold; color: #666; }
                .result-value { font-size: 18px; font-weight: bold; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

function downloadExcel() {
    // Excel download functionality
    const yearlyBreakdown = document.querySelectorAll('#yearlyBreakdownTable tbody tr');
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Year,Yearly Investment,Cumulative Investment,Portfolio Value,Gains\n";
    
    yearlyBreakdown.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = Array.from(cells).map(cell => cell.textContent.replace(/[₹,]/g, '')).join(',');
        csvContent += rowData + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "goal_sip_calculator_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generatePrintableContent() {
    const inflationAdjustedGoal = document.getElementById('inflationAdjustedGoalResult').textContent;
    const netPostTaxReturn = document.getElementById('netPostTaxReturnResult').textContent;
    const monthlySipRequired = document.getElementById('monthlySipRequiredResult').textContent;
    const totalInvested = document.getElementById('totalInvestedResult').textContent;
    const maturityValue = document.getElementById('maturityValueResult').textContent;
    const totalGain = document.getElementById('totalGainResult').textContent;
    
    return `
        <div class="header">
            <h1>Goal-Based SIP Calculator Results</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="results-grid">
            <div class="result-item">
                <div class="result-label">Inflation-Adjusted Goal Value</div>
                <div class="result-value">${inflationAdjustedGoal}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Net Post-Tax Return</div>
                <div class="result-value">${netPostTaxReturn}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Monthly SIP Required</div>
                <div class="result-value">${monthlySipRequired}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Total Invested</div>
                <div class="result-value">${totalInvested}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Maturity Value</div>
                <div class="result-value">${maturityValue}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Total Gain</div>
                <div class="result-value">${totalGain}</div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Year</th>
                    <th>Yearly Investment</th>
                    <th>Cumulative Investment</th>
                    <th>Portfolio Value</th>
                    <th>Gains</th>
                </tr>
            </thead>
            <tbody>
                ${document.getElementById('yearlyBreakdownBody').innerHTML}
            </tbody>
        </table>
    `;
}

function shareLink() {
    const presentGoalValue = parseFloat(document.getElementById('presentGoalValue').value) || 500000;
    const yearsToGoal = parseInt(document.getElementById('yearsToGoal').value) || 15;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 10;
    const compoundingFrequency = document.getElementById('compoundingFrequency').value || 'monthly';
    
    const shareUrl = `${window.location.origin}/sip-calculator-with-inflation-and-tax-2/?goal=${presentGoalValue}&years=${yearsToGoal}&inflation=${inflationRate}&return=${expectedReturn}&tax=${taxRate}&frequency=${compoundingFrequency}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Goal-Based SIP Calculator Results',
            text: 'Check out my SIP calculation results',
            url: shareUrl
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(shareUrl).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            fallbackCopyTextToClipboard(shareUrl);
        });
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
        document.execCommand('copy');
        showNotification('Link copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Unable to copy link', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        ${type === 'success' ? 'background-color: #4CAF50;' : 'background-color: #f44336;'}
    `;
    
    // Add animation keyframes
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('goal')) {
        const goalValue = parseFloat(urlParams.get('goal'));
        if (goalValue >= 1000 && goalValue <= 100000000) {
            document.getElementById('presentGoalValue').value = goalValue;
            document.getElementById('presentGoalValueSlider').value = goalValue;
        }
    }
    
    if (urlParams.has('years')) {
        const years = parseInt(urlParams.get('years'));
        if (years >= 1 && years <= 50) {
            document.getElementById('yearsToGoal').value = years;
            document.getElementById('yearsToGoalSlider').value = years;
        }
    }
    
    if (urlParams.has('inflation')) {
        const inflation = parseFloat(urlParams.get('inflation'));
        if (inflation >= 0 && inflation <= 25) {
            document.getElementById('inflationRate').value = inflation;
            document.getElementById('inflationRateSlider').value = inflation;
        }
    }
    
    if (urlParams.has('return')) {
        const returnRate = parseFloat(urlParams.get('return'));
        if (returnRate >= 1 && returnRate <= 30) {
            document.getElementById('expectedReturn').value = returnRate;
            document.getElementById('expectedReturnSlider').value = returnRate;
        }
    }
    
    if (urlParams.has('tax')) {
        const tax = parseFloat(urlParams.get('tax'));
        if (tax >= 0 && tax <= 50) {
            document.getElementById('taxRate').value = tax;
            document.getElementById('taxRateSlider').value = tax;
        }
    }
    
    if (urlParams.has('frequency')) {
        const frequency = urlParams.get('frequency');
        if (['monthly', 'quarterly', 'half-yearly', 'yearly'].includes(frequency)) {
            document.getElementById('compoundingFrequency').value = frequency;
        }
    }
}

function formatCurrency(amount) {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} L`;
    } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(0)} K`;
    } else {
        return `₹${amount.toFixed(0)}`;
    }
}

function formatCurrencyShort(amount) {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(0)}K`;
    } else {
        return `₹${amount.toFixed(0)}`;
    }
} 