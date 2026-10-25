/**
 * Browser controller for the standalone ERP–CRM ROI calculator.
 * Reads the form, runs the pure model and renders the result with textContent only.
 */

import { calculateDiagnostic } from './calculator-core.mjs';

const RISK_LABELS = { low: 'Low', medium: 'Moderate', high: 'High', critical: 'Critical' };
const NUMERIC_FIELDS = ['monthlyTransactions', 'minutesPerTransaction', 'hourlyRate', 'errorRatePercent',
    'costPerError', 'systemsCount', 'manualHandoffs'];

const form = document.getElementById('diagnosticForm');
const results = document.getElementById('results');
const formError = document.getElementById('formError');

const currency = (value) => new Intl.NumberFormat('en-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(value);
const number = (value) => new Intl.NumberFormat('en-CH', { maximumFractionDigits: 0 }).format(value);
const set = (id, value) => { document.getElementById(id).textContent = value; };

function readInput() {
    const data = new FormData(form);
    const input = Object.fromEntries(NUMERIC_FIELDS.map((field) => [field, Number(data.get(field))]));
    return { ...input, syncFrequency: data.get('syncFrequency'), monitoring: data.get('monitoring') };
}

form.addEventListener('submit', (event) => {
    event.preventDefault();
    formError.hidden = true;
    if (!form.reportValidity()) return;

    try {
        const result = calculateDiagnostic(readInput());
        set('annualWaste', currency(result.annualWaste));
        set('riskScore', `${result.riskScore}/100`);
        set('riskLevel', RISK_LABELS[result.riskLevel]);
        set('manualHours', `${number(result.annualManualHours)} h`);
        set('laborCost', currency(result.annualLaborCost));
        set('errorCost', currency(result.annualErrorCost));
        set('recoverableRange', `${currency(result.recoverableLow)}–${currency(result.recoverableHigh)}`);
        document.getElementById('riskLevel').dataset.risk = result.riskLevel;
        results.hidden = false;
        results.focus({ preventScroll: true });
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        formError.textContent = 'Please review the values and try again.';
        formError.hidden = false;
    }
});
