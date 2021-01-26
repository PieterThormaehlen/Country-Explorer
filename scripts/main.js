const countrySelector = document.querySelector('form')
const countryOutput = document.querySelector('main')
const autocompleteOutput = document.querySelector('.autocomplete')
const baseURL = 'https://restcountries.eu/rest/v2/'

;(async () => {
	const location = 'all/'
	const query = '?fields=name;population;flag'
	const response = await fetch(baseURL + location + query)
	const countries = await response.json()
	countries.sort((a, b) => b.population - a.population)

	let selectedCountryPosition = 0
	let positions = 0

	const showAutocomplete = (e) => {
		autocompleteOutput.removeAttribute('data-hidden')
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
			article.setAttribute('role', 'button')
			const flag = document.createElement('img')
			flag.src = country.flag
			article.appendChild(flag)
			countriesFragment.appendChild(article)
		})
		autocompleteOutput.innerHTML = ''
		autocompleteOutput.appendChild(countriesFragment)
		autocompleteOutput.children[selectedCountryPosition].setAttribute('data-selected', '')
	}

	countrySelector.country.addEventListener('focus', showAutocomplete)
	countrySelector.country.addEventListener('keyup', showAutocomplete)
	countrySelector.country.focus()

	countrySelector.country.addEventListener('keydown', (e) => {
		if (e.keyCode === 13) return
		if (e.keyCode !== 40 && e.keyCode !== 38) {
			selectedCountryPosition = 0
			return
		}
		e.preventDefault()
		if (e.keyCode === 40 && selectedCountryPosition < positions - 1) selectedCountryPosition++
		if (e.keyCode === 38 && selectedCountryPosition > 0) selectedCountryPosition--
		showAutocomplete()
	})

	const getCountryData = async (countryName) => {
		const location = `name/${countryName}`
		const query = '?fullText=true'
		const response = await fetch(baseURL + location + query)
		const data = await response.json()
		return data[0]
	}

	// from https://stackoverflow.com/a/40724354
	const abbreviateNumber = (number) => {
		const SI_SYMBOL = ['', 'k', 'M']
		// what tier?
		const tier = Math.min(Math.log10(number) / 3, 2) | 0
		// if zero, we don't need a suffix
		if (tier == 0) return number
		// determine scale
		const scale = Math.pow(10, tier * 3)
		// scale the number
		const scaled = number / scale
		// format number and add suffix
		return scaled.toFixed(1) + SI_SYMBOL[tier]
	}

	const getNeighbors = async (codes) => {
		const location = `alpha`
		const query = `?codes=${codes.join(';')}&fields=name;flag`
		const response = await fetch(baseURL + location + query)
		const data = await response.json()
		return data
	}

	const dataArticle = (label, data) => {
		if (!Array.isArray(data)) data = [data]
		const newArticle = document.querySelector('#dataArticle').content.cloneNode(true)
		newArticle.querySelector('.label').textContent = label
		data.forEach((d) => {
			const span = document.createElement('span')
			span.textContent = d
			newArticle.querySelector('div').appendChild(span)
		})
		return newArticle
	}

	const showCountry = async (e, countryName) => {
		countrySelector.reset()
		countrySelector.country.blur()
		autocompleteOutput.setAttribute('data-hidden', '')
		const countryData = await getCountryData(countryName)

		const countryMapScale = Math.sqrt(countryData.area) / 275 + 2

		const contentFragment = document.querySelector('#countryTemplate').content.cloneNode(true)
		const overview = contentFragment.querySelector('.overview')
		const region = contentFragment.querySelector('.region')
		const neighbors = contentFragment.querySelector('.neighbors')
		const blocs = contentFragment.querySelector('.blocs')
		contentFragment.querySelector('h1').innerHTML = `<span>${countryData.name}</span> (${countryData.nativeName})`
		if (countryData.region) overview.appendChild(dataArticle('Region:', countryData.region))
		if (countryData.capital) overview.appendChild(dataArticle('Capital:', countryData.capital))
		if (countryData.area) overview.appendChild(dataArticle('Area:', `${abbreviateNumber(countryData.area)} km²`))
		overview.appendChild(dataArticle('Population:', abbreviateNumber(countryData.population)))
		{
			const label = countryData.languages.length > 1 ? `Languages:` : `Language:`
			const data = countryData.languages.map((language) => language.name)
			overview.appendChild(dataArticle(label, data))
		}
		{
			const label = countryData.currencies.length > 1 ? `Currencies:` : `Currency:`
			const data = countryData.currencies.map((currency) => `${currency.code} (${currency.symbol})`)
			overview.appendChild(dataArticle(label, data))
		}
		contentFragment.querySelector('.flag').src = countryData.flag
		if (countryData.latlng.length) {
			region.querySelector('.subtitle').textContent = countryData.subregion
			region.querySelector('.countryLocation').src = `https://www.openstreetmap.org/export/embed.html?bbox=${countryData.latlng[1] - countryMapScale}%2C${countryData.latlng[0] - countryMapScale}%2C${countryData.latlng[1] + countryMapScale}%2C${countryData.latlng[0] + countryMapScale}&layer=mapnik&marker=${countryData.latlng[0]}%2C${countryData.latlng[1]}`
			region.appendChild(dataArticle('Latitude:', countryData.latlng[0]))
			region.appendChild(dataArticle('Longitude:', countryData.latlng[1]))
		} else {
			region.remove()
		}
		if (countryData.borders.length) {
			const neighborsData = await getNeighbors(countryData.borders)
			neighborsData.forEach((neighbor) => {
				const article = document.createElement('article')
				article.textContent = neighbor.name
				const flag = document.createElement('img')
				flag.src = neighbor.flag
				article.appendChild(flag)
				neighbors.appendChild(article)
			})
		} else {
			neighbors.remove()
		}
		if (countryData.regionalBlocs.length) {
			countryData.regionalBlocs.forEach((bloc) => {
				const span = document.createElement('span')
				span.textContent = bloc.name
				blocs.appendChild(span)
			})
		} else {
			blocs.remove()
		}

		countryOutput.innerHTML = ''
		countryOutput.appendChild(contentFragment)
		console.log(countryData)
	}

	autocompleteOutput.addEventListener('mousedown', (e) => e.preventDefault())
	autocompleteOutput.addEventListener('click', (e) => {
		if (!e.target.closest('article')) return
		showCountry(e, e.target.closest('article').textContent)
	})

	countrySelector.country.addEventListener('blur', (e) => {
		selectedCountryPosition = 0
		autocompleteOutput.setAttribute('data-hidden', '')
	})

	countrySelector.addEventListener('submit', (e) => {
		e.preventDefault()
		showCountry(e, autocompleteOutput.children[selectedCountryPosition].textContent)
	})
})()
