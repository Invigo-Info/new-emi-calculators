// RD vs SIP Calculator JavaScript

// Global variables
let isCalculatingRdSip = false;
let currentRdSipData = null;
let comparisonChart = null;

// DOM elements
const rdAmountElement = document.getElementById('rdAmount');
const rdAmountSliderElement = document.getElementById('rdAmountSlider');
const rdDurationElement = document.getElementById('rdDuration');
const rdDurationSliderElement = document.getElementById('rdDurationSlider');
const rdRateElement = document.getElementById('rdRate');
const rdRateSliderElement = document.getElementById('rdRateSlider');
const rdCompoundingElement = document.getElementById('rdCompounding');

const sipAmountElement = document.getElementById('sipAmount');
const sipAmountSliderElement = document.getElementById('sipAmountSlider');
const sipDurationElement = document.getElementById('sipDuration');
const sipDurationSliderElement = document.getElementById('sipDurationSlider');
const sipReturnElement = document.getElementById('sipReturn');
const sipReturnSliderElement = document.getElementById('sipReturnSlider');

// Result elements
const rdInvestedResultElement = document.getElementById('rdInvestedResult');
const rdMaturityResultElement = document.getElementById('rdMaturityResult');
const rdInterestResultElement = document.getElementById('rdInterestResult');
const sipInvestedResultElement = document.getElementById('sipInvestedResult');
const sipMaturityResultElement = document.getElementById('sipMaturityResult');
const sipGainsResultElement = document.getElementById('sipGainsResult');
const differenceResultElement = document.getElementById('differenceResult');
const percentageGainResultElement = document.getElementById('percentageGainResult');
const betterOptionBadgeElement = document.getElementById('betterOptionBadge');

// Initialize calculator
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupMegaMenu();
    calculateRdVsSip();
});

function setupEventListeners() {
    // RD input event listeners
    rdAmountElement.addEventListener('input', syncSliderAndInput);
    rdAmountSliderElement.addEventListener('input', syncSliderAndInput);
    rdDurationElement.addEventListener('input', syncSliderAndInput);
    rdDurationSliderElement.addEventListener('input', syncSliderAndInput);
    rdRateElement.addEventListener('input', syncSliderAndInput);
    rdRateSliderElement.addEventListener('input', syncSliderAndInput);
    rdCompoundingElement.addEventListener('change', calculateRdVsSip);

    // SIP input event listeners
    sipAmountElement.addEventListener('input', syncSliderAndInput);
    sipAmountSliderElement.addEventListener('input', syncSliderAndInput);
    sipDurationElement.addEventListener('input', syncSliderAndInput);
    sipDurationSliderElement.addEventListener('input', syncSliderAndInput);
    sipReturnElement.addEventListener('input', syncSliderAndInput);
    sipReturnSliderElement.addEventListener('input', syncSliderAndInput);
}

function syncSliderAndInput(event) {
    const input = event.target;
    const isSlider = input.type === 'range';
    const partnerId = isSlider ? input.id.replace('Slider', '') : input.id + 'Slider';
    const partner = document.getElementById(partnerId);
    
    if (partner) {
        partner.value = input.value;
    }
    
    // Debounce calculation
    clearTimeout(window.rdSipCalculationTimeout);
    window.rdSipCalculationTimeout = setTimeout(calculateRdVsSip, 300);
}

function setupMegaMenu() {
    // Handle all mega menu containers
    const megaMenuContainers = document.querySelectorAll('.mega-menu-container');
    
    megaMenuContainers.forEach(container => {
        const trigger = container.querySelector('.mega-menu-trigger');
        
        if (trigger) {
            // Toggle mega menu on click
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Close all other mega menus
                megaMenuContainers.forEach(otherContainer => {
                    if (otherContainer !== container) {
                        otherContainer.classList.remove('open');
                    }
                });
                
                // Toggle current mega menu
                container.classList.toggle('open');
            });
        }
    });
    
    // Close mega menus when clicking outside
    document.addEventListener('click', function(e) {
        const isInsideMegaMenu = e.target.closest('.mega-menu-container');
        if (!isInsideMegaMenu) {
            hideAllMegaMenus();
        }
    });
    
    // Close mega menus when clicking on mega menu links
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('mega-menu-link')) {
            hideAllMegaMenus();
        }
    });
    
    // Handle close button clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('mega-menu-close')) {
            e.stopPropagation();
            hideAllMegaMenus();
        }
    });
    
    // Handle overlay clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('mega-menu-overlay')) {
            hideAllMegaMenus();
        }
    });
    
    // Hide mega menus on scroll
    window.addEventListener('scroll', function() {
        hideAllMegaMenus();
    });
    
    // Hide mega menus on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAllMegaMenus();
        }
    });
    
    // Hide all mega menus function
    function hideAllMegaMenus() {
        megaMenuContainers.forEach(container => {
            container.classList.remove('open');
        });
    }
}

async function calculateRdVsSip() {
    if (isCalculatingRdSip) return;
    
    isCalculatingRdSip = true;
    
    try {
        const rdData = {
            rdAmount: parseFloat(rdAmountElement.value) || 5000,
            rdDuration: parseInt(rdDurationElement.value) || 5,
            rdRate: parseFloat(rdRateElement.value) || 6.5,
            rdCompounding: rdCompoundingElement.value || 'quarterly'
        };
        
        const sipData = {
            sipAmount: parseFloat(sipAmountElement.value) || 5000,
            sipDuration: parseInt(sipDurationElement.value) || 5,
            sipReturn: parseFloat(sipReturnElement.value) || 12
        };
        
        const requestData = { ...rdData, ...sipData };
        
        const response = await fetch('/calculate-rd-vs-sip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            console.error('Calculation error:', data.error);
            showNotification('Error: ' + data.error, 'error');
            return;
        }

        updateRdSipResults(data);
        updateComparisonChart(data);

    } catch (error) {
        console.error('Error calculating RD vs SIP:', error);
        showNotification('Calculation failed. Please try again.', 'error');
    } finally {
        isCalculatingRdSip = false;
    }
}

function updateRdSipResults(data) {
    // Store current data for downloads
    currentRdSipData = data;
    
    // Update RD results
    rdInvestedResultElement.textContent = formatCurrency(data.rd.total_invested);
    rdMaturityResultElement.textContent = formatCurrency(data.rd.maturity_value);
    rdInterestResultElement.textContent = formatCurrency(data.rd.interest_earned);
    
    // Update SIP results
    sipInvestedResultElement.textContent = formatCurrency(data.sip.total_invested);
    sipMaturityResultElement.textContent = formatCurrency(data.sip.maturity_value);
    sipGainsResultElement.textContent = formatCurrency(data.sip.gains_earned);
    
    // Update comparison results
    const difference = data.comparison.difference_amount;
    const percentageGain = data.comparison.percentage_gain;
    
    differenceResultElement.textContent = formatCurrency(Math.abs(difference));
    percentageGainResultElement.textContent = (difference >= 0 ? '+' : '-') + Math.abs(percentageGain).toFixed(2) + '%';
    
    // Update better option badge
    const betterOption = data.comparison.better_option;
    betterOptionBadgeElement.textContent = `${betterOption} is Better`;
    betterOptionBadgeElement.className = 'option-badge';
    
    if (betterOption === 'SIP') {
        betterOptionBadgeElement.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else {
        betterOptionBadgeElement.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    }
    
    showNotification('Calculation completed successfully!');
}

function updateComparisonChart(data) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    const chartData = {
        labels: ['Total Invested', 'Maturity Value', 'Returns/Interest'],
        datasets: [
            {
                label: 'Recurring Deposit (RD)',
                data: [
                    data.rd.total_invested,
                    data.rd.maturity_value,
                    data.rd.interest_earned
                ],
                backgroundColor: 'rgba(245, 158, 11, 0.8)',
                borderColor: 'rgba(245, 158, 11, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            },
            {
                label: 'Systematic Investment Plan (SIP)',
                data: [
                    data.sip.total_invested,
                    data.sip.maturity_value,
                    data.sip.gains_earned
                ],
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }
        ]
    };
    
    const config = {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            family: 'Inter',
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    cornerRadius: 8,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: 'Inter',
                            weight: '500'
                        },
                        color: '#6b7280'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: 'Inter',
                            weight: '500'
                        },
                        color: '#6b7280',
                        callback: function(value) {
                            return formatCurrencyShort(value);
                        }
                    }
                }
            },
            elements: {
                bar: {
                    borderRadius: 6
                }
            }
        }
    };
    
    // Set chart container height
    document.getElementById('comparisonChart').style.height = '300px';
    
    comparisonChart = new Chart(ctx, config);
}

function formatCurrency(amount) {
    if (amount >= 10000000) { // 1 crore
        return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
    } else if (amount >= 100000) { // 1 lakh
        return '₹' + (amount / 100000).toFixed(2) + ' L';
    } else if (amount >= 1000) { // 1 thousand
        return '₹' + (amount / 1000).toFixed(2) + ' K';
    } else {
        return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }
}

function formatCurrencyShort(amount) {
    if (amount >= 10000000) {
        return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
    } else if (amount >= 100000) {
        return '₹' + (amount / 100000).toFixed(1) + 'L';
    } else if (amount >= 1000) {
        return '₹' + (amount / 1000).toFixed(1) + 'K';
    } else {
        return '₹' + amount.toFixed(0);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.classList.remove('hidden');
        
        // Change color based on type
        if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
        } else {
            notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
}

function downloadPDF() {
    if (!currentRdSipData) {
        showNotification('Please calculate first before downloading', 'error');
        return;
    }
    
    const printableContent = generatePrintableContent();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>RD vs SIP Calculator - Comparison Results</title>
            <style>
                body { font-family: 'Inter', Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; }
                .results-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
                .result-item { padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
                .result-label { font-size: 14px; color: #6b7280; margin-bottom: 5px; }
                .result-value { font-size: 18px; font-weight: bold; color: #1f2937; }
                .comparison-section { margin-top: 20px; }
                .rd-section { border-left: 4px solid #f59e0b; }
                .sip-section { border-left: 4px solid #10b981; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            ${printableContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
    
    showNotification('PDF download initiated!');
}

function downloadExcel() {
    if (!currentRdSipData) {
        showNotification('Please calculate first before downloading', 'error');
        return;
    }
    
    const rdAmount = parseFloat(rdAmountElement.value) || 5000;
    const rdDuration = parseInt(rdDurationElement.value) || 5;
    const rdRate = parseFloat(rdRateElement.value) || 6.5;
    const sipAmount = parseFloat(sipAmountElement.value) || 5000;
    const sipDuration = parseInt(sipDurationElement.value) || 5;
    const sipReturn = parseFloat(sipReturnElement.value) || 12;
    
    // Create CSV content
    let csvContent = "RD vs SIP Calculator Comparison Results\n\n";
    csvContent += "Input Parameters\n";
    csvContent += `RD Monthly Amount,${formatCurrency(rdAmount)}\n`;
    csvContent += `RD Duration,${rdDuration} years\n`;
    csvContent += `RD Interest Rate,${rdRate}%\n`;
    csvContent += `RD Compounding,${rdCompoundingElement.value}\n`;
    csvContent += `SIP Monthly Amount,${formatCurrency(sipAmount)}\n`;
    csvContent += `SIP Duration,${sipDuration} years\n`;
    csvContent += `SIP Expected Return,${sipReturn}%\n\n`;
    
    csvContent += "Comparison Results\n";
    csvContent += "Investment Type,Total Invested,Maturity Value,Returns/Interest\n";
    csvContent += `Recurring Deposit (RD),${currentRdSipData.rd.total_invested},${currentRdSipData.rd.maturity_value},${currentRdSipData.rd.interest_earned}\n`;
    csvContent += `Systematic Investment Plan (SIP),${currentRdSipData.sip.total_invested},${currentRdSipData.sip.maturity_value},${currentRdSipData.sip.gains_earned}\n\n`;
    
    csvContent += "Summary\n";
    csvContent += `Difference in Returns,${Math.abs(currentRdSipData.comparison.difference_amount)}\n`;
    csvContent += `Percentage Gain,${currentRdSipData.comparison.percentage_gain.toFixed(2)}%\n`;
    csvContent += `Better Option,${currentRdSipData.comparison.better_option}\n`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'rd_vs_sip_comparison.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Excel file downloaded successfully!');
}

function shareResults() {
    if (!currentRdSipData) {
        showNotification('Please calculate first before sharing', 'error');
        return;
    }
    
    const rdAmount = parseFloat(rdAmountElement.value) || 5000;
    const sipAmount = parseFloat(sipAmountElement.value) || 5000;
    const duration = parseInt(rdDurationElement.value) || 5;
    
    const shareText = `RD vs SIP Comparison Results:
    
📊 Investment Details:
• Monthly Amount: ${formatCurrency(rdAmount)}
• Duration: ${duration} years

🏦 Recurring Deposit (RD):
• Maturity Value: ${formatCurrency(currentRdSipData.rd.maturity_value)}
• Interest Earned: ${formatCurrency(currentRdSipData.rd.interest_earned)}

📈 SIP (Mutual Funds):
• Maturity Value: ${formatCurrency(currentRdSipData.sip.maturity_value)}
• Wealth Gain: ${formatCurrency(currentRdSipData.sip.gains_earned)}

⚖️ Comparison:
• ${currentRdSipData.comparison.better_option} is better by ${formatCurrency(Math.abs(currentRdSipData.comparison.difference_amount))}
• Percentage gain: ${currentRdSipData.comparison.percentage_gain.toFixed(2)}%

Calculate your own: ${window.location.href}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'RD vs SIP Calculator Results',
            text: shareText,
            url: window.location.href
        }).then(() => {
            showNotification('Results shared successfully!');
        }).catch((error) => {
            console.log('Error sharing:', error);
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

function fallbackShare(text) {
    // Copy to clipboard as fallback
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Results copied to clipboard!');
    }).catch(() => {
        // If clipboard fails, show share text in alert
        alert('Share this result:\n\n' + text);
    });
}

function generatePrintableContent() {
    if (!currentRdSipData) return '';
    
    const rdAmount = parseFloat(rdAmountElement.value) || 5000;
    const rdDuration = parseInt(rdDurationElement.value) || 5;
    const rdRate = parseFloat(rdRateElement.value) || 6.5;
    const sipAmount = parseFloat(sipAmountElement.value) || 5000;
    const sipDuration = parseInt(sipDurationElement.value) || 5;
    const sipReturn = parseFloat(sipReturnElement.value) || 12;
    
    return `
        <div class="header">
            <h1>RD vs SIP Calculator - Comparison Results</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="results-grid">
            <div class="result-item">
                <div class="result-label">RD Monthly Amount</div>
                <div class="result-value">${formatCurrency(rdAmount)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">SIP Monthly Amount</div>
                <div class="result-value">${formatCurrency(sipAmount)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">RD Duration</div>
                <div class="result-value">${rdDuration} years</div>
            </div>
            <div class="result-item">
                <div class="result-label">SIP Duration</div>
                <div class="result-value">${sipDuration} years</div>
            </div>
            <div class="result-item">
                <div class="result-label">RD Interest Rate</div>
                <div class="result-value">${rdRate}%</div>
            </div>
            <div class="result-item">
                <div class="result-label">SIP Expected Return</div>
                <div class="result-value">${sipReturn}%</div>
            </div>
        </div>
        
        <div class="comparison-section">
            <h2>Comparison Results</h2>
            <div class="results-grid">
                <div class="result-item rd-section">
                    <div class="result-label">RD Total Invested</div>
                    <div class="result-value">${formatCurrency(currentRdSipData.rd.total_invested)}</div>
                </div>
                <div class="result-item sip-section">
                    <div class="result-label">SIP Total Invested</div>
                    <div class="result-value">${formatCurrency(currentRdSipData.sip.total_invested)}</div>
                </div>
                <div class="result-item rd-section">
                    <div class="result-label">RD Maturity Value</div>
                    <div class="result-value">${formatCurrency(currentRdSipData.rd.maturity_value)}</div>
                </div>
                <div class="result-item sip-section">
                    <div class="result-label">SIP Maturity Value</div>
                    <div class="result-value">${formatCurrency(currentRdSipData.sip.maturity_value)}</div>
                </div>
                <div class="result-item rd-section">
                    <div class="result-label">RD Interest Earned</div>
                    <div class="result-value">${formatCurrency(currentRdSipData.rd.interest_earned)}</div>
                </div>
                <div class="result-item sip-section">
                    <div class="result-label">SIP Wealth Gain</div>
                    <div class="result-value">${formatCurrency(currentRdSipData.sip.gains_earned)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Difference in Returns</div>
                    <div class="result-value">${formatCurrency(Math.abs(currentRdSipData.comparison.difference_amount))}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Better Option</div>
                    <div class="result-value">${currentRdSipData.comparison.better_option}</div>
                </div>
            </div>
        </div>
    `;
}