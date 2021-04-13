require('dotenv').config();
const _interval = 15 * 60 * 1000;

const { getHomes } = require('./bluefin');
const { bot, broadcast } = require('./telegram');

async function update() {
    const res = await getHomes({
        'max_price': '750000',
        'num_beds': '2',
        'min_listing_approx_size': '1000'
    });

    if (!res || res.length == 0) {
        return;
    }
    
    console.log(res.length);
    console.log(res[0].address);
    // merge with database
}

bot.launch();

update();
setInterval(async () => {
    await update();
}, _interval);