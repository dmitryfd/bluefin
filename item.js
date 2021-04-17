const config = require('./config');
const { k, r } = require('./utils');

class Item {
    get address() {
        return `${this.streetLine}, ${this.city}`;
    }

    get mapUrl() {
        return `https://www.google.com/maps/place/${this.lat},${this.long}`;
    }

    get downPayment() {
        return this.price * config.mortgageDownPayment;
    }

    get mortgagePayment() {
        const P = this.price * (1 - config.mortgageDownPayment);
        const r = config.mortgageInterestRate / config.mortgagePaymentsPerYear;
        const n = config.mortgagePaymentsPerYear * config.mortgageTermYears;

        const x = Math.pow(1 + r, n);

        return P * r * x / (x - 1);
    }

    get taxPayment() {
        return this.price * config.taxYearlyRate / 12;
    }

    get insurancePayment() {
        return this.price * config.insuranceYearlyRate / 12;
    }

    get totalPayment() {
        return this.mortgagePayment + this.taxPayment + this.insurancePayment + this.hoaPayment;
    }

    get pricePerSqft() {
        return (this.price && this.sqft) ? this.price / this.sqft : NaN;
    }

    print() {
        const msg =
`<u><b><a href="${this.url}">$${k(this.price)} in ${this.location}</a></b></u>
${this.beds}b + ${this.baths}ba | ${this.sqft} ft² | $${r(this.pricePerSqft)}/ft² | ${this.yearBuilt}

$${k(this.downPayment)} down, ~$${r(this.totalPayment)}/mo
(M $${k(this.mortgagePayment)}, T $${r(this.taxPayment)}, I $${r(this.insurancePayment)}, H $${r(this.hoaPayment)})

<i><a href="${this.mapUrl}">${this.address}</a></i>`;
        
        return msg;
    }
}

Item.fromObject = function(obj) {
    return Object.assign(new Item(), obj);
}

module.exports = Item;