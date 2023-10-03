import {BrowserTabGroup, updateTabGroup} from "./storage";

export function importOneTab(){
    const importValue = (<HTMLTextAreaElement>document.getElementById("importOnetabTextarea")).value;
    console.log(importValue);
    const content = importValue.split('\n');
    const tabGroups: BrowserTabGroup[] = [];
    let tabArr: {title: string, url: string, id: number}[] = [];

    for (const line of content) {
        if (line.trim() === "") {
            const tabGroup = new BrowserTabGroup();
            console.log(tabArr)
            tabGroup.fromTabArr(tabArr);
            tabArr = [];

            tabGroups.push(tabGroup);
        } else {
            const lineList = line.split(' | ');
            const tab: { id: number; title: string; url: string } = {title: lineList[1], url: lineList[0], id: tabArr.length};
            tabArr.push(tab);
        }
    }

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