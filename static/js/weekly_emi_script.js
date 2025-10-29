// Global variables
let paymentBreakupChart;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupDropdownMenu();
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'loanAmount', slider: 'loanAmountSlider', min: 10000, max: 10000000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 1, max: 30 },
        { input: 'tenureWeeks', slider: 'tenureWeeksSlider', min: 4, max: 520 }
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
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const tenureWeeks = parseInt(document.getElementById('tenureWeeks').value) || 0;
    
    if (loanAmount <= 0 || tenureWeeks <= 0) {
        return;
    }
    
    // Send data to backend for calculation
    const requestData = {
        principal: loanAmount,
        interestRate: interestRate,
        tenureWeeks: tenureWeeks
    };
    
    fetch('/calculate-weekly-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateResults(data);
            updateChart(data);
            updateScheduleTable(data);
        } else {
            console.error('Calculation error:', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateResults(data) {
    document.getElementById('weeklyEmi').textContent = formatCurrency(data.weeklyEmi);
    document.getElementById('principalAmount').textContent = formatCurrency(data.principal);
    document.getElementById('totalInterest').textContent = formatCurrency(data.totalInterest);
    document.getElementById('totalPayment').textContent = formatCurrency(data.totalPayment);
    
    // Update percentages
    const principalPercentage = (data.principal / data.totalPayment * 100).toFixed(1);
    const interestPercentage = (data.totalInterest / data.totalPayment * 100).toFixed(1);
    
    document.getElementById('principalPercentage').textContent = principalPercentage + '%';
    document.getElementById('interestPercentage').textContent = interestPercentage + '%';
}

function updateChart(data) {
    const ctx = document.getElementById('paymentBreakupChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (paymentBreakupChart) {
        paymentBreakupChart.destroy();
    }
    
    paymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Interest'],
            datasets: [{
                data: [data.principal, data.totalInterest],
                backgroundColor: ['#14B8A6', '#F59E0B'],
                borderWidth: 2,
                borderColor: '#fff'
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
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return context.label + ': ₹' + formatNumber(value) + ' (' + percentage + '%)';
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function updateScheduleTable(data) {
    const tableBody = document.getElementById('scheduleTableBody');
    tableBody.innerHTML = '';
    
    if (data.amortizationSchedule && data.amortizationSchedule.length > 0) {
        data.amortizationSchedule.forEach(weekData => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${weekData.week}</td>
                <td>₹${formatNumber(weekData.principal)}</td>
                <td>₹${formatNumber(weekData.interest)}</td>
                <td>₹${formatNumber(weekData.weeklyPayment)}</td>
                <td>₹${formatNumber(weekData.balance)}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function formatCurrency(amount) {
    return '₹ ' + formatNumber(amount);
}

function formatNumber(num) {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// Update slider labels for better UX
function updateSliderLabels() {
    // Update tenure slider labels based on current value
    const tenureWeeks = parseInt(document.getElementById('tenureWeeks').value) || 52;
    const tenureSliderLabels = document.querySelector('#tenureWeeksSlider').parentElement.querySelector('.slider-labels');
    
    if (tenureSliderLabels) {
        tenureSliderLabels.innerHTML = `
            <span>4W</span>
            <span>1Y</span>
            <span>3Y</span>
            <span>7Y</span>
            <span>10Y</span>
        `;
    }
}

// Input validation and formatting - only validate on blur to allow free typing
document.addEventListener('blur', function(e) {
    if (e.target.type === 'number') {
        const value = parseFloat(e.target.value);
        const min = parseFloat(e.target.min);
        const max = parseFloat(e.target.max);
        
        // Enforce constraints only when user finishes typing (on blur)
        if (!isNaN(value) && !isNaN(min) && !isNaN(max)) {
            if (value < min) {
                e.target.value = min;
            } else if (value > max) {
                e.target.value = max;
            }
        }
    }
}, true);

// Initialize slider labels
document.addEventListener('DOMContentLoaded', function() {
    updateSliderLabels();
});

function setupDropdownMenu() {
    const dropdown = document.querySelector('.dropdown');
    const dropdownBtn = document.querySelector('.dropdown-btn');
    
    if (dropdown && dropdownBtn) {
        dropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
        
        // Prevent dropdown from closing when clicking inside
        dropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
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
