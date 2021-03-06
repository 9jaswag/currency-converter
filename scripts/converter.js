// user requirejs to export the converter class
define(function () {
  return Converter;
})

const currenciesURL = "https://free.currencyconverterapi.com/api/v5/currencies";
const fromSelect = document.querySelector('#from-currency');
const toSelect = document.querySelector('#to-currency');
const currency = document.querySelector('#currency');
const convertedCurrencyField = document.querySelector('#converted-currency');
const convertButton = document.querySelector('#convert-button');
const errorAlert = document.querySelector('.alert');
const closeButton = document.querySelector('.close-alert');
const swapButton = document.querySelector('.fa-sync');
const ctx = document.getElementById("myChart").getContext('2d')


// function to create the currency converter database
const openDb = () => {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return idb.open('currencyConverter', 1, function (upgradeDb) {
    upgradeDb.createObjectStore('exchangeRates');
  });
};

// event listener for closing alert
closeButton.onclick = (event) => {
  event.stopPropagation();
  const alertDiv = event.target.closest("div.alert");
  alertDiv.classList.add('d-none')
};

// event listener for swapping selected currencies
swapButton.onclick = () => {
  if (fromSelect.value === "" || toSelect.value === "") {
    Converter.displayOfflineMessage("No currency selected")
    return;
  }
  const fromValue = fromSelect.value;
  const toValue = toSelect.value;
  fromSelect.value = toValue;
  toSelect.value = fromValue;
};

// function for formatting date
const formatDate = (date) => {
  return date.toLocaleDateString('en-GB').split('/').reverse().join('-');
}

// function to get date range
const getDateRange = () => {
  let date = new Date();
  date.setDate(date.getDate() - 5)
  const today = formatDate(new Date(Date.now()));
  const fiveDaysAgo = formatDate(date)

  return [fiveDaysAgo, today]
}

class Converter {
  constructor(chart) {
    this.dbPromise = openDb();
    this.handleClick();
    this.chart = chart;
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
        if (response.status != 200) {
          return false;
        }
        return response.json();
      })
      .then(response => response)
      .catch(error => console.warn(error));
  }

  async populateSelectFields() {
    const { results } = await this.getRequest(currenciesURL) || { results: false };
    if (!results) {
      // display offline alert
      Converter.displayOfflineMessage();
      return;
    }

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
    if (fromSelect.value === "" || toSelect.value === "" || currency.value === "") {
      Converter.displayOfflineMessage("Please fill all fields correctly")
      return false;
    }

    if (currency.value.length === 0 || isNaN(currency.value)) {
      return false;
    }

    return true;
  }

  converter(exchangeRate, currencies, date) {
    const currentExchangeRate = exchangeRate[currencies][date]
    this.renderChart(exchangeRate, currencies);
    return currency.value * currentExchangeRate;
  }

  async getExchangeRate(url, currencies) {
    // get the exchange rate from the currency API
    let networkFetch = await this.getRequest(url);
    // check the indexDB to see if the requested exchange rate also exists
    return this.getDbValue(currencies).then(response => {
      // if user is offline and the exchange rate is not in the iDB
      if (!response && !networkFetch) {
        return false;
      }

      // if the exchange rate exists in the iDB and there's new data
      if (response && networkFetch !== undefined) {
        // delete the response from the iDB
        this.deleteDbValue(currencies);
      }

      // if there's new data, add it to the iDB
      if (networkFetch !== undefined) {
        // add the new exchange rate to the iDB
        this.setDbValue(currencies, networkFetch);
      }

      // return the response if it exists in the indexDB or the network response if it doesn't exist
      return response || networkFetch;
    })
  }

  handleClick() {
    convertButton.onclick = async () => {
      if (this.validateFields()) {
        convertedCurrencyField.value = "converting..."
        const currencies = `${fromSelect.value}_${toSelect.value}`;
        const dateRange = getDateRange();
        const conversionURL = `https://free.currencyconverterapi.com/api/v5/convert?q=${currencies}&compact=ultra&date=${dateRange[0]}&endDate=${dateRange[1]}`;
        let exchangeRate = await this.getExchangeRate(conversionURL, currencies);
        if (!exchangeRate) {
          // display offline alert
          Converter.displayOfflineMessage();
          convertedCurrencyField.value = "";
          return;
        }
        const convertedCurrency = this.converter(exchangeRate, currencies, dateRange[1])
        const currencySymbol = toSelect.selectedOptions[0].dataset.symbol
        convertedCurrencyField.value = `${currencySymbol} ${convertedCurrency.toFixed(2)}`;
      };
    }
  }

  renderChart(exchangeRates, currency) {
    const labels = Object.keys(exchangeRates[currency]);
    const dataset = Object.values(exchangeRates[currency]);
    const [currency1, currency2] = currency.split('_');

    const myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: currency,
          data: dataset,
          borderColor: '#3e95cd',
          borderWidth: 2,
          fill: false
        }]
      },
      options: {
        title: {
          display: true,
          text: `Changes of the ${currency1} against the ${currency2} in the past five days`
        },
        legend: {
          labels: {
            fontFamily: "'Muli', sans-serif"
          }
        }
      }
    });
  }

  static displayOfflineMessage(
    message = "<strong>Holy guacamole!</strong> I swear it's not my fault. You're offline!"
  ) {
    errorAlert.firstElementChild.innerHTML = message;
    errorAlert.classList.remove('d-none');
  }
}
