// Inflation Calculator Script

let chart = null;

// Input elements
const currentAmountInput = document.getElementById('currentAmount');
const currentAmountSlider = document.getElementById('currentAmountSlider');
const inflationRateInput = document.getElementById('inflationRate');
const inflationRateSlider = document.getElementById('inflationRateSlider');
const timePeriodInput = document.getElementById('timePeriod');
const timePeriodSlider = document.getElementById('timePeriodSlider');

// Custom Chart.js plugin to display Current Amount in center
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
            
            // Draw Current Amount
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 10);
            
            // Draw "Current Amount" label
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('Current Amount', centerX, centerY + 15);
            
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
    syncInputs(currentAmountInput, currentAmountSlider);
    syncInputs(inflationRateInput, inflationRateSlider);
    syncInputs(timePeriodInput, timePeriodSlider);
}

function initialSyncValues() {
    // Ensure initial values are properly synchronized
    currentAmountSlider.value = currentAmountInput.value;
    inflationRateSlider.value = inflationRateInput.value;
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
    [currentAmountInput, inflationRateInput, timePeriodInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [currentAmountSlider, inflationRateSlider, timePeriodSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });
}

function calculateAndUpdateResults() {
    const currentAmount = parseFloat(currentAmountInput.value) || 0;
    const inflationRate = parseFloat(inflationRateInput.value) || 0;
    const timePeriod = parseInt(timePeriodInput.value) || 1;

    // Send calculation request to backend
    fetch('/calculate-inflation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            current_amount: currentAmount,
            inflation_rate: inflationRate,
            time_period: timePeriod
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
        // Fallback to client-side calculation
        const result = calculateInflationImpact(currentAmount, inflationRate, timePeriod);
        updateResultsDisplay(result);
        updateChart(result);
        updateTables(result);
    });
}

function calculateInflationImpact(currentAmount, inflationRate, timePeriod) {
    // Convert percentages to decimal
    const inflationDecimal = inflationRate / 100;
    
    // Calculate future value needed to maintain purchasing power
    const futureValue = currentAmount * Math.pow(1 + inflationDecimal, timePeriod);
    
    // Calculate purchasing power lost
    const purchasingPowerLost = futureValue - currentAmount;
    
    // Generate detailed breakdown
    const yearlyData = generateYearlyBreakdown(currentAmount, inflationDecimal, timePeriod);
    const monthlyData = generateMonthlyBreakdown(currentAmount, inflationDecimal, timePeriod);
    
    return {
        current_amount: currentAmount,
        future_value: futureValue,
        purchasing_power_lost: purchasingPowerLost,
        yearly_data: yearlyData,
        monthly_data: monthlyData
    };
}

function generateYearlyBreakdown(currentAmount, inflationRate, years) {
    const yearlyData = [];
    
    for (let year = 1; year <= years; year++) {
        const currentValue = currentAmount;
        const futureValue = currentAmount * Math.pow(1 + inflationRate, year);
        const purchasingPowerLost = futureValue - currentAmount;
        
        yearlyData.push({
            year: year,
            current_value: currentValue,
            future_value: futureValue,
            purchasing_power_lost: purchasingPowerLost
        });
    }
    
    return yearlyData;
}

function generateMonthlyBreakdown(currentAmount, inflationRate, years) {
    const monthlyData = [];
    const monthlyInflationRate = inflationRate / 12;
    const totalMonths = years * 12;
    
    for (let month = 1; month <= totalMonths; month++) {
        const currentValue = currentAmount;
        const futureValue = currentAmount * Math.pow(1 + monthlyInflationRate, month);
        const purchasingPowerLost = futureValue - currentAmount;
        
        monthlyData.push({
            month: month,
            current_value: currentValue,
            future_value: futureValue,
            purchasing_power_lost: purchasingPowerLost
        });
    }
    
    return monthlyData;
}

function updateResultsDisplay(result) {
    document.getElementById('futureValueResult').textContent = formatCurrency(result.future_value);
    document.getElementById('currentCostResult').textContent = formatCurrency(result.current_amount);
    document.getElementById('purchasingPowerResult').textContent = formatCurrency(result.purchasing_power_lost);
    
    // Update chart summary
    document.getElementById('currentValueDisplay').textContent = formatCurrency(result.current_amount);
    document.getElementById('inflationImpactDisplay').textContent = formatCurrency(result.purchasing_power_lost);
}

function updateChart(result) {
    const ctx = document.getElementById('inflationChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }
    
    const data = {
        labels: ['Current Value', 'Price Increase due to Inflation'],
        datasets: [{
            data: [
                result.current_amount,
                result.purchasing_power_lost
            ],
            backgroundColor: [
                '#3b82f6',
                '#f59e0b'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    };
    
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                centerText: {
                    display: true,
                    text: formatCurrency(result.current_amount)
                }
            },
            cutout: '60%'
        }
    });
}

function updateTables(result) {
    if (result.yearly_data) {
        updateYearlyTable(result.yearly_data);
    }
    if (result.monthly_data) {
        updateMonthlyTable(result.monthly_data);
    }
}

function updateYearlyTable(yearlyData) {
    const tableBody = document.getElementById('yearlyTableBody');
    tableBody.innerHTML = '';
    
    yearlyData.forEach(data => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${data.year}</td>
            <td>${formatCurrency(data.current_value)}</td>
            <td>${formatCurrency(data.future_value)}</td>
            <td>${formatCurrency(data.purchasing_power_lost)}</td>
        `;
    });
}

function updateMonthlyTable(monthlyData) {
    const tableBody = document.getElementById('monthlyTableBody');
    tableBody.innerHTML = '';
    
    monthlyData.forEach((data, index) => {
        if (index % 12 === 0) {
            // Add year divider
            const yearRow = tableBody.insertRow();
            yearRow.className = 'year-divider';
            yearRow.innerHTML = `<td colspan="4">Year ${Math.floor(index / 12) + 1}</td>`;
        }
        
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${data.month}</td>
            <td>${formatCurrency(data.current_value)}</td>
            <td>${formatCurrency(data.future_value)}</td>
            <td>${formatCurrency(data.purchasing_power_lost)}</td>
        `;
    });
}

function formatCurrency(amount) {
    // Format to Indian rupee format (₹1,59,384)
    const formatted = Math.round(amount).toLocaleString('en-IN');
    return '₹' + formatted;
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
        
        // Close menu when clicking on a link
        const megaLinks = document.querySelectorAll('.mega-link');
        megaLinks.forEach(link => {
            link.addEventListener('click', function() {
                megaMenu.classList.remove('open');
            });
        });
    }
}

function setupTableToggle() {
    // Initially hide table
    const tableSection = document.getElementById('tableSection');
    if (tableSection) {
        tableSection.classList.add('hidden');
    }
}

function toggleTable() {
    const tableSection = document.getElementById('tableSection');
    if (tableSection) {
        tableSection.classList.toggle('hidden');
    }
}

function showYearlyTable() {
    const yearlyTable = document.getElementById('yearlyTable');
    const monthlyTable = document.getElementById('monthlyTable');
    const yearlyBtn = document.querySelector('.toggle-btn:first-child');
    const monthlyBtn = document.querySelector('.toggle-btn:last-child');
    
    if (yearlyTable && monthlyTable && yearlyBtn && monthlyBtn) {
        yearlyTable.classList.remove('hidden');
        monthlyTable.classList.add('hidden');
        yearlyBtn.classList.add('active');
        monthlyBtn.classList.remove('active');
    }
}

function showMonthlyTable() {
    const yearlyTable = document.getElementById('yearlyTable');
    const monthlyTable = document.getElementById('monthlyTable');
    const yearlyBtn = document.querySelector('.toggle-btn:first-child');
    const monthlyBtn = document.querySelector('.toggle-btn:last-child');
    
    if (yearlyTable && monthlyTable && yearlyBtn && monthlyBtn) {
        yearlyTable.classList.add('hidden');
        monthlyTable.classList.remove('hidden');
        yearlyBtn.classList.remove('active');
        monthlyBtn.classList.add('active');
    }
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Inflation Calculator Report', 20, 20);
    
    // Add current values
    doc.setFontSize(12);
    const currentAmount = parseFloat(currentAmountInput.value) || 0;
    const inflationRate = parseFloat(inflationRateInput.value) || 0;
    const timePeriod = parseInt(timePeriodInput.value) || 1;
    
    doc.text(`Current Amount: ${formatCurrency(currentAmount)}`, 20, 40);
    doc.text(`Inflation Rate: ${inflationRate}%`, 20, 50);
    doc.text(`Time Period: ${timePeriod} years`, 20, 60);
    
    // Add results
    const result = calculateInflationImpact(currentAmount, inflationRate, timePeriod);
    doc.text(`Future Value: ${formatCurrency(result.future_value)}`, 20, 90);
    doc.text(`Current Cost Value: ${formatCurrency(result.current_amount)}`, 20, 100);
    doc.text(`Price Increase due to Inflation: ${formatCurrency(result.purchasing_power_lost)}`, 20, 110);
    
    // Save the PDF
    doc.save('inflation-calculator-report.pdf');
} 