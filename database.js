const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient({
    endpoint: process.env.DB_ENDPOINT,
    key: process.env.DB_KEY
});

const database = client.database('bluefin');
const itemsContainer = database.container('items');
const configContainer = database.container('config');

async function initDatabase() {
    await client.databases.createIfNotExists({ id: 'bluefin' });
    await database.containers.createIfNotExists({ id: 'items' });
    await database.containers.createIfNotExists({ id: 'config' });
}

module.exports = {
    initDatabase,
    itemsContainer,
    configContainer
};