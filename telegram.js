const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_TOKEN || '');

const _allowedUserIds = (process.env.TELEGRAM_ALLOWED_USERIDS || '').split(',');

bot.use(async (ctx, next) => {
    if (_allowedUserIds.indexOf(ctx.chat.id.toString()) < 0) {
        ctx.replyWithMarkdown(`🛑 Sorry, you are not authorized to use this bot! (${ctx.chat.id})}`);
    }
    else {
        await next();
    }
});

bot.start(ctx => {
    const name = ctx.chat.type == 'private' ? ctx.chat.first_name : ctx.chat.title;
    ctx.replyWithMarkdown(`👋 Hey there, ${name} (${ctx.chat.id})!`);
});

async function broadcast(msg, opts) {
    opts = opts || { parse_mode: 'html' };

    for (const userId of _allowedUserIds) {
        try {
            await bot.telegram.sendMessage(userId, msg, opts);
        }
        catch (err) {
            console.error(err);
        }
    }
}

module.exports = {
    bot,
    broadcast
};
