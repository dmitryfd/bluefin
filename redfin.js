const regions = {
    vancouver: '3790',
    burnaby: '3791',
    richmond: '3789',
    northvan: '3279'
}

const propertyTypes = {
    house: '1',
    condo: '2',
    townhouse: '3',
    multifamily: '4',
    land: '5',
    other: '6',
    manufactured: '7',
    coop: '8',
    all: '1,2,3,4,5,6,7,8'
};

const _getHomesApi = 'https://www.redfin.ca/stingray/mobile/v1/gis-proto-mobile';
const _getCommuteApi = 'https://www.redfin.com/stingray/mobile/api/v1/home/details/commute/commuteDuration/property/';
const _getTourInsightsApi = 'https://www.redfin.com/stingray/mobile/api/1/home/details/tourInsights';
const _getWalkScoreApi = 'https://www.redfin.com/stingray/mobile/api/v1/home/details/neighborhoodStats/walkScore';
const _getPopularityInfoApi = 'https://www.redfin.com/stingray/api/home/details/popularityInfo';
const _getAmenitiesApi = 'https://www.redfin.com/stingray/mobile/api/v1/home/details/amenities';
const _getAboveTheFoldApi = 'https://www.redfin.com/stingray/mobile/api/v1/home/details/aboveTheFold';
const _getBelowTheFoldApi = 'https://www.redfin.com/stingray/mobile/api/v2/home/details/belowTheFold';

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

const axios = require('axios').default;

async function getHomes(params, headers = null) {
    const finalHeaders = { ..._defaultHeaders, ...headers};
    
    const defaultParams = {
        'al': '1', //3 on web?
        'include_nearby_homes': 'true', //remove?
        'market': 'britishcolumbia',
        'num_homes': '400',
        'ord': 'price-asc',
        'page_number': '1',
        'region_id': `${regions.vancouver},${regions.burnaby}`,
        'region_type': '33,33',
        'sf': '1,2,5,6,7',
        'start': '0',
        'status': '9',
        'uipt': propertyTypes.all,
        'v': '8', //6 on mobile?
        'excl_ar': 'true', //works on mobile?
        'excl_ll': 'true', //works on mobile?
        'android-app-version-code': '380'
    };
    
    const urlParams = { ...defaultParams, ...params };
    const urlParamsStr = new URLSearchParams(urlParams).toString();
    const url = `${_getHomesApi}?${urlParamsStr}`;

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

    // also dataSourceId, marketId, businessMarketId, mlsStatusId
    const obj = {
        id: x.mlsId,
        mlsId: x.mlsId,
        propertyId: x.propertyId,
        listingId: x.listingId,
        price: x.priceInfo && parseInt(x.priceInfo.amount) || null,
        searchStatus: x.listingMetadata && x.listingMetadata.searchStatus || null,
        type: x.propertyType,
        daysOnMarket: x.daysOnMarket && parseInt(x.daysOnMarket.daysOnMarket) || null,
        hoaPayment: x.hoaDues && parseInt(x.hoaDues.amount) || null,
        sqft: x.sqftInfo && parseInt(x.sqftInfo.amount) || null,
        beds: x.beds,
        baths: x.baths,
        location: x.addressInfo && x.addressInfo.location || null,
        lat: x.addressInfo && x.addressInfo.centroid && x.addressInfo.centroid.centroid && x.addressInfo.centroid.centroid.latitude || null,
        long: x.addressInfo && x.addressInfo.centroid && x.addressInfo.centroid.centroid && x.addressInfo.centroid.centroid.longitude || null,
        streetLine: x.addressInfo && x.addressInfo.formattedStreetLine || null,
        unit: x.addressInfo && x.addressInfo.unitNumber || null,
        city: x.addressInfo && x.addressInfo.city || null,
        state: x.addressInfo && x.addressInfo.state || null,
        postalCode: x.addressInfo && x.addressInfo.zip || null,
        country: x.addressInfo && x.addressInfo.countryCode || null,
        yearBuilt: x.yearBuilt && x.yearBuilt.yearBuilt || null,
        url: `https://redfin.ca${x.url}`,
        lastSoldDate: x.lastSaleData && x.lastSaleData.lastSoldDate || null,
        broker: x.brokers && x.brokers.listingBrokerAndAgent && x.brokers.listingBrokerAndAgent.brokerName || null,
        isNew: !!(x.listingMetadata && x.listingMetadata.isNewConstruction),
        hasInsight: !!(x.insights && x.insights.hasInsight)
    };

    return obj;
}

async function getTourInsights(propertyId, listingId, headers = null) {
    const finalHeaders = { ..._defaultHeaders, ...headers};
    
    const urlParams = {
        propertyId,
        listingId,
        accessLevel: '1',
        'android-app-version-code': '380'
    };

    const urlParamsStr = new URLSearchParams(urlParams).toString();
    const url = `${_getTourInsightsApi}?${urlParamsStr}`;

    try {
        const res = await axios(url, {
            method: 'get',
            headers: finalHeaders
        });
        
        const json = res.data.replace('{}&&', '');
        const obj = JSON.parse(json);
        
        return obj && obj.payload;
    }
    catch (err) {
        console.error(err);
    }

    return null;
}

async function getWalkScore(propertyId, listingId, headers = null) {
    const finalHeaders = { ..._defaultHeaders, ...headers};
    
    const urlParams = {
        propertyId,
        listingId,
        accessLevel: '1',
        'android-app-version-code': '380'
    };

    const urlParamsStr = new URLSearchParams(urlParams).toString();
    const url = `${_getWalkScoreApi}?${urlParamsStr}`;

    try {
        const res = await axios(url, {
            method: 'get',
            headers: finalHeaders
        });
        
        const json = res.data.replace('{}&&', '');
        const obj = JSON.parse(json);
        
        return obj && obj.payload;
    }
    catch (err) {
        console.error(err);
    }

    return null;
}

async function getCommute(propertyId, commuteTypeId = '3', destinationLatitude = '49.2820597', destinationLongitude = '-123.1196942', headers = null) {
    const finalHeaders = { ..._defaultHeaders, ...headers};
    
    const urlParams = {
        commuteTypeId,
        destinationLatitude,
        destinationLongitude,
        'android-app-version-code': '380'
    };

    const urlParamsStr = new URLSearchParams(urlParams).toString();
    const url = `${_getCommuteApi}${propertyId}?${urlParamsStr}`;

    try {
        const res = await axios(url, {
            method: 'get',
            headers: finalHeaders
        });
        
        const json = res.data.replace('{}&&', '');
        const obj = JSON.parse(json);
        
        if (obj && obj.payload) {
            return obj.payload.formattedDuration;
        }
    }
    catch (err) {
        console.error(err);
    }

    return null;
}

async function getPopularityInfo(listingId, headers = null) {
    const finalHeaders = { ..._defaultHeaders, ...headers};
    
    const urlParams = {
        listingId,
        'android-app-version-code': '380'
    };

    const urlParamsStr = new URLSearchParams(urlParams).toString();
    const url = `${_getPopularityInfoApi}?${urlParamsStr}`;

    try {
        const res = await axios(url, {
            method: 'get',
            headers: finalHeaders
        });
        
        const json = res.data.replace('{}&&', '');
        const obj = JSON.parse(json);
        
        return obj && obj.payload;
    }
    catch (err) {
        console.error(err);
    }

    return null;
}

async function getAmenities(propertyId, listingId, headers = null) {
    const finalHeaders = { ..._defaultHeaders, ...headers};
    
    // also mc-mv=1617991667260, mc-dsov=1617213270019, mc-mlsv=1617835433462, mc-ccv=-400856821, mc-api=2
    const urlParams = {
        propertyId,
        listingId,
        accessLevel: '1',
        'android-app-version-code': '380'
    };

    const urlParamsStr = new URLSearchParams(urlParams).toString();
    const url = `${_getAmenitiesApi}?${urlParamsStr}`;

    try {
        const res = await axios(url, {
            method: 'get',
            headers: finalHeaders
        });
        
        const json = res.data.replace('{}&&', '');
        const obj = JSON.parse(json);
        
        return obj && obj.payload;
    }
    catch (err) {
        console.error(err);
    }

    return null;
}

async function getAboveTheFold(propertyId, listingId, headers = null) {
    const finalHeaders = { ..._defaultHeaders, ...headers};
    
    const urlParams = {
        propertyId,
        listingId,
        accessLevel: '1',
        'supported_virtualtour_sources': '0,1,2',
        'android-app-version-code': '380'
    };

    const urlParamsStr = new URLSearchParams(urlParams).toString();
    const url = `${_getAboveTheFoldApi}?${urlParamsStr}`;

    try {
        const res = await axios(url, {
            method: 'get',
            headers: finalHeaders
        });
        
        const json = res.data.replace('{}&&', '');
        const obj = JSON.parse(json);
        
        return obj && obj.payload;
    }
    catch (err) {
        console.error(err);
    }

    return null;
}

async function getBelowTheFold(propertyId, listingId, headers = null) {
    const finalHeaders = { ..._defaultHeaders, ...headers};
    
    const urlParams = {
        propertyId,
        listingId,
        accessLevel: '1',
        'android-app-version-code': '380'
    };

    const urlParamsStr = new URLSearchParams(urlParams).toString();
    const url = `${_getBelowTheFoldApi}?${urlParamsStr}`;

    try {
        const res = await axios(url, {
            method: 'get',
            headers: finalHeaders
        });
        
        const json = res.data.replace('{}&&', '');
        const obj = JSON.parse(json);
        
        return obj && obj.payload;
    }
    catch (err) {
        console.error(err);
    }

    return null;
}

module.exports = {
    propertyTypes,
    regions,
    getHomes,
    getTourInsights,
    getWalkScore,
    getCommute,
    getPopularityInfo,
    getAmenities,
    getAboveTheFold,
    getBelowTheFold
};