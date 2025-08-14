// Global variables
let currentMode = 'carpet'; // 'carpet' or 'builtup'
let currentUnit = 'sqft'; // 'sqft' or 'sqm'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateAreaUnitLabels();
    calculateAndUpdate();
});

function setupEventListeners() {
    // Mode button listeners
    const modeCarpetBtn = document.getElementById('modeCarpetBtn');
    const modeBuiltUpBtn = document.getElementById('modeBuiltUpBtn');
    
    modeCarpetBtn.addEventListener('click', function() {
        setMode('carpet');
    });
    
    modeBuiltUpBtn.addEventListener('click', function() {
        setMode('builtup');
    });
    
    // Unit button listeners
    const unitSqftBtn = document.getElementById('unitSqftBtn');
    const unitSqmBtn = document.getElementById('unitSqmBtn');
    
    unitSqftBtn.addEventListener('click', function() {
        setUnit('sqft');
    });
    
    unitSqmBtn.addEventListener('click', function() {
        setUnit('sqm');
    });
    
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'carpetArea', slider: 'carpetAreaSlider' },
        { input: 'builtUpArea', slider: 'builtUpAreaSlider' },
        { input: 'wallDuctsLoading', slider: 'wallDuctsLoadingSlider' },
        { input: 'commonAreaLoading', slider: 'commonAreaLoadingSlider' }
    ];
    
    inputs.forEach(({ input, slider }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = parseFloat(this.value) || 0;
                const min = parseFloat(sliderElement.min);
                const max = parseFloat(sliderElement.max);
                sliderElement.value = Math.max(Math.min(value, max), min);
                calculateAndUpdate();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                calculateAndUpdate();
            });
        }
    });
    
    // Quick toggle for no common area
    const noCommonAreaBtn = document.getElementById('noCommonAreaBtn');
    noCommonAreaBtn.addEventListener('click', function() {
        document.getElementById('commonAreaLoading').value = 0;
        document.getElementById('commonAreaLoadingSlider').value = 0;
        calculateAndUpdate();
    });
}

function setMode(mode) {
    currentMode = mode;
    
    // Update button states
    const modeCarpetBtn = document.getElementById('modeCarpetBtn');
    const modeBuiltUpBtn = document.getElementById('modeBuiltUpBtn');
    
    modeCarpetBtn.classList.toggle('active', mode === 'carpet');
    modeBuiltUpBtn.classList.toggle('active', mode === 'builtup');
    
    // Show/hide appropriate input groups
    const carpetAreaGroup = document.getElementById('carpetAreaGroup');
    const builtUpAreaGroup = document.getElementById('builtUpAreaGroup');
    
    if (mode === 'carpet') {
        carpetAreaGroup.classList.remove('hidden');
        builtUpAreaGroup.classList.add('hidden');
    } else {
        carpetAreaGroup.classList.add('hidden');
        builtUpAreaGroup.classList.remove('hidden');
    }
    
    calculateAndUpdate();
}

function setUnit(unit) {
    const previousUnit = currentUnit;
    currentUnit = unit;
    
    // Update button states
    const unitSqftBtn = document.getElementById('unitSqftBtn');
    const unitSqmBtn = document.getElementById('unitSqmBtn');
    
    unitSqftBtn.classList.toggle('active', unit === 'sqft');
    unitSqmBtn.classList.toggle('active', unit === 'sqm');
    
    // Convert existing values if unit changed
    if (previousUnit !== unit) {
        convertAreaValues(previousUnit, unit);
    }
    
    updateAreaUnitLabels();
    calculateAndUpdate();
}

function convertAreaValues(fromUnit, toUnit) {
    const carpetAreaInput = document.getElementById('carpetArea');
    const builtUpAreaInput = document.getElementById('builtUpArea');
    const carpetAreaSlider = document.getElementById('carpetAreaSlider');
    const builtUpAreaSlider = document.getElementById('builtUpAreaSlider');
    
    let conversionFactor;
    
    if (fromUnit === 'sqft' && toUnit === 'sqm') {
        // Convert sq ft to sq m (1 sq ft = 0.092903 sq m)
        conversionFactor = 0.092903;
    } else if (fromUnit === 'sqm' && toUnit === 'sqft') {
        // Convert sq m to sq ft (1 sq m = 10.7639 sq ft)
        conversionFactor = 10.7639;
    } else {
        return; // No conversion needed
    }
    
    // Convert carpet area
    const carpetValue = parseFloat(carpetAreaInput.value) || 0;
    const newCarpetValue = Math.round(carpetValue * conversionFactor);
    carpetAreaInput.value = newCarpetValue;
    carpetAreaSlider.value = newCarpetValue;
    
    // Convert built-up area
    const builtUpValue = parseFloat(builtUpAreaInput.value) || 0;
    const newBuiltUpValue = Math.round(builtUpValue * conversionFactor);
    builtUpAreaInput.value = newBuiltUpValue;
    builtUpAreaSlider.value = newBuiltUpValue;
    
    // Update slider ranges for new unit
    updateSliderRanges();
}

function updateSliderRanges() {
    const carpetAreaSlider = document.getElementById('carpetAreaSlider');
    const builtUpAreaSlider = document.getElementById('builtUpAreaSlider');
    
    if (currentUnit === 'sqft') {
        // Square feet ranges
        carpetAreaSlider.min = 100;
        carpetAreaSlider.max = 10000;
        carpetAreaSlider.step = 50;
        
        builtUpAreaSlider.min = 120;
        builtUpAreaSlider.max = 12000;
        builtUpAreaSlider.step = 60;
    } else {
        // Square meter ranges (roughly 1/10th of sq ft values)
        carpetAreaSlider.min = 10;
        carpetAreaSlider.max = 1000;
        carpetAreaSlider.step = 5;
        
        builtUpAreaSlider.min = 12;
        builtUpAreaSlider.max = 1200;
        builtUpAreaSlider.step = 6;
    }
}

function updateAreaUnitLabels() {
    const unitSymbol = currentUnit === 'sqft' ? 'ft²' : 'm²';
    
    // Update all unit labels
    document.getElementById('carpetAreaSuffix').textContent = unitSymbol;
    document.getElementById('builtUpAreaSuffix').textContent = unitSymbol;
    
    // Update slider labels
    const carpetSliderLabels = document.querySelector('#carpetAreaGroup .slider-labels');
    const builtUpSliderLabels = document.querySelector('#builtUpAreaGroup .slider-labels');
    
    if (currentUnit === 'sqft') {
        carpetSliderLabels.innerHTML = `
            <span>100</span>
            <span>2.5K</span>
            <span>5K</span>
            <span>7.5K</span>
            <span>10K</span>
        `;
        builtUpSliderLabels.innerHTML = `
            <span>120</span>
            <span>3K</span>
            <span>6K</span>
            <span>9K</span>
            <span>12K</span>
        `;
    } else {
        carpetSliderLabels.innerHTML = `
            <span>10</span>
            <span>250</span>
            <span>500</span>
            <span>750</span>
            <span>1K</span>
        `;
        builtUpSliderLabels.innerHTML = `
            <span>12</span>
            <span>300</span>
            <span>600</span>
            <span>900</span>
            <span>1.2K</span>
        `;
    }
}

function calculateAndUpdate() {
    // Get input values
    const carpetArea = parseFloat(document.getElementById('carpetArea').value) || 0;
    const builtUpArea = parseFloat(document.getElementById('builtUpArea').value) || 0;
    const wallDuctsLoading = parseFloat(document.getElementById('wallDuctsLoading').value) || 0;
    const commonAreaLoading = parseFloat(document.getElementById('commonAreaLoading').value) || 0;
    
    // Determine which area to use based on mode
    const inputArea = currentMode === 'carpet' ? carpetArea : builtUpArea;
    
    if (inputArea > 0) {
        // Make API call to backend
        const requestData = {
            mode: currentMode,
            areaUnit: currentUnit,
            carpetArea: carpetArea,
            builtUpArea: builtUpArea,
            wallDuctsLoading: wallDuctsLoading,
            commonAreaLoading: commonAreaLoading
        };
        
        fetch('/calculate-built-up-vs-carpet-area', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                console.error('Calculation error:', data.error);
                return;
            }
            
            updateResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            // Fallback to client-side calculation
            performClientSideCalculation();
        });
    }
}

function performClientSideCalculation() {
    // Fallback client-side calculation
    const carpetAreaValue = parseFloat(document.getElementById('carpetArea').value) || 0;
    const builtUpAreaValue = parseFloat(document.getElementById('builtUpArea').value) || 0;
    const wallLoading = parseFloat(document.getElementById('wallDuctsLoading').value) / 100 || 0;
    const commonLoading = parseFloat(document.getElementById('commonAreaLoading').value) / 100 || 0;
    
    let finalCarpet, finalBuiltUp, superBuiltUp;
    
    if (currentMode === 'carpet') {
        finalCarpet = carpetAreaValue;
        finalBuiltUp = carpetAreaValue * (1 + wallLoading);
        superBuiltUp = finalBuiltUp * (1 + commonLoading);
    } else {
        finalBuiltUp = builtUpAreaValue;
        finalCarpet = builtUpAreaValue / (1 + wallLoading);
        superBuiltUp = finalBuiltUp * (1 + commonLoading);
    }
    
    // Calculate loading percentages
    const builtUpOverCarpetPct = ((finalBuiltUp / finalCarpet) - 1) * 100;
    const superOverBuiltUpPct = ((superBuiltUp / finalBuiltUp) - 1) * 100;
    const superOverCarpetPct = ((superBuiltUp / finalCarpet) - 1) * 100;
    
    const data = {
        carpetArea: Math.round(finalCarpet * 100) / 100,
        builtUpArea: Math.round(finalBuiltUp * 100) / 100,
        superBuiltUpArea: Math.round(superBuiltUp * 100) / 100,
        builtUpOverCarpetPct: Math.round(builtUpOverCarpetPct * 10) / 10,
        superOverBuiltUpPct: Math.round(superOverBuiltUpPct * 10) / 10,
        superOverCarpetPct: Math.round(superOverCarpetPct * 10) / 10,
        areaUnit: currentUnit
    };
    
    updateResults(data);
}

function updateResults(data) {
    const unitSymbol = data.areaUnit === 'sqft' ? 'ft²' : 'm²';
    
    // Update area results
    document.getElementById('resultCarpetArea').textContent = formatArea(data.carpetArea, unitSymbol);
    document.getElementById('resultBuiltUpArea').textContent = formatArea(data.builtUpArea, unitSymbol);
    document.getElementById('resultSuperBuiltUpArea').textContent = formatArea(data.superBuiltUpArea, unitSymbol);
    
    // Update loading percentages
    document.getElementById('builtUpOverCarpetPct').textContent = data.builtUpOverCarpetPct + '%';
    document.getElementById('superOverBuiltUpPct').textContent = data.superOverBuiltUpPct + '%';
    document.getElementById('superOverCarpetPct').textContent = data.superOverCarpetPct + '%';
}

function formatArea(area, unit) {
    // Format area with commas for thousands
    const formattedNumber = Math.round(area).toLocaleString('en-IN');
    return formattedNumber + ' ' + unit;
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
