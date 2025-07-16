// ELSS SIP Calculator Script

let chart = null;
let yearwiseChart = null;

// Investment mode tracking
let currentMode = 'sip'; // 'sip' or 'lumpsum'

// Input elements
const sipAmountInput = document.getElementById('sipAmount');
const sipAmountSlider = document.getElementById('sipAmountSlider');
const lumpsumAmountInput = document.getElementById('lumpsumAmount');
const lumpsumAmountSlider = document.getElementById('lumpsumAmountSlider');
const expectedReturnInput = document.getElementById('expectedReturn');
const expectedReturnSlider = document.getElementById('expectedReturnSlider');
const investmentPeriodInput = document.getElementById('investmentPeriod');
const investmentPeriodSlider = document.getElementById('investmentPeriodSlider');
// Removed tax slab selection

// Mode switcher elements
const sipModeBtn = document.getElementById('sipModeBtn');
const lumpsumModeBtn = document.getElementById('lumpsumModeBtn');
const sipAmountGroup = document.getElementById('sipAmountGroup');
const lumpsumAmountGroup = document.getElementById('lumpsumAmountGroup');

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
            
            // Draw Total Return value
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 8);
            
            // Draw "Expected Returns" label
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('Expected Returns', centerX, centerY + 12);
            
            ctx.restore();
        }
    }
};

// Register the plugin
Chart.register(centerTextPlugin);

// Initialize sliders and event listeners
document.addEventListener('DOMContentLoaded', function() {
    setupSliders();
    addEventListeners();
    initialSyncValues();
    calculateAndUpdateResults();
    setupMegaMenu();
    setupResponsiveCharts();
});

function setupSliders() {
    syncInputs(sipAmountInput, sipAmountSlider);
    syncInputs(lumpsumAmountInput, lumpsumAmountSlider);
    syncInputs(expectedReturnInput, expectedReturnSlider);
    syncInputs(investmentPeriodInput, investmentPeriodSlider);
}

function initialSyncValues() {
    // Ensure initial values are properly synchronized
    sipAmountSlider.value = sipAmountInput.value;
    lumpsumAmountSlider.value = lumpsumAmountInput.value;
    expectedReturnSlider.value = expectedReturnInput.value;
    investmentPeriodSlider.value = investmentPeriodInput.value;
}

function syncInputs(input, slider) {
    // Sync input to slider
    input.addEventListener('input', function() {
        const value = parseFloat(this.value) || 0;
        if (value >= parseFloat(slider.min) && value <= parseFloat(slider.max)) {
            slider.value = value;
        }
        calculateAndUpdateResults();
    });

    // Sync slider to input
    slider.addEventListener('input', function() {
        input.value = this.value;
        calculateAndUpdateResults();
    });

    // Add change event for input field to handle direct typing
    input.addEventListener('change', function() {
        const value = parseFloat(this.value) || 0;
        if (value >= parseFloat(slider.min) && value <= parseFloat(slider.max)) {
            slider.value = value;
        } else if (value < parseFloat(slider.min)) {
            this.value = slider.min;
            slider.value = slider.min;
        } else if (value > parseFloat(slider.max)) {
            this.value = slider.max;
            slider.value = slider.max;
        }
        calculateAndUpdateResults();
    });
}

function addEventListeners() {
    // Add change listeners for all inputs
    [sipAmountInput, lumpsumAmountInput, expectedReturnInput, investmentPeriodInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [sipAmountSlider, lumpsumAmountSlider, expectedReturnSlider, investmentPeriodSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });

    // Removed tax slab listener

    // Add listeners for mode switcher
    sipModeBtn.addEventListener('click', () => switchMode('sip'));
    lumpsumModeBtn.addEventListener('click', () => switchMode('lumpsum'));
}

function calculateAndUpdateResults() {
    let data;
    
    if (currentMode === 'sip') {
        data = {
            mode: 'sip',
            sip_amount: parseFloat(sipAmountInput.value) || 0,
            expected_return: parseFloat(expectedReturnInput.value) || 0,
            investment_period: parseFloat(investmentPeriodInput.value) || 0
        };
        
        // Validate inputs - allow 0 and positive values
        if (data.sip_amount < 0 || data.expected_return < 0 || data.investment_period < 0) {
            return;
        }
    } else {
        data = {
            mode: 'lumpsum',
            lumpsum_amount: parseFloat(lumpsumAmountInput.value) || 0,
            expected_return: parseFloat(expectedReturnInput.value) || 0,
            investment_period: parseFloat(investmentPeriodInput.value) || 0
        };
        
        // Validate inputs - allow 0 and positive values
        if (data.lumpsum_amount < 0 || data.expected_return < 0 || data.investment_period < 0) {
            return;
        }
    }

    // Send calculation request
    fetch('/calculate-elss-sip', {
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
        updateYearwiseChart(result);
        updateYearwiseTable(result);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateResultsDisplay(result) {
    document.getElementById('finalCorpusResult').textContent = formatCurrency(result.final_corpus);
    document.getElementById('totalInvestedResult').textContent = formatCurrency(result.total_invested);
    document.getElementById('wealthGainedResult').textContent = formatCurrency(result.wealth_gained);
    
    // Update chart summary
    document.getElementById('totalInvestedDisplay').textContent = formatCurrency(result.total_invested);
    document.getElementById('wealthGainedDisplay').textContent = formatCurrency(result.wealth_gained);
}

function updateChart(result) {
    const ctx = document.getElementById('elssChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    // Handle 0 values gracefully
    const totalReturnPercentage = result.total_invested > 0 
        ? ((result.wealth_gained / result.total_invested) * 100).toFixed(1) + '%'
        : '0%';

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#ffffff',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                displayColors: true,
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = formatCurrency(context.parsed);
                        const total = result.total_invested + result.wealth_gained;
                        const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0';
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            },
            centerText: {
                display: true,
                text: totalReturnPercentage
            }
        },
        animation: {
            animateScale: true,
            animateRotate: true
        }
    };

    // Handle case where both values are 0
    let chartData = [result.total_invested, result.wealth_gained];
    if (result.total_invested === 0 && result.wealth_gained === 0) {
        chartData = [1, 0]; // Show at least something in the chart
    }

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Total Invested', 'Wealth Gained'],
            datasets: [{
                data: chartData,
                backgroundColor: ['#10B981', '#F59E0B'],
                borderWidth: 3,
                borderColor: '#ffffff',
                cutout: '75%',
                hoverOffset: 8
            }]
        },
        options: getResponsiveChartOptions(pieChartOptions)
    });
}

function updateYearwiseChart(result) {
    const ctx = document.getElementById('yearwiseChart').getContext('2d');
    
    if (yearwiseChart) {
        yearwiseChart.destroy();
    }

    if (result.yearly_breakdown && result.yearly_breakdown.length > 0) {
        const years = result.yearly_breakdown.map(item => `Year ${item.year}`);
        const cumulativeInvestment = result.yearly_breakdown.map(item => item.cumulative_investment);
        const expectedValue = result.yearly_breakdown.map(item => item.expected_value);
        const wealthGained = result.yearly_breakdown.map(item => item.wealth_gained);

        const barChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = formatCurrency(context.parsed.y);
                            return `${label}: ${value}`;
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
                            weight: '500'
                        },
                        color: '#6b7280'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f3f4f6',
                        borderDash: [2, 2]
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#6b7280',
                        callback: function(value) {
                            if (value >= 10000000) { // 1 crore
                                return '₹' + (value / 10000000).toFixed(1) + 'Cr';
                            } else if (value >= 100000) { // 1 lakh
                                return '₹' + (value / 100000).toFixed(1) + 'L';
                            } else if (value >= 1000) { // 1 thousand
                                return '₹' + (value / 1000).toFixed(1) + 'K';
                            } else {
                                return '₹' + value;
                            }
                        }
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            }
        };

        yearwiseChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Cumulative Investment',
                        data: cumulativeInvestment,
                        backgroundColor: '#10B981',
                        borderColor: '#059669',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Expected Value',
                        data: expectedValue,
                        backgroundColor: '#3B82F6',
                        borderColor: '#2563EB',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Wealth Gained',
                        data: wealthGained,
                        backgroundColor: '#F59E0B',
                        borderColor: '#D97706',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: getResponsiveChartOptions(barChartOptions)
        });
    } else {
        // Handle case with no data - create empty chart
        yearwiseChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['No Data'],
                datasets: [
                    {
                        label: 'Cumulative Investment',
                        data: [0],
                        backgroundColor: '#10B981',
                        borderColor: '#059669',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Expected Value',
                        data: [0],
                        backgroundColor: '#3B82F6',
                        borderColor: '#2563EB',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Wealth Gained',
                        data: [0],
                        backgroundColor: '#F59E0B',
                        borderColor: '#D97706',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: getResponsiveChartOptions({
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        enabled: false
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
                                weight: '500'
                            },
                            color: '#6b7280'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f3f4f6',
                            borderDash: [2, 2]
                        },
                        ticks: {
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            color: '#6b7280',
                            callback: function(value) {
                                return '₹0';
                            }
                        }
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeInOutQuart'
                }
            })
        });
    }
}

function updateYearwiseTable(result) {
    const tableBody = document.getElementById('yearwiseTableBody');
    tableBody.innerHTML = '';
    
    if (result.yearly_breakdown && result.yearly_breakdown.length > 0) {
        result.yearly_breakdown.forEach(year => {
            const row = document.createElement('tr');
            
            // For lumpsum mode, show investment only in year 1, otherwise show dash
            const annualInvestmentDisplay = currentMode === 'lumpsum' && year.year > 1 
                ? '-' 
                : formatCurrency(year.annual_investment);
            
            row.innerHTML = `
                <td>${year.year}</td>
                <td>${annualInvestmentDisplay}</td>
                <td>${formatCurrency(year.cumulative_investment)}</td>
                <td>${formatCurrency(year.expected_value)}</td>
                <td>${formatCurrency(year.wealth_gained)}</td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        // Show a row indicating no data
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" style="text-align: center; color: #6b7280; padding: 20px;">
                Enter values to see year-wise breakdown
            </td>
        `;
        tableBody.appendChild(row);
    }
}

function formatCurrency(amount) {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
}

function switchMode(mode) {
    currentMode = mode;
    
    if (mode === 'sip') {
        sipModeBtn.classList.add('active');
        lumpsumModeBtn.classList.remove('active');
        sipAmountGroup.style.display = 'block';
        lumpsumAmountGroup.style.display = 'none';
        
        // Update UI labels
        document.getElementById('calculationTitle').textContent = 'Calculate ELSS SIP Returns';
        document.getElementById('totalInvestedLabel').textContent = 'Total Invested';
        document.getElementById('tableHeaderInvestment').textContent = 'Annual Investment';
        document.getElementById('tableHeaderCumulative').textContent = 'Cumulative Investment';
    } else {
        lumpsumModeBtn.classList.add('active');
        sipModeBtn.classList.remove('active');
        sipAmountGroup.style.display = 'none';
        lumpsumAmountGroup.style.display = 'block';
        
        // Update UI labels
        document.getElementById('calculationTitle').textContent = 'Calculate ELSS Lumpsum Returns';
        document.getElementById('totalInvestedLabel').textContent = 'Lumpsum Investment';
        document.getElementById('tableHeaderInvestment').textContent = 'Investment Amount';
        document.getElementById('tableHeaderCumulative').textContent = 'Total Investment';
    }
    
    // Recalculate with new mode
    calculateAndUpdateResults();
}

function setupMegaMenu() {
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenu = document.querySelector('.mega-menu');
    
    if (megaMenuBtn && megaMenu) {
        megaMenuBtn.addEventListener('click', function() {
            megaMenu.classList.toggle('open');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!megaMenu.contains(event.target)) {
                megaMenu.classList.remove('open');
            }
        });
    }
}

function setupResponsiveCharts() {
    // Handle window resize for responsive charts
    window.addEventListener('resize', function() {
        // Debounce resize event
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(function() {
            if (pieChart) {
                pieChart.resize();
            }
            if (yearwiseChart) {
                yearwiseChart.resize();
            }
        }, 250);
    });
}

function isMobileDevice() {
    return window.innerWidth <= 768;
}

function getResponsiveChartOptions(baseOptions) {
    const isMobile = isMobileDevice();
    
    if (isMobile) {
        // Mobile-specific chart options
        return {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                legend: {
                    ...baseOptions.plugins.legend,
                    position: 'bottom',
                    labels: {
                        ...baseOptions.plugins.legend.labels,
                        padding: 10,
                        font: {
                            size: 10,
                            weight: '500'
                        }
                    }
                }
            },
            scales: baseOptions.scales ? {
                ...baseOptions.scales,
                x: {
                    ...baseOptions.scales.x,
                    ticks: {
                        ...baseOptions.scales.x.ticks,
                        font: {
                            size: 9,
                            weight: '500'
                        },
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    ...baseOptions.scales.y,
                    ticks: {
                        ...baseOptions.scales.y.ticks,
                        font: {
                            size: 9,
                            weight: '500'
                        }
                    }
                }
            } : undefined
        };
    }
    
    return baseOptions;
} 