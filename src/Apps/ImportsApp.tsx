import * as React from "react";
import {importTabGroups, loadAllTabGroup, makeEmptyTabGroup, OneTabData, TabGroup} from "../storage";
import {useState} from "react";
import {downloadJsonFile} from "../utils";

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

    function handleJsonUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target?.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result as string);
                    console.log(importedData);
                    importTabGroups(importedData).then(() => location.reload());
                } catch (error) {
                    console.error('无法解析JSON文件', error);
                }
            };
            reader.readAsText(file);
        }
    }

    function exportJson() {
        loadAllTabGroup().then(value => downloadJsonFile(value, "TabCabinetData.json"));
    }

    function importJson() {
        document.getElementById("importJsonInput").click();
    }

    // TODO: 折叠导出格式。
    return (<div className="container" role="main">
        <div id="importOneTab" className="m-3">
            <h3><span className="i18n" title="hideShowImportOnetabFunction"></span></h3>
            <textarea id="importOnetabTextarea" value={onetabTextAreaValue}
                      onChange={e => setOnetabTextareaValue(e.target.value)}/>
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

            <div>
                <button id="exportJson" type="button" onClick={exportJson} className="btn btn-outline-primary">
                    <span className="i18n" title="exportJson"></span>
                </button>

                <button id="importJson" type="button" onClick={importJson} className="btn btn-outline-primary">
                    <span className="i18n" title="importJson"></span>
                </button>
                <input className="form-control" hidden={true} type="file" id="importJsonInput" accept=".json"
                       onChange={handleJsonUpload}/>
            </div>

        </div>
    </div>)
}