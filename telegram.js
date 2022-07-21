const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_TOKEN || '');

const config = require('./config');
const { log, r, k, j } = require('./utils');
const { getItem, cleanItems, updateItems, getLastUpdate } = require('./items');
const { getMortgages } = require('./ratehub');

bot.use(async (ctx, next) => {
    const allowedUsers = config.allowedUsers || [];
    const id = ctx.chat.id.toString();
    const name = ctx.chat.type == 'private' ? ctx.chat.first_name : ctx.chat.title;

    if (allowedUsers.indexOf(id) < 0) {
        log(`unauthorized msg from ${name} (${id})`);
        ctx.replyWithMarkdown(`🛑 Sorry, you are not authorized to use this bot! (${id})`);
    }
    else {
        await next();
    }
});

bot.start(ctx => {
    const id = ctx.chat.id.toString();
    const name = ctx.chat.type == 'private' ? ctx.chat.first_name : ctx.chat.title;

    ctx.replyWithMarkdown(`👋 Hey there, ${name} (${id})!`);
});

bot.command('get', ctx => {
    const tokens = ctx.message.text.split(' ');
    if (tokens.length != 2) {
        ctx.replyWithMarkdown(`😥 Couldn't process that`);
        return;
    }

    const id = tokens[1];
    const value = config[id];

    if (typeof value == 'undefined') {
        ctx.replyWithMarkdown(`👎 Such setting does not exist`);
    }
    else {
        ctx.replyWithHTML(j(value));
    }
});

bot.command('getAll', ctx => {
    ctx.replyWithHTML(j(config));
});

bot.command('unset', async (ctx) => {
    const tokens = ctx.message.text.split(' ');
    if (tokens.length != 2) {
        ctx.replyWithMarkdown(`😥 Couldn't process that`);
        return;
    }

    const id = tokens[1];

    const status = await config.unset(id);
    ctx.replyWithMarkdown(status ? `👍 OK` : `👎 Failed`);
});

bot.command('set', async (ctx) => {
    const text = ctx.message.text;
    if (text) {
        const matches = text.match(/^\/?\w+ (\w+) (.*)$/s);
        if (matches && matches.length == 3) {
            const id = matches[1].trim();
            const valueJson = matches[2].trim();
            try
            {
                const valueObj = JSON.parse(valueJson);
                if (id && typeof valueObj != 'undefined') {
                    const status = await config.set(id, valueObj);
                    ctx.replyWithMarkdown(status ? `👍 OK` : `👎 Failed`);
                    return;
                }
            }
            catch (err) {
                console.error(err);
            }          
        }
    } 

    ctx.replyWithMarkdown(`😥 Couldn't process that`);
});

bot.command('top', async (ctx) => {
    const changes = getLastUpdate();
    if (!changes) {
        ctx.replyWithMarkdown(`😥 Couldn't process that`);
        return;
    }
    
    changes.existing.sort((a, b) => b.score.finalScore - a.score.finalScore);
    
    const maxCount = config.topCount;
    let i = 1;
    let msg = 'Top listings by score:\n';

    for (const item of changes.existing) {
        msg += `${i}) <a href="${item.url}">[${r(100* item.score.finalScore)}] $${k(item.price)} in ${item.location}</a>\n`;
        if (++i > maxCount) {
            break;
        }
    }

    ctx.replyWithHTML(msg);
});

bot.command('score', async (ctx) => {
    const text = ctx.message.text;
    if (text) {
        const matches = text.match(/^\/?\w+ (R\d+)$/);
        if (matches && matches.length == 2) {
            const id = matches[1].trim();
            try {
                const item = await getItem(id);
                if (item) {
                    ctx.replyWithHTML(item.printScore());
                }
                else {
                    ctx.replyWithMarkdown(`👎 Not found`);
                }
                return;
            }
            catch (err) {
                console.error(err);
            }
        }
    }

    ctx.replyWithMarkdown(`😥 Couldn't process that`);
});

bot.command('cleanup', async (ctx) => {
    try {
        const deleted = await cleanItems();
        if (deleted >= 0) {
            ctx.replyWithMarkdown(`👍 Deleted ${deleted} items`);
            return;
        }
    }
    catch (err) {
        console.error(err);
    }

    ctx.replyWithMarkdown(`👎 Failed`);
});

bot.command('update', async (ctx) => {
    try {
        const changes = await updateItems();
        await notifyChanges(changes);
    }
    catch (err) {
        console.error(err);
    }
});

bot.command('stats', async (ctx) => {
    try {
        const changes = getLastUpdate();
        if (changes) {
            const totalItems = changes.added.length + changes.modified.length + changes.existing.length;

            ctx.replyWithMarkdown(`${totalItems} results (+${changes.added.length}, ~${changes.modified.length}), ${changes.ignored.length} ignored`);
        }
        else {
            ctx.replyWithMarkdown(`😥 Couldn't process that`);
        }
    }
    catch (err) {
        console.error(err);
    }
});

bot.command('rates', async (ctx) => {
    try {
        const fixedMortgages = await getMortgages({ type: 'fixed' });
        const variableMortgages = await getMortgages({ type: 'variable' });

        let msg = '*Fixed rates:*\n';
        for (let i = 0; i < Math.min(fixedMortgages.length, 5); ++i) {
            msg += `- ${fixedMortgages[i].provider}: ${fixedMortgages[i].value}%\n`;
        }

        msg += '\n*Variable rates:*\n';
        for (let i = 0; i < Math.min(variableMortgages.length, 5); ++i) {
            msg += `- ${variableMortgages[i].provider}: P${variableMortgages[i].valueP.toPrecision(2)}% (${variableMortgages[i].value}%)\n`;
        }

        ctx.replyWithMarkdown(msg);
    }
    catch (err) {
        console.error(err);
    }
});

async function msg(txt, opts) {
    if (config.mute) {
        return;
    }

    opts = opts || { parse_mode: 'html' };

    try {
        const allowedUsers = config.allowedUsers || [];
        for (const userId of allowedUsers) {
            try {
                await bot.telegram.sendMessage(userId, txt, opts);
            }
            catch (err) {
                console.error(err);
            }
        }
    }
    catch (err) {
        console.error(err);
    }
}

async function vmsg(txt, opts) {
    if (config.verbose) {
        msg(txt, opts);
    }
}

async function notifyChanges(changes) {
    changes = changes || getLastUpdate();
    if (!changes) {
        return;
    }

    vmsg(`finished update: +${changes.added.length}, ~${changes.modified.length}, ${changes.existing.length}`);

    for (const item of changes.added) {
        // TODO: Add notify criteria in config
        msg(item.print());
    }
}

module.exports = {
    bot,
    msg,
    vmsg,
    notifyChanges
};
