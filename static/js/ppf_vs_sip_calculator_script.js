// PPF vs SIP Calculator JavaScript - Complete File

let comparisonChart, breakdownChart;

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializePpfVsSipCalculator();
    setupEventListeners();
    setupNavigationListeners();
    calculatePpfVsSipComparison();
});

function initializePpfVsSipCalculator() {
    syncInputsWithSliders();
}

function setupEventListeners() {
    // PPF input listeners
    document.getElementById('ppfMonthlyAmount').addEventListener('input', handlePpfAmountChange);
    document.getElementById('ppfMonthlyAmountSlider').addEventListener('input', handlePpfAmountSliderChange);
    document.getElementById('ppfDuration').addEventListener('input', handlePpfDurationChange);
    document.getElementById('ppfDurationSlider').addEventListener('input', handlePpfDurationSliderChange);
    document.getElementById('ppfInterestRate').addEventListener('input', handlePpfRateChange);
    document.getElementById('ppfInterestRateSlider').addEventListener('input', handlePpfRateSliderChange);

    // SIP input listeners
    document.getElementById('sipMonthlyAmount').addEventListener('input', handleSipAmountChange);
    document.getElementById('sipMonthlyAmountSlider').addEventListener('input', handleSipAmountSliderChange);
    document.getElementById('sipDuration').addEventListener('input', handleSipDurationChange);
    document.getElementById('sipDurationSlider').addEventListener('input', handleSipDurationSliderChange);
    document.getElementById('sipReturnRate').addEventListener('input', handleSipRateChange);
    document.getElementById('sipReturnRateSlider').addEventListener('input', handleSipRateSliderChange);
}

function setupNavigationListeners() {
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

function syncInputsWithSliders() {
    syncInputWithSlider('ppfMonthlyAmount', 'ppfMonthlyAmountSlider');
    syncInputWithSlider('ppfDuration', 'ppfDurationSlider');
    syncInputWithSlider('ppfInterestRate', 'ppfInterestRateSlider');
    syncInputWithSlider('sipMonthlyAmount', 'sipMonthlyAmountSlider');
    syncInputWithSlider('sipDuration', 'sipDurationSlider');
    syncInputWithSlider('sipReturnRate', 'sipReturnRateSlider');
}

function syncInputWithSlider(inputId, sliderId) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(sliderId);
    if (input && slider) {
        slider.value = input.value;
    }
}

// PPF Event Handlers
function handlePpfAmountChange(event) {
    const value = parseFloat(event.target.value) || 0;
    document.getElementById('ppfMonthlyAmountSlider').value = value;
    calculatePpfVsSipComparison();
}

function handlePpfAmountSliderChange(event) {
    const value = parseFloat(event.target.value) || 0;
    document.getElementById('ppfMonthlyAmount').value = value;
    calculatePpfVsSipComparison();
}

function handlePpfDurationChange(event) {
    const value = parseInt(event.target.value) || 15;
    document.getElementById('ppfDurationSlider').value = value;
    document.getElementById('sipDuration').value = value;
    document.getElementById('sipDurationSlider').value = value;
    calculatePpfVsSipComparison();
}

function handlePpfDurationSliderChange(event) {
    const value = parseInt(event.target.value) || 15;
    document.getElementById('ppfDuration').value = value;
    document.getElementById('sipDuration').value = value;
    document.getElementById('sipDurationSlider').value = value;
    calculatePpfVsSipComparison();
}

function handlePpfRateChange(event) {
    const value = parseFloat(event.target.value) || 7.1;
    document.getElementById('ppfInterestRateSlider').value = value;
    calculatePpfVsSipComparison();
}

function handlePpfRateSliderChange(event) {
    const value = parseFloat(event.target.value) || 7.1;
    document.getElementById('ppfInterestRate').value = value;
    calculatePpfVsSipComparison();
}

// SIP Event Handlers
function handleSipAmountChange(event) {
    const value = parseFloat(event.target.value) || 0;
    document.getElementById('sipMonthlyAmountSlider').value = value;
    calculatePpfVsSipComparison();
}

function handleSipAmountSliderChange(event) {
    const value = parseFloat(event.target.value) || 0;
    document.getElementById('sipMonthlyAmount').value = value;
    calculatePpfVsSipComparison();
}

function handleSipDurationChange(event) {
    const value = parseInt(event.target.value) || 15;
    document.getElementById('sipDurationSlider').value = value;
    document.getElementById('ppfDuration').value = value;
    document.getElementById('ppfDurationSlider').value = value;
    calculatePpfVsSipComparison();
}

function handleSipDurationSliderChange(event) {
    const value = parseInt(event.target.value) || 15;
    document.getElementById('sipDuration').value = value;
    document.getElementById('ppfDuration').value = value;
    document.getElementById('ppfDurationSlider').value = value;
    calculatePpfVsSipComparison();
}

function handleSipRateChange(event) {
    const value = parseFloat(event.target.value) || 12.0;
    document.getElementById('sipReturnRateSlider').value = value;
    calculatePpfVsSipComparison();
}

function handleSipRateSliderChange(event) {
    const value = parseFloat(event.target.value) || 12.0;
    document.getElementById('sipReturnRate').value = value;
    calculatePpfVsSipComparison();
}

// Core Calculation Functions
function calculatePpfVsSipComparison() {
    const inputs = getInputValues();
    const ppfResult = calculatePpfReturns(inputs);
    const sipResult = calculateSipReturns(inputs);
    const comparison = compareResults(ppfResult, sipResult, inputs.duration);
    
    updateResultsDisplay(ppfResult, sipResult, comparison);
    updateChartsDisplay(ppfResult, sipResult, comparison);
    updateComparisonTable(comparison.yearlyBreakdown);
}

function getInputValues() {
    return {
        ppfMonthlyAmount: parseFloat(document.getElementById('ppfMonthlyAmount').value) || 12500,
        ppfInterestRate: parseFloat(document.getElementById('ppfInterestRate').value) || 7.1,
        sipMonthlyAmount: parseFloat(document.getElementById('sipMonthlyAmount').value) || 12500,
        sipReturnRate: parseFloat(document.getElementById('sipReturnRate').value) || 12.0,
        duration: parseInt(document.getElementById('ppfDuration').value) || 15
    };
}

function calculatePpfReturns(inputs) {
    const { ppfMonthlyAmount, ppfInterestRate, duration } = inputs;
    const annualRate = ppfInterestRate / 100;
    const ppfAnnualAmount = ppfMonthlyAmount * 12; // Convert monthly to annual
    
    let totalInvested = 0;
    let maturityValue = 0;
    let yearlyBreakdown = [];
    
    for (let year = 1; year <= duration; year++) {
        totalInvested += ppfAnnualAmount;
        
        if (year === 1) {
            maturityValue = ppfAnnualAmount * (1 + annualRate);
        } else {
            maturityValue = (maturityValue + ppfAnnualAmount) * (1 + annualRate);
        }
        
        const interestEarned = maturityValue - totalInvested;
        
        yearlyBreakdown.push({
            year: year,
            invested: totalInvested,
            interest: interestEarned,
            balance: maturityValue
        });
    }
    
    const netGain = maturityValue - totalInvested;
    const totalReturn = (netGain / totalInvested) * 100;
    
    return {
        totalInvested,
        maturityValue,
        netGain,
        totalReturn,
        annualReturn: ppfInterestRate,
        yearlyBreakdown
    };
}

function calculateSipReturns(inputs) {
    const { sipMonthlyAmount, sipReturnRate, duration } = inputs;
    const monthlyRate = sipReturnRate / (12 * 100);
    const totalMonths = duration * 12;
    
    let totalInvested = 0;
    let maturityValue = 0;
    let yearlyBreakdown = [];
    
    for (let month = 1; month <= totalMonths; month++) {
        totalInvested += sipMonthlyAmount;
        
        if (month === 1) {
            maturityValue = sipMonthlyAmount;
        } else {
            maturityValue = (maturityValue * (1 + monthlyRate)) + sipMonthlyAmount;
        }
        
        if (month % 12 === 0) {
            const year = month / 12;
            const returnsEarned = maturityValue - totalInvested;
            
            yearlyBreakdown.push({
                year: year,
                invested: totalInvested,
                returns: returnsEarned,
                balance: maturityValue
            });
        }
    }
    
    const netGain = maturityValue - totalInvested;
    const totalReturn = (netGain / totalInvested) * 100;
    
    return {
        totalInvested,
        maturityValue,
        netGain,
        totalReturn,
        annualReturn: sipReturnRate,
        yearlyBreakdown
    };
}

function compareResults(ppfResult, sipResult, duration) {
    const maturityDifference = Math.abs(sipResult.maturityValue - ppfResult.maturityValue);
    const betterOption = sipResult.maturityValue > ppfResult.maturityValue ? 'SIP' : 'PPF';
    const advantagePercentage = ((Math.max(sipResult.maturityValue, ppfResult.maturityValue) - Math.min(sipResult.maturityValue, ppfResult.maturityValue)) / Math.min(sipResult.maturityValue, ppfResult.maturityValue)) * 100;
    
    let yearlyBreakdown = [];
    for (let year = 1; year <= duration; year++) {
        const ppfData = ppfResult.yearlyBreakdown.find(item => item.year === year) || {};
        const sipData = sipResult.yearlyBreakdown.find(item => item.year === year) || {};
        
        const ppfBalance = ppfData.balance || 0;
        const sipBalance = sipData.balance || 0;
        const yearBetterOption = sipBalance > ppfBalance ? 'SIP' : 'PPF';
        const yearAdvantage = Math.abs(sipBalance - ppfBalance);
        
        yearlyBreakdown.push({
            year: year,
            ppf: {
                invested: ppfData.invested || 0,
                interest: ppfData.interest || 0,
                balance: ppfBalance
            },
            sip: {
                invested: sipData.invested || 0,
                returns: sipData.returns || 0,
                balance: sipBalance
            },
            betterOption: yearBetterOption,
            advantage: yearAdvantage
        });
    }
    
    return {
        maturityDifference,
        betterOption,
        advantagePercentage,
        yearlyBreakdown
    };
}

function updateResultsDisplay(ppfResult, sipResult, comparison) {
    updateCardValue('ppfTotalInvested', formatCurrency(ppfResult.totalInvested));
    updateCardValue('ppfMaturityValue', formatCurrency(ppfResult.maturityValue));
    updateCardValue('sipTotalInvested', formatCurrency(sipResult.totalInvested));
    updateCardValue('sipMaturityValue', formatCurrency(sipResult.maturityValue));
    updateCardValue('maturityDifference', formatCurrency(comparison.maturityDifference));
    updateCardValue('betterOption', comparison.betterOption);
    
    updateCardValue('ppfNetGain', formatCurrency(ppfResult.netGain));
    updateCardValue('ppfTotalReturn', formatPercentage(ppfResult.totalReturn));
    updateCardValue('ppfAnnualReturn', formatPercentage(ppfResult.annualReturn));
    
    updateCardValue('sipNetGain', formatCurrency(sipResult.netGain));
    updateCardValue('sipTotalReturn', formatPercentage(sipResult.totalReturn));
    updateCardValue('sipAnnualReturn', formatPercentage(sipResult.annualReturn));
}

function updateCardValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        element.classList.add('value-updated');
        setTimeout(() => element.classList.remove('value-updated'), 300);
    }
}

function updateChartsDisplay(ppfResult, sipResult, comparison) {
    updateComparisonChart(ppfResult, sipResult);
    updateBreakdownChart(ppfResult, sipResult);
}

function updateComparisonChart(ppfResult, sipResult) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total Invested', 'Maturity Value', 'Net Gain'],
            datasets: [
                {
                    label: 'PPF',
                    data: [ppfResult.totalInvested, ppfResult.maturityValue, ppfResult.netGain],
                    backgroundColor: 'rgba(240, 147, 251, 0.8)',
                    borderColor: 'rgba(240, 147, 251, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                },
                {
                    label: 'SIP',
                    data: [sipResult.totalInvested, sipResult.maturityValue, sipResult.netGain],
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
                    text: 'PPF vs SIP Comparison',
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

function updateBreakdownChart(ppfResult, sipResult) {
    const ctx = document.getElementById('breakdownChart').getContext('2d');
    
    if (breakdownChart) {
        breakdownChart.destroy();
    }
    
    breakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['PPF Investment', 'PPF Gain', 'SIP Investment', 'SIP Gain'],
            datasets: [{
                data: [ppfResult.totalInvested, ppfResult.netGain, sipResult.totalInvested, sipResult.netGain],
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

function updateComparisonTable(yearlyBreakdown) {
    const tableBody = document.getElementById('comparisonTableBody');
    tableBody.innerHTML = '';
    
    yearlyBreakdown.forEach(yearData => {
        const row = document.createElement('tr');
        const betterOptionClass = yearData.betterOption === 'PPF' ? 'ppf-better' : 'sip-better';
        
        row.innerHTML = `
            <td class="year-cell">${yearData.year}</td>
            <td class="amount-cell">${formatCurrencyShort(yearData.ppf.invested)}</td>
            <td class="amount-cell">${formatCurrencyShort(yearData.ppf.interest)}</td>
            <td class="balance-cell">${formatCurrencyShort(yearData.ppf.balance)}</td>
            <td class="amount-cell">${formatCurrencyShort(yearData.sip.invested)}</td>
            <td class="amount-cell">${formatCurrencyShort(yearData.sip.returns)}</td>
            <td class="balance-cell">${formatCurrencyShort(yearData.sip.balance)}</td>
            <td class="better-option-cell ${betterOptionClass}">${yearData.betterOption}</td>
            <td class="amount-cell">${formatCurrencyShort(yearData.advantage)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Utility Functions
function formatCurrency(amount) {
    if (amount >= 10000000) {
        return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
    } else if (amount >= 100000) {
        return '₹' + (amount / 100000).toFixed(2) + ' L';
    } else if (amount >= 1000) {
        return '₹' + (amount / 1000).toFixed(2) + ' K';
    } else {
        return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }
}

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

function formatPercentage(value) {
    return value.toFixed(2) + '%';
}

// Download Functions
function downloadPDF() {
    try {
        if (typeof window.jsPDF === 'undefined') {
            showNotification('PDF library not loaded. Downloading Excel instead...');
            downloadExcel();
            return;
        }
        
        const inputs = getInputValues();
        const ppfResult = calculatePpfReturns(inputs);
        const sipResult = calculateSipReturns(inputs);
        const comparison = compareResults(ppfResult, sipResult, inputs.duration);
        
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF();
        
        doc.setFont('helvetica');
        doc.setFontSize(20);
        doc.setTextColor(44, 82, 130);
        doc.text('PPF vs SIP Comparison Report', 20, 25);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Generated on: ' + new Date().toLocaleDateString(), 20, 35);
        
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Investment Parameters', 20, 50);
        
        doc.setFontSize(10);
        let yPos = 60;
        doc.text('PPF Monthly Investment: ' + formatCurrency(inputs.ppfMonthlyAmount), 20, yPos);
        doc.text('PPF Interest Rate: ' + inputs.ppfInterestRate + '%', 20, yPos + 8);
        doc.text('SIP Monthly Investment: ' + formatCurrency(inputs.sipMonthlyAmount), 20, yPos + 16);
        doc.text('SIP Expected Return: ' + inputs.sipReturnRate + '%', 20, yPos + 24);
        doc.text('Investment Duration: ' + inputs.duration + ' years', 20, yPos + 32);
        
        yPos += 50;
        doc.setFontSize(14);
        doc.text('Results Summary', 20, yPos);
        
        yPos += 15;
        doc.setFontSize(10);
        
        doc.setTextColor(240, 147, 251);
        doc.text('PPF Results:', 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text('Total Invested: ' + formatCurrency(ppfResult.totalInvested), 25, yPos + 8);
        doc.text('Maturity Value: ' + formatCurrency(ppfResult.maturityValue), 25, yPos + 16);
        doc.text('Net Gain: ' + formatCurrency(ppfResult.netGain), 25, yPos + 24);
        doc.text('Total Return: ' + formatPercentage(ppfResult.totalReturn), 25, yPos + 32);
        
        yPos += 45;
        
        doc.setTextColor(79, 172, 254);
        doc.text('SIP Results:', 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text('Total Invested: ' + formatCurrency(sipResult.totalInvested), 25, yPos + 8);
        doc.text('Maturity Value: ' + formatCurrency(sipResult.maturityValue), 25, yPos + 16);
        doc.text('Net Gain: ' + formatCurrency(sipResult.netGain), 25, yPos + 24);
        doc.text('Total Return: ' + formatPercentage(sipResult.totalReturn), 25, yPos + 32);
        
        yPos += 45;
        
        doc.setTextColor(67, 233, 123);
        doc.text('Comparison:', 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text('Better Option: ' + comparison.betterOption, 25, yPos + 8);
        doc.text('Difference: ' + formatCurrency(comparison.maturityDifference), 25, yPos + 16);
        doc.text('Advantage: ' + formatPercentage(comparison.advantagePercentage), 25, yPos + 24);
        
        if (yPos > 200) {
            doc.addPage();
            yPos = 20;
        } else {
            yPos += 40;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Year-wise Comparison', 20, yPos);
        
        yPos += 15;
        doc.setFontSize(8);
        doc.text('Year', 20, yPos);
        doc.text('PPF Balance', 40, yPos);
        doc.text('SIP Balance', 70, yPos);
        doc.text('Better Option', 100, yPos);
        doc.text('Advantage', 130, yPos);
        
        yPos += 5;
        
        const maxRows = Math.min(10, comparison.yearlyBreakdown.length);
        for (let i = 0; i < maxRows; i++) {
            const yearData = comparison.yearlyBreakdown[i];
            yPos += 8;
            
            if (yPos > 280) {
                doc.addPage();
                yPos = 30;
            }
            
            doc.text(yearData.year.toString(), 20, yPos);
            doc.text(formatCurrencyShort(yearData.ppf.balance), 40, yPos);
            doc.text(formatCurrencyShort(yearData.sip.balance), 70, yPos);
            doc.text(yearData.betterOption, 100, yPos);
            doc.text(formatCurrencyShort(yearData.advantage), 130, yPos);
        }
        
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('This report is generated for informational purposes only.', 20, 285);
        doc.text('Please consult with a financial advisor for investment decisions.', 20, 290);
        
        doc.save('ppf_vs_sip_comparison.pdf');
        showNotification('PDF downloaded successfully!');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('PDF generation failed. Downloading Excel instead...');
        downloadExcel();
    }
}

function downloadExcel() {
    const inputs = getInputValues();
    const ppfResult = calculatePpfReturns(inputs);
    const sipResult = calculateSipReturns(inputs);
    const comparison = compareResults(ppfResult, sipResult, inputs.duration);
    
    let csvContent = "PPF vs SIP Calculator Results\n";
    csvContent += "Calculation Date," + new Date().toLocaleDateString() + "\n\n";
    
    csvContent += "Input Parameters\n";
    csvContent += "PPF Monthly Amount," + formatCurrency(inputs.ppfMonthlyAmount) + "\n";
    csvContent += "PPF Interest Rate," + inputs.ppfInterestRate + "%\n";
    csvContent += "SIP Monthly Amount," + formatCurrency(inputs.sipMonthlyAmount) + "\n";
    csvContent += "SIP Return Rate," + inputs.sipReturnRate + "%\n";
    csvContent += "Investment Duration," + inputs.duration + " years\n\n";
    
    csvContent += "Summary Results\n";
    csvContent += "Investment Type,Total Invested,Maturity Value,Net Gain,Total Return\n";
    csvContent += "PPF," + formatCurrency(ppfResult.totalInvested) + "," + formatCurrency(ppfResult.maturityValue) + "," + formatCurrency(ppfResult.netGain) + "," + formatPercentage(ppfResult.totalReturn) + "\n";
    csvContent += "SIP," + formatCurrency(sipResult.totalInvested) + "," + formatCurrency(sipResult.maturityValue) + "," + formatCurrency(sipResult.netGain) + "," + formatPercentage(sipResult.totalReturn) + "\n\n";
    
    csvContent += "Better Option," + comparison.betterOption + "\n";
    csvContent += "Difference," + formatCurrency(comparison.maturityDifference) + "\n\n";
    
    csvContent += "Year-wise Comparison\n";
    csvContent += "Year,PPF Invested,PPF Interest,PPF Balance,SIP Invested,SIP Returns,SIP Balance,Better Option,Advantage\n";
    
    comparison.yearlyBreakdown.forEach(yearData => {
        csvContent += yearData.year + "," + yearData.ppf.invested + "," + yearData.ppf.interest + "," + yearData.ppf.balance + "," + yearData.sip.invested + "," + yearData.sip.returns + "," + yearData.sip.balance + "," + yearData.betterOption + "," + yearData.advantage + "\n";
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'ppf_vs_sip_comparison.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Excel file downloaded successfully!');
}

function shareResults() {
    const inputs = getInputValues();
    const ppfResult = calculatePpfReturns(inputs);
    const sipResult = calculateSipReturns(inputs);
    const comparison = compareResults(ppfResult, sipResult, inputs.duration);
    
    const shareText = `PPF vs SIP Comparison Results:

📊 Investment Duration: ${inputs.duration} years

🏛️ PPF Results:
• Monthly Investment: ${formatCurrency(inputs.ppfMonthlyAmount)}
• Total Invested: ${formatCurrency(ppfResult.totalInvested)}
• Maturity Value: ${formatCurrency(ppfResult.maturityValue)}
• Net Gain: ${formatCurrency(ppfResult.netGain)}
• Total Return: ${formatPercentage(ppfResult.totalReturn)}

📈 SIP Results:
• Monthly Investment: ${formatCurrency(inputs.sipMonthlyAmount)}
• Total Invested: ${formatCurrency(sipResult.totalInvested)}
• Maturity Value: ${formatCurrency(sipResult.maturityValue)}
• Net Gain: ${formatCurrency(sipResult.netGain)}
• Total Return: ${formatPercentage(sipResult.totalReturn)}

🏆 Better Option: ${comparison.betterOption}
💰 Difference: ${formatCurrency(comparison.maturityDifference)}

Calculate your own: [Your Website URL]`;

    if (navigator.share) {
        navigator.share({
            title: 'PPF vs SIP Calculator Results',
            text: shareText
        }).then(() => {
            showNotification('Results shared successfully!');
        }).catch(() => {
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Results copied to clipboard!');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Results copied to clipboard!');
    } catch (err) {
        showNotification('Failed to copy results.');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4facfe, #00f2fe);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        }, 300);
    }, 3000);
}