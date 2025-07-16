// FD Calculator Script

let chart = null;

// Input elements
const principalAmountInput = document.getElementById('principalAmount');
const principalAmountSlider = document.getElementById('principalAmountSlider');
const interestRateInput = document.getElementById('interestRate');
const interestRateSlider = document.getElementById('interestRateSlider');
const tenureYearsInput = document.getElementById('tenureYears');
const tenureYearsSlider = document.getElementById('tenureYearsSlider');
const compoundingFrequencySelect = document.getElementById('compoundingFrequency');

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
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 10);
            
            // Draw "Total Return" label
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('Total Return', centerX, centerY + 15);
            
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
    calculateAndUpdateResults();
    setupMegaMenu();
});

function setupSliders() {
    syncInputs(principalAmountInput, principalAmountSlider);
    syncInputs(interestRateInput, interestRateSlider);
    syncInputs(tenureYearsInput, tenureYearsSlider);
}

function syncInputs(input, slider) {
    // Sync input to slider
    input.addEventListener('input', function() {
        const value = this.value;
        if (value >= slider.min && value <= slider.max) {
            slider.value = value;
        }
        calculateAndUpdateResults();
    });

    // Sync slider to input
    slider.addEventListener('input', function() {
        input.value = this.value;
        calculateAndUpdateResults();
    });
}

function addEventListeners() {
    // Add change listeners for all inputs
    [principalAmountInput, interestRateInput, tenureYearsInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [principalAmountSlider, interestRateSlider, tenureYearsSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });

    // Add listener for compounding frequency
    compoundingFrequencySelect.addEventListener('change', calculateAndUpdateResults);
}

function calculateAndUpdateResults() {
    const data = {
        principal_amount: parseFloat(principalAmountInput.value) || 0,
        annual_interest_rate: parseFloat(interestRateInput.value) || 0,
        tenure_years: parseInt(tenureYearsInput.value) || 0,
        compounding_frequency: compoundingFrequencySelect.value
    };

    // Validate inputs
    if (data.principal_amount <= 0 || data.annual_interest_rate <= 0 || data.tenure_years <= 0) {
        return;
    }

    // Send calculation request
    fetch('/calculate-fd', {
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
    document.getElementById('principalAmountResult').textContent = formatCurrency(result.principal_amount);
    document.getElementById('interestEarnedResult').textContent = formatCurrency(result.interest_earned);
    document.getElementById('maturityAmountResult').textContent = formatCurrency(result.maturity_amount);
    document.getElementById('totalReturnResult').textContent = `${result.total_return_percentage.toFixed(2)}%`;
    
    // Update chart summary
    document.getElementById('principalAmountDisplay').textContent = formatCurrency(result.principal_amount);
    document.getElementById('interestAmountDisplay').textContent = formatCurrency(result.interest_earned);
}

function updateChart(result) {
    const ctx = document.getElementById('fdBreakupChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Amount', 'Interest Earned'],
            datasets: [{
                data: [result.principal_amount, result.interest_earned],
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
                            const percentage = ((context.parsed / (result.principal_amount + result.interest_earned)) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: `${result.total_return_percentage.toFixed(2)}%`
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1200,
                easing: 'easeOutCubic'
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
    }).format(Math.round(amount));
}

// Mega menu functionality
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

        // Prevent menu from closing when clicking inside
        megaMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
} 