// async function updateSearch() {
//     await chrome.scripting
//         .executeScript({
//             target: { tabId: getTabId() },
//             func: updategG_rgAppInfo,
//             world: 'MAIN'
//         })
//         .then(() => console.log("injected a function"));
// }

console.log("background");
// updateSearch();

async function getPageVar(name, tabId) {
    const [{ result }] = await chrome.scripting.executeScript({
        func: name => window[name],
        args: [name],
        target: {
            tabId: tabId ??
                (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id
        },
        world: 'MAIN',
    });
    return result;
}


// (async () => {
//     const v = await getPageVar('g_rgAppInfo');
//     console.log(v);
// })();


/*
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

  // skip urls like "chrome://" to avoid extension error
  if (tab.url?.startsWith("chrome://")) return undefined;

  if (tab.active && changeInfo.status === "complete") {
    chrome.scripting.executeScript({
       //...
*/