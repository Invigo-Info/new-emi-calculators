// National Savings Certificate Calculator Script

let chart = null;

// Input elements
const investmentAmountInput = document.getElementById('investmentAmount');
const investmentAmountSlider = document.getElementById('investmentAmountSlider');
const interestRateInput = document.getElementById('interestRate');
const interestRateSlider = document.getElementById('interestRateSlider');
// tenureYears is fixed at 5 years for NSC

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
    syncInputs(interestRateInput, interestRateSlider);
    // tenure is fixed at 5 years for NSC
}

function initialSyncValues() {
    // Ensure initial values are properly synchronized
    investmentAmountSlider.value = investmentAmountInput.value;
    interestRateSlider.value = interestRateInput.value;
    // tenure is fixed at 5 years for NSC
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
    [investmentAmountInput, interestRateInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [investmentAmountSlider, interestRateSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });
}

function calculateAndUpdateResults() {
    const investmentAmount = parseFloat(investmentAmountInput.value) || 0;
    const interestRate = parseFloat(interestRateInput.value) || 0;
    const tenureYears = 5; // Fixed for NSC

    // Send calculation request to backend
    fetch('/calculate-nsc', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            investment_amount: investmentAmount,
            interest_rate: interestRate
            // tenure_years not needed as it's fixed at 5 years
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
        const result = calculateNSCReturns(investmentAmount, interestRate);
        updateResultsDisplay(result);
        updateChart(result);
        updateTables(result);
    });
}

function calculateNSCReturns(investmentAmount, interestRate) {
    // NSC has fixed tenure of 5 years
    const tenureYears = 5;
    
    // Convert percentages to decimal
    const annualRate = interestRate / 100;
    
    // Calculate maturity amount using compound interest
    const maturityAmount = investmentAmount * Math.pow(1 + annualRate, tenureYears);
    
    // Calculate total interest earned
    const totalInterest = maturityAmount - investmentAmount;
    
    // Calculate tax benefit (80C allows deduction up to ₹1.5 lakh)
    const max80cLimit = 150000;
    const taxBenefit = Math.min(investmentAmount, max80cLimit);
    
    // Generate detailed breakdown
    const yearlyData = generateYearlyBreakdown(investmentAmount, annualRate, tenureYears);
    const monthlyData = generateMonthlyBreakdown(investmentAmount, annualRate, tenureYears);
    
    return {
        investment_amount: investmentAmount,
        maturity_amount: maturityAmount,
        total_interest: totalInterest,
        tax_benefit: taxBenefit,
        yearly_data: yearlyData,
        monthly_data: monthlyData
    };
}

function generateYearlyBreakdown(investmentAmount, interestRate, years) {
    const yearlyData = [];
    let cumulativeAmount = investmentAmount;
    
    for (let year = 1; year <= years; year++) {
        const yearEndAmount = investmentAmount * Math.pow(1 + interestRate, year);
        const yearInterest = yearEndAmount - cumulativeAmount;
        const cumulativeInterest = yearEndAmount - investmentAmount;
        
        yearlyData.push({
            year: year,
            opening_balance: cumulativeAmount,
            interest_earned: yearInterest,
            closing_balance: yearEndAmount,
            cumulative_interest: cumulativeInterest
        });
        cumulativeAmount = yearEndAmount;
    }
    
    return yearlyData;
}

function generateMonthlyBreakdown(investmentAmount, interestRate, years) {
    const monthlyData = [];
    const totalMonths = Math.min(years * 12, 24); // Show max 2 years monthly
    const monthlyInterestRate = interestRate / 12;
    
    for (let month = 1; month <= totalMonths; month++) {
        const monthsFactor = month / 12.0;
        const monthAmount = investmentAmount * Math.pow(1 + interestRate, monthsFactor);
        const monthInterest = monthAmount - investmentAmount;
        
        const year = Math.ceil(month / 12);
        const monthInYear = ((month - 1) % 12) + 1;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        monthlyData.push({
            year: year,
            month: monthNames[monthInYear - 1],
            amount: monthAmount,
            interest_earned: monthInterest
        });
    }
    
    return monthlyData;
}

function updateResultsDisplay(result) {
    // Update result cards
    document.getElementById('maturityAmountResult').textContent = formatCurrency(result.maturity_amount);
    document.getElementById('investmentValueResult').textContent = formatCurrency(result.investment_amount);
    document.getElementById('interestEarnedResult').textContent = formatCurrency(result.total_interest);
    document.getElementById('taxBenefitResult').textContent = formatCurrency(result.tax_benefit);
    
    // Update chart summary
    document.getElementById('principalDisplay').textContent = formatCurrency(result.investment_amount);
    document.getElementById('interestGainDisplay').textContent = formatCurrency(result.total_interest);
}

function updateChart(result) {
    const ctx = document.getElementById('nscChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }
    
    const data = {
        labels: ['Principal Amount', 'Interest Earned'],
        datasets: [{
            data: [result.investment_amount, result.total_interest],
            backgroundColor: [
                'rgba(49, 130, 206, 0.8)',
                'rgba(5, 150, 105, 0.8)'
            ],
            borderColor: [
                'rgba(49, 130, 206, 1)',
                'rgba(5, 150, 105, 1)'
            ],
            borderWidth: 2
        }]
    };
    
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: formatCurrency(result.investment_amount)
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
            <td>${formatCurrency(row.opening_balance)}</td>
            <td>${formatCurrency(row.interest_earned)}</td>
            <td>${formatCurrency(row.closing_balance)}</td>
            <td>${formatCurrency(row.cumulative_interest)}</td>
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
            <td>${formatCurrency(row.amount)}</td>
            <td>${formatCurrency(row.interest_earned)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function formatCurrency(amount) {
    if (amount >= 10000000) { // 1 Crore
        return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
    } else if (amount >= 100000) { // 1 Lakh
        return '₹' + (amount / 100000).toFixed(2) + ' L';
    } else {
        return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }
}

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
        
        // Close mega menu when pressing escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                megaMenu.classList.remove('open');
            }
        });
    }
}

function setupTableToggle() {
    const yearlyBtn = document.getElementById('yearlyBtn');
    const monthlyBtn = document.getElementById('monthlyBtn');
    
    if (yearlyBtn && monthlyBtn) {
        // Set initial state
        yearlyBtn.classList.add('active');
        monthlyBtn.classList.remove('active');
    }
}

function toggleTable() {
    const tableSection = document.getElementById('tableSection');
    if (tableSection) {
        tableSection.classList.toggle('hidden');
    }
}

function showYearlyTable() {
    const yearlyBtn = document.getElementById('yearlyBtn');
    const monthlyBtn = document.getElementById('monthlyBtn');
    const yearlyContainer = document.getElementById('yearlyTableContainer');
    const monthlyContainer = document.getElementById('monthlyTableContainer');
    
    // Update button states
    yearlyBtn.classList.add('active');
    monthlyBtn.classList.remove('active');
    
    // Show/hide tables
    yearlyContainer.classList.remove('hidden');
    monthlyContainer.classList.add('hidden');
}

function showMonthlyTable() {
    const yearlyBtn = document.getElementById('yearlyBtn');
    const monthlyBtn = document.getElementById('monthlyBtn');
    const yearlyContainer = document.getElementById('yearlyTableContainer');
    const monthlyContainer = document.getElementById('monthlyTableContainer');
    
    // Update button states
    yearlyBtn.classList.remove('active');
    monthlyBtn.classList.add('active');
    
    // Show/hide tables
    yearlyContainer.classList.add('hidden');
    monthlyContainer.classList.remove('hidden');
}

function downloadPDF() {
    // Get current values
    const investmentAmount = parseFloat(investmentAmountInput.value) || 0;
    const interestRate = parseFloat(interestRateInput.value) || 0;
    const tenureYears = 5; // Fixed for NSC
    
    // Calculate results
    const result = calculateNSCReturns(investmentAmount, interestRate);
    
    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105);
    doc.text('National Savings Certificate Calculator', 20, 30);
    
    // Add input parameters
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Investment Parameters:', 20, 50);
    
    doc.setFontSize(12);
    doc.text(`Investment Amount: ${formatCurrency(investmentAmount)}`, 20, 65);
    doc.text(`Interest Rate: ${interestRate}% per annum`, 20, 75);
    doc.text(`Investment Tenure: ${tenureYears} years (Fixed)`, 20, 85);
    
    // Add results
    doc.setFontSize(14);
    doc.text('Investment Results:', 20, 105);
    
    doc.setFontSize(12);
    doc.text(`Maturity Amount: ${formatCurrency(result.maturity_amount)}`, 20, 120);
    doc.text(`Total Interest Earned: ${formatCurrency(result.total_interest)}`, 20, 130);
    doc.text(`Tax Benefit (80C): ${formatCurrency(result.tax_benefit)}`, 20, 140);
    
    // Add yearly breakdown
    if (result.yearly_data && result.yearly_data.length > 0) {
        doc.setFontSize(14);
        doc.text('Yearly Breakdown:', 20, 160);
        
        doc.setFontSize(10);
        let yPos = 175;
        doc.text('Year | Opening Balance | Interest Earned | Closing Balance | Cumulative Interest', 20, yPos);
        
        result.yearly_data.forEach((row, index) => {
            yPos += 10;
            if (yPos > 270) { // Start new page if needed
                doc.addPage();
                yPos = 20;
            }
            doc.text(`${row.year} | ${formatCurrency(row.opening_balance)} | ${formatCurrency(row.interest_earned)} | ${formatCurrency(row.closing_balance)} | ${formatCurrency(row.cumulative_interest)}`, 20, yPos);
        });
    }
    
    // Add footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by NSC Calculator', 20, 280);
    doc.text(new Date().toLocaleDateString(), 20, 285);
    
    // Save the PDF
    doc.save('nsc-calculation.pdf');
} 