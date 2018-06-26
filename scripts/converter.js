const currenciesURL = "https://free.currencyconverterapi.com/api/v5/currencies";
const fromSelect = document.querySelector('#from-currency');
const toSelect = document.querySelector('#to-currency');

const getCurrencies = () => {
  return fetch(currenciesURL)
    .then(response => {
      if (response.status != 200) {
        return
      }
      return response.json();
    })
    .then(response => response.results);
};

const populateSelectFields = async () => {
  let currencies = await getCurrencies();
  for (let country in currencies) {
    let option = document.createElement("option");
    let option2 = document.createElement("option");
    option.value = currencies[country].id;
    option2.value = currencies[country].id;
    option.innerHTML = `${currencies[country].currencyName} (${currencies[country].id})`;
    option2.innerHTML = `${currencies[country].currencyName} (${currencies[country].id})`;
    fromSelect.appendChild(option)
    toSelect.appendChild(option2)
  }
}



window.onload = populateSelectFields;
