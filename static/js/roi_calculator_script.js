// ROI Calculator Script

let chart = null;

// Input elements
const initialInvestmentInput = document.getElementById('initialInvestment');
const initialInvestmentSlider = document.getElementById('initialInvestmentSlider');
const finalValueInput = document.getElementById('finalValue');
const finalValueSlider = document.getElementById('finalValueSlider');
const tenureYearsInput = document.getElementById('tenureYears');
const tenureYearsSlider = document.getElementById('tenureYearsSlider');

// Custom Chart.js plugin to display ROI in center
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
            
            // Draw ROI value
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 10);
            
            // Draw "ROI" label
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('ROI', centerX, centerY + 15);
            
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
    syncInputs(initialInvestmentInput, initialInvestmentSlider);
    syncInputs(finalValueInput, finalValueSlider);
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
    [initialInvestmentInput, finalValueInput, tenureYearsInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [initialInvestmentSlider, finalValueSlider, tenureYearsSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });
}

function calculateAndUpdateResults() {
    const data = {
        initial_investment: parseFloat(initialInvestmentInput.value) || 0,
        final_value: parseFloat(finalValueInput.value) || 0,
        tenure_years: parseInt(tenureYearsInput.value) || 0
    };

    // Validate inputs
    if (data.initial_investment <= 0 || data.final_value <= 0 || data.tenure_years <= 0) {
        return;
    }

    // Send calculation request
    fetch('/calculate-roi', {
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
    document.getElementById('absoluteReturnsResult').textContent = formatCurrency(result.absolute_returns);
    document.getElementById('roiResult').textContent = `${result.roi_percentage.toFixed(2)}%`;
    document.getElementById('annualizedRoiResult').textContent = `${result.annualized_roi.toFixed(2)}%`;
    document.getElementById('finalValueResult').textContent = formatCurrency(result.final_value);
    
    // Update chart summary
    document.getElementById('investedAmountDisplay').textContent = formatCurrency(result.initial_investment);
    document.getElementById('returnsAmountDisplay').textContent = formatCurrency(result.absolute_returns);
}

function updateChart(result) {
    const ctx = document.getElementById('roiBreakupChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Initial Investment', 'Absolute Returns'],
            datasets: [{
                data: [result.initial_investment, result.absolute_returns],
                backgroundColor: ['#6C63FF', '#FF6B6B'],
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
                            const percentage = ((context.parsed / (result.initial_investment + result.absolute_returns)) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: `${result.roi_percentage.toFixed(2)}%`
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
    const megaMenuContent = document.querySelector('.mega-menu-content');
    const megaMenu = document.querySelector('.mega-menu');

    if (megaMenuBtn) {
        megaMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            megaMenu.classList.toggle('open');
        });
    }

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