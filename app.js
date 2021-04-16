require('dotenv').config();

const deepEqual = require('deep-equal');

const db = require('./database');
const redfin = require('./redfin');
const { bot, broadcast } = require('./telegram');
const { printAdded } = require('./printer');
const { log, getAddress } = require('./utils');

async function init() {
    await db.init();
    
    await bot.launch();
    await update();
    
    const updateInterval = await db.getConfig('updateInterval');
    if (updateInterval > 0) {
        setInterval(async () => {
            await update();
        }, updateInterval);
    }
}

async function update() {
    log(`--- starting update`);

    const results = await getResults();
    const changes = await processResults(results);
    await notifyChanges(changes);

    log(`--- finished update`);
}

async function getResults() {
    const maxPrice = await db.getConfig('maxPrice');
    const minBeds = await db.getConfig('minBeds');
    const minSqft = await db.getConfig('minSqft');

    const res = await redfin.getHomes({
        'max_price': maxPrice,
        'num_beds': minBeds,
        'min_listing_approx_size': minSqft
    });

    log(`retrieved ${res.length} results`);
    return res;
}

async function processResults(results) {
    if (!results || !results.length) {
        return;
    }

    const changes = {
        added: [],
        modified: []
    };

    for (const result of results) {
        const item = await db.getItem(result.id);
        if (!item) {
            // TODO: Here is where we might want to obtain extended data
            changes.added.push(result);
            await db.addItem(result);
            log(`added: ${getAddress(result)}`);
        }
        // TODO: This will need to ignore the extended data fields
        else if (!deepEqual(result, item)) {
            changes.modified.push(result);
            await db.replaceItem(result);
            log(`replaced: ${getAddress(result)}`);
        }
        // TODO: What to do about deleted results?
    }

    return changes;
}

async function notifyChanges(changes) {
    for (const item of changes.added) {
        broadcast(printAdded(item));
    }
}

init();