const deepEqual = require('deep-equal');

function stripMetadata(obj) {
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

function k(n) {
    return (n / 1000).toFixed(1) + 'K';
}

function r(n) {
    return Math.round(n);
}

module.exports = {
    stripMetadata,
    log,
    shouldUpdateItem,
    k,
    r
};