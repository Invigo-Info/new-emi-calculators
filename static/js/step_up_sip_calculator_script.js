// Global variables
let sipBreakupChart;
let yearlyReturnChart;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupDownloadButtons();
    setupMegaMenu();
    loadFromUrlParameters();
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'initialSipAmount', slider: 'initialSipAmountSlider', min: 500, max: 100000 },
        { input: 'stepUpPercentage', slider: 'stepUpPercentageSlider', min: 0, max: 30 },
        { input: 'fixedStepUpAmount', slider: 'fixedStepUpAmountSlider', min: 0, max: 10000 },
        { input: 'returnRate', slider: 'returnRateSlider', min: 8, max: 25 },
        { input: 'tenureYears', slider: 'tenureYearsSlider', min: 1, max: 30 },
        { input: 'inflationRate', slider: 'inflationRateSlider', min: 0, max: 12 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                calculateAndUpdate();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                calculateAndUpdate();
            });
        }
    });

    // Add frequency change listener
    const frequencySelect = document.getElementById('frequency');
    if (frequencySelect) {
        frequencySelect.addEventListener('change', calculateAndUpdate);
    }
    
    // Add step-up type change listener
    const stepUpTypeSelect = document.getElementById('stepUpType');
    if (stepUpTypeSelect) {
        stepUpTypeSelect.addEventListener('change', function() {
            toggleStepUpInputs();
            calculateAndUpdate();
        });
    }
}

function toggleStepUpInputs() {
    const stepUpType = document.getElementById('stepUpType').value;
    const percentageGroup = document.getElementById('percentageStepUpGroup');
    const fixedGroup = document.getElementById('fixedStepUpGroup');
    
    if (stepUpType === 'fixed_amount') {
        percentageGroup.style.display = 'none';
        fixedGroup.style.display = 'block';
    } else {
        percentageGroup.style.display = 'block';
        fixedGroup.style.display = 'none';
    }
}

function calculateAndUpdate() {
    const initialSipAmount = parseFloat(document.getElementById('initialSipAmount').value) || 5000;
    const stepUpType = document.getElementById('stepUpType').value || 'percentage';
    const stepUpPercentage = parseFloat(document.getElementById('stepUpPercentage').value) || 0;
    const fixedStepUpAmount = parseFloat(document.getElementById('fixedStepUpAmount').value) || 0;
    const frequency = document.getElementById('frequency').value || 'monthly';
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 0;
    
    // Make API call to Step Up SIP calculation endpoint
    fetch('/calculate-step-up-sip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            initialSipAmount: initialSipAmount,
            stepUpType: stepUpType,
            stepUpPercentage: stepUpPercentage,
            fixedStepUpAmount: fixedStepUpAmount,
            frequency: frequency,
            returnRate: returnRate,
            tenureYears: tenureYears,
            inflationRate: inflationRate
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateResults(data);
            updateChart(data);
            updateYearlyReturnChart(data.yearlyBreakdown);
            updateYearlyBreakdownTable(data.yearlyBreakdown);
        } else {
            console.error('Calculation error:', data.error);
        }
    })
    .catch(error => {
        console.error('Network error:', error);
    });
}

function updateResults(data) {
    // Update result cards
    document.getElementById('totalInvestedResult').textContent = formatCurrency(data.totalInvested);
    document.getElementById('totalReturnsResult').textContent = formatCurrency(data.totalReturns);
    document.getElementById('annualStepUpResult').textContent = formatCurrency(data.annualStepUpValue);
    document.getElementById('maturityAmountResult').textContent = formatCurrency(data.futureValue);
    document.getElementById('inflationAdjustedResult').textContent = formatCurrency(data.inflationAdjustedValue);
    
    // Update chart summary
    document.getElementById('investedAmountDisplay').textContent = formatCurrency(data.totalInvested);
    document.getElementById('returnsAmountDisplay').textContent = formatCurrency(data.totalReturns);
}

function updateChart(data) {
    const ctx = document.getElementById('sipBreakupChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (sipBreakupChart) {
        sipBreakupChart.destroy();
    }
    
    sipBreakupChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Total Invested', 'Expected Returns'],
            datasets: [{
                data: [data.totalInvested, data.totalReturns],
                backgroundColor: [
                    '#4facfe',  // Blue gradient for invested amount
                    '#43e97b'   // Green gradient for returns
                ],
                borderWidth: 0,
                hoverOffset: 15
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
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#fff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const percentage = ((context.parsed / data.futureValue) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1000,
                easing: 'easeOutCubic'
            }
        }
    });
}

function updateYearlyReturnChart(yearlyBreakdown) {
    const ctx = document.getElementById('yearlyReturnChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (yearlyReturnChart) {
        yearlyReturnChart.destroy();
    }
    
    // Prepare data for the bar chart
    const years = yearlyBreakdown.map(item => `Year ${item.year}`);
    const investmentData = yearlyBreakdown.map(item => item.cumulative_invested);
    const returnsData = yearlyBreakdown.map(item => item.yearly_returns);
    
    yearlyReturnChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Total Investment',
                    data: investmentData,
                    backgroundColor: '#4285f4',
                    borderColor: '#4285f4',
                    borderWidth: 0,
                    borderRadius: 4,
                    borderSkipped: false,
                },
                {
                    label: 'Returns',
                    data: returnsData,
                    backgroundColor: '#34a853',
                    borderColor: '#34a853',
                    borderWidth: 0,
                    borderRadius: 4,
                    borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Hide default legend since we have custom legend
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#fff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = formatCurrency(context.parsed.y);
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 12,
                            weight: 500
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f3f4f6',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 12,
                            weight: 500
                        },
                        callback: function(value) {
                            // Format y-axis labels as currency
                            if (value >= 10000000) {
                                return (value / 10000000).toFixed(0) + 'Cr';
                            } else if (value >= 100000) {
                                return (value / 100000).toFixed(0) + 'L';
                            } else if (value >= 1000) {
                                return (value / 1000).toFixed(0) + 'K';
                            }
                            return value.toString();
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutCubic'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function updateYearlyBreakdownTable(yearlyBreakdown) {
    const tableBody = document.getElementById('yearlyBreakdownBody');
    tableBody.innerHTML = '';
    
    yearlyBreakdown.forEach((yearData, index) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.style.cursor = 'pointer';
        yearRow.style.backgroundColor = '#f8fafc';
        yearRow.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">▶</span>
                <strong>Year ${yearData.year}</strong>
            </td>
            <td>${formatCurrency(yearData.sip_amount)}</td>
            <td>${formatCurrency(yearData.yearly_invested)}</td>
            <td>${formatCurrency(yearData.cumulative_invested)}</td>
            <td>${formatCurrency(yearData.cumulative_value)}</td>
            <td>${formatCurrency(yearData.yearly_returns)}</td>
            <td>${formatCurrency(yearData.inflation_adjusted_value)}</td>
        `;
        
        // Add click event to show/hide monthly data
        yearRow.addEventListener('click', function() {
            toggleMonthlyRows(this, yearData, index);
        });
        
        tableBody.appendChild(yearRow);
    });
}

function toggleMonthlyRows(yearRow, yearData, yearIndex) {
    const expandIcon = yearRow.querySelector('.expand-icon');
    const isExpanded = expandIcon.textContent === '▼';
    
    if (isExpanded) {
        // Collapse - remove monthly rows
        let nextRow = yearRow.nextSibling;
        while (nextRow && nextRow.classList && nextRow.classList.contains('month-row')) {
            const rowToRemove = nextRow;
            nextRow = nextRow.nextSibling;
            rowToRemove.remove();
        }
        expandIcon.textContent = '▶';
        yearRow.style.backgroundColor = '#f8fafc';
    } else {
        // Expand - generate and add monthly rows
        expandIcon.textContent = '▼';
        yearRow.style.backgroundColor = '#edf2f7';
        
        const monthlyData = generateMonthlyData(yearData, yearIndex);
        let insertAfter = yearRow;
        
        monthlyData.forEach(monthData => {
            const monthRow = document.createElement('tr');
            monthRow.className = 'month-row';
            monthRow.innerHTML = `
                <td style="padding-left: 40px;">${monthData.month}</td>
                <td>${formatCurrency(yearData.sip_amount)}</td>
                <td>${formatCurrency(monthData.monthly_invested)}</td>
                <td>${formatCurrency(monthData.cumulative_invested)}</td>
                <td>${formatCurrency(monthData.cumulative_value)}</td>
                <td>${formatCurrency(monthData.monthly_returns)}</td>
                <td>${formatCurrency(monthData.inflation_adjusted_value)}</td>
            `;
            
            insertAfter.parentNode.insertBefore(monthRow, insertAfter.nextSibling);
            insertAfter = monthRow;
        });
    }
}

function generateMonthlyData(yearData, yearIndex) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = [];
    
    // Get current values from inputs
    const initialSipAmount = parseFloat(document.getElementById('initialSipAmount').value) || 5000;
    const stepUpPercentage = parseFloat(document.getElementById('stepUpPercentage').value) || 0;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 0;
    const frequency = document.getElementById('frequency').value || 'monthly';
    
    // Calculate current year's SIP amount (yearIndex is 0-based, so we need yearIndex for the calculation)
    const currentSipAmount = initialSipAmount * ((1 + stepUpPercentage / 100) ** yearIndex);
    
    // Calculate monthly data based on frequency
    const monthlyRate = returnRate / (12 * 100);
    const frequency_multiplier = { 'daily': 365, 'monthly': 12, 'quarterly': 4, 'yearly': 1 };
    const investments_per_year = frequency_multiplier[frequency] || 12;
    
    // Get starting values (portfolio value before this year started)
    const previousYearValue = yearIndex > 0 ? 
        (yearData.cumulative_value - yearData.yearly_invested) / (1 + returnRate / 100) : 0;
    
    let runningPortfolioValue = previousYearValue;
    let cumulativeInvestedThisYear = 0;
    
    for (let month = 1; month <= 12; month++) {
        // Grow previous portfolio value for one month
        if (runningPortfolioValue > 0) {
            runningPortfolioValue *= (1 + monthlyRate);
        }
        
        // Determine if investment is made this month based on frequency
        let monthlyInvestment = 0;
        if (frequency === 'monthly') {
            monthlyInvestment = currentSipAmount;
        } else if (frequency === 'quarterly' && (month === 1 || month === 4 || month === 7 || month === 10)) {
            monthlyInvestment = currentSipAmount;
        } else if (frequency === 'yearly' && month === 1) {
            monthlyInvestment = currentSipAmount;
        } else if (frequency === 'daily') {
            // For daily SIP, calculate monthly investment (365 days per year / 12 months)
            monthlyInvestment = currentSipAmount * (365 / 12); // 30.417 days per month average
        }
        
        // Add monthly investment
        cumulativeInvestedThisYear += monthlyInvestment;
        runningPortfolioValue += monthlyInvestment;
        
        // Calculate total cumulative invested (including previous years)
        const totalCumulativeInvested = (yearData.cumulative_invested - yearData.yearly_invested) + cumulativeInvestedThisYear;
        
        const monthlyReturns = runningPortfolioValue - totalCumulativeInvested;
        
        // Calculate inflation adjusted value
        const totalMonthsElapsed = (yearIndex * 12) + month;
        const inflationAdjusted = runningPortfolioValue / ((1 + inflationRate / 100) ** (totalMonthsElapsed / 12));
        
        monthlyData.push({
            month: monthNames[month - 1],
            monthly_invested: monthlyInvestment,
            cumulative_invested: totalCumulativeInvested,
            cumulative_value: runningPortfolioValue,
            monthly_returns: monthlyReturns,
            inflation_adjusted_value: inflationAdjusted
        });
    }
    
    return monthlyData;
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

function setupDownloadButtons() {
    // Download buttons will be handled by their onclick attributes
}

function downloadPDF() {
    try {
        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined') {
            showNotification('PDF library is loading. Please try again in a moment.', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get current values
        const initialSipAmount = parseFloat(document.getElementById('initialSipAmount').value) || 5000;
        const stepUpPercentage = parseFloat(document.getElementById('stepUpPercentage').value) || 0;
        const frequency = document.getElementById('frequency').value || 'monthly';
        const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
        const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
        const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 0;
        
        const totalInvested = document.getElementById('totalInvestedResult').textContent;
        const totalReturns = document.getElementById('totalReturnsResult').textContent;
        const maturityAmount = document.getElementById('maturityAmountResult').textContent;
        const inflationAdjusted = document.getElementById('inflationAdjustedResult').textContent;
        
        // Add title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Step Up SIP Calculator Results', 20, 30);
        
        // Add date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
        
        // Add input parameters
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Input Parameters:', 20, 60);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Initial SIP Amount: ₹${initialSipAmount.toLocaleString()}`, 20, 75);
        doc.text(`Annual Step Up: ${stepUpPercentage}%`, 20, 85);
        doc.text(`Investment Frequency: ${frequency}`, 20, 95);
        doc.text(`Expected Return Rate: ${returnRate}%`, 20, 105);
        doc.text(`Investment Period: ${tenureYears} years`, 20, 115);
        doc.text(`Inflation Rate: ${inflationRate}%`, 20, 125);
        
        // Add results summary
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Results Summary:', 20, 125);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Invested: ${totalInvested}`, 20, 140);
        doc.text(`Expected Returns: ${totalReturns}`, 20, 150);
        doc.text(`Maturity Amount: ${maturityAmount}`, 20, 160);
        doc.text(`Inflation Adjusted Value: ${inflationAdjusted}`, 20, 170);
        
        // Add year-wise breakdown header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Year-wise Breakdown:', 20, 190);
        
        // Add table headers
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        let yPos = 205;
        doc.text('Year', 20, yPos);
        doc.text('Yearly Inv.', 45, yPos);
        doc.text('Cumulative Inv.', 80, yPos);
        doc.text('Expected Value', 125, yPos);
        doc.text('Returns', 170, yPos);
        
        // Add table data
        doc.setFont('helvetica', 'normal');
        const tableRows = document.querySelectorAll('#yearlyBreakdownBody .year-row');
        yPos += 10;
        
        tableRows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
                const year = cells[0].textContent.replace('▶', '').replace('▼', '').trim();
                const yearlyInv = cells[1].textContent;
                const cumInv = cells[2].textContent;
                const expValue = cells[3].textContent;
                const returns = cells[4].textContent;
                
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.text(year, 20, yPos);
                doc.text(yearlyInv, 45, yPos);
                doc.text(cumInv, 80, yPos);
                doc.text(expValue, 125, yPos);
                doc.text(returns, 170, yPos);
                yPos += 8;
            }
        });
        
        doc.save('yearly-sip-calculation.pdf');
        showNotification('PDF downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Error generating PDF. Please try again.', 'error');
    }
}

function downloadExcel() {
    try {
        const initialSipAmount = parseFloat(document.getElementById('initialSipAmount').value) || 5000;
        const stepUpPercentage = parseFloat(document.getElementById('stepUpPercentage').value) || 0;
        const frequency = document.getElementById('frequency').value || 'monthly';
        const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
        const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
        const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 0;
        
        // Get results from the DOM
        const totalInvested = document.getElementById('totalInvestedResult').textContent;
        const totalReturns = document.getElementById('totalReturnsResult').textContent;
        const annualStepUpValue = document.getElementById('annualStepUpResult').textContent;
        const maturityAmount = document.getElementById('maturityAmountResult').textContent;
        const inflationAdjusted = document.getElementById('inflationAdjustedResult').textContent;
        
        // Create CSV content with BOM for proper encoding
        let csvContent = "\uFEFF"; // BOM for UTF-8
        csvContent += "Step Up SIP Calculator Results\n\n";
        csvContent += "Input Parameters:\n";
        csvContent += `Initial SIP Amount,${initialSipAmount.toLocaleString()}\n`;
        csvContent += `Annual Step Up Percentage,${stepUpPercentage}%\n`;
        csvContent += `Investment Frequency,${frequency}\n`;
        csvContent += `Expected Return Rate,${returnRate}%\n`;
        csvContent += `Investment Period,${tenureYears} years\n`;
        csvContent += `Inflation Rate,${inflationRate}%\n\n`;
        
        csvContent += "Results Summary:\n";
        csvContent += `Total Invested,${totalInvested}\n`;
        csvContent += `Expected Returns,${totalReturns}\n`;
        csvContent += `Annual Step Up Value,${annualStepUpValue}\n`;
        csvContent += `Maturity Amount,${maturityAmount}\n`;
        csvContent += `Inflation Adjusted Value,${inflationAdjusted}\n\n`;
        
        csvContent += "Year-wise Breakdown:\n";
        csvContent += "Year,SIP Amount,Yearly Investment,Cumulative Investment,Expected Value,Returns Earned,Inflation Adjusted Value\n";
        
        // Add yearly breakdown data
        const tableRows = document.querySelectorAll('#yearlyBreakdownBody tr');
        if (tableRows.length > 0) {
            tableRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 7) {
                    const year = cells[0].textContent.trim();
                    const sipAmount = cells[1].textContent.trim();
                    const yearlyInv = cells[2].textContent.trim();
                    const cumInv = cells[3].textContent.trim();
                    const expValue = cells[4].textContent.trim();
                    const returns = cells[5].textContent.trim();
                    const infAdj = cells[6].textContent.trim();
                    
                    csvContent += `${year},${sipAmount},${yearlyInv},${cumInv},${expValue},${returns},${infAdj}\n`;
                }
            });
        } else {
            csvContent += "No data available. Please ensure the calculator has been used.\n";
        }
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            // For IE
            window.navigator.msSaveOrOpenBlob(blob, 'step-up-sip-calculation.csv');
        } else {
            // For other browsers
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'step-up-sip-calculation.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        
        showNotification('Excel file downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error generating Excel file:', error);
        showNotification('Error generating Excel file. Please try again.', 'error');
    }
}

function generatePrintableContent() {
    const initialSipAmount = parseFloat(document.getElementById('initialSipAmount').value) || 5000;
    const stepUpPercentage = parseFloat(document.getElementById('stepUpPercentage').value) || 0;
    const frequency = document.getElementById('frequency').value || 'monthly';
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 0;
    
    const totalInvested = document.getElementById('totalInvestedResult').textContent;
    const totalReturns = document.getElementById('totalReturnsResult').textContent;
    const annualStepUpValue = document.getElementById('annualStepUpResult').textContent;
    const maturityAmount = document.getElementById('maturityAmountResult').textContent;
    const inflationAdjusted = document.getElementById('inflationAdjustedResult').textContent;
    
    let content = `Step Up SIP Calculator Results\n`;
    content += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    content += `INPUT PARAMETERS:\n`;
    content += `Initial SIP Amount: ₹${initialSipAmount.toLocaleString()}\n`;
    content += `Annual Step Up Percentage: ${stepUpPercentage}%\n`;
    content += `Investment Frequency: ${frequency}\n`;
    content += `Expected Return Rate: ${returnRate}%\n`;
    content += `Investment Period: ${tenureYears} years\n`;
    content += `Inflation Rate: ${inflationRate}%\n\n`;
    
    content += `RESULTS SUMMARY:\n`;
    content += `Total Invested: ${totalInvested}\n`;
    content += `Expected Returns: ${totalReturns}\n`;
    content += `Annual Step Up Value: ${annualStepUpValue}\n`;
    content += `Maturity Amount: ${maturityAmount}\n`;
    content += `Inflation Adjusted Value: ${inflationAdjusted}\n\n`;
    
    content += `YEAR-WISE BREAKDOWN:\n`;
    content += `Year\tSIP Amount\tYearly Investment\tCumulative Investment\tExpected Value\tReturns Earned\tInflation Adjusted Value\n`;
    
    const tableRows = document.querySelectorAll('#yearlyBreakdownBody tr');
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 7) {
            const year = cells[0].textContent.trim();
            const sipAmount = cells[1].textContent.trim();
            const yearlyInv = cells[2].textContent.trim();
            const cumInv = cells[3].textContent.trim();
            const expValue = cells[4].textContent.trim();
            const returns = cells[5].textContent.trim();
            const infAdj = cells[6].textContent.trim();
            
            content += `${year}\t${sipAmount}\t${yearlyInv}\t${cumInv}\t${expValue}\t${returns}\t${infAdj}\n`;
        }
    });
    
    return content;
}

function shareLink() {
    try {
        const initialSipAmount = document.getElementById('initialSipAmount').value;
        const stepUpPercentage = document.getElementById('stepUpPercentage').value;
        const frequency = document.getElementById('frequency').value;
        const returnRate = document.getElementById('returnRate').value;
        const tenureYears = document.getElementById('tenureYears').value;
        const inflationRate = document.getElementById('inflationRate').value;
        
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?initialSipAmount=${initialSipAmount}&stepUpPercentage=${stepUpPercentage}&frequency=${frequency}&returnRate=${returnRate}&tenureYears=${tenureYears}&inflationRate=${inflationRate}`;
        
        // For mobile devices with native share capability
        if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            navigator.share({
                title: 'Step Up SIP Calculator Results',
                text: `Check out my Step Up SIP calculation: ₹${initialSipAmount} starting amount with ${stepUpPercentage}% annual step-up for ${tenureYears} years at ${returnRate}% return rate`,
                url: shareUrl,
            }).then(() => {
                showNotification('Link shared successfully!', 'success');
            }).catch((error) => {
                console.log('Error sharing:', error);
                fallbackCopyTextToClipboard(shareUrl);
            });
        } else {
            // For desktop and other devices, copy to clipboard
            fallbackCopyTextToClipboard(shareUrl);
        }
    } catch (error) {
        console.error('Error in shareLink:', error);
        showNotification('Error sharing link. Please try again.', 'error');
    }
}

function fallbackCopyTextToClipboard(text) {
    // Modern browsers with secure context
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            // Try the fallback method
            legacyCopyToClipboard(text);
        });
    } else {
        // Fallback for older browsers or non-secure contexts
        legacyCopyToClipboard(text);
    }
}

function legacyCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Link copied to clipboard!', 'success');
        } else {
            showNotification('Please manually copy the link from the address bar', 'error');
        }
    } catch (err) {
        console.error('Fallback: Unable to copy', err);
        // As a last resort, select the text for user to copy manually
        textArea.style.position = 'static';
        textArea.style.left = 'auto';
        textArea.style.top = 'auto';
        textArea.style.opacity = '1';
        showNotification('Please copy the selected text below:', 'error');
    } finally {
        setTimeout(() => {
            if (document.body.contains(textArea)) {
                document.body.removeChild(textArea);
            }
        }, 3000);
    }
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '10000',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const initialSipAmount = urlParams.get('initialSipAmount');
    const stepUpPercentage = urlParams.get('stepUpPercentage');
    const frequency = urlParams.get('frequency');
    const returnRate = urlParams.get('returnRate');
    const tenureYears = urlParams.get('tenureYears');
    const inflationRate = urlParams.get('inflationRate');
    
    if (initialSipAmount) {
        document.getElementById('initialSipAmount').value = initialSipAmount;
        document.getElementById('initialSipAmountSlider').value = initialSipAmount;
    }
    if (stepUpPercentage) {
        document.getElementById('stepUpPercentage').value = stepUpPercentage;
        document.getElementById('stepUpPercentageSlider').value = stepUpPercentage;
    }
    if (frequency) {
        document.getElementById('frequency').value = frequency;
    }
    if (returnRate) {
        document.getElementById('returnRate').value = returnRate;
        document.getElementById('returnRateSlider').value = returnRate;
    }
    if (tenureYears) {
        document.getElementById('tenureYears').value = tenureYears;
        document.getElementById('tenureYearsSlider').value = tenureYears;
    }
    if (inflationRate) {
        document.getElementById('inflationRate').value = inflationRate;
        document.getElementById('inflationRateSlider').value = inflationRate;
    }
}

function formatCurrency(amount) {
    if (typeof amount === 'string') {
        amount = parseFloat(amount.replace(/[₹,]/g, ''));
    }
    
    if (isNaN(amount)) return '₹0';
    
    return '₹' + Math.round(amount).toLocaleString('en-IN');
} 