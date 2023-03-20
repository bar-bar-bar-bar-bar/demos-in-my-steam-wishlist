
var WEEK_IN_MS = 604800000;
var DEMO_INFO_URL = "https://raw.githubusercontent.com/bar-bar-bar-bar-bar/demos-in-my-steam-wishlist-data/main/app_id_to_demo_info.json"
var g_hardcodedResponsiveNode = document.querySelector("div.responsive_page_content");
var g_wishlistParentNode = null;
var g_uncheckedItems = new Set();
var g_appToDemoMap = null;


function insertDemoBox(titleNode, demoPlatforms) {
  if (!demoPlatforms) {
    return;
  }
  demoBoxHTML = `
  <div class="dimsw_demo_box">
    <span class="dimsw_checkmark"></span>
    <span class="dimsw_demo_text">DEMO</span>`;

  if (demoPlatforms["windows"]) {
    demoBoxHTML += `<span class="dimsw_platform_icon platform_img win"></span>`;
  }
  if (demoPlatforms["mac"]) {
    demoBoxHTML += `<span class="dimsw_platform_icon platform_img mac"></span>`;
  }
  if (demoPlatforms["linux"]) {
    demoBoxHTML += `<span class="dimsw_platform_icon platform_img linux"></span>`;
  }
  demoBoxHTML += `</div>`;

  titleNode.insertAdjacentHTML("beforeend", demoBoxHTML);
  titleNode.classList.add("has_demo_box");  // to compensate for displacement caused by demo box
}

function loadUncheckedItems() {
  document.querySelectorAll('script').forEach((node) => {
    if (node.innerHTML.includes(`var g_rgWishlistData`)) {
      var scriptContent = node.innerHTML;
      var wishlistDeclaration = node.innerHTML.split('\n', 2)[1];   // [0] is empty
      wishlistDeclaration = wishlistDeclaration
        .replace(/^\s*var g_rgWishlistData = /, "")
        .replace(/;\s*$/, "");
      var wishlistItems = JSON.parse(wishlistDeclaration);
      for (var item of wishlistItems) {
        g_uncheckedItems.add(item.appid);
      }
    }
  });
}

function checkResponsiveNodeChildren(mutations, observer) {
  g_wishlistParentNode = document.querySelector("#wishlist_ctn");
  if (g_wishlistParentNode) {
    observer.disconnect();
    var newObserver = new MutationObserver(onWishlistItemsLoad);
    newObserver.observe(g_wishlistParentNode, { childList: true });
    // nodes that were already loaded won't trigger the observer
    // therefore, we need to check them now
    g_wishlistParentNode.querySelectorAll('a.title').forEach(async (titleNode) => checkLoadedTitleNode(titleNode));
  }
}


async function checkLoadedTitleNode(titleNode) {
  if (!titleNode) { // when the filtered list is empty
    return;
  }

  var appURL = titleNode.getAttribute('href');

  const regex = /store.steampowered.com\/app\/([A-Za-z_0-9]+)(\/.*)?$/;
  var appId = parseInt(appURL.match(regex)[1]);

  if (!g_uncheckedItems.has(appId)) {
    return;
  }
  g_uncheckedItems.delete(appId);
  // console.log(`${g_uncheckedItems.size} nodes remaining`);

  if (g_appToDemoMap[appId]) {
    insertDemoBox(titleNode, g_appToDemoMap[appId].demo_platforms);
  }
}

async function onWishlistItemsLoad(mutations, observer) {
  for (var mutation of mutations) {
    mutation.addedNodes.forEach(async (listItem) => {
      var titleNode = listItem.querySelector('a.title');
      checkLoadedTitleNode(titleNode);
    });
  }
  if (g_uncheckedItems.size == 0) {
    /*
    not happening because of the filter, it is hiding some items
    and even if I reduce the count to the number of filtered items, then when the filter changes I need to restart the observer
    Maybe I could do that at every page load, or whatever event refreshing the filtered items is
    */
    observer.disconnect();
  }
}


async function getAppToDemoMap() {
  return chrome.storage.local.get({ dimswCache: null })
    .then((pre_validation_cache) => {
      if (pre_validation_cache && pre_validation_cache.appToDemoMap && pre_validation_cache.timestamp) {
        var weeksElapsed = (Date.now() - pre_validation_cache.timestamp) / WEEK_IN_MS;
        if (weeksElapsed < 1) {
          console.log("Using cached data...")
          return pre_validation_cache;
        }
      } else {
        return null;
      }
    })
    .then(async (validated_cache) => {
      if (validated_cache) {
        return validated_cache.appToDemoMap;
      }
      console.log("Updating cache...")
      var res = await fetch(DEMO_INFO_URL);
      var freshMap = await res.json();
      chrome.storage.local.set({ dimswCache: { appToDemoMap: freshMap, timestamp: Date.now() } });
      return freshMap;
    })
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDynamicallyDefinedVar(varName) {
  var attempt = 0;

  while (window[varName] == undefined) {
      console.log(`still undefined`);
      await sleep(100);
      ++attempt;
      if (attempt == 10) {
          console.error(`10 times and still undefined`);
          return null;
      }
  }
  return window[varName];
}


async function updategG_rgAppInfo() {
  await getDynamicallyDefinedVar("g_rgAppInfo");
  Object.keys(g_rgAppInfo).forEach((appId) => {
    g_rgAppInfo[appId].has_demo = g_appToDemoMap.includes(appId) ?  true : false; 
  })
}


async function main() {
  g_appToDemoMap = await getAppToDemoMap();
  updategG_rgAppInfo();
  loadUncheckedItems();
  const observer = new MutationObserver(checkResponsiveNodeChildren);
  observer.observe(g_hardcodedResponsiveNode, { childList: true, subtree: true });
}

main();
console.log(g_rgPriceBrackets)


