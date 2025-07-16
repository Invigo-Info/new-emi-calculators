// Goal SIP Calculator Script

let chart = null;

// Input elements
const targetAmountInput = document.getElementById('targetAmount');
const targetAmountSlider = document.getElementById('targetAmountSlider');
const investmentFrequencySelect = document.getElementById('investmentFrequency');
const expectedReturnInput = document.getElementById('expectedReturn');
const expectedReturnSlider = document.getElementById('expectedReturnSlider');
const timePeriodInput = document.getElementById('timePeriod');
const timePeriodSlider = document.getElementById('timePeriodSlider');

// Custom Chart.js plugin to display Target Amount in center
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
            
            // Draw Target Amount
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 10);
            
            // Draw "Target Amount" label
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('Target Amount', centerX, centerY + 15);
            
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
    syncInputs(targetAmountInput, targetAmountSlider);
    syncInputs(expectedReturnInput, expectedReturnSlider);
    syncInputs(timePeriodInput, timePeriodSlider);
}

function initialSyncValues() {
    // Ensure initial values are properly synchronized
    targetAmountSlider.value = targetAmountInput.value;
    expectedReturnSlider.value = expectedReturnInput.value;
    timePeriodSlider.value = timePeriodInput.value;
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
    [targetAmountInput, expectedReturnInput, timePeriodInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [targetAmountSlider, expectedReturnSlider, timePeriodSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });

    // Add frequency change listener
    investmentFrequencySelect.addEventListener('change', calculateAndUpdateResults);
}

function calculateAndUpdateResults() {
    const targetAmount = parseFloat(targetAmountInput.value) || 0;
    const expectedReturn = parseFloat(expectedReturnInput.value) || 0;
    const timePeriod = parseInt(timePeriodInput.value) || 1;
    const frequency = investmentFrequencySelect.value;

    // Send calculation request to backend
    fetch('/calculate-goal-sip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            target_amount: targetAmount,
            expected_return: expectedReturn,
            time_period: timePeriod,
            frequency: frequency
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            console.error('Calculation error:', result.error);
            return;
        }
        
        // Update display
        updateResultsDisplay(result);
        updateChart(result);
        updateTables(result);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function calculateGoalSip(targetAmount, annualReturn, years, frequency) {
    // Convert annual return to decimal
    const rate = annualReturn / 100;
    
    // Calculate frequency multiplier
    let frequencyMultiplier;
    switch(frequency) {
        case 'monthly':
            frequencyMultiplier = 12;
            break;
        case 'quarterly':
            frequencyMultiplier = 4;
            break;
        case 'half-yearly':
            frequencyMultiplier = 2;
            break;
        case 'yearly':
            frequencyMultiplier = 1;
            break;
        default:
            frequencyMultiplier = 12;
    }
    
    // Calculate periodic rate and number of payments
    const periodicRate = rate / frequencyMultiplier;
    const totalPayments = years * frequencyMultiplier;
    
    // Calculate required SIP amount using Future Value of Annuity formula
    // FV = PMT * [((1 + r)^n - 1) / r]
    // PMT = FV / [((1 + r)^n - 1) / r]
    
    let requiredSip;
    if (periodicRate === 0) {
        requiredSip = targetAmount / totalPayments;
    } else {
        const futureValueFactor = (Math.pow(1 + periodicRate, totalPayments) - 1) / periodicRate;
        requiredSip = targetAmount / futureValueFactor;
    }
    
    // Calculate total investment
    const totalInvestment = requiredSip * totalPayments;
    
    // Calculate wealth gain
    const wealthGain = targetAmount - totalInvestment;
    
    // Generate detailed breakdown
    const yearlyData = generateYearlyBreakdown(requiredSip, periodicRate, frequencyMultiplier, years);
    const monthlyData = generateMonthlyBreakdown(requiredSip, periodicRate, frequencyMultiplier, years);
    
    return {
        requiredSip: requiredSip,
        totalInvestment: totalInvestment,
        wealthGain: wealthGain,
        targetAmount: targetAmount,
        yearlyData: yearlyData,
        monthlyData: monthlyData
    };
}

function generateYearlyBreakdown(sipAmount, periodicRate, frequencyMultiplier, years) {
    const yearlyData = [];
    let cumulativeInvestment = 0;
    let currentValue = 0;
    
    for (let year = 1; year <= years; year++) {
        const yearlyInvestment = sipAmount * frequencyMultiplier;
        cumulativeInvestment += yearlyInvestment;
        
        // Calculate value at end of year
        for (let payment = 1; payment <= frequencyMultiplier; payment++) {
            currentValue += sipAmount;
            currentValue = currentValue * (1 + periodicRate);
        }
        
        const returns = currentValue - cumulativeInvestment;
        
        yearlyData.push({
            year: year,
            yearlyInvestment: yearlyInvestment,
            cumulativeInvestment: cumulativeInvestment,
            returns: returns,
            totalValue: currentValue
        });
    }
    
    return yearlyData;
}

function generateMonthlyBreakdown(sipAmount, periodicRate, frequencyMultiplier, years) {
    const monthlyData = [];
    let currentValue = 0;
    let cumulativeInvestment = 0;
    
    for (let year = 1; year <= years; year++) {
        for (let month = 1; month <= 12; month++) {
            let monthlyInvestment = 0;
            
            // Check if investment is made this month based on frequency
            if (frequencyMultiplier === 12) { // Monthly
                monthlyInvestment = sipAmount;
            } else if (frequencyMultiplier === 4 && month % 3 === 0) { // Quarterly
                monthlyInvestment = sipAmount;
            } else if (frequencyMultiplier === 2 && month % 6 === 0) { // Half-yearly
                monthlyInvestment = sipAmount;
            } else if (frequencyMultiplier === 1 && month === 12) { // Yearly
                monthlyInvestment = sipAmount;
            }
            
            if (monthlyInvestment > 0) {
                currentValue += monthlyInvestment;
                cumulativeInvestment += monthlyInvestment;
            }
            
            // Apply monthly growth
            const monthlyRate = periodicRate / (12 / frequencyMultiplier);
            currentValue = currentValue * (1 + monthlyRate);
            
            monthlyData.push({
                year: year,
                month: month,
                monthName: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month-1],
                monthlyInvestment: monthlyInvestment,
                cumulativeInvestment: cumulativeInvestment,
                balance: currentValue
            });
        }
    }
    
    return monthlyData;
}

function updateResultsDisplay(result) {
    document.getElementById('requiredSipResult').textContent = formatCurrency(result.required_sip);
    document.getElementById('totalInvestmentResult').textContent = formatCurrency(result.total_investment);
    document.getElementById('wealthGainResult').textContent = formatCurrency(result.wealth_gain);
    document.getElementById('totalInvestmentDisplay').textContent = formatCurrency(result.total_investment);
    document.getElementById('wealthGainDisplay').textContent = formatCurrency(result.wealth_gain);
}

function updateChart(result) {
    const ctx = document.getElementById('goalSipChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Total Investment', 'Wealth Gain'],
            datasets: [{
                data: [result.total_investment, result.wealth_gain],
                backgroundColor: ['#3182ce', '#f59e0b'],
                borderWidth: 0,
                cutout: '60%'
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
                            return context.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: formatCurrency(result.target_amount)
                }
            }
        }
    });
}

function updateTables(result) {
    updateYearlyTable(result.yearly_breakdown);
    updateMonthlyTable(result.monthly_breakdown);
}

function updateYearlyTable(yearlyData) {
    const tbody = document.getElementById('yearlyTableBody');
    tbody.innerHTML = '';
    
    yearlyData.forEach(data => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${data.year}</td>
            <td>${formatCurrency(data.yearly_investment)}</td>
            <td>${formatCurrency(data.returns)}</td>
            <td>${formatCurrency(data.total_value)}</td>
        `;
    });
}

function updateMonthlyTable(monthlyData) {
    const tbody = document.getElementById('monthlyTableBody');
    tbody.innerHTML = '';
    
    monthlyData.forEach(data => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${data.year}</td>
            <td>${data.month_name}</td>
            <td>${formatCurrency(data.monthly_investment)}</td>
            <td>${formatCurrency(data.balance)}</td>
        `;
    });
}

function formatCurrency(amount) {
    // Round the amount to avoid decimal issues
    amount = Math.round(amount);
    
    // Format in Indian currency style with commas
    return '₹' + amount.toLocaleString('en-IN');
}

function setupMegaMenu() {
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenu = document.querySelector('.mega-menu');
    const megaMenuContent = document.querySelector('.mega-menu-content');

    if (megaMenuBtn && megaMenu) {
        megaMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            megaMenu.classList.toggle('open');
        });

        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });

        if (megaMenuContent) {
            megaMenuContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
}

function setupTableToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const tableBtn = document.getElementById('toggleTable');
    const tableSection = document.getElementById('tableSection');
    
    if (tableBtn && tableSection) {
        tableBtn.addEventListener('click', function() {
            tableSection.classList.toggle('hidden');
            this.textContent = tableSection.classList.contains('hidden') ? 
                'View Table' : 'Hide Table';
        });
    }
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tableType = this.dataset.table;
            
            // Update active button
            toggleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide tables
            document.getElementById('yearlyTableContainer').classList.toggle('hidden', tableType !== 'yearly');
            document.getElementById('monthlyTableContainer').classList.toggle('hidden', tableType !== 'monthly');
        });
    });
}

// PDF Download functionality
document.getElementById('downloadPDF').addEventListener('click', function() {
    // Basic PDF generation - would need more sophisticated implementation
    window.print();
}); 