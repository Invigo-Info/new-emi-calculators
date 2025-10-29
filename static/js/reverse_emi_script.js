// Global variables
let reverseEmiChart;

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
        { input: 'targetEmi', slider: 'targetEmiSlider', min: 1000, max: 1000000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 0.1, max: 36 },
        { input: 'tenureYears', slider: 'tenureYearsSlider', min: 1, max: 30 }
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
}

function calculateAndUpdate() {
    const targetEmi = parseFloat(document.getElementById('targetEmi').value) || 25000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 5;
    
    // Make API call
    fetch('/calculate-reverse-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            targetEmi: targetEmi,
            interestRate: interestRate,
            tenureYears: tenureYears
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateResults(data);
            updateChart(data);
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
    // Update main result cards
    document.getElementById('loanAmountResult').textContent = formatCurrency(data.loanAmount);
    document.getElementById('targetEmiResult').textContent = formatCurrency(data.targetEmi);
    document.getElementById('totalInterestResult').textContent = formatCurrency(data.totalInterest);
    document.getElementById('totalAmountResult').textContent = formatCurrency(data.totalAmount);

    // Update chart summary
    document.getElementById('principalDisplay').textContent = formatCurrency(data.loanAmount);
    document.getElementById('interestDisplay').textContent = formatCurrency(data.totalInterest);
}

function updateChart(data) {
    const ctx = document.getElementById('reverseEmiChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (reverseEmiChart) {
        reverseEmiChart.destroy();
    }

    const chartData = [data.loanAmount, data.totalInterest];
    const chartLabels = ['Principal Amount', 'Interest Amount'];
    const chartColors = ['#14B8A6', '#F59E0B'];
    
    reverseEmiChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
                borderColor: ['#ffffff', '#ffffff'],
                borderWidth: 2,
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
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#ffffff',
                    borderWidth: 1
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000
            }
        }
    });
}

function updateYearlyBreakdownTable(yearlyBreakdown) {
    const tbody = document.getElementById('amortizationTableBody');
    tbody.innerHTML = '';

    yearlyBreakdown.forEach((yearData, yearIndex) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.dataset.year = yearData.year;
        yearRow.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">▶</span>
                ${yearData.year}
            </td>
            <td class="amount-cell">${formatCurrency(yearData.total_payment)}</td>
            <td class="amount-cell">${formatCurrency(yearData.principal)}</td>
            <td class="amount-cell">${formatCurrency(yearData.interest)}</td>
            <td class="balance-cell">${formatCurrency(yearData.balance)}</td>
            <td class="percentage-cell">${yearData.loan_paid_percentage.toFixed(1)}%</td>
        `;
        
        // Add click event to year row for expansion
        yearRow.addEventListener('click', function() {
            toggleYearExpansion(yearData.year);
        });
        
        tbody.appendChild(yearRow);
        
        // Create monthly rows (initially hidden)
        yearData.monthly_data.forEach((monthData, monthIndex) => {
            const monthRow = document.createElement('tr');
            monthRow.className = 'month-row';
            monthRow.dataset.year = yearData.year;
            monthRow.style.display = 'none';
            monthRow.innerHTML = `
                <td class="month-cell">&nbsp;&nbsp;&nbsp;&nbsp;${monthData.month}</td>
                <td class="amount-cell">${formatCurrency(monthData.total_payment)}</td>
                <td class="amount-cell">${formatCurrency(monthData.principal)}</td>
                <td class="amount-cell">${formatCurrency(monthData.interest)}</td>
                <td class="balance-cell">${formatCurrency(monthData.balance)}</td>
                <td class="percentage-cell">${monthData.loan_paid_percentage.toFixed(1)}%</td>
            `;
            tbody.appendChild(monthRow);
        });
    });
}

function toggleYearExpansion(year) {
    const yearRow = document.querySelector(`.year-row[data-year="${year}"]`);
    const monthRows = document.querySelectorAll(`.month-row[data-year="${year}"]`);
    const expandIcon = yearRow.querySelector('.expand-icon');
    
    const isExpanded = expandIcon.textContent === '▼';
    
    if (isExpanded) {
        // Collapse
        expandIcon.textContent = '▶';
        monthRows.forEach(row => {
            row.style.display = 'none';
        });
    } else {
        // Expand
        expandIcon.textContent = '▼';
        monthRows.forEach(row => {
            row.style.display = 'table-row';
        });
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
        
        // Close mega menu when clicking on a link
        const megaLinks = document.querySelectorAll('.mega-link');
        megaLinks.forEach(link => {
            link.addEventListener('click', function() {
                megaMenu.classList.remove('open');
            });
        });
    }
}

function setupDownloadButtons() {
    // Debug function to test PDF library availability
    console.log('Setting up download buttons...');
    console.log('jsPDF available:', typeof window.jsPDF !== 'undefined');
    console.log('jspdf available:', typeof window.jspdf !== 'undefined');
    
    // Add event listeners as backup if onclick doesn't work
    const pdfBtn = document.querySelector('.pdf-btn');
    const excelBtn = document.querySelector('.excel-btn');
    const shareBtn = document.querySelector('.share-btn');
    
    if (pdfBtn) {
        pdfBtn.addEventListener('click', function(e) {
            e.preventDefault();
            downloadPDF();
        });
    }
    
    if (excelBtn) {
        excelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            downloadExcel();
        });
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', function(e) {
            e.preventDefault();
            shareLink();
        });
    }
}

function downloadPDF() {
    try {
        // Check if jsPDF is available
        if (typeof window.jsPDF === 'undefined' && typeof window.jspdf === 'undefined') {
            showNotification('PDF library not loaded. Please refresh the page and try again.', 'error');
            return;
        }

        // Get jsPDF constructor
        let jsPDF;
        if (window.jsPDF) {
            jsPDF = window.jsPDF;
        } else if (window.jspdf && window.jspdf.jsPDF) {
            jsPDF = window.jspdf.jsPDF;
        } else {
            showNotification('PDF library not properly loaded. Please refresh the page.', 'error');
            return;
        }

        const targetEmi = parseFloat(document.getElementById('targetEmi').value) || 25000;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
        const tenureYears = parseInt(document.getElementById('tenureYears').value) || 5;
        
        const loanAmount = document.getElementById('loanAmountResult').textContent;
        const totalInterest = document.getElementById('totalInterestResult').textContent;
        const totalAmount = document.getElementById('totalAmountResult').textContent;

        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text('Reverse EMI Calculator Report', 20, 30);
        
        // Input details
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text('Input Details:', 20, 50);
        
        doc.setFontSize(12);
        doc.text(`Target EMI: ${formatCurrency(targetEmi)}`, 30, 65);
        doc.text(`Interest Rate: ${interestRate}% per annum`, 30, 75);
        doc.text(`Loan Tenure: ${tenureYears} years`, 30, 85);
        
        // Results
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text('Calculation Results:', 20, 105);
        
        doc.setFontSize(12);
        doc.text(`Maximum Loan Amount: ${loanAmount}`, 30, 120);
        doc.text(`Monthly EMI: ${formatCurrency(targetEmi)}`, 30, 130);
        doc.text(`Total Interest: ${totalInterest}`, 30, 140);
        doc.text(`Total Amount Payable: ${totalAmount}`, 30, 150);
        
        // Add amortization table if data exists
        const tableRows = document.querySelectorAll('#amortizationTableBody .year-row');
        if (tableRows.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(60, 60, 60);
            doc.text('Year-wise Payment Schedule:', 20, 170);
            
            doc.setFontSize(10);
            doc.setTextColor(40, 40, 40);
            let yPos = 185;
            
            // Table headers
            doc.text('Year', 20, yPos);
            doc.text('Total Payment', 50, yPos);
            doc.text('Principal', 90, yPos);
            doc.text('Interest', 120, yPos);
            doc.text('Balance', 150, yPos);
            doc.text('Paid %', 180, yPos);
            yPos += 10;
            
            // Table data
            tableRows.forEach((row, index) => {
                if (yPos > 270) return; // Don't overflow page
                
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6) {
                    const year = cells[0].textContent.trim().replace('▶', '').replace('▼', '').trim();
                    const totalPayment = cells[1].textContent.trim();
                    const principal = cells[2].textContent.trim();
                    const interest = cells[3].textContent.trim();
                    const balance = cells[4].textContent.trim();
                    const percentage = cells[5].textContent.trim();
                    
                    doc.text(year, 20, yPos);
                    doc.text(totalPayment, 50, yPos);
                    doc.text(principal, 90, yPos);
                    doc.text(interest, 120, yPos);
                    doc.text(balance, 150, yPos);
                    doc.text(percentage, 180, yPos);
                    yPos += 8;
                }
            });
        }
        
        // Add timestamp
        const now = new Date();
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${now.toLocaleString()}`, 20, 285);
        
        doc.save('reverse-emi-calculation.pdf');
        showNotification('PDF downloaded successfully!', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        // Fallback to simple text download
        fallbackPDFDownload();
    }
}

function fallbackPDFDownload() {
    try {
        const targetEmi = parseFloat(document.getElementById('targetEmi').value) || 25000;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
        const tenureYears = parseInt(document.getElementById('tenureYears').value) || 5;
        
        const loanAmount = document.getElementById('loanAmountResult').textContent;
        const totalInterest = document.getElementById('totalInterestResult').textContent;
        const totalAmount = document.getElementById('totalAmountResult').textContent;

        // Create simple text content as fallback
        let content = "REVERSE EMI CALCULATOR REPORT\n";
        content += "=" * 50 + "\n\n";
        content += "INPUT DETAILS:\n";
        content += "-" * 20 + "\n";
        content += `Target EMI: ${formatCurrency(targetEmi)}\n`;
        content += `Interest Rate: ${interestRate}% per annum\n`;
        content += `Loan Tenure: ${tenureYears} years\n\n`;
        
        content += "CALCULATION RESULTS:\n";
        content += "-" * 25 + "\n";
        content += `Maximum Loan Amount: ${loanAmount}\n`;
        content += `Monthly EMI: ${formatCurrency(targetEmi)}\n`;
        content += `Total Interest: ${totalInterest}\n`;
        content += `Total Amount Payable: ${totalAmount}\n\n`;
        
        // Add amortization table
        const tableRows = document.querySelectorAll('#amortizationTableBody .year-row');
        if (tableRows.length > 0) {
            content += "YEAR-WISE PAYMENT SCHEDULE:\n";
            content += "-" * 35 + "\n";
            content += "Year\tTotal Payment\tPrincipal\tInterest\tBalance\tPaid %\n";
            content += "-" * 80 + "\n";
            
            tableRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6) {
                    const year = cells[0].textContent.trim().replace('▶', '').replace('▼', '').trim();
                    const totalPayment = cells[1].textContent.trim();
                    const principal = cells[2].textContent.trim();
                    const interest = cells[3].textContent.trim();
                    const balance = cells[4].textContent.trim();
                    const percentage = cells[5].textContent.trim();
                    
                    content += `${year}\t${totalPayment}\t${principal}\t${interest}\t${balance}\t${percentage}\n`;
                }
            });
        }
        
        const now = new Date();
        content += `\nGenerated on: ${now.toLocaleString()}\n`;
        
        // Download as text file
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'reverse-emi-calculation.txt');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('Report downloaded as text file (PDF library unavailable)', 'success');
    } catch (fallbackError) {
        console.error('Fallback download error:', fallbackError);
        showNotification('Download failed. Please try refreshing the page.', 'error');
    }
}

function downloadExcel() {
    try {
        const targetEmi = parseFloat(document.getElementById('targetEmi').value) || 25000;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
        const tenureYears = parseInt(document.getElementById('tenureYears').value) || 5;
        
        const loanAmount = document.getElementById('loanAmountResult').textContent;
        const totalInterest = document.getElementById('totalInterestResult').textContent;
        const totalAmount = document.getElementById('totalAmountResult').textContent;

        // Create CSV content with BOM for proper Excel encoding
        let csvContent = "\uFEFFReverse EMI Calculator Report\n\n";
        csvContent += "Input Details\n";
        csvContent += `Target EMI,${formatCurrency(targetEmi)}\n`;
        csvContent += `Interest Rate,${interestRate}% per annum\n`;
        csvContent += `Loan Tenure,${tenureYears} years\n\n`;
        
        csvContent += "Calculation Results\n";
        csvContent += `Maximum Loan Amount,${loanAmount}\n`;
        csvContent += `Monthly EMI,${formatCurrency(targetEmi)}\n`;
        csvContent += `Total Interest,${totalInterest}\n`;
        csvContent += `Total Amount Payable,${totalAmount}\n\n`;
        
        // Add amortization table
        csvContent += "Year-wise Payment Schedule\n";
        csvContent += "Year,Total Payment,Principal,Interest,Outstanding Balance,Loan Paid %\n";
        
        const tableRows = document.querySelectorAll('#amortizationTableBody .year-row');
        if (tableRows.length > 0) {
            tableRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6) {
                    const year = cells[0].textContent.trim().replace('▶', '').replace('▼', '').trim();
                    const totalPayment = cells[1].textContent.trim();
                    const principal = cells[2].textContent.trim();
                    const interest = cells[3].textContent.trim();
                    const balance = cells[4].textContent.trim();
                    const percentage = cells[5].textContent.trim();
                    
                    csvContent += `${year},${totalPayment},${principal},${interest},${balance},${percentage}\n`;
                }
            });
        }
        
        // Add timestamp
        const now = new Date();
        csvContent += `\nGenerated on: ${now.toLocaleString()}\n`;
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'reverse-emi-calculation.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('Excel file downloaded successfully!', 'success');
    } catch (error) {
        console.error('Excel generation error:', error);
        showNotification('Error generating Excel file: ' + error.message, 'error');
    }
}

function shareLink() {
    try {
        const targetEmi = document.getElementById('targetEmi').value || 25000;
        const interestRate = document.getElementById('interestRate').value || 10.5;
        const tenureYears = document.getElementById('tenureYears').value || 5;
        
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?targetEmi=${targetEmi}&interestRate=${interestRate}&tenureYears=${tenureYears}`;
        
        const shareText = `Check out my reverse EMI calculation: Target EMI ${formatCurrency(parseFloat(targetEmi))}, Interest Rate ${interestRate}%, Tenure ${tenureYears} years`;
        
        // Try native Web Share API first (mobile devices)
        if (navigator.share && navigator.canShare) {
            const shareData = {
                title: 'Reverse EMI Calculator Results',
                text: shareText,
                url: shareUrl
            };
            
            if (navigator.canShare(shareData)) {
                navigator.share(shareData).then(() => {
                    showNotification('Shared successfully!', 'success');
                }).catch((error) => {
                    if (error.name !== 'AbortError') {
                        console.log('Error sharing:', error);
                        fallbackCopyTextToClipboard(shareUrl);
                    }
                });
                return;
            }
        }
        
        // Fallback to copying URL to clipboard
        fallbackCopyTextToClipboard(shareUrl);
    } catch (error) {
        console.error('Share error:', error);
        showNotification('Error sharing link: ' + error.message, 'error');
    }
}

function fallbackCopyTextToClipboard(text) {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Modern clipboard API failed:', err);
            legacyCopyTextToClipboard(text);
        });
    } else {
        legacyCopyTextToClipboard(text);
    }
}

function legacyCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Make the textarea invisible but functional
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Link copied to clipboard!', 'success');
        } else {
            showNotification('Please copy this link manually: ' + text, 'error');
        }
    } catch (err) {
        console.error('Fallback: Copying text command was unsuccessful', err);
        showNotification('Please copy this link manually: ' + text, 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const targetEmi = urlParams.get('targetEmi');
    const interestRate = urlParams.get('interestRate');
    const tenureYears = urlParams.get('tenureYears');
    
    if (targetEmi) {
        document.getElementById('targetEmi').value = targetEmi;
        document.getElementById('targetEmiSlider').value = targetEmi;
    }
    
    if (interestRate) {
        document.getElementById('interestRate').value = interestRate;
        document.getElementById('interestRateSlider').value = interestRate;
    }
    
    if (tenureYears) {
        document.getElementById('tenureYears').value = tenureYears;
        document.getElementById('tenureYearsSlider').value = tenureYears;
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
} 
