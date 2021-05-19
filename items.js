const redfin = require('./redfin');
const config = require('./config');
const Item = require('./item');
const { itemsContainer } = require('./database');
const { stripMetadata } = require('./utils');
const { log, shouldUpdateItem } = require('./utils');

let lastUpdate = null;

function formatItem(resource) {
    if (resource) {
        var strippedResource = stripMetadata(resource);
        return Item.fromObject(strippedResource);
    }
    return null;
}

async function getItem(id) {
    const { resource } = await itemsContainer.item(id).read();
    return formatItem(resource);
}

async function addItem(item) {
    const { resource } = await itemsContainer.items.create(item);
    return formatItem(resource);
}

async function replaceItem(item) {
    const { resource } = await itemsContainer.item(item.id).replace(item);
    return formatItem(resource);
}

async function queryItems(querySpec) {
    const { resources } = await itemsContainer.items.query(querySpec).fetchAll();
    return resources && resources.map(r => formatItem(r));
}

async function cleanItems() {
    if (!lastUpdate) {
        return -1;
    }

    const allItems = [...lastUpdate.added, ...lastUpdate.modified, ...lastUpdate.existing];
    const allIds = allItems.map(x => `"${x.mlsId}"`).join(', ');

    const { resources } = await itemsContainer.items.query({
        query: `SELECT * FROM c WHERE c.id NOT IN (${allIds})`
    }).fetchAll();

    if (!resources) {
        return 0;
    }

    let deleted = 0;
    for (const r of resources) {
        try {
            await itemsContainer.item(r.id).delete();
            ++deleted;
        }
        catch (err) {
            console.error(err);
        }
    }

    return deleted;
}

async function updateItems() {
    log(`starting update`);
    
    const results = await redfin.getHomes({
        'max_price': config.maxPrice,
        'num_beds': config.minBeds,
        'min_listing_approx_size': config.minSqft,
        'market': config.marketId,
        'region_id': config.regionIds,
        'region_type': config.regionTypes,
        'uipt': config.propertyTypeIds,
    });
    log(`retrieved ${results.length} results`);


    const changes = await processResults(results);
    log(`finished update`);

    return changes;
}

async function processResults(results) {
    if (!results || !results.length) {
        return;
    }

    const changes = {
        added: [],
        modified: [],
        existing: []
    };

    for (const result of results) {
        const item = await getItem(result.id);
        if (!item) {
            const options = {
                commuteTypeId: config.commuteTypeId,
                commuteLatitude: config.commuteLatitude,
                commuteLongitude: config.commuteLongitude
            };
            const extended = await redfin.getExtendedData(result, options);
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
        else {
            changes.existing.push(item);
        }
    }

    lastUpdate = changes;
    return changes;
}

function getLastUpdate() {
    return lastUpdate;
}

function dumpAsCsv() {
    const allItems = [...lastUpdate.added, ...lastUpdate.modified, ...lastUpdate.existing];

    console.log('id,price,sqft,pricePerSqft,beds,baths,yearBuilt,location,streetLine,city,walkScore,transitScore,workCommute,totalPayment,hoaPayment,mentionsTrain,mentionsDen,mentionsShops,isTownhouse,score');

    for (const x of allItems) {
        console.log([
            x.id,
            x.price,
            x.sqft,
            x.pricePerSqft,
            x.beds,
            x.baths,
            x.yearBuilt,
            x.location,
            x.streetLine,
            x.city,
            x.extended.walkScore.walk || -1,
            x.extended.walkScore.transit || -1,
            x.extended.workCommute,
            x.totalPayment,
            x.hoaPayment || -1,
            x.mentionsTrain ? 1 : 0,
            x.mentionsDen ? 1 : 0,
            x.mentionsShops ? 1 : 0,
            x.type == "TOWNHOUSE" ? 1 : 0,
            x.score.finalScore
        ].join(','));
    }
}

module.exports = {
    getItem,
    addItem,
    replaceItem,
    queryItems,
    cleanItems,
    updateItems,
    getLastUpdate,
    dumpAsCsv
};