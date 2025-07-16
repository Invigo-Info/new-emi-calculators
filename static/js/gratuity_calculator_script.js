// Gratuity Calculator Script

let chart = null;

// Input elements
const lastSalaryInput = document.getElementById('lastSalary');
const lastSalarySlider = document.getElementById('lastSalarySlider');
const yearsOfServiceInput = document.getElementById('yearsOfService');
const yearsOfServiceSlider = document.getElementById('yearsOfServiceSlider');

// Custom Chart.js plugin to display Total Gratuity in center
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
            
            // Draw Total Gratuity value
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 10);
            
            // Draw "Net Gratuity" label
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('Net Gratuity', centerX, centerY + 15);
            
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
    syncInputs(lastSalaryInput, lastSalarySlider);
    syncInputs(yearsOfServiceInput, yearsOfServiceSlider);
}

function initialSyncValues() {
    // Ensure initial values are properly synchronized
    lastSalarySlider.value = lastSalaryInput.value;
    yearsOfServiceSlider.value = yearsOfServiceInput.value;
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
    [lastSalaryInput, yearsOfServiceInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [lastSalarySlider, yearsOfServiceSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });
}



function calculateAndUpdateResults() {
    const data = {
        last_salary: parseFloat(lastSalaryInput.value) || 0,
        years_of_service: parseInt(yearsOfServiceInput.value) || 0,
        gratuity_type: 'act',  // Default to Payment of Gratuity Act (15 days)
        custom_days: 15
    };

    // Send calculation request even with 0 values to show initial state
    fetch('/calculate-gratuity', {
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
    document.getElementById('gratuityAmountResult').textContent = formatCurrency(result.gratuity_amount);
    document.getElementById('annualSalaryResult').textContent = formatCurrency(result.annual_salary);
    
    // Update chart summary
    document.getElementById('gratuityAmountDisplay').textContent = formatCurrency(result.gratuity_amount);
    document.getElementById('annualSalaryDisplay').textContent = formatCurrency(result.annual_salary);
}

function updateChart(result) {
    const ctx = document.getElementById('gratuityBreakupChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    const chartData = [result.gratuity_amount];
    const chartLabels = ['Total Gratuity'];
    const chartColors = ['#10B981'];

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
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
                            return `${label}: ${value}`;
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: formatCurrency(result.gratuity_amount)
                }
            }
        }
    });
}

function formatCurrency(amount) {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
    }
} 