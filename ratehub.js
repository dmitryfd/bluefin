const axios = require('axios').default;

const _getMortgagesApi = 'https://www.ratehub.ca/api/v1/mortgages/all/purchase-rates';

async function getMortgages(params = null) {
  const defaultParams = {
      'amortization': '25',
      'city': 'Vancouver',
      'downPaymentPercent': '0.2',
      'homePrice': '750000',
      'isCashBack': '0',
      'isOpen': '0',
      'isOwnerOccupied': '1',
      'isPreApproval': '0',
      'province': 'BC',
      'term': '60',
      'type': 'fixed'
  };

  const urlParams = { ...defaultParams, ...params };
  const urlParamsStr = new URLSearchParams(urlParams).toString();
  const url = `${_getMortgagesApi}?${urlParamsStr}`;

  try {
      const res = await axios(url, { method: 'get' });
      
      if (res.data && res.data.data && res.data.data.rates) {
          var items = res.data.data.rates.map(x => ({ 
            value: x.value, 
            valueP: x.value - res.data.data.primeRate,  
            hold: x.rateHold, 
            provider: x.provider
          }));

          items.sort((a, b) => a.value > b.value ? 1 : -1);
          return items;
      }
  }
  catch (err) {
      console.error(err);
  }

  return null;
}

module.exports = {
  getMortgages
};