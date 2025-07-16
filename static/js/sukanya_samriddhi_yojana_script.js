// Sukanya Samriddhi Yojana Calculator Script

let chart = null;

// Input elements
const investmentAmountInput = document.getElementById('investmentAmount');
const investmentAmountSlider = document.getElementById('investmentAmountSlider');
const investmentFrequencySelect = document.getElementById('investmentFrequency');
const interestRateInput = document.getElementById('interestRate');
const interestRateSlider = document.getElementById('interestRateSlider');
const investmentPeriodInput = document.getElementById('investmentPeriod');
const investmentPeriodSlider = document.getElementById('investmentPeriodSlider');

// Custom Chart.js plugin to display Maturity Amount in center
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
            
            // Draw Maturity Value
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 10);
            
            // Draw "Maturity Value" label
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('Maturity Value', centerX, centerY + 15);
            
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
    setupTableToggle();
});

function setupSliders() {
    syncInputs(investmentAmountInput, investmentAmountSlider);
    syncInputs(interestRateInput, interestRateSlider);
    syncInputs(investmentPeriodInput, investmentPeriodSlider);
    updateInvestmentLimits();
}

function initialSyncValues() {
    // Ensure initial values are properly synchronized
    investmentAmountSlider.value = investmentAmountInput.value;
    interestRateSlider.value = interestRateInput.value;
    investmentPeriodSlider.value = investmentPeriodInput.value;
}

function updateInvestmentLimits() {
    const frequency = investmentFrequencySelect.value;
    let minAmount, maxAmount, step;
    
    switch(frequency) {
        case 'monthly':
            minAmount = 21; // ₹250/12 ≈ ₹21
            maxAmount = 12500; // ₹150000/12
            step = 21;
            break;
        case 'quarterly':
            minAmount = 63; // ₹250/4 ≈ ₹63
            maxAmount = 37500; // ₹150000/4
            step = 63;
            break;
        case 'half-yearly':
            minAmount = 125; // ₹250/2
            maxAmount = 75000; // ₹150000/2
            step = 125;
            break;
        case 'yearly':
        default:
            minAmount = 250;
            maxAmount = 150000;
            step = 250;
            break;
    }
    
    investmentAmountInput.min = minAmount;
    investmentAmountInput.max = maxAmount;
    investmentAmountInput.step = step;
    investmentAmountSlider.min = minAmount;
    investmentAmountSlider.max = maxAmount;
    investmentAmountSlider.step = step;
    
    // Adjust current value if it's outside new limits
    const currentValue = parseFloat(investmentAmountInput.value);
    if (currentValue < minAmount) {
        investmentAmountInput.value = minAmount;
        investmentAmountSlider.value = minAmount;
    } else if (currentValue > maxAmount) {
        investmentAmountInput.value = maxAmount;
        investmentAmountSlider.value = maxAmount;
    }
    
    // Update slider labels
    const sliderLabels = document.querySelector('.slider-labels');
    if (sliderLabels) {
        const formatAmount = (amount) => {
            if (amount >= 100000) return '₹' + (amount/100000).toFixed(1) + 'L';
            if (amount >= 1000) return '₹' + (amount/1000).toFixed(0) + 'K';
            return '₹' + amount;
        };
        sliderLabels.innerHTML = `
            <span>${formatAmount(minAmount)}</span>
            <span>${formatAmount(maxAmount)}</span>
        `;
    }
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
    [investmentAmountInput, interestRateInput, investmentPeriodInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [investmentAmountSlider, interestRateSlider, investmentPeriodSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });

    // Add frequency change listener
    investmentFrequencySelect.addEventListener('change', function() {
        updateInvestmentLimits();
        calculateAndUpdateResults();
    });
}

function calculateAndUpdateResults() {
    const investmentAmount = parseFloat(investmentAmountInput.value) || 0;
    const frequency = investmentFrequencySelect.value;
    const interestRate = parseFloat(interestRateInput.value) || 0;
    const investmentPeriod = parseInt(investmentPeriodInput.value) || 15;

    // Calculate annual investment based on frequency
    let annualInvestment;
    switch(frequency) {
        case 'monthly':
            annualInvestment = investmentAmount * 12;
            break;
        case 'quarterly':
            annualInvestment = investmentAmount * 4;
            break;
        case 'half-yearly':
            annualInvestment = investmentAmount * 2;
            break;
        case 'yearly':
        default:
            annualInvestment = investmentAmount;
            break;
    }

    const data = {
        investment_amount: investmentAmount,
        investment_frequency: frequency,
        annual_investment: annualInvestment,
        annual_interest_rate: interestRate,
        investment_period: investmentPeriod
    };

    // Validate inputs
    if (annualInvestment < 250 || annualInvestment > 150000) {
        return;
    }
    if (interestRate < 0 || investmentPeriod < 1) {
        return;
    }

    // Send calculation request
    fetch('/calculate-ssy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            console.error('Error:', result.error);
            return;
        }
        updateResultsDisplay(result);
        updateChart(result);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateResultsDisplay(result) {
    document.getElementById('maturityAmountResult').textContent = formatCurrency(result.maturity_amount);
    document.getElementById('totalInvestmentResult').textContent = formatCurrency(result.total_investment);
    document.getElementById('totalInterestResult').textContent = formatCurrency(result.total_interest);
    
    // Update chart summary
    document.getElementById('totalInvestmentDisplay').textContent = formatCurrency(result.total_investment);
    document.getElementById('totalInterestDisplay').textContent = formatCurrency(result.total_interest);
    
    // Update amortization tables
    updateYearlyTable(result.yearly_breakdown);
    updateMonthlyTable(result.monthly_breakdown);
}

function updateChart(result) {
    const ctx = document.getElementById('ssyChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Amount', 'Interest Earned'],
            datasets: [{
                data: [result.total_investment, result.total_interest],
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
                            const percentage = ((context.parsed / (result.total_investment + result.total_interest)) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: formatCurrency(result.maturity_amount)
                }
            },
            elements: {
                arc: {
                    borderWidth: 0
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function formatCurrency(amount) {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
}

function setupMegaMenu() {
    const megaMenu = document.querySelector('.mega-menu');
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenuContent = document.querySelector('.mega-menu-content');

    if (megaMenuBtn && megaMenuContent) {
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

function setupTableToggle() {
    const yearlyBtn = document.getElementById('yearlyViewBtn');
    const monthlyBtn = document.getElementById('monthlyViewBtn');
    const yearlyTable = document.getElementById('yearlyTable');
    const monthlyTable = document.getElementById('monthlyTable');

    if (yearlyBtn && monthlyBtn && yearlyTable && monthlyTable) {
        yearlyBtn.addEventListener('click', function() {
            yearlyBtn.classList.add('active');
            monthlyBtn.classList.remove('active');
            yearlyTable.classList.remove('hidden');
            monthlyTable.classList.add('hidden');
        });

        monthlyBtn.addEventListener('click', function() {
            monthlyBtn.classList.add('active');
            yearlyBtn.classList.remove('active');
            monthlyTable.classList.remove('hidden');
            yearlyTable.classList.add('hidden');
        });
    }
}

function updateYearlyTable(yearlyData) {
    const tbody = document.getElementById('yearlyTableBody');
    if (!tbody || !yearlyData) return;

    tbody.innerHTML = '';

    yearlyData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.year}</td>
            <td>${formatCurrency(row.annual_investment)}</td>
            <td>${formatCurrency(row.total_invested)}</td>
            <td>${formatCurrency(row.interest_earned)}</td>
            <td>${formatCurrency(row.balance)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateMonthlyTable(monthlyData) {
    const tbody = document.getElementById('monthlyTableBody');
    if (!tbody || !monthlyData) return;

    tbody.innerHTML = '';
    let currentYear = 0;

    monthlyData.forEach(row => {
        // Add year divider for new years
        if (row.year !== currentYear) {
            currentYear = row.year;
            const yearDivider = document.createElement('tr');
            yearDivider.className = 'year-divider';
            yearDivider.innerHTML = `
                <td colspan="6" style="text-align: center; font-weight: bold;">
                    --- Year ${row.year} ---
                </td>
            `;
            tbody.appendChild(yearDivider);
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.year}</td>
            <td>${row.month_name}</td>
            <td>${row.monthly_investment > 0 ? formatCurrency(row.monthly_investment) : '-'}</td>
            <td>${formatCurrency(row.cumulative_investment)}</td>
            <td>${formatCurrency(row.interest_earned)}</td>
            <td>${formatCurrency(row.balance)}</td>
        `;
        tbody.appendChild(tr);
    });
} 