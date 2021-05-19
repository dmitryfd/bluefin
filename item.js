const config = require('./config');
const { k, r, map } = require('./utils');

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

    get normalizedRemark() {
        return this.extended && this.extended.remarks && this.extended.remarks.join('\n').toLowerCase();
    }

    get mentionsTrain() {
        if (this.normalizedRemark) {
            for (const criteria of config.trainCriteria) {
                if (this.normalizedRemark.indexOf(criteria) >= 0) {
                    return true;
                }
            }
        }
        return false;
    }

    get mentionsDen() {
        if (this.normalizedRemark) {
            for (const criteria of config.denCriteria) {
                if (this.normalizedRemark.indexOf(criteria) >= 0) {
                    return true;
                }
            }
        }
        return false;
    }

    get mentionsShops() {
        if (this.normalizedRemark) {
            for (const criteria of config.shopCriteria) {
                if (this.normalizedRemark.indexOf(criteria) >= 0) {
                    return true;
                }
            }
        }
        return false;
    }

    get score() {
        const s = {};

        s.commuteScore = 0;
        if (this.extended && this.extended.workCommute) {
            s.commuteScore = 1 - map(this.extended.workCommute, config.commuteScoreMinBound, config.commuteScoreMaxBound);
        }

        s.sqftScore = 0;
        if (this.sqft) {
            s.sqftScore = map(this.sqft, config.sqftScoreMinBound, config.sqftScoreMaxBound);
        }

        s.pricePerSqftScore = 0;
        if (this.pricePerSqft) {
            s.pricePerSqftScore = 1 - map(this.pricePerSqft, config.pricePerSqftScoreMinBound, config.pricePerSqftScoreMaxBound);
        }

        s.monthlyPriceScore = 0;
        if (this.totalPayment) {
            s.monthlyPriceScore = 1 - map(this.totalPayment, config.monthlyPriceScoreMinBound, config.monthlyPriceScoreMaxBound);
        }

        s.walkScore = 0;
        if (this.extended && this.extended.walkScore && this.extended.walkScore.walk) {
            s.walkScore = this.extended.walkScore.walk / 100.0;
        }

        s.transitScore = 0;
        if (this.extended && this.extended.walkScore && this.extended.walkScore.transit) {
            s.transitScore = this.extended.walkScore.transit / 100.0;
        }

        s.ageScore = 0;
        if (this.yearBuilt) {
            s.ageScore = map(this.yearBuilt, config.ageScoreMinBound, config.ageScoreMaxBound);
        }

        s.locationScore = 0.5;
        if (config.locationScoreGood.indexOf(this.location) >= 0) {
            s.locationScore = 1;
        }
        else if (config.locationScoreBad.indexOf(this.location) >= 0) {
            s.locationScore = 0;
        }
        
        s.trainScore = this.mentionsTrain ? 1 : 0;
        s.denScore = this.mentionsDen ? 1 : 0;
        s.shopScore = this.mentionsShops ? 1 : 0;
        s.typeScore = this.type == "TOWNHOUSE" ? 1 : 0;

        let totalWeights = 0;
        for (const weight in config.scoreWeights) {
            totalWeights += config.scoreWeights[weight];
        }

        let finalScore = 0;
        for (const key in s) {
            finalScore += s[key] * (config.scoreWeights[key] || 0);
        }
        finalScore /= totalWeights;

        return {
            finalScore,
            ...s
        };
    }

    print() {
        const msg =
`<u><b><a href="${this.url}">[${r(100* this.score.finalScore)}] $${k(this.price)} in ${this.location}</a></b></u>
${this.beds}b + ${this.baths}ba | ${this.sqft} ft² | $${r(this.pricePerSqft)}/ft² | ${this.yearBuilt}

$${k(this.downPayment)} down, ~$${r(this.totalPayment)}/mo
(M $${k(this.mortgagePayment)}, T $${r(this.taxPayment)}, I $${r(this.insurancePayment)}, H $${r(this.hoaPayment)})

<i><a href="${this.mapUrl}">${this.address}</a></i>`;
        
        return msg;
    }

    printScore() {
        const score = this.score;

        let totalWeights = 0;
        for (const weight in config.scoreWeights) {
            totalWeights += config.scoreWeights[weight];
        }
        
        const scoreMsgs = [];
        for (const key in score) {
            let scoreMsg = `${key} = ${r(100 * score[key])}`;
            if (key != 'finalScore') {
                scoreMsg += ` (${r(100 * score[key] * config.scoreWeights[key] / totalWeights)})`;
            }

            scoreMsgs.push(scoreMsg);
        }

        const msg =
`<u><b><a href="${this.url}">[${r(100* this.score.finalScore)}] $${k(this.price)} in ${this.location}</a></b></u>

${scoreMsgs.join('\n')}`;

        return msg;
    }
}

Item.fromObject = function(obj) {
    return Object.assign(new Item(), obj);
}

module.exports = Item;