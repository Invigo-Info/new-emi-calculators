// SWP Calculator Script

let chart = null;

// Input elements
const initialInvestmentInput = document.getElementById('initialInvestment');
const initialInvestmentSlider = document.getElementById('initialInvestmentSlider');
const annualReturnRateInput = document.getElementById('annualReturnRate');
const annualReturnRateSlider = document.getElementById('annualReturnRateSlider');
const withdrawalAmountInput = document.getElementById('withdrawalAmount');
const withdrawalAmountSlider = document.getElementById('withdrawalAmountSlider');
const tenureYearsInput = document.getElementById('tenureYears');
const tenureYearsSlider = document.getElementById('tenureYearsSlider');
const withdrawalFrequencySelect = document.getElementById('withdrawalFrequency');

// Custom Chart.js plugin to display Net Return in center
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
            
            // Draw Net Return value
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 10);
            
            // Draw "Net Return" label
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('Net Return', centerX, centerY + 15);
            
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
});

function setupSliders() {
    syncInputs(initialInvestmentInput, initialInvestmentSlider);
    syncInputs(annualReturnRateInput, annualReturnRateSlider);
    syncInputs(withdrawalAmountInput, withdrawalAmountSlider);
    syncInputs(tenureYearsInput, tenureYearsSlider);
}

function initialSyncValues() {
    // Ensure initial values are properly synchronized
    initialInvestmentSlider.value = initialInvestmentInput.value;
    annualReturnRateSlider.value = annualReturnRateInput.value;
    withdrawalAmountSlider.value = withdrawalAmountInput.value;
    tenureYearsSlider.value = tenureYearsInput.value;
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
    [initialInvestmentInput, annualReturnRateInput, withdrawalAmountInput, tenureYearsInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [initialInvestmentSlider, annualReturnRateSlider, withdrawalAmountSlider, tenureYearsSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });

    // Add listener for withdrawal frequency
    withdrawalFrequencySelect.addEventListener('change', calculateAndUpdateResults);
}

function calculateAndUpdateResults() {
    const data = {
        initial_investment: parseFloat(initialInvestmentInput.value) || 0,
        annual_return_rate: parseFloat(annualReturnRateInput.value) || 0,
        withdrawal_amount: parseFloat(withdrawalAmountInput.value) || 0,
        tenure_years: parseFloat(tenureYearsInput.value) || 0,
        withdrawal_frequency: withdrawalFrequencySelect.value
    };

    // Validate inputs
    if (data.initial_investment <= 0 || data.annual_return_rate <= 0 || data.withdrawal_amount <= 0 || data.tenure_years <= 0) {
        return;
    }

    // Send calculation request
    fetch('/calculate-swp', {
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
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateResultsDisplay(result) {
    document.getElementById('initialInvestmentResult').textContent = formatCurrency(result.initial_investment);
    document.getElementById('totalWithdrawalsResult').textContent = formatCurrency(result.total_withdrawals);
    document.getElementById('finalBalanceResult').textContent = formatCurrency(result.final_balance);
    document.getElementById('netReturnResult').textContent = `${result.net_return_percentage.toFixed(2)}%`;
    
    // Update chart summary
    document.getElementById('initialInvestmentDisplay').textContent = formatCurrency(result.initial_investment);
    document.getElementById('withdrawalsMadeDisplay').textContent = formatCurrency(result.total_withdrawals);
    document.getElementById('remainingBalanceDisplay').textContent = formatCurrency(result.final_balance);
}

function updateChart(result) {
    const ctx = document.getElementById('swpChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Initial Investment', 'Total Withdrawals', 'Remaining Balance'],
            datasets: [{
                data: [result.initial_investment, result.total_withdrawals, result.final_balance],
                backgroundColor: ['#10B981', '#F59E0B', '#3B82F6'],
                borderWidth: 3,
                borderColor: '#ffffff',
                cutout: '75%',
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
                            const total = result.initial_investment + result.total_withdrawals + result.final_balance;
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: `${result.net_return_percentage.toFixed(2)}%`
                }
            }
        }
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
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

        // Close menu when pressing escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                megaMenu.classList.remove('open');
            }
        });
    }
} 