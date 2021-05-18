const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient({
    endpoint: process.env.DB_ENDPOINT,
    key: process.env.DB_KEY
});

const database = client.database('bluefin');
const itemsContainer = database.container('items');
const configContainer = database.container('config');

async function initDatabase() {
    try {
        await client.databases.createIfNotExists({ id: 'bluefin' });
        await database.containers.createIfNotExists({ id: 'items' });
        await database.containers.createIfNotExists({ id: 'config' });
    }
    catch (err) {
        console.error(err);
    }
}

module.exports = {
    initDatabase,
    itemsContainer,
    configContainer
};