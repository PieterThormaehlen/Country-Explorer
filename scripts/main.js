const countrySelector = document.querySelector('form')
const countryOutput = document.querySelector('.country')
const baseURL = 'https://restcountries.eu/rest/v2/'

const getCountryData = async (countryName) => {
	const location = `name/${countryName}`
	const query = '?fullText=true'
	const response = await fetch(baseURL + location + query)
	const data = await response.json()
	return data[0]
}

countrySelector.addEventListener('submit', async (e) => {
	e.preventDefault()
	const countryName = countrySelector.country.value.trim()
	countrySelector.reset()
	const countryData = await getCountryData(countryName)
	countryOutput.innerHTML = `
		<h2>${countryData.name}</h2>`
})
