const _bluefin = atob('cmVkZmlu');
const _api = `https://www.${_bluefin}.ca/stingray/api/gis`;

const _mortgageDownPayment = 0.20;
const _mortgageInterestRate = 0.019;
const _mortgageTermYears = 30;
const _mortgagePaymentsPerYear = 12;

const _insuranceYearlyRate = 0.0054;

const _taxYearlyRate = 0.0029;

const _defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36 Edg/88.0.705.68',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive'
};

const _defaultParams = {
    'al': '1',
    'include_nearby_homes': 'true',
    'market': 'britishcolumbia',
    'num_homes': '350',
    'ord': `${_bluefin}-recommended-asc`,
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

async function get(params, headers) {
    const finalHeaders = { ..._defaultHeaders, ...headers};
    
    const urlParams = { ..._defaultParams, ...params };
    const urlParamsStr = new URLSearchParams(urlParams).toString();
    const url = `${_api}?${urlParamsStr}`;

    try {
        const res = await axios(url, {
            method: 'get',
            headers: finalHeaders
        });

        const json = res.data.replace('{}&&', '');

        const obj = JSON.parse(json);
        if (obj && obj.payload && obj.payload.homes) {
            return obj.payload.homes.map(x => transform(x));
        }
    }
    catch (err) {
        console.error(err);
    }

    return null;
}

function transform(x) {
    const obj = {
        id: x.mlsId && x.mlsId.value,
        price: x.price && x.price.value,
        hoaPayment: x.hoa && x.hoa.value,
        sqft: x.sqFt && x.sqFt.value,
        pricePerSqft: x.pricePerSqFt && x.pricePerSqFt.value,
        beds: x.beds || 0,
        baths: x.baths || 0,
        location: x.location && x.location.value,
        stories: x.stories || 0,
        lat: x.latLong && x.latLong.value && x.latLong.value.latitude,
        long: x.latLong && x.latLong.value && x.latLong.value.longitude,
        streetLine: x.streetLine && x.streetLine.value,
        unit: x.unitNumber && x.unitNumber.value,
        city: x.city,
        state: x.state,
        postalCode: x.postalCode && x.postalCode.value,
        country: x.countryCode,
        propertyId: x.propertyId,
        listingId: x.listingId,
        dataSourceId: x.dataSourceId,
        marketId: x.marketId,
        servicePolicyId: x.servicePolicyId,
        businessMarketId: x.businessMarketId,
        yearBuilt: x.yearBuilt && x.yearBuilt.value,
        dom: x.dom && x.dom.value,
        broker: x.listingBroker && x.listingBroker.value,
        url: `https://${_bluefin}.ca${x.url}`,
        isHot: x.isHot,
        hasVirtualTour: x.hasVirtualTour,
        hasVideoTour: x.hasVideoTour,
        has3DTour: x.has3DTour,
        hasSelfTour: x.hasSelfTour,
        isNew: x.isNewConstruction,
        rawPhotos: x.photos && x.photos.value,

        get address() {
            return `${this.streetLine}, ${this.city}`;
        },

        get mapUrl() {
            return `https://www.google.com/maps/place/${this.lat},${this.long}`;
        },

        get mortgagePayment() {
            const P = this.price * (1 - _mortgageDownPayment);
            const r = _mortgageInterestRate / _mortgagePaymentsPerYear;
            const n = _mortgagePaymentsPerYear * _mortgageTermYears;

            const x = Math.pow(1 + r, n);

            return P * r * x / (x - 1);
        },

        get taxPayment() {
            return this.price * _taxYearlyRate / 12;
        },

        get insurancePayment() {
            return this.price * _insuranceYearlyRate / 12;
        },

        get totalPayment() {
            return this.mortgagePayment + this.taxPayment + this.insurancePayment + this.hoaPayment;
        },

        get photos() {
            if (!this.id || !this.photos)
            {
                return null;
            }

            const idEnd = this.id.slice(-3);
    
            const photoIds = this.photos
                .split(',')
                .map(x => {
                    var split = x.split(':');
                    var photoId = (split && split.length == 2) ? split[1] : null;
    
                    return photoId ? `https://ssl.cdn-${_bluefin}.com/photo/256/islphoto/${idEnd}/genIslnoResize.${this.id}_${photoId}.jpg` : null;
                })
                .filter(x => !!x);
    
            return photoIds;
        }
    };

    return obj;
}

export default {
    getHomes
};