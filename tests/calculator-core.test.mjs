/**
 * Regression tests for the public ERP–CRM diagnostic assumptions.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDiagnostic, getRiskLevel } from '../src/calculator-core.mjs';

const baselineInput = {
    monthlyTransactions: 500,
    minutesPerTransaction: 12,
    hourlyRate: 65,
    errorRatePercent: 2,
    costPerError: 180,
    systemsCount: 3,
    manualHandoffs: 2,
    syncFrequency: 'daily',
    monitoring: 'partial',
};

test('calculates annual labor and error costs from aggregate inputs', () => {
    const result = calculateDiagnostic(baselineInput);

    assert.equal(result.annualManualHours, 1_200);
    assert.equal(result.annualLaborCost, 78_000);
    assert.equal(result.annualErrors, 120);
    assert.equal(result.annualErrorCost, 21_600);
    assert.equal(result.annualWaste, 99_600);
    assert.equal(result.recoverableLow, 29_880);
    assert.equal(result.recoverableHigh, 59_760);
});

test('produces a stable risk score and band', () => {
    const result = calculateDiagnostic(baselineInput);

    assert.equal(result.riskScore, 48);
    assert.equal(result.riskLevel, 'medium');
});

test('caps the risk score at 100', () => {
    const result = calculateDiagnostic({
        ...baselineInput,
        systemsCount: 50,
        manualHandoffs: 20,
        errorRatePercent: 10,
        syncFrequency: 'manual',
        monitoring: 'none',
    });

    assert.equal(result.riskScore, 100);
    assert.equal(result.riskLevel, 'critical');
});

test('maps every risk boundary correctly', () => {
    assert.equal(getRiskLevel(0), 'low');
    assert.equal(getRiskLevel(29), 'low');
    assert.equal(getRiskLevel(30), 'medium');
    assert.equal(getRiskLevel(59), 'medium');
    assert.equal(getRiskLevel(60), 'high');
    assert.equal(getRiskLevel(79), 'high');
    assert.equal(getRiskLevel(80), 'critical');
    assert.equal(getRiskLevel(100), 'critical');
});

test('rejects invalid numeric and option inputs', () => {
    assert.throws(
        () => calculateDiagnostic({ ...baselineInput, monthlyTransactions: 0 }),
        RangeError
    );
    assert.throws(
        () => calculateDiagnostic({ ...baselineInput, hourlyRate: Number.NaN }),
        TypeError
    );
    assert.throws(
        () => calculateDiagnostic({ ...baselineInput, syncFrequency: 'sometimes' }),
        RangeError
    );
    assert.throws(
        () => calculateDiagnostic({ ...baselineInput, monitoring: 'unknown' }),
        RangeError
    );
});
