import * as React from 'react';
import {useEffect, useState} from 'react';
import {BrowserTabGroup, loadAllTabGroup, updateTabGroup} from "../storage";


export default function TabsApp() {
    const [tabs, setTabs] = useState<BrowserTabGroup[]>([]);
    useEffect(() => {
        loadAllTabGroup().then(r => {
            console.log(r)
            setTabs(r);
        });
    }, []);

    function deleteTabGroup(tabGroup: BrowserTabGroup) {
        chrome.storage.local.get("tabGroupIds", (s: { tabGroupIds: string[] }) => {
            chrome.storage.local.set({tabGroupIds: s.tabGroupIds.filter(x => x !== tabGroup.id)})
        });
        chrome.storage.local.remove(tabGroup.id);
        setTabs(tabs.filter(x => x.id !== tabGroup.id));
    }


    function openInThisWindow(tabGroup: BrowserTabGroup) {
        for (let tab of tabGroup.tabs) {
            chrome.tabs.create({url: tab.url});
        }
    }

    function lockTabGroup(tabGroup: BrowserTabGroup) {
        tabGroup.isLock = true;
        // chrome.storage.local.set()
    }

    function renameTabGroup(tabGroup: BrowserTabGroup) {

    }

    function deleteTab(tabGroup: BrowserTabGroup, tab: { url?: any; title?: any; id?: number }) {
        tabGroup.tabs = tabGroup.tabs.filter((x: { id: number; }) => x.id === tab.id);
        updateTabGroup(tabGroup).then(() => setTabs(tabs));
    }

    function upTabGroup(tabGroup: BrowserTabGroup) {
        //     未实现
    }

    return (
        <div>
            {tabs.map(x =>
                <div id={x.id} className="tabgroup m-3">
                    <div className="tabgroup-title">
                        <h4>
                            {x.groupTitle.length !== 0 ? x.groupTitle : "未命名标签组"}
                            <span className="tabgroup-date">{x.date}</span>
                            <a className="btn btn-link" onClick={() => openInThisWindow(x)}>打开标签组</a>
                            <a className="btn btn-link" onClick={() => deleteTabGroup(x)}>删除标签组</a>
                            {/*<a className="btn btn-link" onClick={() => lockTabGroup(x)}>锁定标签组</a>*/}
                            {/*<a className="btm btn-link" onClick={upTabGroup}>上移标签组</a>*/}
                            {/*<a className="btn btn-link" onClick={() => renameTabGroup(x)}>重命名标签组</a>*/}
                        </h4>
                    </div>

                    <ul className="list-group">
                        {x.tabs.map((tab: { url?: any; title?: any; id?: number; }) =>
                            <a className="list-group-item d-flex justify-content-between align-items-center"
                               key={tab.url} href={tab.url} target="_blank">
                                {tab.title ? tab.title : " "}
                                <button type="button" className="btn-close " aria-label="Close"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            deleteTab(x, tab);
                                        }}></button>
                            </a>
                        )}
                    </ul>
                </div>
            )}
        </div>
    )
}