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

const axios = require('axios').default;

async function getHomes(params, headers = null) {
    const finalHeaders = { ..._defaultHeaders, ...headers};
    
    const defaultParams = {
        'al': '1',
        'include_nearby_homes': 'true',
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
        'v': '8',
        'excl_ar': 'true',
        'excl_ll': 'true'
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
        mlsId: x.mlsId,
        propertyId: x.propertyId,
        listingId: x.listingId,
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
        url: `https://redfin.ca${x.url}`,
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

async function getTourInsights(propertyId, listingId, accessLevel = '1', headers = null) {
    const finalHeaders = { ..._defaultHeaders, ...headers};
    
    const urlParams = {
        propertyId,
        listingId,
        accessLevel,
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

// GET https://www.redfin.com/stingray/mobile/api/v1/home/details/aboveTheFold?propertyId=155378604&accessLevel=1&listingId=125016081&supported_virtualtour_sources=0,1,2&android-app-version-code=380 HTTP/1.1
// {}&&{"version":374,"errorMessage":"Success","resultCode":0,"payload":{"mainHouseInfo":{"listingId":125016081,"videoOpenHouses":[],"hotnessInfo":{"isHot":false,"hotnessMessageInfoWithTourLink":{"hotnessMessageAction":"go tour it now"}},"listingAgents":[{"agentInfo":{"agentName":"Rose Liapis","isAgentNameBlank":false,"isRedfinAgent":false,"isPartnerAgent":false,"isExternalAgent":false},"brokerName":"Goodrich Realty Inc.","agentEmailAddress":"roseliapis@yahoo.com","isOpendoor":false}],"buyingAgents":[],"remarksDisplayLevel":1,"marketingRemarks":[{"marketingRemark":"NW corner unit, spacious 2 bedroom  \u0026  den (or 3 bdrm), 2 baths and in suite laundry. Unit shows very well. Newer laminate floor in living room, dining room  \u0026  den. Fresh paint and crown mouldings. Updated shower and bathtub by Bathfitter, also new dishwasher, front loading washer and dryer. 2 parking stalls rent for $200/month both. Close to transit, elementary, high school and bus route to UBC. Leaky condo, must pay all cash, no finance available. Buyer pays special levy. Potential re-development site. Call for your private appointment. Masks must be worn at showing.  ","displayLevel":1}],"selectedAmenities":[{"header":"Maintenance Fee","content":"$460/month"},{"header":"Property Type","content":"Apartment/Condo"},{"header":"Property Style","content":"Corner Unit"},{"header":"Stories","content":"1"},{"header":"Community","content":"Renfrew Heights","displayLevel":1},{"header":"Region","content":"Greater Vancouver Regional District"},{"header":"MLS®#","content":"R2502255"},{"header":"Built","content":"1995"}],"showPriceHomeLink":false,"showClaimHomeLink":false,"alwaysShowAgentAttribution":false,"showOffMarketWarning":false,"propertyAddress":{"streetNumber":"2528","directionalPrefix":"E","streetName":"Broadway","streetType":"","directionalSuffix":"","unitType":"#","unitValue":"201","city":"Vancouver","stateOrProvinceCode":"BC","postalCode":"V5M 4T7","countryCode":"CA"},"propertyIsActivish":false,"isComingSoonListing":false,"hasOfferDeadlineInEffect":false,"isRedfinDirectEligible":false,"isOpendoorEligible":false,"isBDXEligible":false,"isFMLS":false},"mediaBrowserInfo":{"scans":[],"videos":[],"isHot":false,"previousListingPhotosCount":0},"openHouseInfo":{"openHouseList":[]}}}

// GET https://www.redfin.com/stingray/mobile/api/v1/home/details/neighborhoodStats/walkScore?propertyId=155378604&listingId=125016081&accessLevel=1&android-app-version-code=380 HTTP/1.1
// {}&&{"version":374,"errorMessage":"Success","resultCode":0,"payload":{"walkScoreData":{"walkScore":{"value":59.0,"link":"https://www.walkscore.com/score/2528+Broadway++Vancouver+BC+V5M+4T7/lat\u003d49.2616818/lng\u003d-123.0546664?utm_source\u003dredfin","shortDescription":"Somewhat Walkable","description":"Some errands can be accomplished on foot","color":"#e69500"},"bikeScore":{"value":84.0,"link":"https://www.walkscore.com/score/2528+Broadway++Vancouver+BC+V5M+4T7/lat\u003d49.2616818/lng\u003d-123.0546664?utm_source\u003dredfin"},"transitScore":{"value":75.0,"link":"https://www.walkscore.com/score/2528+Broadway++Vancouver+BC+V5M+4T7/lat\u003d49.2616818/lng\u003d-123.0546664?utm_source\u003dredfin"}}}}

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

// GET https://www.redfin.com/stingray/api/home/details/popularityInfo?listingId=125016081&android-app-version-code=380 HTTP/1.1
// {}&&{"version":374,"errorMessage":"Success","resultCode":0,"payload":{"numHomeViews":0,"p90ViewThreshold":0,"isPopular":false,"isFirstTour":false}}

// GET https://www.redfin.com/stingray/mobile/api/v1/home/details/amenities?propertyId=155239008&listingId=125283113&accessLevel=1&android-app-version-code=380&mc-mv=1617991667260&mc-dsov=1617213270019&mc-mlsv=1617835433462&mc-ccv=-400856821&mc-api=2 HTTP/1.1
// {}&&{"version":374,"errorMessage":"Success","resultCode":0,"payload":{"superGroups":[{"types":[33,27,34,28],"amenityGroups":[{"groupTitle":"Virtual Tour","referenceName":"Virtual Tour","amenityEntries":[{"referenceName":"VT_VTOUR_URL","accessLevel":1,"displayLevel":1,"amenityValues":["\u003ca href\u003d\u0027https://my.matterport.com/show/?m\u003dXcXZq3a3Q2t\u0027 target\u003d\u0027_blank\u0027 rel\u003d\u0027nofollow noopener\u0027\u003eBranded Virtual Tour\u003c/a\u003e"]}]},{"groupTitle":"Building Information","referenceName":"Building Information","amenityEntries":[{"amenityName":"# of Floor Levels","referenceName":"LM_INT1_1","accessLevel":1,"displayLevel":1,"amenityValues":["2"]},{"amenityName":"Approximate Year Built","referenceName":"LM_INT2_2","accessLevel":1,"displayLevel":1,"amenityValues":["2,004"]},{"amenityName":"Age","referenceName":"LM_INT2_3","accessLevel":1,"displayLevel":1,"amenityValues":["17"]},{"amenityName":"Basement Area","referenceName":"LFD_BASEMENT_AREA_37","accessLevel":1,"displayLevel":1,"amenityValues":["None"]}]},{"groupTitle":"Utilities","referenceName":"Utilities","amenityEntries":[{"amenityName":"Sewer Type","referenceName":"LM_CHAR10_75","accessLevel":1,"displayLevel":1,"amenityValues":["City/Municipal"]}]},{"groupTitle":"Tax Information","referenceName":"Tax Information","amenityEntries":[{"amenityName":"Gross Taxes","referenceName":"LM_DEC_16","accessLevel":1,"displayLevel":1,"amenityValues":["$2,211.34"]},{"amenityName":"For Tax Year","referenceName":"LM_INT2_5","accessLevel":1,"displayLevel":1,"amenityValues":["2,019"]}]}],"titleString":"Virtual Tour, Exterior Features, Utilities, Taxes / Assessments"},{"types":[21],"amenityGroups":[{"groupTitle":"Bathroom Information","referenceName":"Bathroom Information","amenityEntries":[{"amenityName":"# of Bathrooms (Total)","referenceName":"LM_INT1_19","accessLevel":1,"displayLevel":1,"amenityValues":["3"]},{"amenityName":"# of Full Bathrooms","referenceName":"LM_INT1_18","accessLevel":1,"displayLevel":1,"amenityValues":["2"]},{"amenityName":"# of Half Bathrooms","referenceName":"LM_INT1_17","accessLevel":1,"displayLevel":1,"amenityValues":["1"]}]},{"groupTitle":"Fireplace Information","referenceName":"FireplaceInformation","amenityEntries":[{"amenityName":"# of Fireplaces","referenceName":"LM_INT1_2","accessLevel":1,"displayLevel":1,"amenityValues":["1"]}]}],"titleString":"Interior Features"},{"types":[20],"amenityGroups":[{"groupTitle":"Land Information","referenceName":"Land Information","amenityEntries":[{"amenityName":"Title to Land","referenceName":"LM_CHAR10_12","accessLevel":1,"displayLevel":1,"amenityValues":["Leasehold prepaid-Strata"]}]},{"groupTitle":"Property Information","referenceName":"Property Features","amenityEntries":[{"amenityName":"Floor Area Finished - Total","referenceName":"LM_DEC_5","accessLevel":1,"displayLevel":1,"amenityValues":["1,044"]},{"amenityName":"Type","referenceName":"L_TYPE_","accessLevel":1,"displayLevel":1,"amenityValues":["Townhouse"]},{"amenityName":"Type of Dwelling","referenceName":"LM_CHAR10_11","accessLevel":1,"displayLevel":1,"amenityValues":["Townhouse"]}]}],"titleString":"Property / Lot Details"},{"types":[32,39],"amenityGroups":[{"groupTitle":"Location Information","referenceName":"Location Information","amenityEntries":[{"amenityName":"Area","referenceName":"L_AREA","accessLevel":1,"displayLevel":1,"amenityValues":["Burnaby North"]},{"amenityName":"Sub-Area/Community","referenceName":"LM_CHAR10_5","accessLevel":1,"displayLevel":1,"amenityValues":["Simon Fraser Univer."]}]},{"groupTitle":"Community Information","referenceName":"CommunityInformation","amenityEntries":[{"amenityName":"Amenities","referenceName":"LFD_AMENITIES_56","accessLevel":1,"displayLevel":1,"amenityValues":["Exercise Centre","In Suite Laundry"]}]}],"titleString":"Location Details, Community Information"}],"isFMLS":false,"showGhostTown":false,"showListingVOW":false,"amenitiesLocked":false,"totalAmenities":0,"userHasAccess":false}}

// GET https://www.redfin.com/stingray/mobile/api/v2/home/details/belowTheFold?propertyId=155239008&listingId=125283113&accessLevel=1&android-app-version-code=380 HTTP/1.1
// {}&&{"version":374,"errorMessage":"Success","resultCode":0,"payload":{"schoolsInfo":{"elementarySchools":[{"servesHome":true,"parentRating":0,"distanceInMiles":"0.2","gradeRanges":"K to 7","institutionType":"Public","name":"University Highlands Elementary School","schoolUrl":"/bc/school/university-highlands-elementary-school/237617","searchUrl":"/bc/school/university-highlands-elementary-school/237617","id":237617,"fullAddress":"9388 Tower Rd, Burnaby, BC V5A 4X6","numReviews":0,"schoolReviews":[],"schoolGranularRatings":[],"elementary":true,"middle":false,"high":false,"lastUpdatedDate":"Sep 23, 2020","hasMultipleCatchmentAreas":false},{"servesHome":true,"parentRating":0,"distanceInMiles":"6.4","gradeRanges":"K to 12","institutionType":"Public","name":"École Des Pionniers","schoolUrl":"/bc/school/cole-des-pionniers/236723","searchUrl":"/bc/school/cole-des-pionniers/236723","id":236723,"fullAddress":"3550 Wellington St, Port Coquitlam, BC V3B 3Y5","numReviews":0,"schoolReviews":[],"schoolGranularRatings":[],"elementary":true,"middle":false,"high":true,"lastUpdatedDate":"Sep 23, 2020","hasMultipleCatchmentAreas":false}],"middleSchools":[],"highSchools":[{"servesHome":true,"parentRating":0,"distanceInMiles":"1.7","gradeRanges":"8 to 12","institutionType":"Public","name":"Burnaby Mountain Secondary School","schoolUrl":"/bc/school/burnaby-mountain-secondary-school/237277","searchUrl":"/bc/school/burnaby-mountain-secondary-school/237277","id":237277,"fullAddress":"8800 Eastlake Dr, Burnaby, BC V3J 7X5","numReviews":0,"schoolReviews":[],"schoolGranularRatings":[],"elementary":false,"middle":false,"high":true,"lastUpdatedDate":"Sep 23, 2020","hasMultipleCatchmentAreas":false},{"servesHome":true,"parentRating":0,"distanceInMiles":"6.4","gradeRanges":"K to 12","institutionType":"Public","name":"École Des Pionniers","schoolUrl":"/bc/school/cole-des-pionniers/236723","searchUrl":"/bc/school/cole-des-pionniers/236723","id":236723,"fullAddress":"3550 Wellington St, Port Coquitlam, BC V3B 3Y5","numReviews":0,"schoolReviews":[],"schoolGranularRatings":[],"elementary":true,"middle":false,"high":true,"lastUpdatedDate":"Sep 23, 2020","hasMultipleCatchmentAreas":false}],"servingThisHomeSchools":[{"servesHome":true,"parentRating":0,"distanceInMiles":"0.2","gradeRanges":"K to 7","institutionType":"Public","name":"University Highlands Elementary School","schoolUrl":"/bc/school/university-highlands-elementary-school/237617","searchUrl":"/bc/school/university-highlands-elementary-school/237617","id":237617,"fullAddress":"9388 Tower Rd, Burnaby, BC V5A 4X6","numReviews":0,"schoolReviews":[],"schoolGranularRatings":[],"elementary":true,"middle":false,"high":false,"lastUpdatedDate":"Sep 23, 2020","hasMultipleCatchmentAreas":false},{"servesHome":true,"parentRating":0,"distanceInMiles":"6.4","gradeRanges":"K to 12","institutionType":"Public","name":"École Des Pionniers","schoolUrl":"/bc/school/cole-des-pionniers/236723","searchUrl":"/bc/school/cole-des-pionniers/236723","id":236723,"fullAddress":"3550 Wellington St, Port Coquitlam, BC V3B 3Y5","numReviews":0,"schoolReviews":[],"schoolGranularRatings":[],"elementary":true,"middle":false,"high":true,"lastUpdatedDate":"Sep 23, 2020","hasMultipleCatchmentAreas":false},{"servesHome":true,"parentRating":0,"distanceInMiles":"1.7","gradeRanges":"8 to 12","institutionType":"Public","name":"Burnaby Mountain Secondary School","schoolUrl":"/bc/school/burnaby-mountain-secondary-school/237277","searchUrl":"/bc/school/burnaby-mountain-secondary-school/237277","id":237277,"fullAddress":"8800 Eastlake Dr, Burnaby, BC V3J 7X5","numReviews":0,"schoolReviews":[],"schoolGranularRatings":[],"elementary":false,"middle":false,"high":true,"lastUpdatedDate":"Sep 23, 2020","hasMultipleCatchmentAreas":false}],"totalSchoolsServiced":3,"sectionPreviewText":"No school information","shouldHideSection":false},"publicRecordsInfo":{"basicInfo":{"beds":2,"baths":2.5,"propertyTypeName":"Townhouse","yearBuilt":2004,"sqFtFinished":1044,"totalSqFt":1044,"apn":"026111012","propertyLastUpdatedDate":1617972347070,"displayTimeZone":"America/Vancouver"},"taxInfo":{},"allTaxInfo":[{"taxableLandValue":198000,"taxableImprovementValue":284000,"rollYear":2021},{"taxableLandValue":198000,"taxableImprovementValue":284000,"rollYear":2020},{"taxableLandValue":170000,"taxableImprovementValue":281000,"rollYear":2019}],"addressInfo":{"isFMLS":false,"street":"9284 University Cres","city":"Burnaby","state":"BC","zip":"V5A 4X9","countryCode":"CA"},"mortgageCalculatorInfo":{"displayLevel":1,"dataSourceId":256,"listingPrice":599900,"downPaymentPercentage":20.0,"monthlyHoaDues":443,"propertyTaxRate":0.36856142690448407,"homeInsuranceRate":0.54,"mortgageInsuranceRate":0.75,"creditScore":740,"loanType":4,"mortgageRateInfo":{"fifteenYearFixed":3.25,"fiveOneArm":3.6249999999999996,"thirtyYearFixed":3.875,"isFromBankrate":false,"twentyFiveYearAmortizationFiveYearTerm":4.0},"mortgageRatesPageLinkText":"View all rates","zipCode":"","dpaEligible":false,"dprLink":""},"countyName":"Greater Vancouver Regional District","countyIsActive":true,"sectionPreviewText":"County data refreshed on 04/09/2021"},"propertyHistoryInfo":{"isHistoryStillGrowing":false,"hasAdminContent":false,"hasLoginContent":true,"dataSourceId":256,"canSeeListing":true,"listingIsNull":false,"hasPropertyHistory":true,"showLogoInLists":false,"definitions":[],"displayTimeZone":"America/Vancouver","isAdminOnlyView":false,"events":[{"isEventAdminOnly":false,"price":599900,"isPriceAdminOnly":false,"eventDescription":"Listed","mlsDescription":"Active","source":"REBGV","sourceId":"R2506452","dataSourceDisplay":{"dataSourceId":256,"dataSourceDescription":"Real Estate Board of Greater Vancouver (REBGV)","dataSourceName":"REBGV","dataSourceImage":"rebgv_small.png","shouldShowLargerLogo":false},"priceDisplayLevel":1,"historyEventType":1,"eventDate":1601881200000},{"isEventAdminOnly":false,"isPriceAdminOnly":true,"eventDescription":"Listed","mlsDescription":"Active","source":"REBGV","sourceId":"R2450464","dataSourceDisplay":{"dataSourceId":256,"dataSourceDescription":"Real Estate Board of Greater Vancouver (REBGV)","dataSourceName":"REBGV","dataSourceImage":"rebgv_small.png","shouldShowLargerLogo":false},"priceDisplayLevel":5,"historyEventType":1,"eventDate":1586761200000},{"isEventAdminOnly":false,"price":399000,"isPriceAdminOnly":false,"eventDescription":"Listed","source":"REBGV","sourceId":"R2043961","dataSourceDisplay":{"dataSourceId":256,"dataSourceDescription":"Real Estate Board of Greater Vancouver (REBGV)","dataSourceName":"REBGV","dataSourceImage":"rebgv_small.png","shouldShowLargerLogo":false},"priceDisplayLevel":3,"historyEventType":1,"eventDate":1457510400000},{"isEventAdminOnly":false,"price":349900,"isPriceAdminOnly":false,"eventDescription":"Listed","source":"REBGV","sourceId":"V727377","dataSourceDisplay":{"dataSourceId":256,"dataSourceDescription":"Real Estate Board of Greater Vancouver (REBGV)","dataSourceName":"REBGV","dataSourceImage":"rebgv_small.png","shouldShowLargerLogo":false},"priceDisplayLevel":3,"historyEventType":1,"eventDate":1217919600000},{"isEventAdminOnly":false,"price":359900,"isPriceAdminOnly":false,"eventDescription":"Listed","source":"REBGV","sourceId":"V587633","dataSourceDisplay":{"dataSourceId":256,"dataSourceDescription":"Real Estate Board of Greater Vancouver (REBGV)","dataSourceName":"REBGV","dataSourceImage":"rebgv_small.png","shouldShowLargerLogo":false},"priceDisplayLevel":3,"historyEventType":1,"eventDate":1145602800000}],"mediaBrowserInfoBySourceId":{"R2043961":{"photos":[{"displayLevel":3,"dataSourceId":256,"height":667,"width":1000},{"displayLevel":3,"dataSourceId":256,"height":667,"width":1000},{"displayLevel":3,"dataSourceId":256,"height":959,"width":640},{"displayLevel":3,"dataSourceId":256,"height":667,"width":1000},{"displayLevel":3,"dataSourceId":256,"height":667,"width":1000},{"displayLevel":3,"dataSourceId":256,"height":667,"width":1000},{"displayLevel":3,"dataSourceId":256,"height":667,"width":1000},{"displayLevel":3,"dataSourceId":256,"height":583,"width":1000},{"displayLevel":3,"dataSourceId":256,"height":667,"width":1000},{"displayLevel":3,"dataSourceId":256,"height":667,"width":1000},{"displayLevel":3,"dataSourceId":256,"height":667,"width":1000},{"displayLevel":3,"dataSourceId":256,"height":667,"width":1000}],"scans":[],"isHot":false,"streetView":{"latLong":{"latitude":49.2786136,"longitude":-122.9035746},"streetViewUrl":"https://maps.googleapis.com/maps/api/streetview?channel\u003dmb-ldp-publicrecord\u0026location\u003d9284+University+Cres%2C+Burnaby%2C+BC+V5A+0A4\u0026size\u003d665x441\u0026source\u003doutdoor\u0026client\u003dgme-redfin\u0026signature\u003d4mXb3oWfHWs9XqoAQLBxuWImgZM\u003d","displayLevel":1,"dataSourceId":256,"streetViewAvailable":true},"altTextForImage":"9284 University Cres, Burnaby, BC V5A 4X9","assembledAddress":"9284 University Cres","previousListingPhotosCount":0,"displayType":1},"R2450464":{"photos":[],"scans":[{"scanUrl":"https://my.matterport.com/show/?m\u003dXcXZq3a3Q2t","externalVirtualHomeScanId":"XcXZq3a3Q2t","posterFrameUrl":"https://my.matterport.com/api/v2/player/models/XcXZq3a3Q2t/thumb","scanHost":0}],"isHot":false,"streetView":{"latLong":{"latitude":49.2786136,"longitude":-122.9035746},"streetViewUrl":"https://maps.googleapis.com/maps/api/streetview?channel\u003dmb-ldp-publicrecord\u0026location\u003d9284+University+Cres%2C+Burnaby%2C+BC+V5A+0A4\u0026size\u003d665x441\u0026source\u003doutdoor\u0026client\u003dgme-redfin\u0026signature\u003d4mXb3oWfHWs9XqoAQLBxuWImgZM\u003d","displayLevel":1,"dataSourceId":256,"streetViewAvailable":false},"assembledAddress":"MLS #: R2450464","previousListingPhotosCount":0,"displayType":2}},"addressInfo":{"isFMLS":false,"street":"9284 University Cres","city":"Burnaby","state":"BC","zip":"V5A 4X9","countryCode":"CA"},"isFMLS":false,"historyHasHiddenRows":true,"priceEstimates":{"displayLevel":1,"priceHomeUrl":"/what-is-my-home-worth?estPropertyId\u003d155239008\u0026src\u003dldp-estimates"},"sectionPreviewText":"No property history on this home"},"mlsDisclaimerInfo":{"showDisclaimerWithMlsInfo":true,"showDisclaimerInFooter":false,"listingBrokerName":"Jovi Realty Inc.","mlsDisclaimer":"\u003cimg src\u003d\"${IMAGE_SERVER}/images/logos/rebgv_large.png\"/\u003e\u003cp\u003eThis representation is based in whole or in part on data generated by the Chilliwack \u0026 District Real Estate Board, Fraser Valley Real Estate Board or Real Estate Board of Greater Vancouver which assumes no responsibility for its accuracy. Listing information displayed on the MLS® VOW is deemed reliable but is not guaranteed accurate by the Board.\u003c/p\u003e","mlsDislcaimerPlainText":"This representation is based in whole or in part on data generated by the Chilliwack \u0026 District Real Estate Board, Fraser Valley Real Estate Board or Real Estate Board of Greater Vancouver which assumes no responsibility for its accuracy. Listing information displayed on the MLS® VOW is deemed reliable but is not guaranteed accurate by the Board.","lastUpdatedString":"Apr 13, 2021 12:22 AM","logoImageFileName":"rebgv_small.png","listingBrokerNumber":"604-202-2929","listingAgentName":"Valerie Dudchenko","listingAgentNumber":"778-892-4462"}}}

module.exports = {
    propertyTypes,
    regions,
    getHomes,
    getCommute,
    getTourInsights
};