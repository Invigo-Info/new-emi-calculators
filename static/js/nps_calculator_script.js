// NPS Calculator Script

let chart = null;

// Input elements
const currentAgeInput = document.getElementById('currentAge');
const currentAgeSlider = document.getElementById('currentAgeSlider');
const retirementAgeInput = document.getElementById('retirementAge');
const retirementAgeSlider = document.getElementById('retirementAgeSlider');
const monthlyContributionInput = document.getElementById('monthlyContribution');
const monthlyContributionSlider = document.getElementById('monthlyContributionSlider');
const expectedReturnInput = document.getElementById('expectedReturn');
const expectedReturnSlider = document.getElementById('expectedReturnSlider');
const annuityPercentageInput = document.getElementById('annuityPercentage');
const annuityPercentageSlider = document.getElementById('annuityPercentageSlider');
const annuityReturnInput = document.getElementById('annuityReturn');
const annuityReturnSlider = document.getElementById('annuityReturnSlider');

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

// Initialize sliders and event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Chart.js to be available
    function initializeCalculator() {
        if (typeof Chart !== 'undefined') {
            // Register the plugin after Chart.js is loaded
            Chart.register(centerTextPlugin);
            
            setupSliders();
            addEventListeners();
            initialSyncValues();
            calculateAndUpdateResults();
            setupMegaMenu();
            console.log('NPS Calculator initialized successfully');
        } else {
            console.log('Waiting for Chart.js to load...');
            setTimeout(initializeCalculator, 100);
        }
    }
    
    initializeCalculator();
});

function setupSliders() {
    syncInputs(currentAgeInput, currentAgeSlider);
    syncInputs(retirementAgeInput, retirementAgeSlider);
    syncInputs(monthlyContributionInput, monthlyContributionSlider);
    syncInputs(expectedReturnInput, expectedReturnSlider);
    syncInputs(annuityPercentageInput, annuityPercentageSlider);
    syncInputs(annuityReturnInput, annuityReturnSlider);
}

function initialSyncValues() {
    // Ensure initial values are properly synchronized
    currentAgeSlider.value = currentAgeInput.value;
    retirementAgeSlider.value = retirementAgeInput.value;
    monthlyContributionSlider.value = monthlyContributionInput.value;
    expectedReturnSlider.value = expectedReturnInput.value;
    annuityPercentageSlider.value = annuityPercentageInput.value;
    annuityReturnSlider.value = annuityReturnInput.value;
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
    [currentAgeInput, retirementAgeInput, monthlyContributionInput, expectedReturnInput, annuityPercentageInput, annuityReturnInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [currentAgeSlider, retirementAgeSlider, monthlyContributionSlider, expectedReturnSlider, annuityPercentageSlider, annuityReturnSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });
}

function calculateAndUpdateResults() {
    const data = {
        current_age: parseFloat(currentAgeInput.value) || 0,
        retirement_age: parseFloat(retirementAgeInput.value) || 0,
        monthly_contribution: parseFloat(monthlyContributionInput.value) || 0,
        expected_return: parseFloat(expectedReturnInput.value) || 0,
        annual_increase: 0,  // Fixed at 0 - no annual increase
        annuity_percentage: parseFloat(annuityPercentageInput.value) || 0,
        annuity_return: parseFloat(annuityReturnInput.value) || 0
    };

    // Validate inputs
    if (data.current_age <= 0 || data.retirement_age <= 0 || data.monthly_contribution <= 0 || 
        data.expected_return <= 0 || data.current_age >= data.retirement_age) {
        return;
    }

    // Send calculation request
    fetch('/calculate-nps', {
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
    document.getElementById('pensionWealthResult').textContent = formatCurrency(result.pension_wealth);
    document.getElementById('investmentAmountResult').textContent = formatCurrency(result.investment_amount);
    document.getElementById('lumpSumResult').textContent = formatCurrency(result.lump_sum_amount);
    document.getElementById('annuityResult').textContent = formatCurrency(result.annuity_amount);
    document.getElementById('monthlyPensionResult').textContent = formatCurrency(result.monthly_pension);
    
    // Update chart summary
    document.getElementById('investmentAmountDisplay').textContent = formatCurrency(result.investment_amount);
    document.getElementById('gainsAmountDisplay').textContent = formatCurrency(result.investment_gains);
}

function updateChart(result) {
    const chartElement = document.getElementById('npsChart');
    if (!chartElement) {
        console.error('Chart canvas element not found');
        return;
    }
    
    const ctx = chartElement.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2D context from canvas');
        return;
    }
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library not loaded');
        return;
    }
    
    if (chart) {
        chart.destroy();
    }

    try {
        chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Investment Amount', 'Investment Gains'],
            datasets: [{
                data: [result.investment_amount, result.investment_gains],
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
                            const percentage = ((context.parsed / (result.investment_amount + result.investment_gains)) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: `${((result.investment_gains / result.investment_amount) * 100).toFixed(1)}%`
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
        
        console.log('Chart created successfully with data:', {
            investment_amount: result.investment_amount,
            investment_gains: result.investment_gains
        });
        
    } catch (error) {
        console.error('Error creating chart:', error);
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.round(amount));
}

function setupMegaMenu() {
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenu = document.querySelector('.mega-menu');
    
    if (megaMenuBtn && megaMenu) {
        megaMenuBtn.addEventListener('click', function() {
            megaMenu.classList.toggle('open');
        });

        // Close mega menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!megaMenu.contains(event.target)) {
                megaMenu.classList.remove('open');
            }
        });
    }
} 