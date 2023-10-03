import {genObjectId} from "./utils";
import * as moment from "moment";

export class BrowserTabGroup {
    date: string;
    tabs: {
        title: string
        url: string
        id: number
    }[];
    isLock: boolean;
    groupTitle: string;
    id: string;

    // makes a tab group, filters it
    // from the array of Tab objects it makes an object with date and the array
    fromTabArr(tabsArr: { title: string, url: string, id: number }[]) {
        this.id = `tabGroup-${genObjectId()}`;
        this.date = moment().format("YYYY-MM-DD HH:mm:ss").toString();
        this.tabs = tabsArr.map((tab) => ({
            title: tab.title.replace(/\p{Cc}/, ''),
            url: tab.url,
            id: tab.id
        }));
        this.isLock = false;
        this.groupTitle = '';
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
        updateTabGroup(tab);
        resolve();
    });
}

export function restoreStorage() {
    // 注意： 此函数仅用于调试。
    // 统计游离的 tabGroup 至 tabGroupIds
    return new Promise<void>(resolve => {
        chrome.storage.local.get(null, function (storage: { [p:string]: any}) {
            const ids = Object.keys(storage).filter(x => x.startsWith("tabGroup-"));
            chrome.storage.local.set({tabGroupIds: ids});
        });
    });
}

export function updateTabGroup(tab: BrowserTabGroup) {
    return new Promise<void>(resolve => {
        const obj: { [p: string]: BrowserTabGroup } = {};
        obj[tab.id.toString()] = tab;
        chrome.storage.local.set(obj);
        resolve();
    })
}

export class Settings {
    deleteAfterOpenTabGroup: boolean = false
    openOptionsAfterSendTab: boolean = true

    githubToken: string = "";
    giteeToken: string = "";
}

export function saveSettings(settings: Settings) {
    return chrome.storage.sync.set({TabMonsterSettings: settings});
}

export function loadSettings() {
    return new Promise<Settings>(resolve => {
        chrome.storage.sync.get("TabMonsterSettings", (storage: {TabMonsterSettings: Settings}) => {
            if (!storage.TabMonsterSettings) resolve(new Settings());
            const settings = storage.TabMonsterSettings;
            resolve(settings);
        });
    });
}