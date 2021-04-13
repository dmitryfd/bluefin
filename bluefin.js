const _bluefin = Buffer.from('cmVkZmlu', 'base64').toString();
const _api = `https://www.${_bluefin}.ca/stingray/mobile/v1/gis-proto-mobile`;

const _mortgageDownPayment = 0.20;
const _mortgageInterestRate = 0.019;
const _mortgageTermYears = 30;
const _mortgagePaymentsPerYear = 12;

const _insuranceYearlyRate = 0.0054;

const _taxYearlyRate = 0.0029;

// X-RF-Android, appsflyer_id seem optional
// Also has Cookie: RF_BROWSER_ID=Ac4WK5D8Q7SztfsqQY008w; RF_BID_UPDATED=1; RF_CORVAIR_LAST_VERSION=361.4.0; JSESSIONID=C0786834FAF7B79C22DCE68146724274; RF_BUSINESS_MARKET=97; RF_LAST_ACCESS=; RF_SECURE_AUTH=; RF_AUTH=; RF_W_AUTH=; RF_ACCESS_LEVEL=
const _defaultHeaders = {
    'User-Agent': 'Redfin Android 353.0.9',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip',
    'Connection': 'keep-alive',
    'X-RF-Android': '5cca9de45c86506e;Android/sdk_google_phone_x86/generic_x86:6.0/MASTER/6695544:userdebug/test-keys;Android;unknown;353.0.9;1;e6c972f9-073c-4abb-b5f2-06fcb43fbefe;353.0',
    'appsflyer_id': '1618291814710-216498166915512168'
};

const _defaultParams = {
    'al': '1',
    'include_nearby_homes': 'true',
    'market': 'britishcolumbia',
    'num_homes': '400',
    'ord': 'price-asc',
    'page_number': '1',
    'region_id': '3790,3791',
    'region_type': '33,33',
    'sf': '1,2,5,6,7',
    'start': '0',
    'status': '9',
    'uipt': '1,2,3,4,5,6',
    'v': '8'
};

const axios = require('axios').default;

async function getHomes(params, headers) {
    const finalHeaders = { ..._defaultHeaders, ...headers};
    
    const urlParams = { ..._defaultParams, ...params };
    const urlParamsStr = new URLSearchParams(urlParams).toString();
    const url = `${_api}?${urlParamsStr}`;

    try {
        const res = await axios(url, {
            method: 'get',
            headers: finalHeaders
        });
        
        if (res.data && res.data.homes) {
            return res.data.homes.map(x => transform(x));
        }
    }
    catch (err) {
        console.error(err);
    }

    return null;
}

function transform(i) {
    const x = i && i.homeData;
    if (!x) {
        return null;
    }

    // also propertyId, listingId, dataSourceId, marketId, businessMarketId, mlsStatusId
    const obj = {
        mlsId: x.mlsId,
        price: x.priceInfo && parseInt(x.priceInfo.amount),
        searchStatus: x.listingMetadata && x.listingMetadata.searchStatus,
        type: x.propertyType,
        daysOnMarket: x.daysOnMarket && parseInt(x.daysOnMarket.daysOnMarket),
        hoaPayment: x.hoaDues && parseInt(x.hoaDues.amount),
        sqft: x.sqftInfo && parseInt(x.sqftInfo.amount),
        beds: x.beds,
        baths: x.baths,
        location: x.addressInfo && x.addressInfo.location,
        lat: x.addressInfo && x.addressInfo.centroid && x.addressInfo.centroid.centroid && x.addressInfo.centroid.centroid.latitude,
        long: x.addressInfo && x.addressInfo.centroid && x.addressInfo.centroid.centroid && x.addressInfo.centroid.centroid.longitude,
        streetLine: x.addressInfo && x.addressInfo.formattedStreetLine,
        unit: x.addressInfo && x.addressInfo.unitNumber,
        city: x.addressInfo && x.addressInfo.city,
        state: x.addressInfo && x.addressInfo.state,
        postalCode: x.addressInfo && x.addressInfo.zip,
        country: x.addressInfo && x.addressInfo.countryCode,
        yearBuilt: x.yearBuilt && x.yearBuilt.yearBuilt,
        url: `https://${_bluefin}.ca${x.url}`,
        lastSoldDate: x.lastSaleData && x.lastSaleData.lastSoldDate,
        broker: x.brokers && x.brokers.listingBrokerAndAgent && x.brokers.listingBrokerAndAgent.brokerName,
        isNew: !!(x.listingMetadata && x.listingMetadata.isNewConstruction),
        hasInsight: !!(x.insights && x.insights.hasInsight)
    };

    obj.address = getAddress(obj.streetLine, obj.city); 
    obj.mapUrl = getMapUrl(obj.lat, obj.long); 
    obj.mortgagePayment = getMortgagePayment(obj.price);
    obj.taxPayment = getTaxPayment(obj.price); 
    obj.insurancePayment = getInsurancePayment(obj.price); 
    obj.totalPayment = obj.mortgagePayment + obj.taxPayment + obj.insurancePayment + obj.hoaPayment;
    obj.pricePerSqft = obj.price / obj.sqft;
    
    return obj;
}

function getAddress(street, city) {
    return `${street}, ${city}`;
}

function getMapUrl(lat, long) {
    return `https://www.google.com/maps/place/${lat},${long}`;
}

function getMortgagePayment(price) {
    const P = price * (1 - _mortgageDownPayment);
    const r = _mortgageInterestRate / _mortgagePaymentsPerYear;
    const n = _mortgagePaymentsPerYear * _mortgageTermYears;

    const x = Math.pow(1 + r, n);

    return P * r * x / (x - 1);
}

function getTaxPayment(price) {
    return price * _taxYearlyRate / 12;
}

function getInsurancePayment(price) {
    return price * _insuranceYearlyRate / 12;
}

module.exports = {
    getHomes
};