import {GithubApi, GiteeApi} from "./gistApi";
import {saveTabGroup, BrowserTabGroup, updateTabGroup, tabGroupFromTabArr, loadSettings, Settings} from "./storage";

let settings: Settings, githubApi: GithubApi, giteeApi: GiteeApi;

loadSettings().then(s => {
    settings = s;
});

chrome.runtime.onMessage.addListener((req, sendRes) => {
    switch (req.action) {
        case "settings-changed":
            loadSettings().then(s => {
                settings = s;
            });
            break;
    }
});

chrome.action.onClicked.addListener((tab) => {
    chrome.runtime.openOptionsPage();
})

// 获取tab数量并在pop上显示
chrome.tabs.query({}, function (tab) {
    chrome.action.setBadgeText({text: tab.length + ""});
    chrome.action.setBadgeBackgroundColor({color: "#0038a8"});
});

// 持续监听，当tab被激活的时候刷新一下pop上badge的tab的数量
chrome.tabs.onActivated.addListener(function callback() {
    chrome.tabs.query({}, function (tab) {
        chrome.action.setBadgeText({text: tab.length + ""});
        chrome.action.setBadgeBackgroundColor({color: "#0038a8"});
    });
});
// 持续监听，当tab被关闭的时候刷新一下pop上badge的tab的数量
chrome.tabs.onRemoved.addListener(function callback() {
    chrome.tabs.query({}, function (tab) {
        chrome.action.setBadgeText({text: tab.length + ""});
        chrome.action.setBadgeBackgroundColor({color: "#0038a8"});
    });
});
// 持续监听，当tab被创建的时候刷新一下pop上badge的tab的数量
chrome.tabs.onCreated.addListener(function callback() {
    chrome.tabs.query({}, function (tab) {
        chrome.action.setBadgeText({text: tab.length + ""});
        chrome.action.setBadgeBackgroundColor({color: "#0038a8"});
    });
});


// 创建定时同步gitee任务
chrome.alarms.create("checkAutoSyncGitee", {delayInMinutes: 70, periodInMinutes: 70});
// 创建定时同步github任务
chrome.alarms.create("checkAutoSyncGithub", {delayInMinutes: 90, periodInMinutes: 90});
// 持续监听响应定时任务
chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === "checkAutoSyncGitee") {
        if (giteeApi) {
            console.log("自动同步gitee")
            giteeApi.checkAutoSync();
        }
    }
    if (alarm.name === "checkAutoSyncGithub") {
        if (githubApi) {
            console.log("自动同步github")
            githubApi.checkAutoSync();
        }
    }
});

function saveTabs(tabsArr: chrome.tabs.Tab[]) {
    const tab_group = tabGroupFromTabArr(tabsArr.map(tab => ({
        title: tab.title,
        url: tab.url,
        id: tab.id
    })));
    saveTabGroup(tab_group);
}

// close all the tabs in the provided array of Tab objects
function closeTabs(tabsArr: chrome.tabs.Tab[]) {
    const tabsToClose = tabsArr.map(x => x.id);

    chrome.tabs.remove(tabsToClose, function () {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
        }
    });
}


// 打开background页
function openBackgroundPage() {
    chrome.tabs.query({url: "chrome-extension://*/options.html*", currentWindow: true}, function (tab) {
        if (tab.length >= 1) {
            chrome.tabs.move(tab[0].id, {index: 0}, () => {
                chrome.tabs.highlight({tabs: 0});
            });
            chrome.tabs.reload(tab[0].id);
        } else {
            chrome.tabs.create({index: 0, url: chrome.runtime.getURL('options.html')});
        }
    });
}


// 创建页面中的右键菜单，发送当前tab
chrome.contextMenus.create({
    id: "cloudSkyMonster-SendCurrentTab", title: `${chrome.i18n.getMessage("sendCurrentTab")}`,
});

chrome.contextMenus.create({
    id: "4", title: `${chrome.i18n.getMessage("showAllTabs")}`, contexts: ["action"]
});

chrome.contextMenus.create({
    id: "5", title: `${chrome.i18n.getMessage("sendAllTabs")}`, contexts: ["action"]
});


chrome.contextMenus.create({
    id: "6", title: `${chrome.i18n.getMessage("sendCurrentTab")}`, contexts: ["action"]
});


chrome.contextMenus.create({
    id: "7", title: `${chrome.i18n.getMessage("sendOtherTabs")}`, contexts: ["action"]
});


chrome.contextMenus.onClicked.addListener(function (info, tab) {
    console.log(info, tab);
    if (info.menuItemId === "cloudSkyMonster-SendCurrentTab") {
        chrome.storage.local.get(function (storage) {
            chrome.tabs.query({
                url: ["https://*/*", "http://*/*"], highlighted: true, currentWindow: true
            }, function (tabsArr) {
                const opts = storage.options
                let openBackgroundAfterSendTab = "yes"
                if (opts) {
                    openBackgroundAfterSendTab = opts.openBackgroundAfterSendTab || "yes"
                }
                if (tabsArr.length > 0) {
                    saveTabs(tabsArr);
                    if (openBackgroundAfterSendTab === "yes") {
                        openBackgroundPage();
                    }
                    closeTabs(tabsArr);
                } else {
                    if (openBackgroundAfterSendTab === "yes") {
                        openBackgroundPage();
                    }
                }

            });
        });
    } else if (info.menuItemId === '4') {
        openBackgroundPage();
    } else if (info.menuItemId === '5') {
        chrome.tabs.query({url: ["https://*/*", "http://*/*"], currentWindow: true}, function (tabs) {
            if (tabs.length > 0) {
                saveTabs(tabs);
                openBackgroundPage();
                closeTabs(tabs);
            } else {
                openBackgroundPage();
            }
        });
    } else if (info.menuItemId === '6') {

        chrome.storage.local.get(function (storage) {
            const opts = storage.options
            let openBackgroundAfterSendTab = "yes"
            if (opts) {
                openBackgroundAfterSendTab = opts.openBackgroundAfterSendTab || "yes"
            }
            chrome.tabs.query({
                url: ["https://*/*", "http://*/*"], highlighted: true, currentWindow: true
            }, function (req) {
                if (req.length > 0) {
                    saveTabs(req);
                    if (openBackgroundAfterSendTab === "yes") {
                        openBackgroundPage();
                    }
                    closeTabs(req);
                } else {
                    if (openBackgroundAfterSendTab === "yes") {
                        openBackgroundPage();
                    }
                }
            });
        });
    } else if (info.menuItemId === '7') {
        chrome.tabs.query({url: ["https://*/*", "http://*/*"], active: false, currentWindow: true}, function (req) {
            if (req.length > 0) {
                saveTabs(req);
                openBackgroundPage();
                closeTabs(req);
            } else {
                openBackgroundPage();
            }
        });
    }
});

