import * as React from "react";
import {importTabGroups, makeEmptyTabGroup, OneTabData, TabGroup} from "../storage";
import {useState} from "react";

export function ImportsApp() {
    // TODO: 给更正式的例子
    const onetab_default = "https://www.baidu.com | BaiDu\n" +
        "https://www.google.com | Google\n" +
        "\n" +
        "https://www.bilibili.com | Bilibili\n" +
        "https://www.weibo.com | Weibo"
    let [onetabTextAreaValue, setOnetabTextareaValue] = useState(onetab_default);


    function importOneTab() {
        const importValue = onetabTextAreaValue;
        console.log(importValue);
        const content = importValue.split('\n');
        const tabGroups: TabGroup[] = [];
        let tabArr: OneTabData[] = [];

        for (const line of content) {
            if (line.trim() === "") {
                const tabGroup = makeEmptyTabGroup()
                tabGroup.tabs = tabArr;
                tabGroups.push(tabGroup);

                tabArr = [];
            } else {
                const lineList = line.split('|');
                const tab: OneTabData = {
                    title: lineList[1].trim(),
                    url: lineList[0].trim(),
                    id: tabArr.length
                };
                tabArr.push(tab);
            }
        }
        if (tabArr.length !== 0) {
            const tabGroup = makeEmptyTabGroup()
            tabGroup.tabs = tabArr;
            tabGroups.push(tabGroup);
        }
        console.log(tabGroups);
        importTabGroups(tabGroups).then(() => location.reload());
    }

    function importJson() {

    }

    function exportJson() {

    }

    // TODO: 折叠导出格式。
    return (<div className="container" role="main">
        <div id="importOneTab" className="m-3">
            <h3><span className="i18n" title="hideShowImportOnetabFunction"></span></h3>
            <textarea id="importOnetabTextarea" value={onetabTextAreaValue} onChange={e => setOnetabTextareaValue(e.target.value)}></textarea>
            <div>
                <button id="importOnetabMode" type="button"
                        className="btn btn-primary"><span className="i18n" title="importToLocal"
                                                          onClick={importOneTab}></span>
                </button>
                <span><span className="i18n" title="importWarn"></span></span>
            </div>
        </div>

        <div id="importDefault" className="m-3">
            <h3><span className="i18n" title="hideShowImportDefaultFunction"></span></h3>
            <button id="importJson" onClick={importJson} className="btn btn-outline-primary">
                <span className="i18n" title="importJson"></span>
            </button>
            <button id="exportJson" onClick={exportJson} className="btn btn-outline-primary">
                <span className="i18n" title="exportJson"></span>
            </button>
        </div>
    </div>)
}