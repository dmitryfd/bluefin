const he = require('he');
const axios = require('axios').default;

const Item = require('./item');

const _getHomesApi = 'https://www.redfin.ca/stingray/mobile/v1/gis-proto-mobile';
const _getCommuteApi = 'https://www.redfin.com/stingray/mobile/api/v1/home/details/commute/commuteDuration/property/';
const _getTourInsightsApi = 'https://www.redfin.com/stingray/mobile/api/1/home/details/tourInsights';
const _getWalkScoreApi = 'https://www.redfin.com/stingray/mobile/api/v1/home/details/neighborhoodStats/walkScore';
const _getPopularityInfoApi = 'https://www.redfin.com/stingray/api/home/details/popularityInfo';
const _getAmenitiesApi = 'https://www.redfin.com/stingray/mobile/api/v1/home/details/amenities';
const _getAboveTheFoldApi = 'https://www.redfin.com/stingray/mobile/api/v1/home/details/aboveTheFold';
const _getBelowTheFoldApi = 'https://www.redfin.com/stingray/mobile/api/v2/home/details/belowTheFold';

// 'X-RF-Android': '5cca9de45c86506e;Android/sdk_google_phone_x86/generic_x86:6.0/MASTER/6695544:userdebug/test-keys;Android;unknown;353.0.9;1;e6c972f9-073c-4abb-b5f2-06fcb43fbefe;353.0'
// 'appsflyer_id': '1618291814710-216498166915512168'
// 'Cookie': 'RF_BROWSER_ID=Ac4WK5D8Q7SztfsqQY008w; RF_BID_UPDATED=1; RF_CORVAIR_LAST_VERSION=361.4.0; JSESSIONID=C0786834FAF7B79C22DCE68146724274; RF_BUSINESS_MARKET=97; RF_LAST_ACCESS=; RF_SECURE_AUTH=; RF_AUTH=; RF_W_AUTH=; RF_ACCESS_LEVEL='
const _defaultHeaders = {
    'User-Agent': 'Redfin Android 353.0.9',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip',
    'Connection': 'keep-alive'
};

async function getHomes(params, headers = null) {
    const finalHeaders = { ..._defaultHeaders, ...headers};
    
    const defaultParams = {
        'al': '1', //3 on web?
        'include_nearby_homes': 'true', //remove?
        'num_homes': '10000',
        'ord': 'price-asc',
        'page_number': '1',
        'sf': '1,2,5,6,7',
        'start': '0',
        'status': '9',
        'v': '8', //6 on mobile?
        'excl_ar': 'true',
        'excl_ll': 'true',
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
        publishedDate: x.daysOnMarket && x.daysOnMarket.listingAddedDate || null,
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
        extended: null
    };

    return Item.fromObject(obj);
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
        
        return obj && obj.payload && obj.payload.walkScoreData;
    }
    catch (err) {
        console.error(err);
    }

    return null;
}

async function getCommute(propertyId, commuteTypeId, destinationLatitude, destinationLongitude, headers = null) {
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
        
        return obj && obj.payload && obj.payload.formattedDuration;
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

async function getExtendedData(item, options = null) {
    if (!item) {
        return null;
    }

    const extended = {};

    const w = await getWalkScore(item.propertyId, item.listingId);
    if (w) {
        extended.walkScore = {
            walk: w.walkScore && w.walkScore.value || null,
            bike: w.bikeScore && w.bikeScore.value || null,
            transit: w.transitScore && w.transitScore.value || null,
            desc: w.walkScore && w.walkScore.shortDescription || null
        };
    }

    const commuteTypeId = options && options.commuteTypeId;
    const commuteLatitude = options && options.commuteLatitude;
    const commuteLongitude = options && options.commuteLongitude;
    if (commuteTypeId && commuteLatitude && commuteLongitude) {
        const c = await getCommute(item.propertyId, commuteTypeId, commuteLatitude, commuteLongitude);
        if (c) {
            const matches = c.match(/\d+/g);
            if (!matches || matches.length == 0) {
                extended.workCommute = null;
            }
            else if (matches.length == 1) {
                extended.workCommute = parseInt(matches[0]);
            }
            else if (matches.length == 2) {
                extended.workCommute = parseInt(matches[0]) * 60 + parseInt(matches[1]);
            }
        }
    }

    const af = await getAboveTheFold(item.propertyId, item.listingId);
    if (af && af.mainHouseInfo && af.mainHouseInfo.marketingRemarks) {
        extended.remarks = af.mainHouseInfo.marketingRemarks.map(x => he.decode(x.marketingRemark));
    }
    
    // TODO: Schools, more detailed tax info, price history etc
    // const bf = await getBelowTheFold(item.propertyId, item.listingId);

    const a = await getAmenities(item.propertyId, item.listingId);
    if (a && a.superGroups) {
        extended.amenities = [];
        for (const superGroup of a.superGroups) {
            for (const group of superGroup.amenityGroups) {
                for (const entry of group.amenityEntries) {
                    extended.amenities.push({
                        id: entry.referenceName || null,
                        name: entry.amenityName && he.decode(entry.amenityName) || null,
                        value: entry.amenityValues && entry.amenityValues.map(x => he.decode(x)).join(', ') || null
                    });
                }
            }
        }
    }

    const i = await getTourInsights(item.propertyId, item.listingId);
    if (i && i.tourInsights) {
        extended.insights = i.tourInsights.map(x => he.decode(x.note));
    }

    return extended;
}

module.exports = {
    getHomes,
    getExtendedData
};