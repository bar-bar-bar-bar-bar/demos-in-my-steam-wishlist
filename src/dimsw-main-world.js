const sleep = (ms) => {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDynamicallyDefinedArray(varName) {
	var attempt = 0;

	while (window[varName].length == 0) {
		console.log(`still undefined`);
		await sleep(100);
		++attempt;
		if (attempt == 20) {
			console.error(`20 times and still undefined`);
			return null;
		}
	}
	return window[varName];
}

async function updategG_rgAppInfo() {
    var appToDemoMap = await chrome.storage.local.get("dimswCache");
	Object.keys(g_rgAppInfo).forEach((appId) => {
		g_rgAppInfo[appId].demoPlatforms = appToDemoMap.includes(appId) ? appToDemoMap[appId].demo_platforms : null;
	})
    console.log("finshed updategG_rgAppInfo");
}

async function main() {
    console.log("global");
    await getDynamicallyDefinedArray("g_rgAppInfo");
        // .then(updategG_rgAppInfo);
    const cat = localStorage.getItem("myCat");
    console.log(cat);
}

main();
/* 

https://stackoverflow.com/questions/9915311/chrome-extension-code-vs-content-scripts-vs-injected-scripts 

*/
// async function updateSearch() {
//     await chrome.scripting
//         .executeScript({
//             target: { tabId: getTabId() },
//             func: updategG_rgAppInfo,
//             world: 'MAIN'
//         })
//         .then(() => console.log("injected a function"));
// }

// console.log("background");
// // updateSearch();

// async function getPageVar(name, tabId) {
//     const [{ result }] = await chrome.scripting.executeScript({
//         func: name => window[name],
//         args: [name],
//         target: {
//             tabId: tabId ??
//                 (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id
//         },
//         world: 'MAIN',
//     });
//     return result;
// }


// (async () => {
//     const v = await getPageVar('g_rgAppInfo');
//     console.log(v);
// })();

/*
try sending message as in https://stackoverflow.com/questions/46869780/access-global-js-variables-from-js-injected-by-a-chrome-extension/46870005#46870005
        > like this too https://stackoverflow.com/questions/9602022/chrome-extension-retrieving-global-variable-from-webpage
better yet https://stackoverflow.com/questions/9515704/access-variables-and-functions-defined-in-page-context-using-a-content-script/9517879#9517879
    > also try chrome.scripting.registerContentScripts with world: 'MAIN'

*/

// var g_alreadyRunOnce = false;
// const WISHLIST_PAGE_REGEX = /store.steampowered.com\/wishlist\/([A-Za-z_0-9]+)(\/.*)?$/;

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (!tab.url?.match(WISHLIST_PAGE_REGEX)) return undefined;
//     g_alreadyRunOnce = true;
//     if (tab.active && changeInfo.status === "complete") {
//         chrome.scripting.executeScript(...);
//     }
// })