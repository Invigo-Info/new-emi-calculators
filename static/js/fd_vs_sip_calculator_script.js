// FD vs SIP Calculator JavaScript

// Global variables
let isCalculating = false;

// DOM Elements
const fdMonthlyInvestment = document.getElementById('fdMonthlyInvestment');
const fdMonthlyInvestmentSlider = document.getElementById('fdMonthlyInvestmentSlider');
const fdDurationYears = document.getElementById('fdDurationYears');
const fdDurationYearsSlider = document.getElementById('fdDurationYearsSlider');
const fdInterestRate = document.getElementById('fdInterestRate');
const fdInterestRateSlider = document.getElementById('fdInterestRateSlider');
const fdCompoundingFrequency = document.getElementById('fdCompoundingFrequency');

const sipMonthlyAmount = document.getElementById('sipMonthlyAmount');
const sipMonthlyAmountSlider = document.getElementById('sipMonthlyAmountSlider');
const sipDurationYears = document.getElementById('sipDurationYears');
const sipDurationYearsSlider = document.getElementById('sipDurationYearsSlider');
const sipExpectedCagr = document.getElementById('sipExpectedCagr');
const sipExpectedCagrSlider = document.getElementById('sipExpectedCagrSlider');

// Result elements
const fdTotalInvestedResult = document.getElementById('fdTotalInvestedResult');
const fdMaturityValueResult = document.getElementById('fdMaturityValueResult');
const fdInterestEarnedResult = document.getElementById('fdInterestEarnedResult');

const sipTotalInvestedResult = document.getElementById('sipTotalInvestedResult');
const sipEstimatedValueResult = document.getElementById('sipEstimatedValueResult');
const sipGainResult = document.getElementById('sipGainResult');

const betterOptionResult = document.getElementById('betterOptionResult');
const differenceReturnsResult = document.getElementById('differenceReturnsResult');

// Utility Functions
function formatCurrency(amount) {
    if (amount >= 10000000) { // 1 crore
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) { // 1 lakh
        return `₹${(amount / 100000).toFixed(2)} L`;
    } else if (amount >= 1000) { // 1 thousand
        return `₹${(amount / 1000).toFixed(1)} K`;
    } else {
        return `₹${Math.round(amount).toLocaleString('en-IN')}`;
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    
    notificationMessage.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

// Input Synchronization Functions
function syncInputs() {
    // FD inputs
    fdMonthlyInvestment.addEventListener('input', () => {
        fdMonthlyInvestmentSlider.value = fdMonthlyInvestment.value;
        calculateFdVsSip();
    });
    
    fdMonthlyInvestmentSlider.addEventListener('input', () => {
        fdMonthlyInvestment.value = fdMonthlyInvestmentSlider.value;
        calculateFdVsSip();
    });
    
    fdDurationYears.addEventListener('input', () => {
        fdDurationYearsSlider.value = fdDurationYears.value;
        sipDurationYears.value = fdDurationYears.value;
        sipDurationYearsSlider.value = fdDurationYears.value;
        calculateFdVsSip();
    });
    
    fdDurationYearsSlider.addEventListener('input', () => {
        fdDurationYears.value = fdDurationYearsSlider.value;
        sipDurationYears.value = fdDurationYearsSlider.value;
        sipDurationYearsSlider.value = fdDurationYearsSlider.value;
        calculateFdVsSip();
    });
    
    fdInterestRate.addEventListener('input', () => {
        fdInterestRateSlider.value = fdInterestRate.value;
        calculateFdVsSip();
    });
    
    fdInterestRateSlider.addEventListener('input', () => {
        fdInterestRate.value = fdInterestRateSlider.value;
        calculateFdVsSip();
    });
    
    fdCompoundingFrequency.addEventListener('change', calculateFdVsSip);
    
    // SIP inputs
    sipMonthlyAmount.addEventListener('input', () => {
        sipMonthlyAmountSlider.value = sipMonthlyAmount.value;
        fdMonthlyInvestment.value = sipMonthlyAmount.value;
        fdMonthlyInvestmentSlider.value = sipMonthlyAmount.value;
        calculateFdVsSip();
    });
    
    sipMonthlyAmountSlider.addEventListener('input', () => {
        sipMonthlyAmount.value = sipMonthlyAmountSlider.value;
        fdMonthlyInvestment.value = sipMonthlyAmountSlider.value;
        fdMonthlyInvestmentSlider.value = sipMonthlyAmountSlider.value;
        calculateFdVsSip();
    });
    
    sipDurationYears.addEventListener('input', () => {
        sipDurationYearsSlider.value = sipDurationYears.value;
        fdDurationYears.value = sipDurationYears.value;
        fdDurationYearsSlider.value = sipDurationYears.value;
        calculateFdVsSip();
    });
    
    sipDurationYearsSlider.addEventListener('input', () => {
        sipDurationYears.value = sipDurationYearsSlider.value;
        fdDurationYears.value = sipDurationYearsSlider.value;
        fdDurationYearsSlider.value = sipDurationYearsSlider.value;
        calculateFdVsSip();
    });
    
    sipExpectedCagr.addEventListener('input', () => {
        sipExpectedCagrSlider.value = sipExpectedCagr.value;
        calculateFdVsSip();
    });
    
    sipExpectedCagrSlider.addEventListener('input', () => {
        sipExpectedCagr.value = sipExpectedCagrSlider.value;
        calculateFdVsSip();
    });
}

// Validation Functions
function validateInputs() {
    const fdMonthlyInv = parseFloat(fdMonthlyInvestment.value) || 0;
    const fdDuration = parseInt(fdDurationYears.value) || 0;
    const fdRate = parseFloat(fdInterestRate.value) || 0;
    
    const sipMonthlyInv = parseFloat(sipMonthlyAmount.value) || 0;
    const sipDuration = parseInt(sipDurationYears.value) || 0;
    const sipCagr = parseFloat(sipExpectedCagr.value) || 0;
    
    if (fdMonthlyInv <= 0 || sipMonthlyInv <= 0) {
        showNotification('Monthly investment amount must be greater than 0', 'error');
        return false;
    }
    
    if (fdDuration <= 0 || sipDuration <= 0) {
        showNotification('Investment duration must be greater than 0', 'error');
        return false;
    }
    
    if (fdRate < 0 || sipCagr < 0) {
        showNotification('Interest/Return rates cannot be negative', 'error');
        return false;
    }
    
    if (fdMonthlyInv > 100000 || sipMonthlyInv > 100000) {
        showNotification('Monthly investment cannot exceed ₹1,00,000', 'error');
        return false;
    }
    
    if (fdDuration > 30 || sipDuration > 30) {
        showNotification('Investment duration cannot exceed 30 years', 'error');
        return false;
    }
    
    return true;
}

// Main Calculation Function
async function calculateFdVsSip() {
    if (isCalculating) return;
    
    if (!validateInputs()) return;
    
    isCalculating = true;
    showLoading();
    
    try {
        const requestData = {
            fdMonthlyInvestment: parseFloat(fdMonthlyInvestment.value),
            fdDurationYears: parseInt(fdDurationYears.value),
            fdInterestRate: parseFloat(fdInterestRate.value),
            fdCompoundingFrequency: fdCompoundingFrequency.value,
            sipMonthlyAmount: parseFloat(sipMonthlyAmount.value),
            sipDurationYears: parseInt(sipDurationYears.value),
            sipExpectedCagr: parseFloat(sipExpectedCagr.value)
        };
        
        const response = await fetch('/calculate-fd-vs-sip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
            showNotification(data.error, 'error');
            return;
        }
        
        updateResults(data);
        updateAnalysisCharts(data);
        updateComparisonTable(data);
        
    } catch (error) {
        console.error('Error calculating FD vs SIP:', error);
        showNotification('Calculation error. Please check your inputs.', 'error');
    } finally {
        hideLoading();
        isCalculating = false;
    }
}

// Update Results Function
function updateResults(data) {
    const fdResults = data.fd_results;
    const sipResults = data.sip_results;
    const comparison = data.comparison;
    
    // Update FD results
    fdTotalInvestedResult.textContent = formatCurrency(fdResults.total_invested);
    fdMaturityValueResult.textContent = formatCurrency(fdResults.maturity_value);
    fdInterestEarnedResult.textContent = formatCurrency(fdResults.interest_earned);
    
    // Update SIP results
    sipTotalInvestedResult.textContent = formatCurrency(sipResults.total_invested);
    sipEstimatedValueResult.textContent = formatCurrency(sipResults.estimated_value);
    sipGainResult.textContent = formatCurrency(sipResults.gain_from_sip);
    
    // Update comparison results
    betterOptionResult.textContent = comparison.better_option;
    differenceReturnsResult.textContent = formatCurrency(comparison.difference);
    
    // Style the better option card
    const betterCard = betterOptionResult.closest('.result-card');
    if (comparison.better_option === 'FD') {
        betterCard.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        betterCard.style.color = 'white';
    } else if (comparison.better_option === 'SIP') {
        betterCard.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        betterCard.style.color = 'white';
    } else {
        betterCard.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
        betterCard.style.color = 'white';
    }
}

// Analysis Charts Functions
let analysisComparisonChart = null;
let breakdownChart = null;

function updateAnalysisCharts(data) {
    const fdResults = data.fd_results;
    const sipResults = data.sip_results;
    
    // Update Analysis Bar Chart
    updateAnalysisComparisonChart(fdResults, sipResults);
    
    // Update Pie Chart
    updateBreakdownChart(fdResults, sipResults);
    
    // Update Summary Values
    updateSummaryValues(fdResults, sipResults);
}

function updateAnalysisComparisonChart(fdResults, sipResults) {
    const ctx = document.getElementById('analysisComparisonChart').getContext('2d');
    
    if (analysisComparisonChart) {
        analysisComparisonChart.destroy();
    }
    
    analysisComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total Invested', 'Interest/Gain', 'Maturity Value'],
            datasets: [
                {
                    label: 'FD',
                    data: [fdResults.total_invested, fdResults.interest_earned, fdResults.maturity_value],
                    backgroundColor: 'rgba(240, 147, 251, 0.8)',
                    borderColor: 'rgba(240, 147, 251, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                },
                {
                    label: 'SIP',
                    data: [sipResults.total_invested, sipResults.gain_from_sip, sipResults.estimated_value],
                    backgroundColor: 'rgba(79, 172, 254, 0.8)',
                    borderColor: 'rgba(79, 172, 254, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'FD vs SIP Comparison',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top',
                    labels: { usePointStyle: true, padding: 20 }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(79, 172, 254, 1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyShort(value);
                        }
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateBreakdownChart(fdResults, sipResults) {
    const ctx = document.getElementById('breakdownChart').getContext('2d');
    
    if (breakdownChart) {
        breakdownChart.destroy();
    }
    
    breakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['FD Investment', 'FD Interest', 'SIP Investment', 'SIP Gain'],
            datasets: [{
                data: [fdResults.total_invested, fdResults.interest_earned, sipResults.total_invested, sipResults.gain_from_sip],
                backgroundColor: [
                    'rgba(240, 147, 251, 0.8)',
                    'rgba(245, 87, 108, 0.8)',
                    'rgba(79, 172, 254, 0.8)',
                    'rgba(0, 242, 254, 0.8)'
                ],
                borderColor: [
                    'rgba(240, 147, 251, 1)',
                    'rgba(245, 87, 108, 1)',
                    'rgba(79, 172, 254, 1)',
                    'rgba(0, 242, 254, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 15, font: { size: 12 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(79, 172, 254, 1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + formatCurrency(context.parsed) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function updateSummaryValues(fdResults, sipResults) {
    // FD Summary
    document.getElementById('fdNetGain').textContent = formatCurrency(fdResults.interest_earned);
    
    const fdTotalReturn = ((fdResults.maturity_value - fdResults.total_invested) / fdResults.total_invested * 100);
    document.getElementById('fdTotalReturn').textContent = fdTotalReturn.toFixed(2) + '%';
    
    const fdAnnualReturn = parseFloat(document.getElementById('fdInterestRate').value);
    document.getElementById('fdAnnualReturn').textContent = fdAnnualReturn.toFixed(1) + '%';
    
    // SIP Summary
    document.getElementById('sipNetGain').textContent = formatCurrency(sipResults.gain_from_sip);
    
    const sipTotalReturn = ((sipResults.estimated_value - sipResults.total_invested) / sipResults.total_invested * 100);
    document.getElementById('sipTotalReturn').textContent = sipTotalReturn.toFixed(2) + '%';
    
    const sipAnnualReturn = parseFloat(document.getElementById('sipExpectedCagr').value);
    document.getElementById('sipAnnualReturn').textContent = sipAnnualReturn.toFixed(1) + '%';
}

// Year-wise Comparison Table
function updateComparisonTable(data) {
    const fdDuration = parseInt(document.getElementById('fdDurationYears').value);
    const sipDuration = parseInt(document.getElementById('sipDurationYears').value);
    const duration = Math.max(fdDuration, sipDuration);
    
    const fdMonthly = parseFloat(document.getElementById('fdMonthlyInvestment').value);
    const fdRate = parseFloat(document.getElementById('fdInterestRate').value) / 100;
    const fdCompounding = document.getElementById('fdCompoundingFrequency').value;
    
    const sipMonthly = parseFloat(document.getElementById('sipMonthlyAmount').value);
    const sipRate = parseFloat(document.getElementById('sipExpectedCagr').value) / 100;
    
    const tableBody = document.getElementById('comparisonTableBody');
    tableBody.innerHTML = '';
    
    for (let year = 1; year <= duration; year++) {
        const fdData = calculateYearlyFD(year, fdMonthly, fdRate, fdCompounding, fdDuration);
        const sipData = calculateYearlySIP(year, sipMonthly, sipRate, sipDuration);
        
        const betterOption = sipData.balance > fdData.balance ? 'SIP' : 'FD';
        const advantage = Math.abs(sipData.balance - fdData.balance);
        const betterOptionClass = betterOption === 'FD' ? 'fd-better' : 'sip-better';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="year-cell">${year}</td>
            <td class="amount-cell">${formatCurrencyShort(fdData.invested)}</td>
            <td class="amount-cell">${formatCurrencyShort(fdData.interest)}</td>
            <td class="balance-cell">${formatCurrencyShort(fdData.balance)}</td>
            <td class="amount-cell">${formatCurrencyShort(sipData.invested)}</td>
            <td class="amount-cell">${formatCurrencyShort(sipData.returns)}</td>
            <td class="balance-cell">${formatCurrencyShort(sipData.balance)}</td>
            <td class="better-option-cell ${betterOptionClass}">${betterOption}</td>
            <td class="amount-cell">${formatCurrencyShort(advantage)}</td>
        `;
        
        tableBody.appendChild(row);
    }
}

function calculateYearlyFD(year, monthly, rate, compounding, maxDuration) {
    if (year > maxDuration) {
        return { invested: 0, interest: 0, balance: 0 };
    }
    
    const invested = monthly * 12 * year;
    const n = compounding === 'monthly' ? 12 : compounding === 'quarterly' ? 4 : 1;
    const r = rate / n;
    const t = year;
    
    let balance = 0;
    for (let i = 1; i <= year; i++) {
        const principal = monthly * 12;
        const periods = (year - i + 1) * n;
        balance += principal * Math.pow(1 + r, periods);
    }
    
    const interest = balance - invested;
    
    return { invested, interest, balance };
}

function calculateYearlySIP(year, monthly, rate, maxDuration) {
    if (year > maxDuration) {
        return { invested: 0, returns: 0, balance: 0 };
    }
    
    const invested = monthly * 12 * year;
    const monthlyRate = rate / 12;
    const months = year * 12;
    
    // SIP formula: PMT * [(1 + r)^n - 1] / r
    const balance = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const returns = balance - invested;
    
    return { invested, returns, balance };
}

// Utility function for short currency format
function formatCurrencyShort(amount) {
    if (amount >= 10000000) {
        return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
    } else if (amount >= 100000) {
        return '₹' + (amount / 100000).toFixed(1) + 'L';
    } else if (amount >= 1000) {
        return '₹' + (amount / 1000).toFixed(1) + 'K';
    } else {
        return '₹' + Math.round(amount);
    }
}

// Download Functions
function downloadPDF() {
    showNotification('PDF download feature will be available soon!', 'info');
}

function downloadExcel() {
    showNotification('Excel download feature will be available soon!', 'info');
}

function shareResults() {
    if (navigator.share) {
        navigator.share({
            title: 'FD vs SIP Calculator Results',
            text: 'Check out my FD vs SIP comparison results!',
            url: window.location.href
        });
    } else {
        // Fallback: copy URL to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            showNotification('URL copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Unable to share. Please copy the URL manually.', 'error');
        });
    }
}

// Navigation Mega Menu Functions
function initializeMegaMenu() {
    // Setup mega menu functionality for all menu containers
    const megaMenuContainers = document.querySelectorAll('.mega-menu-container');
    
    megaMenuContainers.forEach(container => {
        const trigger = container.querySelector('.mega-menu-trigger');
        const menu = container.querySelector('.mega-menu');
        const overlay = container.querySelector('.mega-menu-overlay');
        const closeBtn = container.querySelector('.mega-menu-close');
        
        if (trigger && menu) {
            // Toggle menu on trigger click
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other open menus
                megaMenuContainers.forEach(otherContainer => {
                    if (otherContainer !== container) {
                        otherContainer.classList.remove('open');
                    }
                });
                
                // Toggle current menu
                container.classList.toggle('open');
            });
            
            // Close menu on overlay click (if exists)
            if (overlay) {
                overlay.addEventListener('click', function() {
                    container.classList.remove('open');
                });
            }
            
            // Close menu on close button click (if exists)
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    container.classList.remove('open');
                });
            }
            
            // Close menu when clicking on links
            const megaLinks = menu.querySelectorAll('.mega-menu-link');
            megaLinks.forEach(link => {
                link.addEventListener('click', function() {
                    container.classList.remove('open');
                });
            });
        }
    });
    
    // Close all menus when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.mega-menu-container')) {
            megaMenuContainers.forEach(container => {
                container.classList.remove('open');
            });
        }
    });
    
    // Close menus on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            megaMenuContainers.forEach(container => {
                container.classList.remove('open');
            });
        }
    });
}

// Notification Close Function
function initializeNotification() {
    const notificationClose = document.getElementById('notificationClose');
    const notification = document.getElementById('notification');
    
    if (notificationClose && notification) {
        notificationClose.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }
}

// Download Functions
function downloadResults() {
    try {
        const fdMonthlyInv = parseFloat(fdMonthlyInvestment.value);
        const fdDuration = parseInt(fdDurationYears.value);
        const fdRate = parseFloat(fdInterestRate.value);
        const fdCompounding = fdCompoundingFrequency.value;
        
        const sipMonthlyInv = parseFloat(sipMonthlyAmount.value);
        const sipDuration = parseInt(sipDurationYears.value);
        const sipCagr = parseFloat(sipExpectedCagr.value);
        
        const fdTotalInvested = fdTotalInvestedResult.textContent;
        const fdMaturityValue = fdMaturityValueResult.textContent;
        const fdInterestEarned = fdInterestEarnedResult.textContent;
        
        const sipTotalInvested = sipTotalInvestedResult.textContent;
        const sipEstimatedValue = sipEstimatedValueResult.textContent;
        const sipGain = sipGainResult.textContent;
        
        const betterOption = betterOptionResult.textContent;
        const differenceReturns = differenceReturnsResult.textContent;
        
        const reportContent = generateReportContent({
            fdMonthlyInv, fdDuration, fdRate, fdCompounding,
            sipMonthlyInv, sipDuration, sipCagr,
            fdTotalInvested, fdMaturityValue, fdInterestEarned,
            sipTotalInvested, sipEstimatedValue, sipGain,
            betterOption, differenceReturns
        });
        
        const blob = new Blob([reportContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fd-vs-sip-comparison-report.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Report downloaded successfully!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Download failed. Please try again.', 'error');
    }
}

function generateReportContent(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FD vs SIP Comparison Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #667eea; margin-bottom: 10px; }
        .section { margin-bottom: 25px; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .section h3 { color: #2d3748; margin-bottom: 15px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; }
        .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .result-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .result-label { font-weight: 500; }
        .result-value { font-weight: 600; color: #2d3748; }
        .highlight { background: #f8fafc; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
        .fd-section { border-left-color: #f59e0b; }
        .sip-section { border-left-color: #10b981; }
        .comparison-section { border-left-color: #8b5cf6; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>FD vs SIP Comparison Report</h1>
        <p>Generated on ${new Date().toLocaleDateString('en-IN', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        })}</p>
    </div>
    
    <div class="section">
        <h3>Investment Parameters</h3>
        <div class="comparison-grid">
            <div>
                <h4>Fixed Deposit (FD)</h4>
                <div class="result-item">
                    <span class="result-label">Monthly Investment:</span>
                    <span class="result-value">₹${data.fdMonthlyInv.toLocaleString('en-IN')}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Duration:</span>
                    <span class="result-value">${data.fdDuration} years</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Interest Rate:</span>
                    <span class="result-value">${data.fdRate}% per annum</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Compounding:</span>
                    <span class="result-value">${data.fdCompounding.charAt(0).toUpperCase() + data.fdCompounding.slice(1)}</span>
                </div>
            </div>
            <div>
                <h4>Systematic Investment Plan (SIP)</h4>
                <div class="result-item">
                    <span class="result-label">Monthly SIP:</span>
                    <span class="result-value">₹${data.sipMonthlyInv.toLocaleString('en-IN')}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Duration:</span>
                    <span class="result-value">${data.sipDuration} years</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Expected CAGR:</span>
                    <span class="result-value">${data.sipCagr}% per annum</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Investment Type:</span>
                    <span class="result-value">Mutual Fund SIP</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h3>Comparison Results</h3>
        <div class="comparison-grid">
            <div class="fd-section" style="border: 1px solid #f59e0b; border-radius: 8px; padding: 15px;">
                <h4 style="color: #f59e0b;">Fixed Deposit Results</h4>
                <div class="result-item">
                    <span class="result-label">Total Invested:</span>
                    <span class="result-value">${data.fdTotalInvested}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Maturity Value:</span>
                    <span class="result-value">${data.fdMaturityValue}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Interest Earned:</span>
                    <span class="result-value">${data.fdInterestEarned}</span>
                </div>
            </div>
            <div class="sip-section" style="border: 1px solid #10b981; border-radius: 8px; padding: 15px;">
                <h4 style="color: #10b981;">SIP Results</h4>
                <div class="result-item">
                    <span class="result-label">Total Invested:</span>
                    <span class="result-value">${data.sipTotalInvested}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Estimated Value:</span>
                    <span class="result-value">${data.sipEstimatedValue}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Gain from SIP:</span>
                    <span class="result-value">${data.sipGain}</span>
                </div>
            </div>
        </div>
        
        <div class="highlight comparison-section">
            <h4>Winner: ${data.betterOption}</h4>
            <p><strong>Difference in Returns:</strong> ${data.differenceReturns}</p>
        </div>
    </div>
    
    <div class="section">
        <h3>Important Notes</h3>
        <ul>
            <li><strong>Fixed Deposit:</strong> Guaranteed returns with principal protection. Interest is taxed as per your income tax slab.</li>
            <li><strong>SIP in Mutual Funds:</strong> Market-linked returns, not guaranteed. Potential for higher returns but with market risk.</li>
            <li><strong>Tax Implications:</strong> 
                <ul>
                    <li>FD: Interest taxed as income</li>
                    <li>SIP: Long-term capital gains (>1 year) taxed at 10% above ₹1 lakh</li>
                </ul>
            </li>
            <li><strong>Liquidity:</strong> FDs may have penalties for premature withdrawal. SIP units can be redeemed anytime (subject to exit load if any).</li>
        </ul>
    </div>
    
    <div class="footer">
        <p>This report is generated for informational purposes only. Please consult a financial advisor for personalized investment advice.</p>
        <p>Report generated by FD vs SIP Calculator</p>
    </div>
</body>
</html>`;
}

// Print Function
function printResults() {
    const printContent = generateReportContent({
        fdMonthlyInv: parseFloat(fdMonthlyInvestment.value),
        fdDuration: parseInt(fdDurationYears.value),
        fdRate: parseFloat(fdInterestRate.value),
        fdCompounding: fdCompoundingFrequency.value,
        sipMonthlyInv: parseFloat(sipMonthlyAmount.value),
        sipDuration: parseInt(sipDurationYears.value),
        sipCagr: parseFloat(sipExpectedCagr.value),
        fdTotalInvested: fdTotalInvestedResult.textContent,
        fdMaturityValue: fdMaturityValueResult.textContent,
        fdInterestEarned: fdInterestEarnedResult.textContent,
        sipTotalInvested: sipTotalInvestedResult.textContent,
        sipEstimatedValue: sipEstimatedValueResult.textContent,
        sipGain: sipGainResult.textContent,
        betterOption: betterOptionResult.textContent,
        differenceReturns: differenceReturnsResult.textContent
    });
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// Keyboard Shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    downloadResults();
                    break;
                case 'p':
                    e.preventDefault();
                    printResults();
                    break;
                case 'r':
                    e.preventDefault();
                    location.reload();
                    break;
            }
        }
    });
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('FD vs SIP Calculator initialized');
    
    // Initialize all components
    initializeMegaMenu();
    initializeNotification();
    initializeKeyboardShortcuts();
    syncInputs();
    
    // Debounced calculation function
    const debouncedCalculation = debounce(calculateFdVsSip, 300);
    
    // Add debounced event listeners to all inputs
    const allInputs = [
        fdMonthlyInvestment, fdMonthlyInvestmentSlider,
        fdDurationYears, fdDurationYearsSlider,
        fdInterestRate, fdInterestRateSlider,
        sipMonthlyAmount, sipMonthlyAmountSlider,
        sipDurationYears, sipDurationYearsSlider,
        sipExpectedCagr, sipExpectedCagrSlider
    ];
    
    allInputs.forEach(input => {
        if (input) {
            input.removeEventListener('input', calculateFdVsSip);
            input.addEventListener('input', debouncedCalculation);
        }
    });
    
    // Add event listener for dropdown change
    if (fdCompoundingFrequency) {
        fdCompoundingFrequency.addEventListener('change', calculateFdVsSip);
    }
    
    // Perform initial calculation
    setTimeout(() => {
        calculateFdVsSip();
    }, 100);
    
    // Add helpful tooltips and additional interactions
    addTooltips();
    
    // Show welcome message
    setTimeout(() => {
        showNotification('FD vs SIP Calculator loaded successfully! Adjust the values to compare returns.', 'success');
    }, 500);
});

// Add Tooltips Function
function addTooltips() {
    const tooltips = {
        'fdInterestRate': 'Current FD rates typically range from 5.5% to 8.5% depending on the bank and tenure.',
        'sipExpectedCagr': 'Historical equity mutual fund returns have averaged 10-15% over long periods.',
        'fdCompoundingFrequency': 'Quarterly compounding is most common for bank FDs.',
    };
    
    Object.keys(tooltips).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.title = tooltips[id];
        }
    });
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('An unexpected error occurred. Please refresh the page.', 'error');
});

// Performance Monitoring
window.addEventListener('load', function() {
    if (window.performance && window.performance.timing) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        console.log(`Page loaded in ${loadTime}ms`);
    }
});