import {GithubApi, GiteeApi, GistApi} from "./gistApi";
import {
    saveTabGroup,
    loadSettings,
    Settings,
    loadAllTabGroup,
    TabGroup,
    saveSettings,
    makeEmptyTabGroup
} from "./storage";


let settings: Settings, githubApi: GithubApi, giteeApi: GiteeApi;


function updateWithSettingsValue(s: Settings) {
    settings = s;
    githubApi = new GithubApi(settings.githubToken, settings.githubId);
    giteeApi = new GiteeApi(settings.giteeToken, settings.giteeId);
}

// 加载Settings，初始化Api
loadSettings().then(updateWithSettingsValue);

chrome.runtime.onMessage.addListener((req, _, sendRes) => {
    switch (req.action) {
        case "settings-changed":
            loadSettings().then(updateWithSettingsValue);
            break;
        case "push-git":
            pushGist(req.api === githubApi.name ? githubApi : giteeApi)
                .then(() => sendRes(true))
                .catch(() => sendRes(false));
            break;
        case "pull-git":
            pullGist(req.api === githubApi.name ? githubApi : giteeApi);
            break;
    }
});

function pushGist(api: GistApi) {
    return new Promise((resolve, reject) => {
        if (!giteeApi || !giteeApi.gistToken) {
            reject("No token");
            return;
        }
        loadAllTabGroup().then(
            tabGroups => {
                loadSettings().then(settings => {
                    api.pushData(tabGroups, settings);
                });
            }
        );
    });
}

function pullGist(api: GistApi) {
    return new Promise((resolve, reject) => {
        // TODO: 提供更明显的提示。
        if (!giteeApi || !giteeApi.gistToken) {
            reject("No token");
            return;
        }

        api.pullData().then((r: { tabGroups: TabGroup[], settings: Settings }) => {
            saveSettings(r.settings).then(() => updateWithSettingsValue(r.settings));
            for (const group of r.tabGroups) {
                chrome.storage.local.set({[group.id]: group});
            }
            // TODO: 清除Storage中的原有数据。
            chrome.storage.local.set({tabGroupIds: r.tabGroups.map(x => x.id)}).then(() => {
                chrome.runtime.sendMessage({action: "tabGroup-changed"}).then(resolve);
            });
        });
    });
}

function openOptionsAndPin() {
    // TODO: Options标签页固定
}

chrome.action.onClicked.addListener(() => {
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
    const session = {...makeEmptyTabGroup(), tabs: tabsArr};
    saveTabGroup(session);
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


// 创建页面中的右键菜单，发送当前tab
chrome.contextMenus.create({
    id: "tabCabinet-SendCurrentTab", title: `${chrome.i18n.getMessage("sendCurrentTab")}`,
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
    if (info.menuItemId === "tabCabinet-SendCurrentTab") {
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
                        chrome.runtime.openOptionsPage();
                    }
                    closeTabs(tabsArr);
                } else {
                    if (openBackgroundAfterSendTab === "yes") {
                        chrome.runtime.openOptionsPage();
                    }
                }

            });
        });
    } else if (info.menuItemId === '4') {
        chrome.runtime.openOptionsPage();
    } else if (info.menuItemId === '5') {
        chrome.tabs.query({url: ["https://*/*", "http://*/*"], currentWindow: true}, function (tabs) {
            if (tabs.length > 0) {
                saveTabs(tabs);
                chrome.runtime.openOptionsPage();
                closeTabs(tabs);
            } else {
                chrome.runtime.openOptionsPage();
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
                        chrome.runtime.openOptionsPage();
                    }
                    closeTabs(req);
                } else {
                    if (openBackgroundAfterSendTab === "yes") {
                        chrome.runtime.openOptionsPage();
                    }
                }
            });
        });
    } else if (info.menuItemId === '7') {
        chrome.tabs.query({url: ["https://*/*", "http://*/*"], active: false, currentWindow: true}, function (req) {
            if (req.length > 0) {
                saveTabs(req);
                chrome.runtime.openOptionsPage();
                closeTabs(req);
            } else {
                chrome.runtime.openOptionsPage();
            }
        });
    }
});

