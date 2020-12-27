const countrySelector = document.querySelector('form')
const countryOutput = document.querySelector('.country')
const autocompleteOutput = document.querySelector('.autocomplete')
const baseURL = 'https://restcountries.eu/rest/v2/'

;(async () => {
	const location = 'all/'
	const query = '?fields=name;population'
	const response = await fetch(baseURL + location + query)
	const countries = await response.json()
	countries.sort((a, b) => b.population - a.population)

	let selectedCountryPosition = 0
	let positions = 0

	const showAutocomplete = (e) => {
		autocompleteOutput.removeAttribute('data-hidden')
		countryOutput.setAttribute('data-hidden', '')
		const countryName = countrySelector.country.value.trim().toLowerCase()
		const autocompletedCountries = countries
			.filter((country) => country.name.toLowerCase().includes(countryName))
			.sort((a, b) => a.name.toLowerCase().indexOf(countryName) - b.name.toLowerCase().indexOf(countryName))
			.slice(0, 10)
		positions = autocompletedCountries.length
		const countriesFragment = document.createDocumentFragment()
		autocompletedCountries.forEach((country) => {
			const article = document.createElement('article')
			article.textContent = country.name
			countriesFragment.appendChild(article)
		})
		autocompleteOutput.innerHTML = ''
		autocompleteOutput.appendChild(countriesFragment)
		autocompleteOutput.children[selectedCountryPosition].setAttribute('data-selected', '')
	}

	countrySelector.country.addEventListener('focus', showAutocomplete)
	countrySelector.country.addEventListener('keyup', showAutocomplete)

	countrySelector.country.addEventListener('keydown', (e) => {
		if (e.keyCode !== 40 && e.keyCode !== 38) return
		e.preventDefault()
		if (e.keyCode === 40 && selectedCountryPosition < positions - 1) selectedCountryPosition++
		if (e.keyCode === 38 && selectedCountryPosition > 0) selectedCountryPosition--
		showAutocomplete()
	})

	countrySelector.country.addEventListener('blur', async (e) => {
		autocompleteOutput.setAttribute('data-hidden', '')
		countryOutput.removeAttribute('data-hidden')
	})

	const getCountryData = async (countryName) => {
		const location = `name/${countryName}`
		const query = '?fullText=true'
		const response = await fetch(baseURL + location + query)
		const data = await response.json()
		return data[0]
	}

	countrySelector.addEventListener('submit', async (e) => {
		e.preventDefault()
		countrySelector.reset()
		countrySelector.country.blur()
		const countryData = await getCountryData(autocompleteOutput.children[selectedCountryPosition].textContent)
		countryOutput.innerHTML = `
		<h2>${countryData.name}</h2>`
	})
})()
