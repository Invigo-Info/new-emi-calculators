// Index Fund Calculator JavaScript

// Global variables
let currentInvestmentType = 'sip';
let growthChart = null;
let isCalculating = false;

// DOM Elements
const sipToggle = document.getElementById('sipToggle');
const lumpsumToggle = document.getElementById('lumpsumToggle');
const sipForm = document.getElementById('sipForm');
const lumpsumForm = document.getElementById('lumpsumForm');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');

// SIP Form Elements
const monthlyAmount = document.getElementById('monthlyAmount');
const monthlyAmountSlider = document.getElementById('monthlyAmountSlider');
const sipDuration = document.getElementById('sipDuration');
const sipDurationSlider = document.getElementById('sipDurationSlider');
const sipCagr = document.getElementById('sipCagr');
const sipCagrSlider = document.getElementById('sipCagrSlider');

// Lumpsum Form Elements
const lumpsumAmount = document.getElementById('lumpsumAmount');
const lumpsumAmountSlider = document.getElementById('lumpsumAmountSlider');
const lumpsumDuration = document.getElementById('lumpsumDuration');
const lumpsumDurationSlider = document.getElementById('lumpsumDurationSlider');
const lumpsumCagr = document.getElementById('lumpsumCagr');
const lumpsumCagrSlider = document.getElementById('lumpsumCagrSlider');

// Result Elements
const totalInvested = document.getElementById('totalInvested');
const maturityAmount = document.getElementById('maturityAmount');
const totalGain = document.getElementById('totalGain');
const resultCagr = document.getElementById('resultCagr');

// Initialize the calculator
document.addEventListener('DOMContentLoaded', function() {
    setupMegaMenu(); // Setup mega menu functionality
    initializeEventListeners();
    updateSliderBackgrounds();
    calculateIndexFundReturns(); // Initial calculation
});

function setupMegaMenu() {
    // Mega menu functionality
    const megaMenuContainers = document.querySelectorAll('.mega-menu-container');
    
    megaMenuContainers.forEach(container => {
        const trigger = container.querySelector('.mega-menu-trigger');
        const menu = container.querySelector('.mega-menu');
        const close = container.querySelector('.mega-menu-close');
        
        if (trigger && menu) {
            trigger.addEventListener('click', (e) => {
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
            
            if (close) {
                close.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    container.classList.remove('open');
                });
            }
        }
    });
    
    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.mega-menu-container')) {
            megaMenuContainers.forEach(container => {
                container.classList.remove('open');
            });
        }
    });
    
    // Close menus on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            megaMenuContainers.forEach(container => {
                container.classList.remove('open');
            });
        }
    });
}

function initializeEventListeners() {
    // Investment type toggles
    sipToggle.addEventListener('click', () => switchInvestmentType('sip'));
    lumpsumToggle.addEventListener('click', () => switchInvestmentType('lumpsum'));
    
    // SIP form listeners
    monthlyAmount.addEventListener('input', syncInput);
    monthlyAmountSlider.addEventListener('input', syncSlider);
    sipDuration.addEventListener('input', syncInput);
    sipDurationSlider.addEventListener('input', syncSlider);
    sipCagr.addEventListener('input', syncInput);
    sipCagrSlider.addEventListener('input', syncSlider);
    
    // Lumpsum form listeners
    lumpsumAmount.addEventListener('input', syncInput);
    lumpsumAmountSlider.addEventListener('input', syncSlider);
    lumpsumDuration.addEventListener('input', syncInput);
    lumpsumDurationSlider.addEventListener('input', syncSlider);
    lumpsumCagr.addEventListener('input', syncInput);
    lumpsumCagrSlider.addEventListener('input', syncSlider);
    
    // Button listeners
    calculateBtn.addEventListener('click', calculateIndexFundReturns);
    resetBtn.addEventListener('click', resetForm);
    
    // Auto-calculate on input changes
    const allInputs = [monthlyAmount, sipDuration, sipCagr, lumpsumAmount, lumpsumDuration, lumpsumCagr];
    allInputs.forEach(input => {
        input.addEventListener('input', debounce(calculateIndexFundReturns, 500));
    });
    
    const allSliders = [monthlyAmountSlider, sipDurationSlider, sipCagrSlider, 
                       lumpsumAmountSlider, lumpsumDurationSlider, lumpsumCagrSlider];
    allSliders.forEach(slider => {
        slider.addEventListener('input', debounce(calculateIndexFundReturns, 300));
    });
}

function switchInvestmentType(type) {
    currentInvestmentType = type;
    
    if (type === 'sip') {
        // Update toggle buttons
        sipToggle.classList.add('bg-blue-600', 'text-white');
        sipToggle.classList.remove('text-gray-700', 'hover:text-gray-900');
        lumpsumToggle.classList.remove('bg-blue-600', 'text-white');
        lumpsumToggle.classList.add('text-gray-700', 'hover:text-gray-900');
        
        // Show/hide forms
        sipForm.classList.remove('hidden');
        lumpsumForm.classList.add('hidden');
    } else {
        // Update toggle buttons
        lumpsumToggle.classList.add('bg-blue-600', 'text-white');
        lumpsumToggle.classList.remove('text-gray-700', 'hover:text-gray-900');
        sipToggle.classList.remove('bg-blue-600', 'text-white');
        sipToggle.classList.add('text-gray-700', 'hover:text-gray-900');
        
        // Show/hide forms
        lumpsumForm.classList.remove('hidden');
        sipForm.classList.add('hidden');
    }
    
    // Recalculate with new investment type
    calculateIndexFundReturns();
}

function syncInput(event) {
    const input = event.target;
    const sliderId = input.id + 'Slider';
    const slider = document.getElementById(sliderId);
    
    if (slider) {
        slider.value = input.value;
        updateSliderBackground(slider);
    }
}

function syncSlider(event) {
    const slider = event.target;
    const inputId = slider.id.replace('Slider', '');
    const input = document.getElementById(inputId);
    
    if (input) {
        input.value = slider.value;
        updateSliderBackground(slider);
    }
}

function updateSliderBackgrounds() {
    const sliders = [monthlyAmountSlider, sipDurationSlider, sipCagrSlider,
                    lumpsumAmountSlider, lumpsumDurationSlider, lumpsumCagrSlider];
    
    sliders.forEach(slider => {
        updateSliderBackground(slider);
    });
}

function updateSliderBackground(slider) {
    const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty('--value', value + '%');
}

async function calculateIndexFundReturns() {
    if (isCalculating) return;
    
    try {
        isCalculating = true;
        calculateBtn.classList.add('loading');
        
        const requestData = {
            investmentType: currentInvestmentType,
        };
        
        if (currentInvestmentType === 'sip') {
            requestData.monthlyAmount = parseFloat(monthlyAmount.value) || 5000;
            requestData.investmentDuration = parseInt(sipDuration.value) || 10;
            requestData.expectedReturn = parseFloat(sipCagr.value) || 12;
        } else {
            requestData.lumpsumAmount = parseFloat(lumpsumAmount.value) || 100000;
            requestData.investmentDuration = parseInt(lumpsumDuration.value) || 15;
            requestData.expectedReturn = parseFloat(lumpsumCagr.value) || 10;
        }
        
        const response = await fetch('/calculate-index-fund', {
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
            console.error('Calculation error:', data.error);
            return;
        }
        
        updateResults(data);
        updateGrowthChart(data);
        
    } catch (error) {
        console.error('Error calculating returns:', error);
    } finally {
        isCalculating = false;
        calculateBtn.classList.remove('loading');
    }
}

function updateResults(data) {
    // Update result values
    totalInvested.textContent = formatCurrency(data.totalInvested);
    maturityAmount.textContent = formatCurrency(data.maturityAmount);
    totalGain.textContent = formatCurrency(data.totalGain);
    resultCagr.textContent = data.expectedReturn + '%';
    
    // Apply positive/negative styling to gain
    totalGain.className = data.totalGain >= 0 ? 'text-xl font-bold text-green-800 positive-gain' : 'text-xl font-bold text-red-800 negative-gain';
    
    // Add animation
    [totalInvested, maturityAmount, totalGain].forEach(element => {
        element.classList.add('fade-in');
        setTimeout(() => element.classList.remove('fade-in'), 300);
    });
}

function updateGrowthChart(data) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    
    // Destroy existing chart
    if (growthChart) {
        growthChart.destroy();
    }
    
    // Prepare chart data
    const years = data.yearlyBreakdown.map(item => `Year ${item.year}`);
    const investedData = data.yearlyBreakdown.map(item => item.cumulative_invested);
    const valueData = data.yearlyBreakdown.map(item => item.current_value);
    
    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Total Invested',
                    data: investedData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Investment Value',
                    data: valueData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#ffffff',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Investment Period',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Amount (₹)',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyShort(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function resetForm() {
    if (currentInvestmentType === 'sip') {
        monthlyAmount.value = 5000;
        monthlyAmountSlider.value = 5000;
        sipDuration.value = 10;
        sipDurationSlider.value = 10;
        sipCagr.value = 12;
        sipCagrSlider.value = 12;
    } else {
        lumpsumAmount.value = 100000;
        lumpsumAmountSlider.value = 100000;
        lumpsumDuration.value = 15;
        lumpsumDurationSlider.value = 15;
        lumpsumCagr.value = 10;
        lumpsumCagrSlider.value = 10;
    }
    
    updateSliderBackgrounds();
    calculateIndexFundReturns();
}

// Utility Functions
function formatCurrency(amount) {
    const num = parseFloat(amount);
    
    if (num >= 10000000) { // 1 Crore
        return `₹${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) { // 1 Lakh
        return `₹${(num / 100000).toFixed(2)} L`;
    } else if (num >= 1000) { // 1 Thousand
        return `₹${(num / 1000).toFixed(2)} K`;
    } else {
        return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
}

function formatCurrencyShort(amount) {
    const num = parseFloat(amount);
    
    if (num >= 10000000) {
        return `₹${(num / 10000000).toFixed(1)}Cr`;
    } else if (num >= 100000) {
        return `₹${(num / 100000).toFixed(1)}L`;
    } else if (num >= 1000) {
        return `₹${(num / 1000).toFixed(1)}K`;
    } else {
        return `₹${num.toFixed(0)}`;
    }
}

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