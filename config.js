const { configContainer } = require('./database');

class Config {
    constructor() {
        this.allowedUsers = [675685158];
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
    }

    async sync() {
        const { resources } = await configContainer.items.readAll().fetchAll();
        if (resources) {
            for (const resource of resources) {
                this[resource.id] = resource.value;
            }
        }
    }
    
    async set(id, value) {
        const { resource } = await configContainer.items.upsert({ id, value });
        if (resource) {
            this[id] = value;
        }
    }
}

module.exports = new Config();