const u = require('./utils');

function printAdded(item) {
    const downPayment = u.getDownPayment(item);
    const mortgagePayment = u.getMortgagePayment(item);
    const taxPayment = u.getTaxPayment(item);
    const insurancePayment = u.getInsurancePayment(item);
    const address = u.getAddress(item);
    const mapUrl = u.getMapUrl(item);
    const totalPayment = mortgagePayment + taxPayment + insurancePayment + item.hoaPayment;
    const pricePerSqft = (item.price && item.sqft) ? item.price / item.sqft : '?';

    const msg =
`<u><b><a href="${item.url}">$${k(item.price)} in ${item.location}</a></b></u>
${item.beds}b + ${item.baths}ba | ${item.sqft} ft² | $${r(pricePerSqft)}/ft² | ${item.yearBuilt}

$${k(downPayment)} down, ~$${r(totalPayment)}/mo
(M $${k(mortgagePayment)}, T $${r(taxPayment)}, I $${r(insurancePayment)}, H $${r(item.hoaPayment)})

<i><a href="${mapUrl}">${address}</a></i>`;

    return msg;
}

function k(n) {
    return (n / 1000).toFixed(1) + 'K';
}

function r(n) {
    return Math.round(n);
}

module.exports = {
    printAdded
};