// Global variables
let comparisonChart;
let savingsChart;
let currentData = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCalculator();
    setupEventListeners();
    calculateAndUpdate();
});

function initializeCalculator() {
    // Sync sliders with input values
    syncSliderWithInput('existingPrincipalSlider', 'existingPrincipal');
    syncSliderWithInput('existingTenureSlider', 'existingTenureYears');
    syncSliderWithInput('existingInterestSlider', 'existingInterestRate');
    syncSliderWithInput('newTenureSlider', 'newTenureYears');
    syncSliderWithInput('newInterestSlider', 'newInterestRate');
}

function setupEventListeners() {
    // Slider event listeners
    document.getElementById('existingPrincipalSlider').addEventListener('input', function() {
        document.getElementById('existingPrincipal').value = this.value;
        calculateAndUpdate();
    });

    document.getElementById('existingTenureSlider').addEventListener('input', function() {
        document.getElementById('existingTenureYears').value = this.value;
        calculateAndUpdate();
    });

    document.getElementById('existingInterestSlider').addEventListener('input', function() {
        document.getElementById('existingInterestRate').value = this.value;
        calculateAndUpdate();
    });

    document.getElementById('newTenureSlider').addEventListener('input', function() {
        document.getElementById('newTenureYears').value = this.value;
        calculateAndUpdate();
    });

    document.getElementById('newInterestSlider').addEventListener('input', function() {
        document.getElementById('newInterestRate').value = this.value;
        calculateAndUpdate();
    });

    // Input field event listeners
    document.getElementById('existingPrincipal').addEventListener('input', function() {
        document.getElementById('existingPrincipalSlider').value = this.value;
        calculateAndUpdate();
    });

    document.getElementById('existingTenureYears').addEventListener('input', function() {
        document.getElementById('existingTenureSlider').value = this.value;
        calculateAndUpdate();
    });

    document.getElementById('existingInterestRate').addEventListener('input', function() {
        document.getElementById('existingInterestSlider').value = this.value;
        calculateAndUpdate();
    });

    document.getElementById('newTenureYears').addEventListener('input', function() {
        document.getElementById('newTenureSlider').value = this.value;
        calculateAndUpdate();
    });

    document.getElementById('newInterestRate').addEventListener('input', function() {
        document.getElementById('newInterestSlider').value = this.value;
        calculateAndUpdate();
    });

    document.getElementById('processingFeePercent').addEventListener('input', calculateAndUpdate);

    // Tab event listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateTable(this.dataset.tab);
        });
    });

    // Download buttons
    document.getElementById('downloadPDF').addEventListener('click', downloadPDF);
    document.getElementById('downloadExcel').addEventListener('click', downloadExcel);
    document.getElementById('shareCalculation').addEventListener('click', shareCalculation);
}

function syncSliderWithInput(sliderId, inputId) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);
    if (slider && input) {
        slider.value = input.value;
    }
}

function calculateAndUpdate() {
    const data = {
        existingPrincipal: parseFloat(document.getElementById('existingPrincipal').value) || 0,
        existingTenureYears: parseInt(document.getElementById('existingTenureYears').value) || 0,
        existingInterestRate: parseFloat(document.getElementById('existingInterestRate').value) || 0,
        newTenureYears: parseInt(document.getElementById('newTenureYears').value) || 0,
        newInterestRate: parseFloat(document.getElementById('newInterestRate').value) || 0,
        processingFeePercent: parseFloat(document.getElementById('processingFeePercent').value) || 0.5
    };

    // Send calculation request to backend
    fetch('/calculate-refinance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            console.error('Calculation error:', result.error);
            return;
        }
        
        currentData = result;
        updateResults(result);
        updateCharts(result);
        updateTable('existing');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateResults(data) {
    document.getElementById('totalSavings').textContent = formatCurrency(data.totalSavings);
    document.getElementById('existingEmi').textContent = formatCurrency(data.existingEmi);
    document.getElementById('newEmi').textContent = formatCurrency(data.newEmi);
    document.getElementById('emiSavings').textContent = formatCurrency(data.emiSavings);
    document.getElementById('interestSavings').textContent = formatCurrency(data.interestSavings);
    document.getElementById('processingFee').textContent = formatCurrency(data.processingFee);
    
    if (data.monthsToBreakeven > 0) {
        const years = Math.floor(data.monthsToBreakeven / 12);
        const months = data.monthsToBreakeven % 12;
        let breakevenText = '';
        if (years > 0) {
            breakevenText += `${years} year${years > 1 ? 's' : ''}`;
            if (months > 0) {
                breakevenText += ` ${months} month${months > 1 ? 's' : ''}`;
            }
        } else {
            breakevenText = `${months} month${months > 1 ? 's' : ''}`;
        }
        document.getElementById('breakevenPeriod').textContent = breakevenText;
    } else {
        document.getElementById('breakevenPeriod').textContent = 'No savings';
    }
}

function updateCharts(data) {
    updateComparisonChart(data);
    updateSavingsChart(data);
}

function updateComparisonChart(data) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    if (comparisonChart) {
        comparisonChart.destroy();
    }

    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Existing Loan', 'Refinanced Loan'],
            datasets: [
                {
                    label: 'Monthly EMI (₹)',
                    data: [data.existingEmi, data.newEmi],
                    backgroundColor: ['#f56565', '#48bb78'],
                    borderColor: ['#e53e3e', '#38a169'],
                    borderWidth: 1
                },
                {
                    label: 'Total Interest (₹)',
                    data: [data.existingTotalInterest, data.newTotalInterest],
                    backgroundColor: ['#fc8181', '#68d391'],
                    borderColor: ['#e53e3e', '#38a169'],
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}

function updateSavingsChart(data) {
    const ctx = document.getElementById('savingsChart').getContext('2d');
    
    if (savingsChart) {
        savingsChart.destroy();
    }

    const savingsData = [
        data.emiSavings > 0 ? data.emiSavings * (data.existingSchedule.length * 12) : 0,
        data.interestSavings > 0 ? data.interestSavings : 0,
        data.processingFee
    ];

    savingsChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['EMI Savings', 'Interest Savings', 'Processing Fee'],
            datasets: [{
                data: savingsData,
                backgroundColor: [
                    '#48bb78',
                    '#4299e1',
                    '#f56565'
                ],
                borderColor: [
                    '#38a169',
                    '#3182ce',
                    '#e53e3e'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            return label + ': ₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}

function updateTable(type) {
    const tableBody = document.getElementById('paymentTableBody');
    tableBody.innerHTML = '';

    if (!currentData.existingSchedule || !currentData.newSchedule) {
        return;
    }

    switch (type) {
        case 'existing':
            generateTableRows(currentData.existingSchedule, 'Existing');
            break;
        case 'new':
            generateTableRows(currentData.newSchedule, 'Refinanced');
            break;
        case 'comparison':
            generateComparisonTable();
            break;
    }
}

function generateTableRows(schedule, type) {
    const tableBody = document.getElementById('paymentTableBody');
    
    schedule.forEach((yearData, index) => {
        // Year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        
        yearRow.innerHTML = `
            <td><span class="year-text">${yearData.year}</span></td>
            <td class="principal-col">${formatCurrency(yearData.principal)}</td>
            <td class="interest-col">${formatCurrency(yearData.interest)}</td>
            <td class="total-col">${formatCurrency(yearData.totalPayment)}</td>
            <td class="balance-col">${formatCurrency(yearData.balance)}</td>
            <td class="loan-paid-col">${yearData.loanPaidPercentage}%</td>
        `;
        
        tableBody.appendChild(yearRow);
        
        // Month rows (initially hidden) - Skip for refinance calculator as we only show yearly data
        // Monthly breakdown is not needed for refinance comparison
    });
}

function generateComparisonTable() {
    const tableBody = document.getElementById('paymentTableBody');
    const table = document.getElementById('paymentTable');
    
    // Update table headers for comparison
    const headerRow = table.querySelector('thead tr');
    headerRow.innerHTML = `
        <th>Year</th>
        <th>Existing EMI (₹)</th>
        <th>New EMI (₹)</th>
        <th>EMI Savings (₹)</th>
        <th>Existing Interest (₹)</th>
        <th>New Interest (₹)</th>
        <th>Interest Savings (₹)</th>
    `;
    
    const maxLength = Math.max(currentData.existingSchedule.length, currentData.newSchedule.length);
    
    for (let i = 0; i < maxLength; i++) {
        const existingData = currentData.existingSchedule[i] || {};
        const newData = currentData.newSchedule[i] || {};
        
        const row = document.createElement('tr');
        row.className = 'comparison-row';
        
        const year = existingData.year || newData.year || '';
        const existingEmi = (existingData.principal || 0) + (existingData.interest || 0);
        const newEmi = (newData.principal || 0) + (newData.interest || 0);
        const emiSavings = existingEmi - newEmi;
        const interestSavings = (existingData.interest || 0) - (newData.interest || 0);
        
        row.innerHTML = `
            <td>${year}</td>
            <td>${formatCurrency(existingEmi)}</td>
            <td>${formatCurrency(newEmi)}</td>
            <td class="${emiSavings >= 0 ? 'positive' : 'negative'}">${formatCurrency(emiSavings)}</td>
            <td>${formatCurrency(existingData.interest || 0)}</td>
            <td>${formatCurrency(newData.interest || 0)}</td>
            <td class="${interestSavings >= 0 ? 'positive' : 'negative'}">${formatCurrency(interestSavings)}</td>
        `;
        
        tableBody.appendChild(row);
    }
}

function toggleYearExpansion(yearIndex, type) {
    // For refinance calculator, we don't expand to monthly view
    // This function is kept for consistency but doesn't perform any action
    console.log('Year expansion not applicable for refinance calculator');
}

function formatCurrency(amount) {
    if (amount === 0) return '₹0';
    return '₹' + Math.round(amount).toLocaleString('en-IN');
}

function downloadPDF() {
    // Implementation for PDF download
    console.log('PDF download functionality to be implemented');
    showNotification('PDF download feature coming soon!');
}

function downloadExcel() {
    // Implementation for Excel download
    console.log('Excel download functionality to be implemented');
    showNotification('Excel download feature coming soon!');
}

function shareCalculation() {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: 'Home Loan Refinance Calculator',
            text: 'Check out this home loan refinance calculation',
            url: url
        });
    } else {
        copyToClipboard(url);
        showNotification('Link copied to clipboard!');
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #48bb78;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
} 

// Mega Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const megaMenu = document.querySelector('.mega-menu');
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenuContent = document.querySelector('.mega-menu-content');

    if (megaMenuBtn && megaMenu) {
        // Toggle mega menu on button click
        megaMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            megaMenu.classList.toggle('active');
        });

        // Close mega menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('active');
            }
        });

        // Close mega menu when clicking on any link inside
        if (megaMenuContent) {
            const megaLinks = megaMenuContent.querySelectorAll('.mega-link');
            megaLinks.forEach(function(link) {
                link.addEventListener('click', function() {
                    megaMenu.classList.remove('active');
                });
            });
        }

        // Prevent closing when clicking inside the mega menu content
        if (megaMenuContent) {
            megaMenuContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
});