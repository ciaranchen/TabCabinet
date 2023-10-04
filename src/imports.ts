import {BrowserTab, BrowserTabGroup, loadAllTabGroup, tabGroupFromTabArr, updateTabGroup} from "./storage";

function importTabGroupIntoStorage(tabGroups: BrowserTabGroup[]) {
    // 存储Id
    chrome.storage.local.get("tabGroupIds", function (storage: { tabGroupIds: string[] }) {
        let tabGroupIds: string[] = [];
        if (storage.tabGroupIds) {
            tabGroupIds = storage.tabGroupIds;
        }

        chrome.storage.local.set({tabGroupIds: tabGroupIds.concat(tabGroups.map(x => x.id))});
    });

    for (const tabGroup of tabGroups) {
        // 在指定Id处存入
        updateTabGroup(tabGroup);
    }
}

export function importOneTab() {
    const importValue = (<HTMLTextAreaElement>document.getElementById("importOnetabTextarea")).value;
    console.log(importValue);
    const content = importValue.split('\n');
    const tabGroups: BrowserTabGroup[] = [];
    let tabArr: BrowserTab[] = [];

    for (const line of content) {
        if (line.trim() === "") {
            // fromTabArr 构造一个空的tabGroup
            const tabGroup = tabGroupFromTabArr(tabArr);
            tabArr = [];

            tabGroups.push(tabGroup);
        } else {
            const lineList = line.split('|');
            const tab: { id: number; title: string; url: string } = {
                title: lineList[1].trim(),
                url: lineList[0].trim(),
                id: tabArr.length
            };
            tabArr.push(tab);
        }
    }

    importTabGroupIntoStorage(tabGroups);
    // TODO: refresh page
}

// TODO: 将默认形式改为json格式
export function importDefault() {
    const importValue = (<HTMLTextAreaElement>document.getElementById("importDefaultTextarea")).value;
    console.log(importValue);
    const content = importValue.split('\n');
    const tabGroups: BrowserTabGroup[] = [];
    let tabGroup: BrowserTabGroup;

    for (const line of content) {
        if (tabGroup) {
            if (line.trim() === "") {
                tabGroups.push(tabGroup);
                tabGroup = undefined;
            } else {
                const lineList = line.split('|');
                const tab: { id: number; title: string; url: string } = {
                    url: lineList[0].trim(),
                    title: lineList[1].trim(),
                    id: tabGroup.tabs.length
                };
                tabGroup.tabs.push(tab);
            }
        } else if (line.trim() !== "") {
            const lineList = line.split('|');
            tabGroup = tabGroupFromTabArr([]);
            tabGroup.groupTitle = lineList[0].trim()
            tabGroup.isLock = lineList[1].trim() === "锁定";
        }
    }

    importTabGroupIntoStorage(tabGroups);
    // TODO: refresh page
}

export function exportDefault() {
    loadAllTabGroup().then(groups =>
        groups.map(group =>
            `${group.groupTitle}|${group.isLock ? "锁定" : "解锁"}\n` +
            group.tabs.map(tab => `${tab.url}|${tab.title}`).join('\n')
        ).join('\n\n')
    ).then(exportData => {
        console.log(exportData);
        const textArea = document.getElementById("exportTextarea") as HTMLTextAreaElement;
        textArea.value = exportData;
    });
}