const form = document.forms.my
const queryOptions = {active: true, url: "http://pcserv.vympel/*"}

const dellNewsField = form.elements.dellNews,
	changeField = form.elements.change,
	styleField = form.elements.style,
	workTimerField = form.elements.workTimer,
	mainUserField = form.elements.mainUser,
	archiveField = form.elements.archive,
	toHide = ['btns', 'styled', 'colorized', 'enabled']

function parseTimeToMinutes(timeStr) {
	if (!timeStr || typeof timeStr !== 'string') return null;
	const parts = timeStr.split(':').map(Number);
	if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
	return parts[0] * 60 + parts[1];
}

chrome.storage.local.get(['user', 'user_input', 'formFields'], ({user, user_input, formFields})=>{
	const name = user?.fio.split(' ')[1] || 'Незнакомец'
	if (!user) mainUserField.elements.isAdmin.disabled = true

	const userNameEl = document.querySelector('.user-name')
	if (userNameEl) {
		userNameEl.textContent = name;
		
		if (user_input && formFields?.workTimerField) {
			const startDay = formFields.workTimerField.startDay || '07:00';
			const startMin = parseTimeToMinutes(startDay);
			const loginMin = parseTimeToMinutes(user_input);
			if (startMin !== null && loginMin !== null && loginMin > startMin) {
				const latenessMin = loginMin - startMin;
				const formatLateness = (min) => {
					const h = Math.floor(min / 60);
					const m = min % 60;
					return h > 0 ? `${h}ч ${m}м` : `${m}м`;
				};
				const span = document.createElement('span');
				span.style.color = '#ff4a4a';
				span.style.fontWeight = 'bold';
				span.style.marginLeft = '6px';
				span.style.fontSize = '12px';
				span.textContent = `(+${formatLateness(latenessMin)})`;
				userNameEl.appendChild(span);
			}
		}
	}
})





//-----------------------------------------------------------------------------------

chrome.storage.local.get('oldLinks', ({oldLinks = []})=>{
	oldLinks.forEach(link=>{
		const l = document.createElement('label');
		l.textContent = " " + link.name;
		
		const input = document.createElement('input');
		input.type = "checkbox";
		input.value = link.id;
		input.name = 'btnName';

		l.prepend(input);

		oldBtns.append(l)
	})
})

function getFormElementsArray(name) {
	const elements = form.elements[name]
	if (!elements) return []
	if (elements instanceof Element) return [elements]
	if (typeof elements.length === 'number' && !(elements instanceof Element)) {
		return Array.from(elements)
	}
	return [elements]
}

function check() {
	let checked = []
	const newsList = getFormElementsArray('newsList')
	for (const el of newsList) {
		if (el.checked){
			checked.push(el)
		}
	}

	if (form.all) {
		form.all.checked = (newsList.length > 0 && checked.length === newsList.length)
	}
}



//services

function colorLuminance(hex, lum){
	hex = String(hex).replace(/[^0-9a-f]/gi, '')

	if (hex.length < 6) {hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]}

	lum = lum || 0

	let rgb = '#'

	for (let i = 0; i < 3; i++) {
		let c = parseInt(hex.substr(i*2,2), 16)
		c = Math.round(Math.min(Math.max(0, c + (c*lum)), 255)).toString(16)
		rgb += ("00"+c).substr(c.length)
	}

	return rgb
}

function setEndDayF(endDay){

	const o = 75*60*1000

	const t = endDay.split(':')

	const end = new Date().setHours(...t)

	const endF = new Date(end - o)


	function addZero(i) {
		if(i<10) {
			i= "0" + i
		}
		return i
	}

	const n = [addZero(endF.getHours()),addZero(endF.getMinutes())]

	return n.join(':')
}

form.elements.endDay.addEventListener('input', (e)=>{
	form.elements.endDayF.value = setEndDayF(e.target.value)
})

function setVisibility(elem) {
	const h=()=>{
		form.querySelector(`.${elem}_collapse`).hidden = !(form.elements[elem].value === 'true')
		if((form.elements[elem].value === 'true')){
			form.querySelector(`.${elem}_collapse`).style.animation = 'in 1s forwards'
		}
	}

	h()

	form.elements[elem].addEventListener('change', ()=>{
		if(!(form.elements[elem].value === 'true')){
			form.querySelector(`.${elem}_collapse`).style.animation = 'out 1s forwards'
			setTimeout(h, 1000)
		} else {
			h()
		}
	})
}

function updateTimerCollapse() {
	const show = form.elements.timer.value === 'true' || form.elements.headerEnabled.value === 'true';
	const collapse = form.querySelector('.timer_collapse');
	if (collapse) {
		collapse.hidden = !show;
		if (show) {
			collapse.style.animation = 'in 1s forwards';
		}
	}
}

form.elements.timer.addEventListener('change', updateTimerCollapse);
form.elements.headerEnabled.addEventListener('change', updateTimerCollapse);


function saveFieldData(field) {
	const elem = field.elements
	const res = {}

	for (const el of elem) {

		switch (el.localName) {
			case 'select':
				res[el.id]=el.value
				break
			case 'input':
				if (el.id === 'all') {break}
				if (el.type === 'checkbox') {
					if (!res[el.name]) res[el.name] = []
					if (el.checked) {
						res[el.name].push(el.value)
					}
				} else if (el.type === 'time') {
					if (!res[el.name]) res[el.name] = []
					res[el.name].push(el.value)
				} else if (el.type === 'color') {
					if (!res.colorTheme) res.colorTheme = {}
					res.colorTheme[el.name] = el.value
				}
				break
			case 'button':
				break
			default:
				console.error('Что-то пошло не так, попробуй еще раз')
				break
		}
	}

	removeArray(res)

	return res
}

function removeArray(obj){
	for(const key in obj) {
		if(Array.isArray(obj[key])) {
			if(obj[key].length === 1){
				obj[key]=obj[key].toString()
			}
		} 
	}
}


function restoreSettings() {
	chrome.storage.local.get('formFields', function({formFields}) {

		if (!formFields) {
			formFields = {
				changeField: {
					btns: 'false',
				},
				dellNewsField: {
					news: 'false'
				},
				styleField: {
					styled: 'false',
					colorized: "false"
				},
				workTimerField: {
					timer: 'false',
					headerEnabled: 'false'
				},
				mainUserField: {
					isAdmin: 'false'
				},
				archiveField: {
					enabled: 'true',
					saveTabs: 'true',
					syncDocName: 'true',
					projectFilter: 'true'
				}
			}

			chrome.storage.local.set({formFields}, function(){})
		}

		for (const field in formFields) {
			for (const name in formFields[field]) {
				if(name === 'colorTheme'){
					for (const subName in formFields[field][name]) {
						form.elements[subName].value = formFields[field][name][subName]
					}
				}
				const elements = getFormElementsArray(name)
				if (elements.length === 0) continue

				const firstEl = elements[0]
				
				if (elements.length === 1 && firstEl.localName === 'select') {
					firstEl.value = formFields[field][name]
				} else if (elements.length === 1 && firstEl.localName === 'input' && firstEl.type !== 'checkbox') {
					firstEl.value = formFields[field][name]
				} else {
					elements.forEach(el => {
						const storedValues = Array.isArray(formFields[field][name]) 
							? formFields[field][name] 
							: [formFields[field][name]];
						if (storedValues.includes(el.value)) {
							el.checked = true
						} else {
							el.checked = false
						}
					})
				}
			}
		}

		for (const hideElem of toHide) {
			setVisibility(hideElem)
		}

		updateTimerCollapse()

		check()
	})
}

const reloadActiveTab = () => {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){ 
		if(tabs[0] && (tabs[0].url.includes("pcserv.vympel") || tabs[0].url.includes("r-and-l.ru") || tabs[0].url.includes("archive.vympel"))) {
			chrome.tabs.reload(tabs[0].id)
		}
	})
}

form.save.addEventListener('click', (e)=>{
	e.preventDefault()

	chrome.storage.local.get(['formFields'], ({formFields: oldFormFields}) => {
		const formFields = {}
		form.querySelectorAll('fieldset').forEach(fs => {
			formFields[fs.id + 'Field'] = saveFieldData(fs)
		})

		// Keep all dismissed news IDs that were already in storage
		formFields.dellNewsField.newsList = oldFormFields?.dellNewsField?.newsList || [];

		chrome.storage.local.set({formFields}, reloadActiveTab)
	});
})

form.restore.addEventListener('click', (e)=>{
	e.preventDefault()
	const defaultFields = {
		changeField: {
			btns: 'false',
		},
		dellNewsField: {
			news: 'false'
		},
		styleField: {
			styled: 'false',
			colorized: "false"
		},
		workTimerField: {
			timer: 'false',
			headerEnabled: 'false'
		},
		mainUserField: {
			isAdmin: 'false'
		},
		archiveField: {
			enabled: 'true',
			saveTabs: 'true',
			syncDocName: 'true',
			projectFilter: 'true'
		}
	}
	chrome.storage.local.set({formFields: defaultFields}, () => {
		chrome.storage.local.remove(['newsId'], reloadActiveTab)
	})
})

form.mainColor.addEventListener('input', (el)=>{
	form.mainColorHover.value = colorLuminance((el.target.value), 0.75)
})

// Tab switching logic
const btnGeneral = document.getElementById('tab-btn-general')
const btnArchive = document.getElementById('tab-btn-archive')
const contentGeneral = document.getElementById('tab-content-general')
const contentArchive = document.getElementById('tab-content-archive')

btnGeneral.addEventListener('click', () => {
	btnGeneral.classList.add('active')
	btnGeneral.setAttribute('aria-selected', 'true')
	btnArchive.classList.remove('active')
	btnArchive.setAttribute('aria-selected', 'false')
	contentGeneral.classList.remove('hidden')
	contentArchive.classList.add('hidden')
})

btnArchive.addEventListener('click', () => {
	btnArchive.classList.add('active')
	btnArchive.setAttribute('aria-selected', 'true')
	btnGeneral.classList.remove('active')
	btnGeneral.setAttribute('aria-selected', 'false')
	contentArchive.classList.remove('hidden')
	contentGeneral.classList.add('hidden')
})

// Clear archive hashes logic
const clearHashesBtn = document.getElementById('clearHashes')
clearHashesBtn.addEventListener('click', () => {
	chrome.storage.local.remove('archiveHashes', () => {
		const originalText = clearHashesBtn.textContent
		clearHashesBtn.textContent = '✅ Очищено!'
		clearHashesBtn.disabled = true
		setTimeout(() => {
			clearHashesBtn.textContent = originalText
			clearHashesBtn.disabled = false
		}, 1500)
	})
})
document.addEventListener('DOMContentLoaded', restoreSettings)