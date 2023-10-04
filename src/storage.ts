import {genObjectId} from "./utils";
import * as moment from "moment";

export interface BrowserTab {
    title: string
    url: string
    id: number
}

// TODO: use below to fix more.
export interface BrowserTabGroupExtend {
    created: string
    tabs: chrome.tabs.Tab[]
    isLock: boolean
    groupTitle: string
    id: string
}

export interface BrowserTabGroup {
    date: string;
    tabs: BrowserTab[];
    isLock: boolean;
    groupTitle: string;
    id: string;
}

// makes a tab group, filters it
// from the array of Tab objects it makes an object with date and the array



export function tabGroupFromTabArr(tabsArr: BrowserTab[]): BrowserTabGroup {
    return {
        id: `tabGroup-${genObjectId()}`,
        date: moment().format("YYYY-MM-DD HH:mm:ss").toString(),
        tabs: tabsArr,
        isLock: false,
        groupTitle: ''
    }
}

export function loadAllTabGroup(): Promise<BrowserTabGroup[]> {
    return new Promise((resolve) => {
        chrome.storage.local.get("tabGroupIds", function (storage: { tabGroupIds: string[] }) {
            if (!storage.tabGroupIds) resolve([]);
            chrome.storage.local.get(storage.tabGroupIds, (groups: { [p: string]: BrowserTabGroup }) => {
                resolve(Object.values(groups));
            });
        });
    });
}

export function saveTabGroup(tab: BrowserTabGroup) {
    return new Promise<void>((resolve, reject) => {
        // 存储Id
        chrome.storage.local.get("tabGroupIds", function (storage: { tabGroupIds: string[] }) {
            let tabGroupIds: string[] = [];
            if (storage.tabGroupIds) {
                tabGroupIds = storage.tabGroupIds;
            }
            tabGroupIds.push(tab.id);
            // TODO: handle id 重复的情况
            chrome.storage.local.set({tabGroupIds: tabGroupIds});
        });

        // 在指定Id处存入
        updateTabGroup(tab).then(() => {
            chrome.runtime.sendMessage({action: 'tabGroups-changed'}).then(() => resolve());
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

export function updateTabGroup(tab: BrowserTabGroup, source?: string) {
    return new Promise<void>(resolve => {
        chrome.storage.local.set({[tab.id]: tab})
            .then(() => chrome.runtime.sendMessage({action: 'tabGroups-changed', source: source?source:''}))
            .then(() => resolve());
    });
}

export interface Settings {
    deleteAfterOpenTabGroup: boolean
    openOptionsAfterSendTab: boolean

    githubToken: string,
    githubId: string,
    giteeToken: string,
    giteeId: string,

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

    autoSync: false,
    autoSyncInterval: 60
}

export function saveSettings(settings: Settings) {
    return chrome.storage.sync.set({TabMonsterSettings: settings}).then(() => chrome.runtime.sendMessage({action: 'settings-changed'}));
}

export function loadSettings() {
    return new Promise<Settings>(resolve => {
        chrome.storage.sync.get("TabMonsterSettings", (storage: { TabMonsterSettings: Settings }) => {
            if (!storage.TabMonsterSettings) resolve(defaultSettings);
            const settings = storage.TabMonsterSettings;
            resolve(settings);
        });
    });
}