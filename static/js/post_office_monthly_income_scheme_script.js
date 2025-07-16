// Post Office Monthly Income Scheme Calculator Script

let chart = null;

// Input elements
const yearlyInvestmentInput = document.getElementById('yearlyInvestment');
const yearlyInvestmentSlider = document.getElementById('yearlyInvestmentSlider');
const timePeriodInput = document.getElementById('timePeriod');
const timePeriodSlider = document.getElementById('timePeriodSlider');
const interestRateInput = document.getElementById('interestRate');
const interestRateSlider = document.getElementById('interestRateSlider');

// Custom Chart.js plugin to display Total Interest in center
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
            
            // Draw Total Interest value
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 10);
            
            // Draw "Total Interest" label
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('Total Interest', centerX, centerY + 15);
            
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
    syncInputs(yearlyInvestmentInput, yearlyInvestmentSlider);
    syncInputs(timePeriodInput, timePeriodSlider);
    syncInputs(interestRateInput, interestRateSlider);
}

function initialSyncValues() {
    // Ensure initial values are properly synchronized
    yearlyInvestmentSlider.value = yearlyInvestmentInput.value;
    timePeriodSlider.value = timePeriodInput.value;
    interestRateSlider.value = interestRateInput.value;
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
    [yearlyInvestmentInput, timePeriodInput, interestRateInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [yearlyInvestmentSlider, timePeriodSlider, interestRateSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });
}

function calculateAndUpdateResults() {
    const data = {
        yearly_investment: parseFloat(yearlyInvestmentInput.value) || 0,
        time_period: parseFloat(timePeriodInput.value) || 0,
        interest_rate: parseFloat(interestRateInput.value) || 0
    };

    // Validate inputs
    if (data.yearly_investment <= 0 || data.time_period <= 0 || data.interest_rate <= 0) {
        return;
    }

    // Send calculation request
    fetch('/calculate-post-office-monthly-income-scheme', {
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
    document.getElementById('monthlyInterestResult').textContent = formatCurrency(result.monthly_interest);
    document.getElementById('totalInterestResult').textContent = formatCurrency(result.total_interest);
    document.getElementById('maturityValueResult').textContent = formatCurrency(result.maturity_value);
    document.getElementById('investedAmountResult').textContent = formatCurrency(result.invested_amount);
    
    // Update chart summary
    document.getElementById('investedAmountDisplay').textContent = formatCurrency(result.invested_amount);
    document.getElementById('totalInterestDisplay').textContent = formatCurrency(result.total_interest);
}

function updateChart(result) {
    const ctx = document.getElementById('pomisChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Invested Amount', 'Total Interest'],
            datasets: [{
                data: [result.invested_amount, result.total_interest],
                backgroundColor: ['#10B981', '#F59E0B'],
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
                            const percentage = ((context.parsed / (result.invested_amount + result.total_interest)) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: formatCurrency(result.total_interest)
                }
            },
            layout: {
                padding: 20
            },
            elements: {
                arc: {
                    borderWidth: 3
                }
            }
        }
    });
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

function setupMegaMenu() {
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenu = document.querySelector('.mega-menu');
    
    if (megaMenuBtn && megaMenu) {
        megaMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            megaMenu.classList.toggle('open');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });

        // Close menu when pressing Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                megaMenu.classList.remove('open');
            }
        });
    }
} 