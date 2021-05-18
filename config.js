const { configContainer } = require('./database');
const { log } = require('./utils');

class Config {
    constructor() {
        this.reset();
    }

    reset() {
        this.allowedUsers = [process.env.TELEGRAM_DEFAULT_USERID];
        this.updateInterval = 15;
        this.updateOnLaunch = true;
        this.mute = false;
        this.verbose = false;
        this.topCount = 10;

        this.maxPrice = 750000;
        this.minSqft = 1000;
        this.minBeds = 2;

        this.mortgageDownPayment = 0.20;
        this.mortgageInterestRate = 0.022;
        this.mortgageTermYears = 30;
        this.mortgagePaymentsPerYear = 12;
        this.insuranceYearlyRate = 0.0054;
        this.taxYearlyRate = 0.0029;

        this.scoreWeights = {
            commuteScore: 32,
            locationScore: 24,
            walkScore: 24,
            sqftScore: 12,
            pricePerSqftScore: 12,
            monthlyPriceScore: 8,
            ageScore: 12,
            typeScore: 8,
            denScore: 4,
            trainScore: 4,
            transitScore: 2,
            shopScore: 2
        };

        this.commuteScoreMinBound = 15;
        this.commuteScoreMaxBound = 60;

        this.sqftScoreMinBound = 750;
        this.sqftScoreMaxBound = 1250;

        this.pricePerSqftScoreMinBound = 400;
        this.pricePerSqftScoreMaxBound = 700;

        this.monthlyPriceScoreMinBound = 2000;
        this.monthlyPriceScoreMaxBound = 3000;

        this.ageScoreMinBound = 1970;
        this.ageScoreMaxBound = 2011;

        this.locationScoreGood = ['Kitsilano', 'Point Grey', 'Cambie', 'Metrotown', 'Brentwood Park'];
        this.locationScoreBad = ['Highgate', 'Edmonds BE', 'Champlain Heights', 'South Marine', 'Marpole', 'Strathcona', 'Downtown VE'];

        this.trainCriteria = ['train', 'station'];
        this.denCriteria = ['den', 'solarium'];
        this.shopCriteria = ['shop'];
    }

    async sync() {
        try {
            const { resources } = await configContainer.items.readAll().fetchAll();
            if (resources) {
                this.reset();
                for (const resource of resources) {
                    this[resource.id] = resource.value;
                }
            }
            log(`synced config`);
        }
        catch (err) {
            console.error(err);
        }
    }
    
    async set(id, value) {
        try {
            const { resource } = await configContainer.items.upsert({ id, value });
    
            if (resource) {
                this[id] = value;
                return true;
            }
        }
        catch (err) {
            console.log(err);
        }

        return false;
    }

    async unset(id) {
        try {
            await configContainer.item(id).delete();
            this[id] = (new Config())[id];
            return true;
        }
        catch {
            return false;
        }
    }
}

module.exports = new Config();