// Land Area Calculator JavaScript
// Unique naming to avoid conflicts with other calculators

class LandAreaCalculatorApp {
    constructor() {
        this.unitToSqm = {
            'Square Feet': 0.092903,
            'Square Yards (Gaj)': 0.836127,
            'Square Meters': 1,
            'Acre': 4046.86,
            'Hectare': 10000,
            'Cent': 40.4686,
            'Guntha': 101.17,
            'Decimal': 40.4686,
            'Ground': 222.967,
            'Bigha': {
                'Not applicable': 1337.8,
                'Rajasthan (Upper)': 17424.0,
                'Rajasthan (Lower)': 3025.0,
                'Uttar Pradesh': 2529.0,
                'Bihar': 2529.0,
                'West Bengal': 1337.8,
                'Assam': 2508.0,
                'Gujarat': 17424.0,
                'Madhya Pradesh': 12165.0,
                'Punjab/Haryana': 4046.86
            },
            'Katha': {
                'Not applicable': 126.441,
                'Rajasthan (Upper)': 81.75,
                'Rajasthan (Lower)': 101.17,
                'Uttar Pradesh': 126.441,
                'Bihar': 126.441,
                'West Bengal': 720,
                'Assam': 2880,
                'Gujarat': 81.75,
                'Madhya Pradesh': 121.65,
                'Punjab/Haryana': 505.857
            },
            'Biswa': {
                'Not applicable': 151.25,
                'Rajasthan (Upper)': 151.25,
                'Rajasthan (Lower)': 96.8,
                'Uttar Pradesh': 126.441,
                'Bihar': 63.22,
                'West Bengal': 36,
                'Assam': 144,
                'Gujarat': 151.25,
                'Madhya Pradesh': 60.825,
                'Punjab/Haryana': 25.29
            },
            'Marla': 25.2929,
            'Kanal': 505.857,
            'Murabba': 101171.41
        };

        this.unitSuffixes = {
            'Square Feet': 'sq ft',
            'Square Yards (Gaj)': 'sq yd',
            'Square Meters': 'sq m',
            'Acre': 'acre',
            'Hectare': 'ha',
            'Cent': 'cent',
            'Guntha': 'guntha',
            'Decimal': 'decimal',
            'Ground': 'ground',
            'Bigha': 'bigha',
            'Katha': 'katha',
            'Biswa': 'biswa',
            'Marla': 'marla',
            'Kanal': 'kanal',
            'Murabba': 'murabba'
        };

        this.regionalUnits = ['Bigha', 'Katha', 'Biswa'];
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateUrlFromParams();
        this.performCalculation();
    }

    initializeElements() {
        this.elements = {
            areaValue: document.getElementById('areaValue'),
            fromUnit: document.getElementById('fromUnit'),
            toUnit: document.getElementById('toUnit'),
            region: document.getElementById('region'),
            precision: document.getElementById('precision'),
            showTable: document.getElementById('showTable'),
            fromUnitSuffix: document.getElementById('fromUnitSuffix'),
            convertedValue: document.getElementById('convertedValue'),
            formulaUsed: document.getElementById('formulaUsed'),
            sqmEquivalent: document.getElementById('sqmEquivalent'),
            regionInfo: document.getElementById('regionInfo'),
            regionalNote: document.getElementById('regionalNote'),
            selectedRegion: document.getElementById('selectedRegion'),
            conversionTableContainer: document.getElementById('conversionTableContainer'),
            conversionTableBody: document.getElementById('conversionTableBody'),
            inputValueDisplay: document.getElementById('inputValueDisplay'),
            inputUnitDisplay: document.getElementById('inputUnitDisplay'),
            copyResult: document.getElementById('copyResult')
        };
    }

    attachEventListeners() {
        // Input change listeners for live calculation
        this.elements.areaValue.addEventListener('input', () => this.performCalculation());
        this.elements.fromUnit.addEventListener('change', () => {
            this.updateUnitSuffix();
            this.checkRegionalUnits();
            this.performCalculation();
            this.updateUrl();
        });
        this.elements.toUnit.addEventListener('change', () => {
            this.checkRegionalUnits();
            this.performCalculation();
            this.updateUrl();
        });
        this.elements.region.addEventListener('change', () => {
            this.performCalculation();
            this.updateUrl();
        });
        this.elements.precision.addEventListener('input', () => this.performCalculation());
        this.elements.showTable.addEventListener('change', () => {
            this.toggleConversionTable();
            this.performCalculation();
        });

        // Copy functionality
        this.elements.copyResult.addEventListener('click', () => this.copyResult());

        // Prevent form submission on enter
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
                e.preventDefault();
            }
        });
    }

    updateUnitSuffix() {
        const fromUnit = this.elements.fromUnit.value;
        this.elements.fromUnitSuffix.textContent = this.unitSuffixes[fromUnit] || 'unit';
    }

    checkRegionalUnits() {
        const fromUnit = this.elements.fromUnit.value;
        const toUnit = this.elements.toUnit.value;
        const isRegionalUnit = this.regionalUnits.includes(fromUnit) || this.regionalUnits.includes(toUnit);
        
        this.elements.regionInfo.style.display = isRegionalUnit ? 'block' : 'none';
        
        if (isRegionalUnit && this.elements.region.value === 'Not applicable') {
            this.elements.region.value = 'Rajasthan (Upper)'; // Default to a valid region
        }
    }

    formatNumber(num, precision) {
        // Format number with INR-style grouping
        const formatted = new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision
        }).format(num);
        return formatted;
    }

    performCalculation() {
        try {
            const fromValue = parseFloat(this.elements.areaValue.value) || 0;
            const fromUnit = this.elements.fromUnit.value;
            const toUnit = this.elements.toUnit.value;
            const region = this.elements.region.value;
            const precision = parseInt(this.elements.precision.value) || 4;

            if (fromValue <= 0) {
                this.updateResults(0, fromUnit, toUnit, region, precision, 0);
                return;
            }

            // Get conversion factors
            let fromFactor = this.unitToSqm[fromUnit];
            let toFactor = this.unitToSqm[toUnit];

            // Handle regional units
            if (typeof fromFactor === 'object') {
                fromFactor = fromFactor[region] || fromFactor['Not applicable'];
            }
            if (typeof toFactor === 'object') {
                toFactor = toFactor[region] || toFactor['Not applicable'];
            }

            if (!fromFactor || !toFactor) {
                throw new Error('Invalid unit or region selection');
            }

            // Perform conversion
            const sqm = fromValue * fromFactor;
            const resultValue = sqm / toFactor;

            this.updateResults(resultValue, fromUnit, toUnit, region, precision, sqm);
            this.updateConversionTable(sqm, region, precision, fromValue, fromUnit);

        } catch (error) {
            console.error('Calculation error:', error);
            this.showError(error.message);
        }
    }

    updateResults(resultValue, fromUnit, toUnit, region, precision, sqm) {
        // Update converted value
        const formattedResult = this.formatNumber(resultValue, precision);
        const resultSuffix = this.unitSuffixes[toUnit] || toUnit.toLowerCase();
        this.elements.convertedValue.textContent = `${formattedResult} ${resultSuffix}`;

        // Update formula
        let fromFactor = this.unitToSqm[fromUnit];
        let toFactor = this.unitToSqm[toUnit];
        
        if (typeof fromFactor === 'object') {
            fromFactor = fromFactor[region] || fromFactor['Not applicable'];
        }
        if (typeof toFactor === 'object') {
            toFactor = toFactor[region] || toFactor['Not applicable'];
        }

        const conversionFactor = fromFactor / toFactor;
        this.elements.formulaUsed.textContent = `${this.unitSuffixes[toUnit]} = ${this.unitSuffixes[fromUnit]} × ${conversionFactor.toFixed(6)}`;

        // Update square meter equivalent
        const formattedSqm = this.formatNumber(sqm, precision);
        this.elements.sqmEquivalent.textContent = `${formattedSqm} sq m`;

        // Show/hide regional note
        const isRegionalCalculation = this.regionalUnits.includes(fromUnit) || this.regionalUnits.includes(toUnit);
        if (isRegionalCalculation && region !== 'Not applicable') {
            this.elements.regionalNote.style.display = 'block';
            this.elements.selectedRegion.textContent = region;
        } else {
            this.elements.regionalNote.style.display = 'none';
        }
    }

    updateConversionTable(sqm, region, precision, inputValue, inputUnit) {
        if (!this.elements.showTable.checked) {
            this.elements.conversionTableContainer.style.display = 'none';
            return;
        }

        this.elements.conversionTableContainer.style.display = 'block';
        
        // Update table header
        this.elements.inputValueDisplay.textContent = this.formatNumber(inputValue, precision);
        this.elements.inputUnitDisplay.textContent = inputUnit;

        // Clear existing table
        this.elements.conversionTableBody.innerHTML = '';

        // Generate table rows
        Object.keys(this.unitToSqm).forEach(unit => {
            let factor = this.unitToSqm[unit];
            
            if (typeof factor === 'object') {
                factor = factor[region] || factor['Not applicable'];
            }

            if (factor) {
                const convertedValue = sqm / factor;
                const formattedValue = this.formatNumber(convertedValue, precision);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${unit}</td>
                    <td>${formattedValue} ${this.unitSuffixes[unit]}</td>
                    <td>
                        <button class="table-copy-btn" onclick="landAreaCalc.copyTableValue('${formattedValue} ${this.unitSuffixes[unit]}')">
                            Copy
                        </button>
                    </td>
                `;
                
                this.elements.conversionTableBody.appendChild(row);
            }
        });
    }

    toggleConversionTable() {
        const isVisible = this.elements.showTable.checked;
        this.elements.conversionTableContainer.style.display = isVisible ? 'block' : 'none';
    }

    copyResult() {
        const resultText = this.elements.convertedValue.textContent;
        this.copyToClipboard(resultText, this.elements.copyResult);
    }

    copyTableValue(value) {
        this.copyToClipboard(value);
    }

    copyToClipboard(text, buttonElement = null) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                this.showCopySuccess(buttonElement);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                this.fallbackCopyTextToClipboard(text, buttonElement);
            });
        } else {
            this.fallbackCopyTextToClipboard(text, buttonElement);
        }
    }

    fallbackCopyTextToClipboard(text, buttonElement = null) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopySuccess(buttonElement);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        
        document.body.removeChild(textArea);
    }

    showCopySuccess(buttonElement) {
        if (buttonElement) {
            buttonElement.classList.add('copy-success');
            setTimeout(() => {
                buttonElement.classList.remove('copy-success');
            }, 1000);
        }
        
        // Show temporary success message
        const successMsg = document.createElement('div');
        successMsg.textContent = 'Copied to clipboard!';
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #38a169;
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 1000;
            animation: fadeIn 0.3s ease-in-out;
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            document.body.removeChild(successMsg);
        }, 2000);
    }

    showError(message) {
        this.elements.convertedValue.textContent = 'Error';
        this.elements.formulaUsed.textContent = message;
        this.elements.sqmEquivalent.textContent = 'N/A';
    }

    updateUrl() {
        if (!window.history || !window.history.pushState) return;
        
        const params = new URLSearchParams();
        params.set('from', this.elements.fromUnit.value);
        params.set('to', this.elements.toUnit.value);
        params.set('value', this.elements.areaValue.value);
        params.set('region', this.elements.region.value);
        params.set('precision', this.elements.precision.value);
        params.set('table', this.elements.showTable.checked ? '1' : '0');
        
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }

    updateUrlFromParams() {
        const params = new URLSearchParams(window.location.search);
        
        if (params.has('from')) {
            this.elements.fromUnit.value = params.get('from');
            this.updateUnitSuffix();
        }
        if (params.has('to')) {
            this.elements.toUnit.value = params.get('to');
        }
        if (params.has('value')) {
            this.elements.areaValue.value = params.get('value');
        }
        if (params.has('region')) {
            this.elements.region.value = params.get('region');
        }
        if (params.has('precision')) {
            this.elements.precision.value = params.get('precision');
        }
        if (params.has('table')) {
            this.elements.showTable.checked = params.get('table') === '1';
        }
        
        this.checkRegionalUnits();
        this.toggleConversionTable();
    }
}

// Initialize the calculator when DOM is loaded
let landAreaCalc;
document.addEventListener('DOMContentLoaded', function() {
    landAreaCalc = new LandAreaCalculatorApp();
});

// Expose for global access (for inline onclick handlers)
window.landAreaCalc = landAreaCalc;
