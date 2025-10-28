// CGTMSE Loan EMI Calculator JavaScript - Matching Personal Loan Layout

// Global variables
let cgtmsePaymentBreakupChart;
let cgtmseCurrentTenureUnit = 'years'; // 'years' or 'months'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    cgtmseSetupEventListeners();
    cgtmseUpdateSliderFromInput();
    cgtmseCalculateAndUpdate();
});

function cgtmseSetupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'cgtmseLoanAmount', slider: 'cgtmseLoanAmountSlider', min: 10000, max: 100000000 },
        { input: 'cgtmseInterestRate', slider: 'cgtmseInterestRateSlider', min: 0, max: 40 },
        { input: 'cgtmseRiskPremium', slider: 'cgtmseRiskPremiumSlider', min: 0, max: 70 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                cgtmseCalculateAndUpdate();
            });
            
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                cgtmseCalculateAndUpdate();
            });
        }
    });
    
    cgtmseSetupTenureEventListeners();
    
    document.getElementById('cgtmseConcession').addEventListener('change', cgtmseCalculateAndUpdate);
    document.getElementById('cgtmsePassAgf').addEventListener('change', cgtmseCalculateAndUpdate);
}

function cgtmseSetupTenureEventListeners() {
    const tenureValueInput = document.getElementById('cgtmseTenureValue');
    const tenureSlider = document.getElementById('cgtmseTenureSlider');
    const tenureYrBtn = document.getElementById('cgtmseTenureYrBtn');
    const tenureMoBtn = document.getElementById('cgtmseTenureMoBtn');
    
    cgtmseSetTenureMode('years');
    
    tenureValueInput.addEventListener('input', function() {
        cgtmseUpdateSliderFromInput();
        cgtmseCalculateAndUpdate();
    });
    
    tenureSlider.addEventListener('input', function() {
        cgtmseUpdateInputFromSlider();
        cgtmseCalculateAndUpdate();
    });
    
    tenureYrBtn.addEventListener('click', function() {
        if (cgtmseCurrentTenureUnit !== 'years') {
            cgtmseSetTenureMode('years');
        }
    });
    
    tenureMoBtn.addEventListener('click', function() {
        if (cgtmseCurrentTenureUnit !== 'months') {
            cgtmseSetTenureMode('months');
        }
    });
}

function cgtmseSetTenureMode(unit) {
    const previousUnit = cgtmseCurrentTenureUnit;
    cgtmseCurrentTenureUnit = unit;
    
    const tenureValueInput = document.getElementById('cgtmseTenureValue');
    const tenureSlider = document.getElementById('cgtmseTenureSlider');
    const tenureYrBtn = document.getElementById('cgtmseTenureYrBtn');
    const tenureMoBtn = document.getElementById('cgtmseTenureMoBtn');
    const tenureSliderLabels = document.getElementById('cgtmseTenureSliderLabels');
    
    tenureYrBtn.classList.toggle('active', unit === 'years');
    tenureMoBtn.classList.toggle('active', unit === 'months');
    
    const currentValue = parseFloat(tenureValueInput.value) || (unit === 'years' ? 5 : 60);
    
    if (unit === 'years') {
        let years;
        if (previousUnit === 'months') {
            years = Math.round(currentValue / 12 * 2) / 2;
        } else {
            years = currentValue;
        }
        
        tenureValueInput.value = years;
        tenureValueInput.step = '0.5';
        tenureValueInput.min = '0.5';
        tenureValueInput.max = '10';
        
        tenureSlider.min = '0.5';
        tenureSlider.max = '10';
        tenureSlider.step = '0.5';
        tenureSlider.value = years;
        
        tenureSliderLabels.innerHTML = `
            <span>0.5</span>
            <span>2</span>
            <span>4</span>
            <span>6</span>
            <span>8</span>
            <span>10</span>
        `;
    } else {
        let months;
        if (previousUnit === 'years') {
            months = Math.round(currentValue * 12);
        } else {
            months = Math.round(currentValue);
        }
        
        tenureValueInput.value = months;
        tenureValueInput.step = '1';
        tenureValueInput.min = '6';
        tenureValueInput.max = '120';
        
        tenureSlider.min = '6';
        tenureSlider.max = '120';
        tenureSlider.step = '1';
        tenureSlider.value = months;
        
        tenureSliderLabels.innerHTML = `
            <span>6</span>
            <span>24</span>
            <span>48</span>
            <span>72</span>
            <span>96</span>
            <span>120</span>
        `;
    }
    
    cgtmseUpdateSliderFromInput();
    cgtmseCalculateAndUpdate();
}

function cgtmseUpdateSliderFromInput() {
    const tenureValueInput = document.getElementById('cgtmseTenureValue');
    const tenureSlider = document.getElementById('cgtmseTenureSlider');
    
    const value = parseFloat(tenureValueInput.value) || 0;
    const min = parseFloat(tenureSlider.min);
    const max = parseFloat(tenureSlider.max);
    
    tenureSlider.value = Math.min(Math.max(value, min), max);
}

function cgtmseUpdateInputFromSlider() {
    const tenureValueInput = document.getElementById('cgtmseTenureValue');
    const tenureSlider = document.getElementById('cgtmseTenureSlider');
    
    tenureValueInput.value = tenureSlider.value;
}

// CGTMSE calculation functions
function cgtmseAgfSrFromAmount(amount) {
    if (amount <= 1000000) return 0.37;
    if (amount <= 5000000) return 0.55;
    if (amount <= 10000000) return 0.60;
    if (amount <= 20000000) return 0.85;
    if (amount <= 50000000) return 1.00;
    if (amount <= 80000000) return 1.10;
    return 1.20;
}

function cgtmseAgfEffectiveRate(sr, concessionPct = 0, riskPremiumPct = 0) {
    const discounted = sr * (1 - (concessionPct / 100));
    return discounted * (1 + (riskPremiumPct / 100));
}

function cgtmseEmiCalculation(principal, annualPct, months) {
    const r = (annualPct / 12) / 100;
    if (months <= 0) return 0;
    if (r === 0) return principal / months;
    const x = Math.pow(1 + r, months);
    return principal * r * x / (x - 1);
}

function cgtmseTotalsCalculation(principal, annualPct, months) {
    const emi = cgtmseEmiCalculation(principal, annualPct, months);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;
    return { emi, totalPayment, totalInterest };
}

function cgtmseOutstandingAfterMonths(principal, annualPct, months, m) {
    const emi = cgtmseEmiCalculation(principal, annualPct, months);
    const r = (annualPct / 12) / 100;
    let balance = principal;
    
    for (let i = 0; i < m; i++) {
        const interest = balance * r;
        const principalPmt = emi - interest;
        balance -= principalPmt;
        if (balance < 0) balance = 0;
    }
    
    return balance;
}

function cgtmseAgfSchedule(principal, annualPct, months, sr, concessionPct = 0, riskPremiumPct = 0) {
    const rate = cgtmseAgfEffectiveRate(sr, concessionPct, riskPremiumPct) / 100;
    const years = Math.floor(months / 12);
    const remainder = months % 12;
    const rows = [];
    let opening = principal;
    let totalAgf = 0;

    for (let y = 1; y <= years; y++) {
        const fee = opening * rate;
        totalAgf += fee;
        const closing = cgtmseOutstandingAfterMonths(principal, annualPct, months, y * 12);
        rows.push({
            year: y,
            opening: opening,
            closing: closing,
            months: 12,
            fee: fee
        });
        opening = closing;
    }

    if (remainder > 0) {
        const fee = opening * rate * (remainder / 12);
        totalAgf += fee;
        const closing = cgtmseOutstandingAfterMonths(principal, annualPct, months, months);
        rows.push({
            year: years + 1,
            opening: opening,
            closing: closing,
            months: remainder,
            fee: fee
        });
    }

    return {
        rows: rows,
        total: totalAgf,
        effectiveRatePercent: rate * 100
    };
}

function cgtmseCalculateAndUpdate() {
    const loanAmount = parseFloat(document.getElementById('cgtmseLoanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('cgtmseInterestRate').value) || 0;
    const tenureValue = parseFloat(document.getElementById('cgtmseTenureValue').value) || 0;
    const concessionPct = parseFloat(document.getElementById('cgtmseConcession').value) || 0;
    const riskPremiumPct = parseFloat(document.getElementById('cgtmseRiskPremium').value) || 0;
    const passAgf = document.getElementById('cgtmsePassAgf').checked;
    
    let totalMonths = 0;
    if (cgtmseCurrentTenureUnit === 'years') {
        totalMonths = Math.round(tenureValue * 12);
    } else {
        totalMonths = Math.round(tenureValue);
    }
    
    if (loanAmount > 0 && interestRate >= 0 && totalMonths > 0) {
        const results = cgtmseTotalsCalculation(loanAmount, interestRate, totalMonths);
        
        document.getElementById('cgtmseMonthlyEmi').textContent = cgtmseFormatCurrency(results.emi);
        document.getElementById('cgtmsePrincipalAmount').textContent = cgtmseFormatCurrency(loanAmount);
        document.getElementById('cgtmseTotalInterest').textContent = cgtmseFormatCurrency(results.totalInterest);
        document.getElementById('cgtmseTotalPayment').textContent = cgtmseFormatCurrency(results.totalPayment);
        
        let agfData = null;
        if (passAgf) {
            const sr = cgtmseAgfSrFromAmount(loanAmount);
            agfData = cgtmseAgfSchedule(loanAmount, interestRate, totalMonths, sr, concessionPct, riskPremiumPct);
            
            document.getElementById('cgtmseAgfTotal').textContent = cgtmseFormatCurrency(agfData.total);
            document.getElementById('cgtmseEffectiveAgfRate').textContent = agfData.effectiveRatePercent.toFixed(3) + '%';
            
            let tableHtml = '';
            agfData.rows.forEach(row => {
                tableHtml += `
                    <tr>
                        <td>${row.year}</td>
                        <td>${cgtmseFormatCurrency(row.opening)}</td>
                        <td>${row.months}</td>
                        <td>${cgtmseFormatCurrency(row.fee)}</td>
                    </tr>
                `;
            });
            document.getElementById('cgtmseAgfTableBody').innerHTML = tableHtml;
            
            const grandTotal = results.totalPayment + agfData.total;
            document.getElementById('cgtmseGrandTotal').textContent = cgtmseFormatCurrency(grandTotal);
            
            document.getElementById('cgtmseAgfResult').style.display = 'block';
            document.getElementById('cgtmseGrandTotalResult').style.display = 'block';
            document.getElementById('cgtmseAgfScheduleSection').style.display = 'block';
            document.getElementById('cgtmseAgfSummary').style.display = 'block';
        } else {
            document.getElementById('cgtmseAgfResult').style.display = 'none';
            document.getElementById('cgtmseGrandTotalResult').style.display = 'none';
            document.getElementById('cgtmseAgfScheduleSection').style.display = 'none';
            document.getElementById('cgtmseAgfSummary').style.display = 'none';
        }
        
        cgtmseUpdateChart(results, agfData);
        
        const totalForPercentage = passAgf && agfData ? 
            results.totalPayment + agfData.total : results.totalPayment;
            
        const principalPercentage = (loanAmount / totalForPercentage) * 100;
        const interestPercentage = (results.totalInterest / totalForPercentage) * 100;
        const agfPercentage = passAgf && agfData ? (agfData.total / totalForPercentage) * 100 : 0;
        
        document.getElementById('cgtmsePrincipalPercentage').textContent = principalPercentage.toFixed(1) + '%';
        document.getElementById('cgtmseInterestPercentage').textContent = interestPercentage.toFixed(1) + '%';
        if (passAgf && agfData) {
            document.getElementById('cgtmseAgfPercentage').textContent = agfPercentage.toFixed(1) + '%';
        }
    }
}

function cgtmseUpdateChart(results, agfData) {
    const ctx = document.getElementById('cgtmsePaymentBreakupChart').getContext('2d');
    
    if (cgtmsePaymentBreakupChart) {
        cgtmsePaymentBreakupChart.destroy();
    }
    
    const chartData = {
        labels: ['Principal Amount', 'Total Interest'],
        datasets: [{
            data: [results.totalPayment - results.totalInterest, results.totalInterest],
            backgroundColor: ['#14B8A6', '#F59E0B'],
            borderWidth: 0,
            cutout: '60%'
        }]
    };
    
    if (agfData && document.getElementById('cgtmsePassAgf').checked) {
        chartData.labels.push('AGF Charges');
        chartData.datasets[0].data.push(agfData.total);
        chartData.datasets[0].backgroundColor.push('#8B5CF6');
    }
    
    cgtmsePaymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
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
                            const value = context.parsed;
                            const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return context.label + ': ' + cgtmseFormatCurrency(value) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function cgtmseFormatCurrency(amount) {
    if (amount >= 10000000) {
        return '₹ ' + (amount / 10000000).toFixed(2) + ' Cr';
    } else if (amount >= 100000) {
        return '₹ ' + (amount / 100000).toFixed(2) + ' L';
    } else {
        return '₹ ' + Math.round(amount).toLocaleString('en-IN');
    }
}

// Mega Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const megaMenu = document.querySelector('.mega-menu');
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenuContent = document.querySelector('.mega-menu-content');

    if (megaMenuBtn && megaMenu) {
        megaMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            megaMenu.classList.toggle('active');
        });

        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('active');
            }
        });

        if (megaMenuContent) {
            const megaLinks = megaMenuContent.querySelectorAll('.mega-link');
            megaLinks.forEach(function(link) {
                link.addEventListener('click', function() {
                    megaMenu.classList.remove('active');
                });
            });
        }

        if (megaMenuContent) {
            megaMenuContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
});
