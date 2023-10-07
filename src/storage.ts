import {genObjectId} from "./utils";

export interface OneTabData {
    title: string
    url: string
    id: number
}

export type BrowserTab = chrome.tabs.Tab | OneTabData;

export interface TabGroup {
    id: string
    created_at: number
    updated_at?: number
    title: string
    tabs?: BrowserTab[]

    collapsed: boolean
    lock: boolean
}


// makes a tab group
export function makeEmptyTabGroup(): TabGroup {
    return {
        id: `tabGroup-${genObjectId()}`,
        title: '',
        created_at: new Date().getTime(),
        collapsed: false,
        lock: false,

        tabs: []
    }
}

export function loadAllTabGroup(): Promise<TabGroup[]> {
    return new Promise((resolve) => {
        chrome.storage.local.get("tabGroupIds", function (storage: { tabGroupIds: string[] }) {
            if (!storage.tabGroupIds) resolve([]);
            chrome.storage.local.get(storage.tabGroupIds, (groups: { [p: string]: TabGroup }) => {
                resolve(Object.values(groups));
            });
        });
    });
}

export function saveTabGroup(tabGroup: TabGroup) {
    return new Promise<void>((resolve, reject) => {
        // 在指定位置存入
        updateTabGroup(tabGroup);

        // 存储Id
        chrome.storage.local.get("tabGroupIds", function (storage: { tabGroupIds: string[] }) {
            let tabGroupIds: string[] = [];
            if (storage.tabGroupIds) {
                tabGroupIds = storage.tabGroupIds;
            }
            tabGroupIds.push(tabGroup.id);
            // TODO: handle id 重复的情况
            chrome.storage.local.set({tabGroupIds: tabGroupIds}).then(() => {
                chrome.runtime.sendMessage({action: 'tabGroups-changed'}).then(() => resolve());
            });
        });
    });
}

export function importTabGroups(tabGroups: TabGroup[]) {
    return new Promise<void>((resolve, reject) => {
        // 在指定位置存入
        for (const tabGroup of tabGroups) {
            updateTabGroup(tabGroup);
        }

        // 存储Id
        chrome.storage.local.get("tabGroupIds", function (storage: { tabGroupIds: string[] }) {
            let tabGroupIds: string[] = [];
            if (storage.tabGroupIds) {
                tabGroupIds = storage.tabGroupIds;
            }
            // TODO: handle id 重复的情况
            chrome.storage.local.set({tabGroupIds: tabGroupIds.concat(tabGroups.map(x => x.id))}).then(() => {
                chrome.runtime.sendMessage({action: 'tabGroups-changed'}).then(() => resolve());
            });
        });
    });
}

export function restoreStorage() {
    // 注意： 此函数仅用于调试。
    // 统计游离的 tabGroup 至 tabGroupIds
    console.debug("restore tabGroupIds")
    return new Promise<void>(resolve => {
        chrome.storage.local.get(null, function (storage: { [p: string]: any }) {
            const ids = Object.keys(storage).filter(x => x.startsWith("tabGroup-"));
            console.debug(ids);
            chrome.storage.local.set({tabGroupIds: ids})
                .then(() => chrome.runtime.sendMessage({action: 'tabGroups-changed'})).then(() => resolve());
        });
    });
}

export function updateTabGroup(tab: TabGroup, sendMsg = true) {
    return new Promise<void>(resolve => {
        chrome.storage.local.set({[tab.id]: tab})
            .then(() => sendMsg ? chrome.runtime.sendMessage({action: 'tabGroups-changed'}) : false)
            .then(() => resolve());
    });
}

export function deleteTabGroup(tabGroup: TabGroup) {
    return new Promise<void>(resolve => {
        chrome.storage.local.get("tabGroupIds", (s: { tabGroupIds: string[] }) => {
            chrome.storage.local.set({tabGroupIds: s.tabGroupIds.filter(x => x !== tabGroup.id)})
                .then(() => chrome.storage.local.remove(tabGroup.id))
                .then(() => resolve());
        });
    });
}

export interface Settings {
    deleteAfterOpenTabGroup: boolean
    openOptionsAfterSendTab: boolean

    githubToken: string,
    githubId: string,
    giteeToken: string,
    giteeId: string,

    inTimeSync: false,
    autoSync: boolean,
    autoSyncInterval: number
}

export const defaultSettings: Settings = {
    deleteAfterOpenTabGroup: false,
    openOptionsAfterSendTab: true,
    githubToken: "",
    githubId: "",
    giteeToken: "",
    giteeId: "",

    inTimeSync: false,
    autoSync: false,
    autoSyncInterval: 60
}

export function saveSettings(settings: Settings) {
    return chrome.storage.sync.set({TabCabinetSettings: settings}).then(() => chrome.runtime.sendMessage({action: 'settings-changed'}));
}

export function loadSettings() {
    return new Promise<Settings>(resolve => {
        chrome.storage.sync.get("TabCabinetSettings", (storage: { TabCabinetSettings: Settings }) => {
            if (!storage.TabCabinetSettings) resolve(defaultSettings);
            const settings = storage.TabCabinetSettings;
            resolve(settings);
        });
    });
}