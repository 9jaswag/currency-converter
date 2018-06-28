define(function () {
  return Converter;
})

const currenciesURL = "https://free.currencyconverterapi.com/api/v5/currencies";
const fromSelect = document.querySelector('#from-currency');
const toSelect = document.querySelector('#to-currency');
const currency = document.querySelector('#currency');
const convertedCurrencyField = document.querySelector('#converted-currency');
const convertButton = document.querySelector('#convert-button');

const openDb = () => {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return idb.open('currencyConverter', 1, function (upgradeDb) {
    upgradeDb.createObjectStore('exchangeRates');
  });
};

class Converter {
  constructor() {
    this.populateSelectFields();
    this.dbPromise = openDb();
    this.handleClick();
  }

  setDbValue(key, val) {
    return this.dbPromise.then(db => {
      const tx = db.transaction('exchangeRates', 'readwrite');
      tx.objectStore('exchangeRates').put(val, key);
      return tx.complete;
    });
  }

  getDbValue(key) {
    return this.dbPromise.then(db => {
      return db.transaction('exchangeRates')
        .objectStore('exchangeRates').get(key);
    });
  }

  deleteDbValue(key) {
    return this.dbPromise.then(db => {
      const tx = db.transaction('exchangeRates', 'readwrite');
      tx.objectStore('exchangeRates').delete(key);
      return tx.complete;
    });
  }

  getRequest(url) {
    return fetch(url)
      .then(response => {
        if (response.status != 200) { // handle errors later
          return false;
        }
        return response.json();
      })
      .then(response => response);
  }

  async populateSelectFields() {
    console.log('populating')
    const { results } = await this.getRequest(currenciesURL);

    for (let country in results) {
      let option = document.createElement("option");
      let option2 = document.createElement("option");
      option.value = results[country].id;
      // set the currency symbol based on whether it exists or not
      const symbol = results[country].currencySymbol ? results[country].currencySymbol : results[country].id;
      // set the currency symbol as a data attribute
      option.setAttribute('data-symbol', symbol)
      option2.setAttribute('data-symbol', symbol)
      option2.value = results[country].id;
      option.innerHTML = `${results[country].currencyName} (${results[country].id})`;
      option2.innerHTML = `${results[country].currencyName} (${results[country].id})`;
      fromSelect.appendChild(option)
      toSelect.appendChild(option2)
    }
  }

  validateFields() {
    if (fromSelect.value === "Select a currency" || toSelect.value === "Select a currency") {
      return false;
    }

    if (currency.value.length === 0 || isNaN(currency.value)) {
      return false;
    }

    return true;
  }

  converter(exchangeRate) {
    return currency.value * exchangeRate;
  }

  async getExchangeRate(url, currencies) {
    // get the exchange rate from the currency API
    let networkFetch = await this.getRequest(url);
    // let networkFetch = { "USD_NGN": 359.999799 };
    console.log(networkFetch)
    // check the indexDB to see if the exchange also exists
    return this.getDbValue(1.351085).then(response => {
      // if the exchange rate exists, replace it with the latest one from the API call before sending it to the user
      if (response) {
        console.log(response)
        // delete the response from the iDB
        this.deleteDbValue(1.351085);
      }
      // add the new exchange rate to the iDB
      this.setDbValue(currencies, networkFetch)

      // return the response if it exists in thr indexDB or the network response if it doesn't exist
      return response || networkFetch;
    })
  }

  handleClick() {
    convertButton.onclick = async () => {
      if (this.validateFields()) {
        const currencies = `${fromSelect.value}_${toSelect.value}`;
        const conversionURL = `https://free.currencyconverterapi.com/api/v5/convert?q=${currencies}&compact=ultra`;
        let exchangeRate = await this.getExchangeRate(conversionURL, currencies);
        const convertedCurrency = this.converter(exchangeRate[currencies])
        const currencySymbol = toSelect.selectedOptions[0].dataset.symbol
        // NAN check
        convertedCurrencyField.value = `${currencySymbol} ${convertedCurrency.toFixed(2)}`;
      };
    }
  }
}
