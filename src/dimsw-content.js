async function getAppDetails(appId) {
  const apiUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
  return fetch(apiUrl)
    .then((response) => response.json())
    .then((resJson) => resJson[appId].data)
    .catch((error) => console.error(error));
}

async function getDemoPlatforms(appId) {
  // console.log(`async function getDemoPlatforms(${appId}) {`);
  return getAppDetails(appId)
    // assuming each app has only one demo app (couldn't find counter-examples)
    .then((appDetails) => "demos" in appDetails ? appDetails.demos[0].appid : null)
    .then((demoId) => demoId ? getAppDetails(demoId) : null)
    .then((demoDetails) => demoDetails ? demoDetails.platforms : null);
}

function insertDemoBox(titleNode, demoPlatforms) {
  if (demoPlatforms == null) {
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

var g_hardcodedResponsiveNode = document.querySelector("div.responsive_page_content");
var g_wishlistParentNode = null;
var g_uncheckedItems = new Set();

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
  if (!titleNode ) { // when the filtered list is empty
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

  var demoPlatformsAvailabilityMap = await getDemoPlatforms(appId); // {<platform>: bool}
  if (demoPlatformsAvailabilityMap) {
    insertDemoBox(titleNode, demoPlatformsAvailabilityMap);
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

async function main() {
  loadUncheckedItems();
  const observer = new MutationObserver(checkResponsiveNodeChildren);
  observer.observe(g_hardcodedResponsiveNode, { childList: true, subtree: true });
}

main();

