const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDynamicallyDefinedArray(varName) {
    var attempt = 0;

    while (window[varName].length == 0) {
        await sleep(100);
        ++attempt;
        if (attempt == 20) {
            console.error(`20 times and still undefined`);
            return null;
        }
    }
    return window[varName];
}

function updategG_rgAppInfo() {
    var stringifiedCache = localStorage.getItem("dimswCache");
    var appToDemoMap = JSON.parse(stringifiedCache).appToDemoMap;
    Object.keys(g_rgAppInfo).forEach((appId) => {
        g_rgAppInfo[appId].demoPlatforms = appId in appToDemoMap ? appToDemoMap[appId].demo_platforms : null;
    })
}

function addFilterCheckboxes() {
    var demoPlatformsDiv = `
    <div class="category">
        <h3>Demo Availability</h3>
        <label><input class="filter_check dimsw_filter" type="checkbox" name="windows_demo"> Windows </label>
        <label><input class="filter_check dimsw_filter" type="checkbox" name="mac_demo"> macOS </label>
        <label><input class="filter_check dimsw_filter" type="checkbox" name="linux_demo"> SteamOS + Linux </label>
    </div>`;

    g_Wishlist.rgValidFilters.push("windows_demo");
    g_Wishlist.rgValidFilters.push("mac_demo");
    g_Wishlist.rgValidFilters.push("linux_demo");

    g_Wishlist.rgFilterPrefixMap.windows_demo = "Demo Availability"
    g_Wishlist.rgFilterPrefixMap.mac_demo = "Demo Availability"
    g_Wishlist.rgFilterPrefixMap.linux_demo = "Demo Availability"

    $J('#section_filters > .wrapper').append(demoPlatformsDiv);

    $J('.dimsw_filter').change(function () {
        if (this.checked)
            g_Wishlist.rgFilterSettings[this.name] = 1;
        else
            delete g_Wishlist.rgFilterSettings[this.name];
        g_Wishlist.SaveSettings();
        g_Wishlist.Update();
    });
}


g_Wishlist.BPassesFilters = function (unAppId, rgFilters) {
    var appInfo = g_rgAppInfo[unAppId];
    if (!appInfo)
        return false; // :thinking:

    var rgelMatchedElements = [];
    var elParent = this.rgElements[unAppId];

    if (rgFilters.term) {
        var rgTerms = rgFilters.term.split(' ');

        for (var j = 0; j < rgTerms.length; j++) {
            var bMatchesTerm = false;
            if (rgTerms[j].length == 0 || !appInfo.name)
                continue;

            if (appInfo.name.toLowerCase().indexOf(rgTerms[j].toLowerCase()) !== -1) {
                bMatchesTerm = true
                rgelMatchedElements.push($J('.title', elParent));
            }

            for (var i = 0; i < appInfo.tags.length; i++)
                if (appInfo.tags[i].toLowerCase().indexOf(rgTerms[j].toLowerCase()) !== -1) {
                    bMatchesTerm = true;
                    rgelMatchedElements.push($J('.tag[data-tag-index=\'' + i + '\']', elParent));
                }

            if (!bMatchesTerm)
                return false;

            for (var i = 0; i < rgelMatchedElements.length; i++) {
                rgelMatchedElements[i].addClass('term_matched');
                this.rgTermMatchedElements.push(rgelMatchedElements[i])
            }

        }
    }

    if (rgFilters.ex_earlyaccess && appInfo.early_access)
        return false;

    if (rgFilters.ex_prerelease && appInfo.prerelease)
        return false;

    if (rgFilters.ex_vr && appInfo.vr_only)
        return false;

    var bDeckVerified = appInfo.deck_compat == 3;
    var bDeckPlayable = appInfo.deck_compat == 2;
    if (rgFilters.deck_verified && rgFilters.deck_playable && !bDeckVerified && !bDeckPlayable) {
        return false;
    }
    else if (rgFilters.deck_verified && !rgFilters.deck_playable && !bDeckVerified) {
        return false;
    }
    else if (!rgFilters.deck_verified && rgFilters.deck_playable && !bDeckPlayable) {
        return false;
    }

    var bPassesPriceFilters = !rgFilters.price_1 && !rgFilters.price_2 && !rgFilters.price_wallet;

    for (var i = 0; i < appInfo.subs.length; i++) {
        if (rgFilters.price_1 && appInfo.subs[i].price <= g_rgPriceBrackets[0])
            bPassesPriceFilters = true;

        if (rgFilters.price_2 && appInfo.subs[i].price <= g_rgPriceBrackets[1])
            bPassesPriceFilters = true;

        if (rgFilters.price_wallet && appInfo.subs[i].price <= g_nWalletCents)
            bPassesPriceFilters = true;
    }

    if (!bPassesPriceFilters)
        return false;

    var bPassesDiscountFilters = !rgFilters.discount_any && !rgFilters.discount_50 && !rgFilters.discount_75;

    for (var i = 0; i < appInfo.subs.length; i++) {

        if (rgFilters.discount_any && appInfo.subs[i].discount_pct > 0)
            bPassesDiscountFilters = true;

        if (rgFilters.discount_50 && appInfo.subs[i].discount_pct >= 50)
            bPassesDiscountFilters = true;

        if (rgFilters.discount_75 && appInfo.subs[i].discount_pct >= 75)
            bPassesDiscountFilters = true;
    }

    if (!bPassesDiscountFilters)
        return false;

    if (rgFilters.type && rgFilters.type != 'all') {
        if (rgFilters.type == 'Video' && appInfo.type != "Video" && appInfo.type != "Movie" && appInfo.type != "Series" && appInfo.type != "Episode")
            return false;
        else if (appInfo.type != rgFilters.type)
            return false;
    }

    // Platform checks: Assume unsupported if any filters are set
    if (rgFilters.platform && rgFilters.platform != 'all') {
        if (rgFilters.platform == 'mac' && !appInfo.mac)
            return false;
        else if (rgFilters.platform == 'linux' && !appInfo.linux)
            return false;
    }

    if (rgFilters.windows_demo || rgFilters.mac_demo || rgFilters.linux_demo) {
        if (!appInfo.demoPlatforms)
            return false;
        if (!((rgFilters.windows_demo && appInfo.demoPlatforms["windows"]) ||
            (rgFilters.mac_demo && appInfo.demoPlatforms["mac"]) ||
            (rgFilters.linux_demo && appInfo.demoPlatforms["linux"])))
            return false;
    }

    return true;
}


async function main() {
    await getDynamicallyDefinedArray("g_rgAppInfo");
    updategG_rgAppInfo();
    addFilterCheckboxes();
}

main();
