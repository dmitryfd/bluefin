const { configContainer } = require('./database');
const { log } = require('./utils');

class Config {
    constructor() {
        this.reset();
    }

    reset() {
        this.allowedUsers = ['675685158'];
        this.updateInterval = 15;

        this.maxPrice = 750000;
        this.minSqft = 1000;
        this.minBeds = 2;
        
        this.mortgageDownPayment = 0.20;
        this.mortgageInterestRate = 0.019;
        this.mortgageTermYears = 30;
        this.mortgagePaymentsPerYear = 12;
        this.insuranceYearlyRate = 0.0054;
        this.taxYearlyRate = 0.0029;

        this.scoreWeights = {
            locationScore: 10,
            walkScore: 15,
            commuteScore: 15,
            monthlyPriceScore: 10,
            ageScore: 10,
            typeScore: 10,
            sqftScore: 10,
            pricePerSqftScore: 6,
            denScore: 5,
            trainScore: 5,
            transitScore: 2,
            shopScore: 2
        };
    }

    async sync() {
        const { resources } = await configContainer.items.readAll().fetchAll();
        if (resources) {
            this.reset();
            for (const resource of resources) {
                this[resource.id] = resource.value;
            }
        }
        log(`synced config`);
    }
    
    async set(id, value) {
        const { resource } = await configContainer.items.upsert({ id, value });

        if (resource) {
            this[id] = value;
            return true;
        }

        return false;
    }

    async unset(id) {
        try {
            await configContainer.item(id).delete();
            return true;
        }
        catch {
            return false;
        }
    }
}

module.exports = new Config();