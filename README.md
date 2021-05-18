## Prerequisites

* Create a free tier [CosmosDB database](https://azure.microsoft.com/en-us/try/cosmosdb/)
* Register a [Telegram bot](https://t.me/botfather)
* Determine your [Telegram user ID](https://t.me/getmyid_bot)
* Prepare a server (local device, VM, Azure Web App etc)

## Setup

* Clone the repository
* Copy `.env.example` to `.env`
* Fill out the configuration details from the steps above
* Fetch dependencies: `yarn install / npm install`
* Run: `yarn start / npm run start`

## Notes

* First run might be very noisy as the initial results are populated
  * Recommend to mute the bot chat in Telegram in advance

* If deploying to Azure Web App, ensure to:
  * Copy configuration details to `Settings -> Configuration`
  * Set `Settings -> Configuration -> General settings -> Always on` to `On`

* Once started, bot will fetch the API results once every `{updateInterval}` and notify each of the `{allowedUsers}` of any additions. 

* To configure either modify the defaults in `config.js` or use these commands:
  * `/getAll` - get all settings values
  * `/get {settingName}` - get value of setting (see `config.js`)
  * `/set {settingName}` - set value of setting (see `config.js`)

* In addition to that, the following commands are supported:
  * `/update` - run an update cycle manually
  * `/cleanup` - purge outdated results
  * `/top` - return top items by score
  * `/score {mlsId}` - print score breakdown