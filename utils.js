const deepEqual = require('deep-equal');

const _mortgageDownPayment = 0.20;
const _mortgageInterestRate = 0.019;
const _mortgageTermYears = 30;
const _mortgagePaymentsPerYear = 12;
const _insuranceYearlyRate = 0.0054;
const _taxYearlyRate = 0.0029;

function getAddress(item) {
    return `${item.streetLine}, ${item.city}`;
}

function getMapUrl(item) {
    return `https://www.google.com/maps/place/${item.lat},${item.long}`;
}

function getDownPayment(item) {
    return item.price * _mortgageDownPayment;
}

function getMortgagePayment(item) {
    const P = item.price * (1 - _mortgageDownPayment);
    const r = _mortgageInterestRate / _mortgagePaymentsPerYear;
    const n = _mortgagePaymentsPerYear * _mortgageTermYears;

    const x = Math.pow(1 + r, n);

    return P * r * x / (x - 1);
}

function getTaxPayment(item) {
    return item.price * _taxYearlyRate / 12;
}

function getInsurancePayment(item) {
    return item.price * _insuranceYearlyRate / 12;
}

function stripMetadata(obj) {
    if (!obj) {
        return null;
    }

    const strippedObj = {};

    for (const key in obj) {
        if (!key.startsWith('_')) {
            strippedObj[key] = obj[key];
        }
    }
    
    return strippedObj;
}

function log(msg) {
    console.log(msg);
}

function shouldUpdateItem(newItem, existingItem) {
    if (!newItem) {
        return false;
    }

    if (!existingItem) {
        return true;
    }

    const existingItemCopy = { ...existingItem };
    existingItemCopy.extended = null;

    return !deepEqual(newItem, existingItemCopy);
}

module.exports = {
    stripMetadata,
    log,
    getAddress,
    getDownPayment,
    getInsurancePayment,
    getMapUrl,
    getMortgagePayment,
    getTaxPayment,
    shouldUpdateItem
};