import {genObjectId} from "./utils";

export class BrowserTabGroup {
    date: Date;
    tabs: { title: string, url: string }[];
    isLock: boolean;
    groupTitle: string;
    id: string;

    // makes a tab group, filters it
    // from the array of Tab objects it makes an object with date and the array
    fromTabArr(tabsArr: chrome.tabs.Tab[]) {
        this.id = `tabGroup-${genObjectId()}`;
        this.date = new Date();
        this.tabs = tabsArr.map((tab) => ({
            title: tab.title.replace(/\p{Cc}/, ''),
            url: tab.url
        }));
        this.isLock = false;
        this.groupTitle = '';
    }
}

export function loadAllTabGroup(): Promise<BrowserTabGroup[]> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("tabGroupIds", function (storage: { tabGroupIds: string[] }) {
            if (!storage.tabGroupIds) reject();
            chrome.storage.local.get(storage.tabGroupIds, (groups: {[p:string]: BrowserTabGroup}) => {
                resolve(Object.values(groups));
            });
        });
    });
}

export function saveTabGroup(tab: BrowserTabGroup) {
    return new Promise<void>((resolve , reject) => {
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
        // TODO: handle 无法存入的情况
        const obj: { [p: string]: BrowserTabGroup } = {};
        obj[tab.id.toString()] = tab;
        chrome.storage.local.set(obj);
        resolve();
    });
}
