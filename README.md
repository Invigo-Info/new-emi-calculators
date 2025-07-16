# EMI Calculator Web Application

A responsive EMI (Equated Monthly Installment) Calculator web application built with Python Flask and modern frontend technologies. This application replicates the functionality and design of emicalculator.net with support for Home Loans, Personal Loans, and Car Loans.

## Features

### 🏠 Multiple Loan Types
- **Home Loan Calculator** - Calculate EMI for home loans with up to ₹2 Crores
- **Personal Loan Calculator** - Calculate EMI for personal loans with up to ₹50 Lakhs  
- **Car Loan Calculator** - Calculate EMI for car loans with EMI in Advance/Arrears options

### 📊 Interactive Interface
- Real-time calculations as you adjust inputs
- Interactive sliders and input fields
- Responsive design that works on all devices
- Beautiful charts showing payment breakdown

### 📈 Visual Analytics
- **Pie Chart** - Principal vs Interest breakdown
- **Bar Chart** - Yearly payment schedule showing principal and interest components
- **Payment Schedule Table** - Monthly breakdown of EMI payments

### 🧮 Accurate Calculations
- Standard EMI formula: `EMI = P × r × (1+r)ⁿ ÷ ((1+r)ⁿ - 1)`
- Support for EMI in Advance (Car loans)
- Detailed amortization schedule
- Total interest and payment calculations

## Technology Stack

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **Styling**: Custom CSS with responsive design
- **Fonts**: Inter (Google Fonts)

## Installation & Setup

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Step 1: Clone or Download
```bash
# If you have git installed
git clone <repository-url>
cd pythonemi

# Or download and extract the files to pythonemi folder
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Run the Application
```bash
python app.py
```

### Step 4: Access the Application
Open your web browser and go to: `http://localhost:5000`

## File Structure

```
pythonemi/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── css/
    │   └── style.css     # Responsive CSS styles
    └── js/
        └── script.js     # Interactive JavaScript
```

## Usage Guide

### 1. Select Loan Type
Click on the tabs at the top to switch between:
- **Home Loan** - For property purchases
- **Personal Loan** - For personal financing needs  
- **Car Loan** - For vehicle purchases (includes EMI scheme option)

### 2. Enter Loan Details
- **Loan Amount**: Use slider or type the principal amount
- **Interest Rate**: Annual interest rate percentage
- **Loan Tenure**: Years and months for loan repayment
- **EMI Scheme**: (Car loans only) Choose between EMI in Advance or Arrears

### 3. View Results
The calculator displays:
- **Monthly EMI Amount**
- **Total Interest Payable**
- **Total Payment** (Principal + Interest)

### 4. Analyze Payment Structure
- **Pie Chart**: Visual breakdown of principal vs interest
- **Bar Chart**: Yearly payment schedule
- **Payment Table**: Month-by-month payment details

## API Endpoints

### POST /calculate
Calculate EMI based on loan parameters.

**Request Body:**
```json
{
    "principal": 2500000,
    "rate": 8.5,
    "tenure_years": 20,
    "tenure_months": 0,
    "loan_type": "home",
    "emi_advance": false
}
```

**Response:**
```json
{
    "emi": 21590.83,
    "total_interest": 2681800.40,
    "total_payment": 5181800.40,
    "principal": 2500000,
    "schedule": [...],
    "yearly_summary": [...],
    "loan_type": "home"
}
```

## Customization

### Loan Amount Limits
Modify the `loanConfigs` object in `static/js/script.js`:
```javascript
const loanConfigs = {
    home: {
        maxAmount: 20000000,    // ₹2 Crores
        defaultAmount: 2500000, // ₹25 Lakhs
    },
    // ... other loan types
};
```

### Interest Rate Ranges
Update slider ranges in `templates/index.html`:
```html
<input type="range" id="interestRateSlider" min="5" max="20" step="0.1" value="8.5">
```

### Styling
Customize colors and layout in `static/css/style.css`. The design uses CSS Grid and Flexbox for responsive layout.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. Feel free to use and modify as needed.

## Support

For issues or questions:
1. Check the browser console for JavaScript errors
2. Ensure Python dependencies are properly installed
3. Verify Flask is running on the correct port
4. Test with different loan amounts and rates

---

**Note**: This calculator provides estimates based on standard EMI formulas. Actual loan terms may vary based on lender policies, processing fees, and other factors. Always consult with financial institutions for accurate loan information. 