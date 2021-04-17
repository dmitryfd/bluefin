require('dotenv').config();

const redfin = require('./redfin');
const config = require('./config');
const { initDatabase } = require('./database');
const { getItem, addItem, replaceItem } = require('./items');
const { bot, broadcast } = require('./telegram');
const { log, shouldUpdateItem } = require('./utils');

async function init() {
    await initDatabase();
    await config.sync();
    await bot.launch();
    await update();

    const updateInterval = config.updateInterval || 0;
    if (updateInterval > 0) {
        setInterval(async () => {
            await config.sync();
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
    const maxPrice = config.maxPrice;
    const minBeds = config.minBeds;
    const minSqft = config.minSqft;

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
        const item = await getItem(result.id);
        if (!item) {
            const extended = await redfin.getExtendedData(result);
            if (extended) {
                result.extended = extended;
            }

            changes.added.push(result);
            await addItem(result);

            log(`-- added: ${result.address}`);
        }
        else if (shouldUpdateItem(result, item)) {
            result.extended = item.extended;
            // TODO: Consider whether extended data needs to be refreshed

            changes.modified.push(result);
            await replaceItem(result);

            log(`-- replaced: ${result.address}`);
        }
    }

    return changes;
}

async function notifyChanges(changes) {
    for (const item of changes.added) {
        broadcast(item.print());
    }
}

init();