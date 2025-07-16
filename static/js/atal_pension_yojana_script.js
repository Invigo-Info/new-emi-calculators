// Atal Pension Yojana Calculator Script

let chart = null;

// Input elements
const joiningAgeInput = document.getElementById('joiningAge');
const joiningAgeSlider = document.getElementById('joiningAgeSlider');
const pensionAmountSelect = document.getElementById('pensionAmount');

// Custom Chart.js plugin to display Monthly Pension in center
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
            
            // Draw Monthly Pension Value
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 10);
            
            // Draw "Monthly Pension" label
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('Monthly Pension', centerX, centerY + 15);
            
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
    syncInputs(joiningAgeInput, joiningAgeSlider);
}

function initialSyncValues() {
    // Ensure initial values are properly synchronized
    joiningAgeSlider.value = joiningAgeInput.value;
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
    [joiningAgeInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [joiningAgeSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });

    // Add select change listeners
    [pensionAmountSelect].forEach(select => {
        select.addEventListener('change', calculateAndUpdateResults);
    });
}

function calculateAndUpdateResults() {
    const joiningAge = parseInt(joiningAgeInput.value) || 25;
    const pensionAmount = parseInt(pensionAmountSelect.value) || 3000;
    
    // Use PFRDA standard return rate of 8.5% and always include government co-contribution
    const data = {
        joining_age: joiningAge,
        pension_amount: pensionAmount
    };

    // Validate inputs
    if (joiningAge < 18 || joiningAge > 40) {
        return;
    }
    if (pensionAmount <= 0) {
        return;
    }

    // Send calculation request
    fetch('/calculate-apy', {
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
    document.getElementById('monthlyContributionResult').textContent = formatCurrency(result.monthly_contribution);
    document.getElementById('investmentDurationResult').textContent = result.investment_period + ' Years';
    document.getElementById('totalInvestmentResult').textContent = formatCurrency(result.total_contribution);
    document.getElementById('pensionAmountResult').textContent = formatCurrency(result.pension_amount);
    document.getElementById('lumpSumResult').textContent = formatCurrency(result.lump_sum);
    
    // Update chart summary
    document.getElementById('totalInvestmentDisplay').textContent = formatCurrency(result.total_contribution);
    document.getElementById('totalGrowthDisplay').textContent = formatCurrency(result.investment_growth);
    
    // Update amortization tables
    updateYearlyTable(result.yearly_breakdown);
    updateMonthlyTable(result.monthly_breakdown);
}

function updateChart(result) {
    const ctx = document.getElementById('apyChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Your Contribution', 'Investment Growth'],
            datasets: [{
                data: [result.total_contribution, result.investment_growth],
                backgroundColor: ['#3B82F6', '#F59E0B'],
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
                            const total = result.total_contribution + result.investment_growth;
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: formatCurrency(result.pension_amount)
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
            <td>${row.age}</td>
            <td>${formatCurrency(row.annual_contribution)}</td>
            <td>${formatCurrency(row.gov_contribution)}</td>
            <td>${formatCurrency(row.total_invested)}</td>
            <td>${formatCurrency(row.investment_growth)}</td>
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
                <td colspan="8" style="text-align: center; font-weight: bold;">
                    --- Year ${row.year} (Age ${row.age}) ---
                </td>
            `;
            tbody.appendChild(yearDivider);
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.year}</td>
            <td>${row.month_name}</td>
            <td>${row.age}</td>
            <td>${row.monthly_contribution > 0 ? formatCurrency(row.monthly_contribution) : '-'}</td>
            <td>${row.gov_contribution > 0 ? formatCurrency(row.gov_contribution) : '-'}</td>
            <td>${formatCurrency(row.cumulative_investment)}</td>
            <td>${formatCurrency(row.investment_growth)}</td>
            <td>${formatCurrency(row.balance)}</td>
        `;
        tbody.appendChild(tr);
    });
} 