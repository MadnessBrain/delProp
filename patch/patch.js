const currentScript = document.currentScript;
const isAdmin = currentScript ? Number(currentScript.dataset.isAdmin) : 0;

const setUserDiv = async ()=>{
	if(typeof USER_DATA !== 'undefined' && !!USER_DATA.fio){
		USER_DATA.is_manager = isAdmin;
		const div = document.createElement("div")
		div.id = 'user'
		div.textContent = USER_DATA.fio
		div.hidden = true
		div.dataset.input = await getActivity(USER_DATA.user_id)
		div.dataset.user = JSON.stringify(USER_DATA)
		document.body.append(div)	
	} else {
		setTimeout(setUserDiv,100)
	}
}

async function getActivity(id) {
	const now = new Date();
	const month = now.getMonth() + 1;
	const year = now.getFullYear();

	const response = await fetch(`http://pcserv.vympel/get_activity2.php?from=01.${month}.${year}&to=01.${month+1}.${year}&user_id=${id}`);
	const data = await response.json();
	return findLast(data, now.toLocaleDateString());
}

function findLast(data, date){
	return data.rows.find(row => row.data.includes(date)).data.at(2);
}

setUserDiv()