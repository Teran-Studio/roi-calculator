/**
 * Pure calculation functions for the ERP–CRM ROI diagnostic.
 * Keeping the model independent from the DOM makes every assumption testable.
 */

const MONTHS_PER_YEAR = 12;

const FIELD_LIMITS = {
    monthlyTransactions: { min: 1, max: 1_000_000 },
    minutesPerTransaction: { min: 0.1, max: 1_440 },
    hourlyRate: { min: 1, max: 1_000 },
    errorRatePercent: { min: 0, max: 100 },
    costPerError: { min: 0, max: 1_000_000 },
    systemsCount: { min: 2, max: 50 },
    manualHandoffs: { min: 0, max: 20 },
};

const SYNC_RISK = {
    realtime: 2,
    hourly: 5,
    daily: 10,
    weekly: 15,
    manual: 20,
};

const MONITORING_RISK = {
    automated: 0,
    partial: 8,
    manual: 14,
    none: 20,
};

/**
 * Validate a numeric input against the public calculator limits.
 */
function validateNumber(name, value) {
    const limits = FIELD_LIMITS[name];

    if (!Number.isFinite(value)) {
        throw new TypeError(`${name} must be a finite number.`);
    }

    if (value < limits.min || value > limits.max) {
        throw new RangeError(`${name} must be between ${limits.min} and ${limits.max}.`);
    }
}

/**
 * Convert a score into a stable, analytics-safe risk band.
 */
export function getRiskLevel(score) {
    if (!Number.isFinite(score) || score < 0 || score > 100) {
        throw new RangeError('score must be between 0 and 100.');
    }

    if (score < 30) return 'low';
    if (score < 60) return 'medium';
    if (score < 80) return 'high';
    return 'critical';
}

/**
 * Calculate the operational waste and integration risk from aggregate inputs.
 */
export function calculateDiagnostic(input) {
    const numericFields = Object.keys(FIELD_LIMITS);
    numericFields.forEach((field) => validateNumber(field, Number(input[field])));

    if (!Object.hasOwn(SYNC_RISK, input.syncFrequency)) {
        throw new RangeError('syncFrequency is not supported.');
    }

    if (!Object.hasOwn(MONITORING_RISK, input.monitoring)) {
        throw new RangeError('monitoring is not supported.');
    }

    const monthlyTransactions = Number(input.monthlyTransactions);
    const minutesPerTransaction = Number(input.minutesPerTransaction);
    const hourlyRate = Number(input.hourlyRate);
    const errorRatePercent = Number(input.errorRatePercent);
    const costPerError = Number(input.costPerError);
    const systemsCount = Number(input.systemsCount);
    const manualHandoffs = Number(input.manualHandoffs);

    const annualManualHours =
        monthlyTransactions * minutesPerTransaction / 60 * MONTHS_PER_YEAR;
    const annualLaborCost = annualManualHours * hourlyRate;
    const annualErrors =
        monthlyTransactions * (errorRatePercent / 100) * MONTHS_PER_YEAR;
    const annualErrorCost = annualErrors * costPerError;
    const annualWaste = annualLaborCost + annualErrorCost;

    const systemsRisk = Math.min(20, Math.max(5, (systemsCount - 1) * 5));
    const errorRisk =
        errorRatePercent <= 1 ? 5
            : errorRatePercent <= 2 ? 10
                : errorRatePercent <= 4 ? 15
                    : 20;
    const handoffRisk = Math.min(20, manualHandoffs * 5);
    const riskScore = Math.min(
        100,
        Math.round(
            systemsRisk
            + errorRisk
            + SYNC_RISK[input.syncFrequency]
            + MONITORING_RISK[input.monitoring]
            + handoffRisk
        )
    );

    return {
        annualManualHours,
        annualLaborCost,
        annualErrors,
        annualErrorCost,
        annualWaste,
        recoverableLow: annualWaste * 0.3,
        recoverableHigh: annualWaste * 0.6,
        riskScore,
        riskLevel: getRiskLevel(riskScore),
    };
}
