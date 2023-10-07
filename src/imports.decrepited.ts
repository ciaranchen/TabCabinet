import {
    TabGroup,
    loadAllTabGroup,
    makeEmptyTabGroup,
    importTabGroups
} from "./storage";

// TODO: 将默认形式改为json格式
export function importDefaultCsv() {
    const importValue = (<HTMLTextAreaElement>document.getElementById("importDefaultTextarea")).value;
    console.log(importValue);
    const content = importValue.split('\n');
    const tabGroups: TabGroup[] = [];
    let tabGroup: TabGroup;

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
            tabGroup = makeEmptyTabGroup();
            tabGroup.title = lineList[0].trim()
            tabGroup.lock = lineList[1].trim() === "锁定";
        }
    }

    importTabGroups(tabGroups).then(() => location.reload());
}

export function exportDefaultCsv() {
    loadAllTabGroup().then(groups =>
        groups.map(group =>
            `${group.title}|${group.lock ? "锁定" : "解锁"}\n` +
            group.tabs.map(tab => `${tab.url}|${tab.title}`).join('\n')
        ).join('\n\n')
    ).then(exportData => {
        console.log(exportData);
        const textArea = document.getElementById("exportTextarea") as HTMLTextAreaElement;
        textArea.value = exportData;
    });
}