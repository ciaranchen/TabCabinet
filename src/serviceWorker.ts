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
let old_autoSync: boolean, old_autoSyncInterval: number;


function updateWithSettingsValue(s: Settings) {
    settings = s;
    githubApi = new GithubApi(settings.githubToken, settings.githubId);
    giteeApi = new GiteeApi(settings.giteeToken, settings.giteeId);
    // 若 autoSync 且新设置与旧设置不同，则需清除alarm，重新设置定时同步。
    if (s.autoSync && (old_autoSync !== s.autoSync || old_autoSyncInterval !== s.autoSyncInterval)) {
        chrome.alarms.clear("checkAutoSyncGithub", () => {
            if (githubApi.gistToken && githubApi.gistToken.length !== 0) {
                autoSync(githubApi);
                chrome.alarms.create("checkAutoSyncGithub", {periodInMinutes: settings.autoSyncInterval});
            }
        });
        chrome.alarms.clear("checkAutoSyncGitee", () => {
            if (giteeApi.gistToken && giteeApi.gistToken.length !== 0) {
                autoSync(giteeApi);
                chrome.alarms.create("checkAutoSyncGitee", {periodInMinutes: settings.autoSyncInterval});
            }
        });

        old_autoSync = s.autoSync;
        old_autoSyncInterval = s.autoSyncInterval;
    }
}


// 持续监听响应定时任务
chrome.alarms.onAlarm.addListener(function (alarm) {
    switch (alarm.name) {
        case "checkAutoSyncGitee":
            console.log("自动同步gitee")
            autoSync(giteeApi);
            break;
        case "checkAutoSyncGithub":
            console.log("自动同步github")
            autoSync(githubApi);
            break;
    }
});

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
    return new Promise<void>((resolve, reject) => {
        if (!giteeApi || !giteeApi.gistToken) {
            reject("No token");
            return;
        }
        loadAllTabGroup().then(
            tabGroups => {
                loadSettings().then(settings => {
                    api.pushData(tabGroups, settings).then(() => resolve());
                });
            }
        );
    });
}

function pullGist(api: GistApi) {
    return new Promise<void>((resolve, reject) => {
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
                chrome.runtime.sendMessage({action: "tabGroup-changed"}).then(() => resolve());
            });
        });
    });
}

function autoSync(api: GistApi) {
    // TODO: 冲突处理。
    return pushGist(api);
}

function openOptionsAndPin() {
    // TODO: Options标签页固定
}

chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
})


// 获取tab数量并在pop上显示
function updateBadge() {
    chrome.tabs.query({}, function (tabs) {
        chrome.action.setBadgeText({text: tabs.length + ""});
        chrome.action.setBadgeBackgroundColor({color: "#0038a8"});
    });
}

// 持续监听，当tab被激活、关闭、创建的时候刷新一下pop上badge的tab的数量
updateBadge();
chrome.tabs.onActivated.addListener(updateBadge);
chrome.tabs.onRemoved.addListener(updateBadge);
chrome.tabs.onCreated.addListener(updateBadge);

// 菜单有关动作
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
    if (info.menuItemId === '4') {
        chrome.runtime.openOptionsPage();
    } else if (info.menuItemId === '5') { // sendAllTabs
        chrome.tabs.query({
            url: ["https://*/*", "http://*/*"],
            currentWindow: true
        }, function (tabs) {
            if (tabs.length > 0) {
                saveTabs(tabs);
            }
            chrome.runtime.openOptionsPage();
            closeTabs(tabs);
        });
    } else if (info.menuItemId === '6' || info.menuItemId === "tabCabinet-SendCurrentTab") { // sendCurrentTab
        chrome.tabs.query({
            url: ["https://*/*", "http://*/*"],
            highlighted: true,
            currentWindow: true
        }, function (tabs) {
            if (tabs.length > 0) {
                saveTabs(tabs);
            }
            if (settings.openOptionsAfterSendTab) {
                chrome.runtime.openOptionsPage();
            }
            closeTabs(tabs);
        });
    } else if (info.menuItemId === '7') {  // sendOtherTabs
        chrome.tabs.query({
            url: ["https://*/*", "http://*/*"],
            active: false,
            currentWindow: true
        }, function (tabs) {
            if (tabs.length > 0) {
                saveTabs(tabs);
            }
            chrome.runtime.openOptionsPage();
            closeTabs(tabs);
        });
    }
})
;

