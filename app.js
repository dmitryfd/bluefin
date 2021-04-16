require('dotenv').config();

const db = require('./database');
const redfin = require('./redfin');
const { bot, broadcast } = require('./telegram');
const { printAdded } = require('./printer');
const { log, getAddress, shouldUpdateItem } = require('./utils');

async function init() {
    await db.init();
    
    await bot.launch();
    await update();
    
    const updateInterval = await db.getConfig('updateInterval');
    if (updateInterval > 0) {
        setInterval(async () => {
            await update();
        }, updateInterval * 1000 * 60);
    }

    // TODO: Clean up deleted results every now and then
}

async function update() {
    log(`starting update`);

    const results = await getResults();
    const changes = await processResults(results);
    await notifyChanges(changes);

    log(`finished update`);
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
            const extended = await redfin.getExtendedData(result);
            if (extended) {
                result.extended = extended;
            }

            changes.added.push(result);
            await db.addItem(result);

            log(`-- added: ${getAddress(result)}`);
        }
        else if (shouldUpdateItem(result, item)) {
            result.extended = item.extended;
            // TODO: Consider whether extended data needs to be refreshed

            changes.modified.push(result);
            await db.replaceItem(result);

            log(`-- replaced: ${getAddress(result)}`);
        }
    }

    return changes;
}

async function notifyChanges(changes) {
    for (const item of changes.added) {
        broadcast(printAdded(item));
    }
}

init();