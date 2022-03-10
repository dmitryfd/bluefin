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

function shouldIgnore(ignoreList, testString) {
    for (let i = 0; i < ignoreList.length; ++i) {
        if (testString && testString.indexOf(ignoreList[i]) >= 0) {
            return true;
        } 
    }
    return false;
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

function j(obj) {
    return JSON.stringify(obj, null, 2);
}

function map(x, min, max) {
    const adjustedMax = max - min;
    
    let adjustedX = x - min;
    adjustedX = Math.min(adjustedX, adjustedMax);
    adjustedX = Math.max(adjustedX, 0);

    return adjustedX / adjustedMax;
}

module.exports = {
    stripMetadata,
    log,
    shouldIgnore,
    shouldUpdateItem,
    k,
    r,
    j,
    map
};