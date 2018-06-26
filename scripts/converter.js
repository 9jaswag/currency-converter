const currenciesURL = "https://free.currencyconverterapi.com/api/v5/currencies";
const fromSelect = document.querySelector('#from-currency');
const toSelect = document.querySelector('#to-currency');
const currency = document.querySelector('#currency');
const convertedCurrencyField = document.querySelector('#converted-currency');
const convertButton = document.querySelector('#convert-button');

// function for making GET requests 
const getRequest = (url) => {
  return fetch(url)
    .then(response => {
      if (response.status != 200) {
        return
      }
      return response.json();
    })
    .then(response => response);
};

// function for populating the select fields on the page with the currencies
const populateSelectFields = async () => {
  const { results } = await getRequest(currenciesURL);
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

// function for confirming if all required fields are filled
const validateFields = () => {
  if (fromSelect.value === "Select a currency" || toSelect.value === "Select a currency") {
    return false;
  }

  if (currency.value.length === 0 || isNaN(currency.value)) {
    return false;
  }

  return true;
}

// function for calculating currency conversion
const converter = (exchangeRate) => currency.value * exchangeRate;

// add click event listener to the convert button
convertButton.onclick = async () => {
  if (validateFields()) {
    // disable currency field while getting exchange rate
    currency.disabled = true
    const currencies = `${fromSelect.value}_${toSelect.value}`
    const conversionURL = `https://free.currencyconverterapi.com/api/v5/convert?q=${currencies}&compact=ultra`;
    let exchangeRate = await getRequest(conversionURL);
    convertedCurrency = converter(exchangeRate[currencies])
    const currencySymbol = toSelect.selectedOptions[0].dataset.symbol
    convertedCurrencyField.value = `${currencySymbol} ${convertedCurrency.toFixed(2)}`
  };
}



window.onload = populateSelectFields;
