// Gold SIP Calculator Script

let chart = null;

// Input elements
const targetGoldAmountInput = document.getElementById('targetGoldAmount');
const targetGoldAmountSlider = document.getElementById('targetGoldAmountSlider');
const currentGoldPriceInput = document.getElementById('currentGoldPrice');
const currentGoldPriceSlider = document.getElementById('currentGoldPriceSlider');
const investmentFrequencySelect = document.getElementById('investmentFrequency');
const expectedReturnInput = document.getElementById('expectedReturn');
const expectedReturnSlider = document.getElementById('expectedReturnSlider');
const timePeriodInput = document.getElementById('timePeriod');
const timePeriodSlider = document.getElementById('timePeriodSlider');

// Custom Chart.js plugin to display Target Gold Amount in center
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
            
            // Draw Target Gold Amount
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 10);
            
            // Draw "Target Gold" label
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('Target Gold', centerX, centerY + 15);
            
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
    syncInputs(targetGoldAmountInput, targetGoldAmountSlider);
    syncInputs(currentGoldPriceInput, currentGoldPriceSlider);
    syncInputs(expectedReturnInput, expectedReturnSlider);
    syncInputs(timePeriodInput, timePeriodSlider);
}

function initialSyncValues() {
    // Ensure initial values are properly synchronized
    targetGoldAmountSlider.value = targetGoldAmountInput.value;
    currentGoldPriceSlider.value = currentGoldPriceInput.value;
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
    [targetGoldAmountInput, currentGoldPriceInput, expectedReturnInput, timePeriodInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [targetGoldAmountSlider, currentGoldPriceSlider, expectedReturnSlider, timePeriodSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });

    // Add frequency change listener
    investmentFrequencySelect.addEventListener('change', calculateAndUpdateResults);
}

function calculateAndUpdateResults() {
    const targetGoldAmount = parseFloat(targetGoldAmountInput.value) || 0;
    const currentGoldPrice = parseFloat(currentGoldPriceInput.value) || 0;
    const expectedReturn = parseFloat(expectedReturnInput.value) || 0;
    const timePeriod = parseInt(timePeriodInput.value) || 1;
    const frequency = investmentFrequencySelect.value;

    // Send calculation request to backend
    fetch('/calculate-gold-sip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            target_gold_amount: targetGoldAmount,
            current_gold_price: currentGoldPrice,
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

function updateResultsDisplay(result) {
    document.getElementById('requiredSipResult').textContent = formatCurrency(result.required_sip_amount);
    document.getElementById('totalInvestmentResult').textContent = formatCurrency(result.total_investment);
    document.getElementById('wealthGainResult').textContent = formatCurrency(result.wealth_gain);
    document.getElementById('totalInvestmentDisplay').textContent = formatCurrency(result.total_investment);
    document.getElementById('wealthGainDisplay').textContent = formatCurrency(result.wealth_gain);
}

function updateChart(result) {
    const ctx = document.getElementById('goldSipChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    const targetGoldAmount = parseFloat(targetGoldAmountInput.value) || 0;
    
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Total Investment', 'Gold Value Gain'],
            datasets: [{
                data: [result.total_investment, result.wealth_gain],
                backgroundColor: ['#3b82f6', '#10b981'],
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
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            return label + ': ' + value;
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: targetGoldAmount + 'g'
                }
            }
        }
    });
}

function updateTables(result) {
    updateYearlyTable(result.yearly_data);
    updateMonthlyTable(result.monthly_data);
}

function updateYearlyTable(yearlyData) {
    const tbody = document.getElementById('yearlyTableBody');
    tbody.innerHTML = '';
    
    yearlyData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.year}</td>
            <td>${formatCurrency(row.investment)}</td>
            <td>${row.gold_accumulated.toFixed(2)}g</td>
            <td>${formatCurrency(row.total_value)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateMonthlyTable(monthlyData) {
    const tbody = document.getElementById('monthlyTableBody');
    tbody.innerHTML = '';
    
    monthlyData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.year}</td>
            <td>${row.month}</td>
            <td>${formatCurrency(row.sip_amount)}</td>
            <td>${row.gold_bought.toFixed(3)}g</td>
            <td>${row.total_gold.toFixed(2)}g</td>
            <td>${formatCurrency(row.value)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function formatCurrency(amount) {
    // Convert to number and handle edge cases
    const num = Number(amount);
    if (isNaN(num)) return '₹0';
    
    // Format with Indian numbering system (commas at appropriate positions)
    return '₹' + num.toLocaleString('en-IN', { 
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    });
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
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });
        
        // Prevent menu from closing when clicking inside
        if (megaMenuContent) {
            megaMenuContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
}

function setupTableToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const yearlyContainer = document.getElementById('yearlyTableContainer');
    const monthlyContainer = document.getElementById('monthlyTableContainer');
    const tableSection = document.getElementById('tableSection');
    const toggleTableBtn = document.getElementById('toggleTable');

    // Toggle table visibility
    if (toggleTableBtn && tableSection) {
        toggleTableBtn.addEventListener('click', function() {
            tableSection.classList.toggle('hidden');
            
            if (tableSection.classList.contains('hidden')) {
                this.innerHTML = '<span class="btn-icon">📊</span>View Table';
            } else {
                this.innerHTML = '<span class="btn-icon">📊</span>Hide Table';
            }
        });
    }

    // Toggle between yearly and monthly tables
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tableType = this.getAttribute('data-table');
            
            // Remove active class from all buttons
            toggleBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show/hide appropriate table
            if (tableType === 'yearly') {
                yearlyContainer.classList.remove('hidden');
                monthlyContainer.classList.add('hidden');
            } else {
                yearlyContainer.classList.add('hidden');
                monthlyContainer.classList.remove('hidden');
            }
        });
    });
}

// PDF Download functionality
document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('downloadPDF');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            generatePDF();
        });
    }
});

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Gold SIP Calculator Report', 20, 20);
    
    // Add current date
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Generated on: ' + new Date().toLocaleDateString(), 20, 30);
    
    // Add input parameters
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Investment Parameters:', 20, 45);
    
    doc.setFontSize(12);
    const targetGold = document.getElementById('targetGoldAmount').value;
    const goldPrice = document.getElementById('currentGoldPrice').value;
    const expectedReturn = document.getElementById('expectedReturn').value;
    const timePeriod = document.getElementById('timePeriod').value;
    const frequency = document.getElementById('investmentFrequency').value;
    
    doc.text(`Target Gold Amount: ${targetGold} grams`, 20, 55);
    doc.text(`Current Gold Price: ₹${goldPrice} per gram`, 20, 65);
    doc.text(`Expected Gold Appreciation: ${expectedReturn}% per annum`, 20, 75);
    doc.text(`Investment Period: ${timePeriod} years`, 20, 85);
    doc.text(`Investment Frequency: ${frequency}`, 20, 95);
    
    // Add results
    doc.setFontSize(14);
    doc.text('Calculation Results:', 20, 110);
    
    doc.setFontSize(12);
    const requiredSip = document.getElementById('requiredSipResult').textContent;
    const totalInvestment = document.getElementById('totalInvestmentResult').textContent;
    const wealthGain = document.getElementById('wealthGainResult').textContent;
    
    doc.text(`Required SIP Amount: ${requiredSip}`, 20, 120);
    doc.text(`Total Investment: ${totalInvestment}`, 20, 130);
    doc.text(`Gold Value Gain: ${wealthGain}`, 20, 140);
    
    // Save the PDF
    doc.save('gold-sip-calculator-report.pdf');
} 