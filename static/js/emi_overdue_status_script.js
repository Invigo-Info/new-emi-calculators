// Global variables
let overdueChart;

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
        { input: 'principal', slider: 'principalSlider', min: 10000, max: 50000000 },
        { input: 'annualRate', slider: 'annualRateSlider', min: 0.1, max: 36 },
        { input: 'tenureMonths', slider: 'tenureMonthsSlider', min: 6, max: 360 },
        { input: 'emiAmount', slider: 'emiAmountSlider', min: 100, max: 500000 },
        { input: 'monthsOverdue', slider: 'monthsOverdueSlider', min: 1, max: 12 },
        { input: 'penaltyRate', slider: 'penaltyRateSlider', min: 0.5, max: 5.0 }
    ];
    
    // Track to prevent circular updates
    let isUpdatingFromSlider = false;
    let isUpdatingFromInput = false;
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                if (isUpdatingFromSlider) return; // Prevent circular updates
                
                isUpdatingFromInput = true;
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                isUpdatingFromInput = false;
                
                calculateAndUpdate();
            });
            
            // Sync slider to input  
            sliderElement.addEventListener('input', function() {
                if (isUpdatingFromInput) return; // Prevent circular updates
                
                isUpdatingFromSlider = true;
                inputElement.value = this.value;
                isUpdatingFromSlider = false;
                
                calculateAndUpdate();
            });
            
            // Add change event for when user finishes typing
            inputElement.addEventListener('change', function() {
                if (isUpdatingFromSlider) return;
                
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                this.value = value;
                sliderElement.value = value;
                calculateAndUpdate();
            });
        }
    });
}

// Add throttling to prevent rapid successive calls
let calculationTimeout;
let isCalculating = false;

function calculateAndUpdate() {
    // Prevent multiple simultaneous calculations
    if (isCalculating) {
        return;
    }
    
    // Clear any pending calculation
    if (calculationTimeout) {
        clearTimeout(calculationTimeout);
    }
    
    // Throttle calculations to prevent rapid successive calls
    calculationTimeout = setTimeout(() => {
        performCalculation();
    }, 300);
}

function performCalculation() {
    isCalculating = true;
    
    try {
        const principal = parseFloat(document.getElementById('principal').value) || 1000000;
        const annualRate = parseFloat(document.getElementById('annualRate').value) || 12.0;
        const tenureMonths = parseInt(document.getElementById('tenureMonths').value) || 180;
        const emiAmount = parseFloat(document.getElementById('emiAmount').value) || 12000;
        const monthsOverdue = parseInt(document.getElementById('monthsOverdue').value) || 3;
        const penaltyRate = parseFloat(document.getElementById('penaltyRate').value) || 2.0;
        
        // Validate input ranges
        if (principal < 10000 || principal > 50000000) {
            console.error('Invalid principal amount');
            isCalculating = false;
            return;
        }
        
        if (annualRate < 0.1 || annualRate > 36) {
            console.error('Invalid annual rate');
            isCalculating = false;
            return;
        }
        
        if (tenureMonths < 6 || tenureMonths > 360) {
            console.error('Invalid tenure');
            isCalculating = false;
            return;
        }
        
        // Make API call
        fetch('/calculate-emi-overdue-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                principal: principal,
                annualRate: annualRate,
                tenureMonths: tenureMonths,
                emiAmount: emiAmount,
                monthsOverdue: monthsOverdue,
                penaltyRate: penaltyRate
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                updateResults(data);
                updateChart(data);
                updateImpactAnalysis(data);
            } else {
                console.error('Calculation error:', data.error);
                showNotification('Calculation error: ' + (data.error || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Network error:', error);
            showNotification('Network error: Unable to calculate overdue status', 'error');
        })
        .finally(() => {
            isCalculating = false;
        });
        
    } catch (error) {
        console.error('Calculation error:', error);
        showNotification('Error: ' + error.message, 'error');
        isCalculating = false;
    }
}

function updateResults(data) {
    // Update result cards
    document.getElementById('missedEmiResult').textContent = formatCurrency(data.overdue_emi_amount);
    document.getElementById('penaltyAmountResult').textContent = formatCurrency(data.overdue_interest);
    document.getElementById('totalOverdueResult').textContent = formatCurrency(data.total_overdue_amount);
    document.getElementById('outstandingPrincipalResult').textContent = formatCurrency(data.outstanding_principal);

    // Update chart summary
    document.getElementById('overdueEmiDisplay').textContent = formatCurrency(data.overdue_emi_amount);
    document.getElementById('penaltyDisplay').textContent = formatCurrency(data.overdue_interest);
}

function updateChart(data) {
    const ctx = document.getElementById('overdueChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (overdueChart) {
        overdueChart.destroy();
    }

    const chartData = [data.overdue_emi_amount, data.overdue_interest];
    const chartLabels = ['Overdue EMI Amount', 'Penalty Interest'];
    const chartColors = ['#dc2626', '#f59e0b'];
    
    overdueChart = new Chart(ctx, {
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

function updateImpactAnalysis(data) {
    // Update Payment Required card
    document.getElementById('impactOverdueEmi').textContent = formatCurrency(data.overdue_emi_amount);
    document.getElementById('impactPenalty').textContent = formatCurrency(data.overdue_interest);
    document.getElementById('impactTotalPayment').textContent = formatCurrency(data.total_overdue_amount);
    
    // Update Current Loan Status card
    document.getElementById('impactOutstanding').textContent = formatCurrency(data.outstanding_principal);
    document.getElementById('impactRevisedEmi').textContent = formatCurrency(data.revised_emi);
    document.getElementById('impactRemainingTenure').textContent = `${data.revised_tenure_months} months`;
    
    // Update Financial Impact card
    document.getElementById('impactMonthsOverdue').textContent = `${data.months_overdue} months`;
    document.getElementById('impactPenaltyRate').textContent = `${data.penalty_rate_monthly}% per month`;
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
    const pdfBtn = document.querySelector('.pdf-btn');
    const excelBtn = document.querySelector('.excel-btn');
    const shareBtn = document.querySelector('.share-btn');
    
    if (pdfBtn) {
        pdfBtn.addEventListener('click', downloadPDF);
    }
    
    if (excelBtn) {
        excelBtn.addEventListener('click', downloadExcel);
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', shareLink);
    }
}

function downloadPDF() {
    try {
        showNotification('Generating PDF...', 'success');
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get current calculation data
        const principal = parseFloat(document.getElementById('principal').value) || 1000000;
        const annualRate = parseFloat(document.getElementById('annualRate').value) || 12.0;
        const tenureMonths = parseInt(document.getElementById('tenureMonths').value) || 180;
        const emiAmount = parseFloat(document.getElementById('emiAmount').value) || 12000;
        const monthsOverdue = parseInt(document.getElementById('monthsOverdue').value) || 3;
        const penaltyRate = parseFloat(document.getElementById('penaltyRate').value) || 2.0;
        
        const missedEmi = document.getElementById('missedEmiResult').textContent;
        const penaltyAmount = document.getElementById('penaltyAmountResult').textContent;
        const totalOverdue = document.getElementById('totalOverdueResult').textContent;
        const outstandingPrincipal = document.getElementById('outstandingPrincipalResult').textContent;
        
        // Set up the PDF
        doc.setFontSize(20);
        doc.text('EMI Overdue Status Report', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
        
        // Input Parameters
        doc.setFontSize(16);
        doc.text('Loan Details:', 20, 50);
        
        doc.setFontSize(12);
        doc.text(`Original Loan Amount: ${formatCurrency(principal)}`, 25, 60);
        doc.text(`Annual Interest Rate: ${annualRate}%`, 25, 70);
        doc.text(`Original Tenure: ${tenureMonths} months`, 25, 80);
        doc.text(`Monthly EMI: ${formatCurrency(emiAmount)}`, 25, 90);
        doc.text(`Months Overdue: ${monthsOverdue}`, 25, 100);
        doc.text(`Penalty Rate: ${penaltyRate}% per month`, 25, 110);
        
        // Results
        doc.setFontSize(16);
        doc.text('Overdue Status:', 20, 130);
        
        doc.setFontSize(12);
        doc.text(`Missed EMI Amount: ${missedEmi}`, 25, 140);
        doc.text(`Penalty Amount: ${penaltyAmount}`, 25, 150);
        doc.text(`Total Overdue Amount: ${totalOverdue}`, 25, 160);
        doc.text(`Outstanding Principal: ${outstandingPrincipal}`, 25, 170);
        
        // Action Required
        doc.setFontSize(16);
        doc.text('Action Required:', 20, 190);
        
        doc.setFontSize(12);
        doc.text('1. Contact your lender immediately', 25, 200);
        doc.text(`2. Pay the total overdue amount: ${totalOverdue}`, 25, 210);
        doc.text(`3. Resume regular EMI payments: ${formatCurrency(emiAmount)}`, 25, 220);
        doc.text('4. Set up auto-pay to avoid future defaults', 25, 230);
        
        // Disclaimer
        doc.setFontSize(10);
        doc.text('Disclaimer: This is an indicative calculation. Please consult with your lender for exact figures.', 20, 270);
        
        // Save the PDF
        doc.save('EMI_Overdue_Status_Report.pdf');
        
        showNotification('PDF downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Error generating PDF. Please try again.', 'error');
    }
}

function downloadExcel() {
    try {
        showNotification('Generating Excel file...', 'success');
        
        // Get current calculation data
        const principal = parseFloat(document.getElementById('principal').value) || 1000000;
        const annualRate = parseFloat(document.getElementById('annualRate').value) || 12.0;
        const tenureMonths = parseInt(document.getElementById('tenureMonths').value) || 180;
        const emiAmount = parseFloat(document.getElementById('emiAmount').value) || 12000;
        const monthsOverdue = parseInt(document.getElementById('monthsOverdue').value) || 3;
        const penaltyRate = parseFloat(document.getElementById('penaltyRate').value) || 2.0;
        
        const missedEmi = document.getElementById('missedEmiResult').textContent;
        const penaltyAmount = document.getElementById('penaltyAmountResult').textContent;
        const totalOverdue = document.getElementById('totalOverdueResult').textContent;
        const outstandingPrincipal = document.getElementById('outstandingPrincipalResult').textContent;
        
        // Create CSV content
        let csvContent = "EMI Overdue Status Report\n";
        csvContent += `Generated on,${new Date().toLocaleDateString()}\n\n`;
        
        csvContent += "Loan Details\n";
        csvContent += `Original Loan Amount,${formatCurrency(principal)}\n`;
        csvContent += `Annual Interest Rate,${annualRate}%\n`;
        csvContent += `Original Tenure,${tenureMonths} months\n`;
        csvContent += `Monthly EMI,${formatCurrency(emiAmount)}\n`;
        csvContent += `Months Overdue,${monthsOverdue}\n`;
        csvContent += `Penalty Rate,${penaltyRate}% per month\n\n`;
        
        csvContent += "Overdue Status\n";
        csvContent += `Missed EMI Amount,${missedEmi}\n`;
        csvContent += `Penalty Amount,${penaltyAmount}\n`;
        csvContent += `Total Overdue Amount,${totalOverdue}\n`;
        csvContent += `Outstanding Principal,${outstandingPrincipal}\n\n`;
        
        csvContent += "Action Required\n";
        csvContent += "1. Contact your lender immediately\n";
        csvContent += `2. Pay the total overdue amount: ${totalOverdue}\n`;
        csvContent += `3. Resume regular EMI payments: ${formatCurrency(emiAmount)}\n`;
        csvContent += "4. Set up auto-pay to avoid future defaults\n";
        
        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'EMI_Overdue_Status_Report.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        showNotification('Excel file downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Excel generation error:', error);
        showNotification('Error generating Excel file. Please try again.', 'error');
    }
}

function shareLink() {
    try {
        const principal = parseFloat(document.getElementById('principal').value) || 1000000;
        const annualRate = parseFloat(document.getElementById('annualRate').value) || 12.0;
        const tenureMonths = parseInt(document.getElementById('tenureMonths').value) || 180;
        const emiAmount = parseFloat(document.getElementById('emiAmount').value) || 12000;
        const monthsOverdue = parseInt(document.getElementById('monthsOverdue').value) || 3;
        const penaltyRate = parseFloat(document.getElementById('penaltyRate').value) || 2.0;
        
        const params = new URLSearchParams({
            principal: principal,
            annualRate: annualRate,
            tenureMonths: tenureMonths,
            emiAmount: emiAmount,
            monthsOverdue: monthsOverdue,
            penaltyRate: penaltyRate
        });
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        
        // Try to use the native Web Share API first
        if (navigator.share) {
            navigator.share({
                title: 'EMI Overdue Status Calculator',
                text: 'Check out this EMI Overdue Status calculation',
                url: shareUrl
            }).then(() => {
                showNotification('Shared successfully!', 'success');
            }).catch((error) => {
                console.log('Error sharing:', error);
                fallbackCopyTextToClipboard(shareUrl);
            });
        } else {
            // Fallback to clipboard
            fallbackCopyTextToClipboard(shareUrl);
        }
        
    } catch (error) {
        console.error('Share error:', error);
        showNotification('Error sharing link. Please try again.', 'error');
    }
}

function fallbackCopyTextToClipboard(text) {
    try {
        // Try the modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification('Link copied to clipboard!', 'success');
            }).catch(() => {
                // If that fails, try the legacy method
                legacyCopyToClipboard(text);
            });
        } else {
            // Use the legacy method for older browsers or non-secure contexts
            legacyCopyToClipboard(text);
        }
    } catch (error) {
        console.error('Clipboard error:', error);
        showNotification('Unable to copy link. Please copy manually.', 'error');
    }
}

function legacyCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Link copied to clipboard!', 'success');
        } else {
            showNotification('Unable to copy link. Please copy manually.', 'error');
        }
    } catch (err) {
        console.error('Legacy copy failed:', err);
        showNotification('Unable to copy link. Please copy manually.', 'error');
    } finally {
        document.body.removeChild(textArea);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Load parameters if they exist
    const params = [
        'principal', 'annualRate', 'tenureMonths', 
        'emiAmount', 'monthsOverdue', 'penaltyRate'
    ];
    
    params.forEach(param => {
        const value = urlParams.get(param);
        if (value) {
            const element = document.getElementById(param);
            const slider = document.getElementById(param + 'Slider');
            if (element) {
                element.value = value;
                if (slider) {
                    slider.value = value;
                }
            }
        }
    });
}

function formatCurrency(amount) {
    if (amount >= 10000000) { // 1 crore
        return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
    } else if (amount >= 100000) { // 1 lakh
        return '₹' + (amount / 100000).toFixed(2) + ' L';
    } else if (amount >= 1000) { // 1 thousand
        return '₹' + (amount / 1000).toFixed(2) + ' K';
    } else {
        return '₹' + amount.toLocaleString('en-IN');
    }
} 