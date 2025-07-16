// Exit Load Calculator Script

let chart = null;
let timeComparisonChart = null;

// Input elements
const investmentAmountInput = document.getElementById('investmentAmount');
const investmentAmountSlider = document.getElementById('investmentAmountSlider');
const exitLoadRateInput = document.getElementById('exitLoadRate');
const exitLoadRateSlider = document.getElementById('exitLoadRateSlider');
const redemptionAmountInput = document.getElementById('redemptionAmount');
const redemptionAmountSlider = document.getElementById('redemptionAmountSlider');
const exitLoadPeriodInput = document.getElementById('exitLoadPeriod');
const exitLoadPeriodSlider = document.getElementById('exitLoadPeriodSlider');
const purchaseNAVInput = document.getElementById('purchaseNAV');
const purchaseNAVSlider = document.getElementById('purchaseNAVSlider');
const currentNAVInput = document.getElementById('currentNAV');
const currentNAVSlider = document.getElementById('currentNAVSlider');

// Custom Chart.js plugin to display Total Return in center
const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
        if (chart.config.options.plugins.centerText && chart.config.options.plugins.centerText.display) {
            const ctx = chart.ctx;
            const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
            
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw Net Redemption value
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 8);
            
            // Draw "Net Amount" label
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('Net Amount', centerX, centerY + 12);
            
            ctx.restore();
        }
    }
};

// Register the plugin
Chart.register(centerTextPlugin);

// Initialize sliders and event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure all elements are loaded
    setTimeout(() => {
        setupSliders();
        addEventListeners();
        initialSyncValues();
        calculateAndUpdateResults();
        setupMegaMenu();
        setupResponsiveCharts();
    }, 100);
});

function setupSliders() {
    syncInputs(investmentAmountInput, investmentAmountSlider);
    syncInputs(exitLoadRateInput, exitLoadRateSlider);
    syncInputs(redemptionAmountInput, redemptionAmountSlider);
    syncInputs(exitLoadPeriodInput, exitLoadPeriodSlider);
    syncInputs(purchaseNAVInput, purchaseNAVSlider);
    syncInputs(currentNAVInput, currentNAVSlider);
}

function initialSyncValues() {
    // Set meaningful default values
    investmentAmountInput.value = 100000;
    investmentAmountSlider.value = 100000;
    exitLoadRateInput.value = 1;
    exitLoadRateSlider.value = 1;
    redemptionAmountInput.value = 120000;
    redemptionAmountSlider.value = 120000;
    exitLoadPeriodInput.value = 1;
    exitLoadPeriodSlider.value = 1;
    purchaseNAVInput.value = 10;
    purchaseNAVSlider.value = 10;
    currentNAVInput.value = 12;
    currentNAVSlider.value = 12;
    
    // Update slider progress for initial values
    updateAllSlidersProgress();
}

function updateAllSlidersProgress() {
    [investmentAmountSlider, exitLoadRateSlider, redemptionAmountSlider, exitLoadPeriodSlider, purchaseNAVSlider, currentNAVSlider].forEach(slider => {
        const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(to right, #3182ce 0%, #3182ce ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
    });
}

function syncInputs(input, slider) {
    // Update slider progress
    function updateSliderProgress(slider) {
        const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(to right, #3182ce 0%, #3182ce ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
    }
    
    // Initial progress update
    updateSliderProgress(slider);
    
    // Sync input to slider
    input.addEventListener('input', function() {
        const value = parseFloat(this.value) || 0;
        if (value >= parseFloat(slider.min) && value <= parseFloat(slider.max)) {
            slider.value = value;
            updateSliderProgress(slider);
        }
        calculateAndUpdateResults();
    });

    // Sync slider to input
    slider.addEventListener('input', function() {
        input.value = this.value;
        updateSliderProgress(this);
        calculateAndUpdateResults();
    });

    // Add change event for input field to handle direct typing
    input.addEventListener('change', function() {
        const value = parseFloat(this.value) || 0;
        if (value >= parseFloat(slider.min) && value <= parseFloat(slider.max)) {
            slider.value = value;
            updateSliderProgress(slider);
        } else if (value < parseFloat(slider.min)) {
            this.value = slider.min;
            slider.value = slider.min;
            updateSliderProgress(slider);
        } else if (value > parseFloat(slider.max)) {
            this.value = slider.max;
            slider.value = slider.max;
            updateSliderProgress(slider);
        }
        calculateAndUpdateResults();
    });
}

function addEventListeners() {
    // Add change listeners for all inputs
    [investmentAmountInput, exitLoadRateInput, redemptionAmountInput, exitLoadPeriodInput, purchaseNAVInput, currentNAVInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [investmentAmountSlider, exitLoadRateSlider, redemptionAmountSlider, exitLoadPeriodSlider, purchaseNAVSlider, currentNAVSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });
}

function calculateAndUpdateResults() {
    const data = {
        investment_amount: parseFloat(investmentAmountInput.value) || 0,
        exit_load_rate: parseFloat(exitLoadRateInput.value) || 0,
        redemption_amount: parseFloat(redemptionAmountInput.value) || 0,
        exit_load_period: (parseFloat(exitLoadPeriodInput.value) || 0) * 365, // Convert years to days
        purchase_nav: parseFloat(purchaseNAVInput.value) || 0,
        current_nav: parseFloat(currentNAVInput.value) || 0
    };
    
    // Validate inputs - allow 0 and positive values
    if (data.investment_amount < 0 || data.exit_load_rate < 0 || data.redemption_amount < 0 || 
        data.exit_load_period < 0 || data.purchase_nav < 0 || data.current_nav < 0) {
        return;
    }

    // Send calculation request
    fetch('/calculate-exit-load', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        updateResultsDisplay(result);
        updateChart(result);
        updateTimeComparisonChart(result);
        updateBreakdownTable(result);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateResultsDisplay(result) {
    document.getElementById('netRedemptionResult').textContent = formatCurrency(result.net_redemption_amount);
    document.getElementById('currentValueResult').textContent = formatCurrency(result.current_value);
    document.getElementById('exitLoadChargeResult').textContent = formatCurrency(result.exit_load_charge);
    document.getElementById('totalGainLossResult').textContent = formatCurrency(result.total_gain_loss);
    
    // Update exit load status
    const statusElement = document.getElementById('exitLoadStatusResult');
    if (result.exit_load_applicable) {
        statusElement.textContent = 'Applicable';
        statusElement.style.color = '#e53e3e';
    } else {
        statusElement.textContent = 'Not Applicable';
        statusElement.style.color = '#38a169';
    }
    
    // Update chart summary
    document.getElementById('investmentAmountDisplay').textContent = formatCurrency(result.investment_amount);
    document.getElementById('gainsEarnedDisplay').textContent = formatCurrency(result.gains_earned);
    document.getElementById('exitLoadChargeDisplay').textContent = formatCurrency(result.exit_load_charge);
}

function updateChart(result) {
    const ctx = document.getElementById('exitLoadChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    const centerText = formatCurrency(result.net_redemption_amount);

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Investment Amount', 'Gains Earned', 'Exit Load Charge'],
            datasets: [{
                data: [
                    result.investment_amount,
                    result.gains_earned,
                    Math.abs(result.exit_load_charge)
                ],
                backgroundColor: [
                    '#06d6a0',
                    '#f72585',
                    '#ff6b35'
                ],
                borderWidth: 0,
                cutout: '65%'
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
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + formatCurrency(context.parsed);
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: centerText
                }
            }
        }
    });
}

function updateTimeComparisonChart(result) {
    const ctx = document.getElementById('timeComparisonChart').getContext('2d');
    
    if (timeComparisonChart) {
        timeComparisonChart.destroy();
    }

    // Generate data for different redemption amounts
    const redemptionAmounts = [];
    const netAmounts = [];
    const exitLoads = [];
    
    // Create meaningful data points based on current value and common redemption scenarios
    const currentValue = result.current_value || 100000;
    const baseAmounts = [
        0,
        currentValue * 0.1,   // 10% of current value
        currentValue * 0.25,  // 25% of current value
        currentValue * 0.5,   // 50% of current value
        currentValue * 0.75,  // 75% of current value
        currentValue,         // Full current value
        currentValue * 1.25,  // 125% of current value
        currentValue * 1.5,   // 150% of current value
        currentValue * 2,     // 200% of current value
        Math.max(currentValue * 3, 1000000)  // At least 10 lakh or 3x current value
    ];
    
    baseAmounts.forEach(amount => {
        redemptionAmounts.push(amount);
        
        const exitLoadCharge = (result.exit_load_rate > 0 && amount > 0) ? 
            (amount * result.exit_load_rate / 100) : 0;
        const netAmount = amount - exitLoadCharge;
        
        netAmounts.push(netAmount);
        exitLoads.push(exitLoadCharge);
    });

    timeComparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: redemptionAmounts.map(amount => formatCurrency(amount)),
            datasets: [
                {
                    label: 'Net Redemption Amount',
                    data: netAmounts,
                    borderColor: '#3182ce',
                    backgroundColor: 'rgba(49, 130, 206, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Exit Load Charge',
                    data: exitLoads,
                    borderColor: '#ff6b35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    fill: false,
                    tension: 0.4
                }
            ]
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
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Redemption Amount'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function updateBreakdownTable(result) {
    const tableBody = document.getElementById('breakdownTableBody');
    tableBody.innerHTML = '';

    const breakdown = [
        { parameter: 'Investment Amount', value: formatCurrency(result.investment_amount), description: 'Original amount invested' },
        { parameter: 'Purchase NAV', value: '₹' + result.purchase_nav, description: 'NAV when units were purchased' },
        { parameter: 'Current NAV', value: '₹' + result.current_nav, description: 'Current NAV of the fund' },
        { parameter: 'Units Held', value: result.units_held.toFixed(4), description: 'Number of units owned' },
        { parameter: 'Current Value', value: formatCurrency(result.current_value), description: 'Current market value of investment' },
        { parameter: 'Gains/Loss', value: formatCurrency(result.total_gain_loss), description: 'Profit or loss on investment' },
        { parameter: 'Redemption Amount', value: formatCurrency(result.redemption_amount), description: 'Amount to be redeemed from investment' },
        { parameter: 'Exit Load Period', value: (result.exit_load_period / 365).toFixed(1) + ' years', description: 'Period during which exit load applies' },
        { parameter: 'Exit Load Rate', value: result.exit_load_rate + '%', description: 'Percentage charged as exit load' },
        { parameter: 'Exit Load Applicable', value: result.exit_load_applicable ? 'Yes' : 'No', description: 'Whether exit load will be charged' },
        { parameter: 'Exit Load Charge', value: formatCurrency(result.exit_load_charge), description: 'Amount charged as exit load' },
        { parameter: 'Net Redemption Amount', value: formatCurrency(result.net_redemption_amount), description: 'Final amount after exit load deduction' }
    ];

    breakdown.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight: 500;">${item.parameter}</td>
            <td style="font-weight: 600; color: #2d3748;">${item.value}</td>
            <td style="color: #718096; font-size: 13px;">${item.description}</td>
        `;
        tableBody.appendChild(row);
    });
}

function formatCurrency(amount) {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    
    // Indian number formatting with commas (lakhs and crores system)
    const formatIndianNumber = (num) => {
        const numStr = Math.round(num).toString();
        
        if (numStr.length <= 3) {
            return numStr;
        }
        
        let result = '';
        let count = 0;
        
        // Process from right to left
        for (let i = numStr.length - 1; i >= 0; i--) {
            result = numStr[i] + result;
            count++;
            
            // Add comma after every 3 digits for the first group (hundreds)
            // Then add comma after every 2 digits (thousands, lakhs, crores)
            if (count === 3 && i > 0) {
                result = ',' + result;
            } else if (count > 3 && (count - 3) % 2 === 0 && i > 0) {
                result = ',' + result;
            }
        }
        
        return result;
    };
    
    return sign + '₹' + formatIndianNumber(absAmount);
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
    }
}

function setupResponsiveCharts() {
    // Handle responsive chart resizing
    window.addEventListener('resize', function() {
        if (chart) chart.resize();
        if (timeComparisonChart) timeComparisonChart.resize();
    });
}

function isMobileDevice() {
    return window.innerWidth <= 768;
}

function getResponsiveChartOptions(baseOptions) {
    if (isMobileDevice()) {
        return {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                legend: {
                    ...baseOptions.plugins.legend,
                    labels: {
                        ...baseOptions.plugins.legend.labels,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        };
    }
    return baseOptions;
} 