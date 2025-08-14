// Global variables for NSIC calculator
let nsicCurrentGstRate = 18;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupNsicEventListeners();
    
    // Ensure initial slider synchronization
    updateNsicSliderFromInput();
    
    calculateAndUpdateNsic();
});

function setupNsicEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'annualTurnoverCrore', slider: 'annualTurnoverSlider', min: 0, max: 10 },
        { input: 'gstRatePercent', slider: 'gstRateSlider', min: 0, max: 28 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                calculateAndUpdateNsic();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                calculateAndUpdateNsic();
            });
        }
    });
    
    // Dropdown change listeners
    const enterpriseCategory = document.getElementById('enterpriseCategory');
    const purpose = document.getElementById('purpose');
    const includeInspectionAndProfessional = document.getElementById('includeInspectionAndProfessional');
    
    if (enterpriseCategory) {
        enterpriseCategory.addEventListener('change', calculateAndUpdateNsic);
    }
    
    if (purpose) {
        purpose.addEventListener('change', calculateAndUpdateNsic);
    }
    
    if (includeInspectionAndProfessional) {
        includeInspectionAndProfessional.addEventListener('change', calculateAndUpdateNsic);
    }
}

function updateNsicSliderFromInput() {
    const turnoverInput = document.getElementById('annualTurnoverCrore');
    const turnoverSlider = document.getElementById('annualTurnoverSlider');
    const gstInput = document.getElementById('gstRatePercent');
    const gstSlider = document.getElementById('gstRateSlider');
    
    if (turnoverInput && turnoverSlider) {
        const value = parseFloat(turnoverInput.value) || 0;
        const min = parseFloat(turnoverSlider.min);
        const max = parseFloat(turnoverSlider.max);
        turnoverSlider.value = Math.min(Math.max(value, min), max);
    }
    
    if (gstInput && gstSlider) {
        const value = parseFloat(gstInput.value) || 0;
        const min = parseFloat(gstSlider.min);
        const max = parseFloat(gstSlider.max);
        gstSlider.value = Math.min(Math.max(value, min), max);
    }
}

// Fee calculation functions (as per requirements)
function calcFreshRegistrationFee(category, turnoverCr) {
    const cr = Math.max(0, turnoverCr);
    const extraBlocks = Math.max(0, Math.floor(cr - 1)); // count full ₹1 cr beyond first
    let fee = 0;
    if (category === 'Micro') {
        fee = 3000 + 1500 * extraBlocks;
    } else { // Small
        fee = 5000 + 2000 * extraBlocks;
    }
    return Math.min(fee, 100000); // cap
}

function calcRegistrationFee(category, turnoverCr, purpose) {
    const fresh = calcFreshRegistrationFee(category, turnoverCr);
    if (purpose === 'Fresh') {
        return fresh;
    }
    const half = Math.round(fresh * 0.5);
    return Math.min(half, 50000); // renewal/amendment cap
}

function inspectionCharge(category) {
    return category === 'Micro' ? 2000 : 3000;
}

function professionalFee(category) {
    return category === 'Micro' ? 6000 : 8000;
}

function calculateAndUpdateNsic() {
    const enterpriseCategory = document.getElementById('enterpriseCategory').value;
    const purpose = document.getElementById('purpose').value;
    const annualTurnoverCrore = parseFloat(document.getElementById('annualTurnoverCrore').value) || 0;
    const includeInspectionAndProfessional = document.getElementById('includeInspectionAndProfessional').checked;
    const gstRatePercent = parseFloat(document.getElementById('gstRatePercent').value) || 0;
    
    if (annualTurnoverCrore >= 0) {
        // Make API call to backend
        fetch('/calculate-nsic-fee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                enterpriseCategory: enterpriseCategory,
                purpose: purpose,
                annualTurnoverCrore: annualTurnoverCrore,
                includeInspectionAndProfessional: includeInspectionAndProfessional,
                gstRatePercent: gstRatePercent
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                console.error('Calculation error:', data.error);
                return;
            }
            
            updateNsicResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            // Fallback to client-side calculation
            const registrationFeeAmount = calcRegistrationFee(enterpriseCategory, annualTurnoverCrore, purpose);
            
            let inspectionFee = 0;
            let professionalFeeAmount = 0;
            
            if (includeInspectionAndProfessional) {
                inspectionFee = inspectionCharge(enterpriseCategory);
                professionalFeeAmount = professionalFee(enterpriseCategory);
            }
            
            const subtotal = registrationFeeAmount + inspectionFee + professionalFeeAmount;
            const gstAmount = subtotal * (gstRatePercent / 100);
            const totalPayable = subtotal + gstAmount;
            
            const resultData = {
                registrationFee: registrationFeeAmount,
                inspectionCharge: inspectionFee,
                professionalFee: professionalFeeAmount,
                subtotal: subtotal,
                gstAmount: gstAmount,
                totalPayable: totalPayable,
                gstRate: gstRatePercent
            };
            
            updateNsicResults(resultData);
        });
    }
}

function updateNsicResults(data) {
    document.getElementById('registrationFee').textContent = formatIndianCurrency(data.registrationFee);
    document.getElementById('inspectionCharge').textContent = formatIndianCurrency(data.inspectionCharge);
    document.getElementById('professionalFee').textContent = formatIndianCurrency(data.professionalFee);
    document.getElementById('subtotal').textContent = formatIndianCurrency(data.subtotal);
    
    // Update GST label with current rate
    const gstLabel = document.querySelector('#gstAmount').parentElement.querySelector('.result-label');
    if (gstLabel) {
        gstLabel.textContent = `GST (${data.gstRate}%)`;
    }
    
    document.getElementById('gstAmount').textContent = formatIndianCurrency(data.gstAmount);
    document.getElementById('totalPayable').textContent = formatIndianCurrency(data.totalPayable);
}

function formatIndianCurrency(amount) {
    return '₹ ' + Math.round(amount).toLocaleString('en-IN');
}

// Mega Menu Functionality (same as other calculators)
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

// Test functions for verification (as per requirements)
function runNsicTestCases() {
    console.log('Running NSIC Test Cases:');
    
    // Test 1: Micro, Fresh, 2.00 cr → Reg. ₹4,500; Subtotal (incl. ₹2,000 + ₹6,000) ₹12,500; GST 18% ₹2,250; Total ₹14,750
    const test1RegFee = calcRegistrationFee('Micro', 2.00, 'Fresh');
    const test1Subtotal = test1RegFee + inspectionCharge('Micro') + professionalFee('Micro');
    const test1Gst = test1Subtotal * 0.18;
    const test1Total = test1Subtotal + test1Gst;
    
    console.log(`Test 1: Micro, Fresh, 2.00 cr`);
    console.log(`- Registration Fee: ₹${test1RegFee} (expected: ₹4,500)`);
    console.log(`- Subtotal: ₹${test1Subtotal} (expected: ₹12,500)`);
    console.log(`- GST 18%: ₹${test1Gst} (expected: ₹2,250)`);
    console.log(`- Total: ₹${test1Total} (expected: ₹14,750)`);
    
    // Test 2: Small, Renewal, 5.00 cr → Reg. fresh ₹13,000 → renewal ₹6,500; with ₹3,000 + ₹8,000 → Subtotal ₹17,500; GST ₹3,150; Total ₹20,650
    const test2RegFresh = calcFreshRegistrationFee('Small', 5.00);
    const test2RegFee = calcRegistrationFee('Small', 5.00, 'Renewal');
    const test2Subtotal = test2RegFee + inspectionCharge('Small') + professionalFee('Small');
    const test2Gst = test2Subtotal * 0.18;
    const test2Total = test2Subtotal + test2Gst;
    
    console.log(`Test 2: Small, Renewal, 5.00 cr`);
    console.log(`- Fresh Registration Fee: ₹${test2RegFresh} (expected: ₹13,000)`);
    console.log(`- Renewal Registration Fee: ₹${test2RegFee} (expected: ₹6,500)`);
    console.log(`- Subtotal: ₹${test2Subtotal} (expected: ₹17,500)`);
    console.log(`- GST 18%: ₹${test2Gst} (expected: ₹3,150)`);
    console.log(`- Total: ₹${test2Total} (expected: ₹20,650)`);
}

// Uncomment the line below to run test cases in console
// runNsicTestCases();
