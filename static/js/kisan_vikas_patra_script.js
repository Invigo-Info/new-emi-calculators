// Kisan Vikas Patra Calculator Script

let chart = null;

// Input elements
const investmentAmountInput = document.getElementById('investmentAmount');
const investmentAmountSlider = document.getElementById('investmentAmountSlider');
const interestRateInput = document.getElementById('interestRate');
const lockInPeriodInput = document.getElementById('lockInPeriod');
const maturityYearsInput = document.getElementById('maturityYears');

// Custom Chart.js plugin to display Investment Amount in center
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
            
            // Draw Investment Amount
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 10);
            
            // Draw "Investment Amount" label
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('Investment Amount', centerX, centerY + 15);
            
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
}

function initialSyncValues() {
    // Ensure initial values are properly synchronized
    investmentAmountSlider.value = investmentAmountInput.value;
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
    // Add change listeners for investment amount only (other fields are fixed)
    investmentAmountInput.addEventListener('change', calculateAndUpdateResults);
    investmentAmountInput.addEventListener('keyup', calculateAndUpdateResults);

    // Add input listener for investment amount slider
    investmentAmountSlider.addEventListener('input', calculateAndUpdateResults);
}

function calculateAndUpdateResults() {
    const investmentAmount = parseFloat(investmentAmountInput.value) || 0;
    const interestRate = parseFloat(interestRateInput.value) || 0;
    const lockInPeriod = parseFloat(lockInPeriodInput.value) || 2.5;
    const maturityYears = parseFloat(maturityYearsInput.value) || 1;

    // Send calculation request to backend
    fetch('/calculate-kvp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            investment_amount: investmentAmount,
            interest_rate: interestRate,
            maturity_years: maturityYears,
            lock_in_period: lockInPeriod
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
        const result = calculateKVPReturns(investmentAmount, interestRate, maturityYears, lockInPeriod);
        updateResultsDisplay(result);
        updateChart(result);
        updateTables(result);
    });
}

function calculateKVPReturns(investmentAmount, interestRate, maturityYears, lockInPeriod = 2.5) {
    // Convert percentages to decimal
    const annualRate = interestRate / 100;
    
    // For KVP, the investment always doubles at maturity
    const maturityAmount = investmentAmount * 2;
    
    // Calculate value at lock-in period (partial growth)
    const lockInAmount = investmentAmount * Math.pow(1 + annualRate, lockInPeriod);
    
    // Calculate total interest earned (which is always equal to principal in KVP)
    const totalInterest = maturityAmount - investmentAmount;
    const lockInInterest = lockInAmount - investmentAmount;
    
    // Calculate doubling period
    const doublingPeriod = Math.log(2) / Math.log(1 + annualRate);
    
    // Calculate maturity date (assuming investment starts today)
    const today = new Date();
    const yearsToAdd = Math.floor(maturityYears);
    const daysToAdd = Math.floor((maturityYears - yearsToAdd) * 365.25);
    
    const maturityDate = new Date(today);
    maturityDate.setFullYear(today.getFullYear() + yearsToAdd);
    maturityDate.setDate(maturityDate.getDate() + daysToAdd);
    
    // Calculate lock-in date
    const lockInYearsToAdd = Math.floor(lockInPeriod);
    const lockInDaysToAdd = Math.floor((lockInPeriod - lockInYearsToAdd) * 365.25);
    
    const lockInDate = new Date(today);
    lockInDate.setFullYear(today.getFullYear() + lockInYearsToAdd);
    lockInDate.setDate(lockInDate.getDate() + lockInDaysToAdd);
    
    const maturityDateFormatted = maturityDate.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
    });
    
    const lockInDateFormatted = lockInDate.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
    });
    
    const maturityDateFull = maturityDate.toLocaleDateString('en-US', { 
        day: 'numeric',
        month: 'long', 
        year: 'numeric' 
    });
    
    // Generate detailed breakdown
    const yearlyData = generateYearlyBreakdown(investmentAmount, annualRate, maturityYears, interestRate);
    const monthlyData = generateMonthlyBreakdown(investmentAmount, annualRate, Math.min(2, maturityYears));
    
    return {
        investment_amount: investmentAmount,
        interest_rate: interestRate,
        maturity_years: maturityYears,
        lock_in_period: lockInPeriod,
        maturity_amount: maturityAmount,
        lock_in_amount: lockInAmount,
        total_interest: totalInterest,
        lock_in_interest: lockInInterest,
        doubling_period: doublingPeriod,
        maturity_date: maturityDateFormatted,
        lock_in_date: lockInDateFormatted,
        maturity_date_full: maturityDateFull,
        yearly_data: yearlyData,
        monthly_data: monthlyData
    };
}

function generateYearlyBreakdown(investmentAmount, annualRate, years, interestRatePercent) {
    const yearlyData = [];
    
    for (let year = 1; year <= Math.ceil(years); year++) {
        let yearAmount;
        
        // For KVP, calculate gradual progression towards doubling
        if (year >= years) {
            // At maturity, amount is exactly double
            yearAmount = investmentAmount * 2;
        } else {
            // Progressive growth using compound interest during the period
            yearAmount = investmentAmount * Math.pow(1 + annualRate, year);
        }
        
        const interestEarned = yearAmount - investmentAmount;
        
        yearlyData.push({
            year: year,
            amount: yearAmount,
            interest_earned: interestEarned,
            interest_rate: interestRatePercent
        });
    }
    
    return yearlyData;
}

function generateMonthlyBreakdown(investmentAmount, annualRate, years) {
    const monthlyData = [];
    const monthlyRate = annualRate / 12;
    const totalMonths = years * 12;
    
    for (let year = 1; year <= years; year++) {
        for (let month = 1; month <= 12; month++) {
            const monthsElapsed = (year - 1) * 12 + month;
            if (monthsElapsed > totalMonths) break;
            
            const monthAmount = investmentAmount * Math.pow(1 + monthlyRate, monthsElapsed);
            const interestEarned = monthAmount - investmentAmount;
            
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            monthlyData.push({
                year: year,
                month: monthNames[month - 1],
                amount: monthAmount,
                interest_earned: interestEarned
            });
        }
    }
    
    return monthlyData;
}

function updateResultsDisplay(result) {
    // Update result cards
    document.getElementById('maturityAmountResult').textContent = formatCurrency(result.maturity_amount);
    document.getElementById('investmentAmountResult').textContent = formatCurrency(result.investment_amount);
    document.getElementById('interestEarnedResult').textContent = formatCurrency(result.total_interest);
    document.getElementById('maturityDateResult').textContent = result.maturity_date || 'Dec 2034';
    
    // Update chart summary
    document.getElementById('investmentValueDisplay').textContent = formatCurrency(result.investment_amount);
    document.getElementById('interestGainDisplay').textContent = formatCurrency(result.total_interest);
}

function updateChart(result) {
    const ctx = document.getElementById('kvpChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }
    
    const data = {
        labels: ['Investment Amount', 'Interest Earned'],
        datasets: [{
            data: [result.investment_amount, result.total_interest],
            backgroundColor: [
                '#3182ce',
                '#f59e0b'
            ],
            borderColor: [
                '#2c5282',
                '#d97706'
            ],
            borderWidth: 2,
            hoverOffset: 10
        }]
    };
    
    const config = {
        type: 'doughnut',
        data: data,
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
                            const label = context.label;
                            const value = formatCurrency(context.raw);
                            const percentage = ((context.raw / result.maturity_amount) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: formatCurrency(result.investment_amount)
                }
            },
            cutout: '60%'
        }
    };
    
    chart = new Chart(ctx, config);
}

function updateTables(result) {
    updateYearlyTable(result.yearly_data);
    updateMonthlyTable(result.monthly_data);
}

function updateYearlyTable(yearlyData) {
    const tableBody = document.getElementById('yearlyTableBody');
    tableBody.innerHTML = '';
    
    yearlyData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.year}</td>
            <td>${formatCurrency(row.amount)}</td>
            <td>${formatCurrency(row.interest_earned)}</td>
            <td>${row.interest_rate}%</td>
        `;
        tableBody.appendChild(tr);
    });
}

function updateMonthlyTable(monthlyData) {
    const tableBody = document.getElementById('monthlyTableBody');
    tableBody.innerHTML = '';
    
    monthlyData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.month} ${row.year}</td>
            <td>${formatCurrency(row.amount)}</td>
            <td>${formatCurrency(row.interest_earned)}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
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
        
        // Close mega menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });
        
        // Close mega menu when pressing Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                megaMenu.classList.remove('open');
            }
        });
    }
}

function setupTableToggle() {
    // Initially hide the table section
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
    const yearlyBtn = document.querySelector('.toggle-btn');
    const monthlyBtn = document.querySelectorAll('.toggle-btn')[1];
    
    // Show yearly table, hide monthly table
    yearlyTable.classList.remove('hidden');
    monthlyTable.classList.add('hidden');
    
    // Update button states
    yearlyBtn.classList.add('active');
    monthlyBtn.classList.remove('active');
}

function showMonthlyTable() {
    const yearlyTable = document.getElementById('yearlyTable');
    const monthlyTable = document.getElementById('monthlyTable');
    const yearlyBtn = document.querySelector('.toggle-btn');
    const monthlyBtn = document.querySelectorAll('.toggle-btn')[1];
    
    // Show monthly table, hide yearly table
    monthlyTable.classList.remove('hidden');
    yearlyTable.classList.add('hidden');
    
    // Update button states
    monthlyBtn.classList.add('active');
    yearlyBtn.classList.remove('active');
}

function downloadPDF() {
    // Get current calculation results
    const investmentAmount = parseFloat(investmentAmountInput.value) || 0;
    const interestRate = parseFloat(interestRateInput.value) || 0;
    const maturityYears = parseFloat(maturityYearsInput.value) || 1;
    
    // Calculate results for PDF
    const result = calculateKVPReturns(investmentAmount, interestRate, maturityYears);
    
    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Kisan Vikas Patra Calculator Report', 20, 30);
    
    // Input parameters
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Investment Details:', 20, 50);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Investment Amount: ${formatCurrency(result.investment_amount)}`, 20, 65);
    doc.text(`Interest Rate: ${result.interest_rate}% per annum`, 20, 75);
    doc.text(`Lock-in Period: ${result.maturity_years} years`, 20, 85);
    doc.text(`Maturity Date: ${result.maturity_date_full || result.maturity_date}`, 20, 95);
    
    // Results
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Investment Results:', 20, 115);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Maturity Amount: ${formatCurrency(result.maturity_amount)}`, 20, 130);
    doc.text(`Total Interest Earned: ${formatCurrency(result.total_interest)}`, 20, 140);
    doc.text(`Doubling Period: ${result.doubling_period.toFixed(1)} years`, 20, 150);
    
    // Key Benefits
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('KVP Key Benefits:', 20, 170);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('• Government-backed savings scheme', 20, 185);
    doc.text('• Investment doubles at maturity (100% returns)', 20, 195);
    doc.text('• Tax benefits available under Section 80C', 20, 205);
    doc.text('• No maximum investment limit', 20, 215);
    doc.text('• Can be used as collateral for loans', 20, 225);
    
    // Footer
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('Generated on: ' + new Date().toLocaleDateString(), 20, 270);
    doc.text('This is a computer-generated report for illustration purposes only.', 20, 280);
    
    // Save the PDF
    doc.save('kisan-vikas-patra-calculation.pdf');
} 