import * as React from 'react';
import {useEffect, useState} from 'react';
import {TabGroup, loadAllTabGroup, updateTabGroup, BrowserTab} from "../storage";
import * as moment from 'moment';


export default function TabsApp() {
    const [tabs, setTabs] = useState<TabGroup[]>([]);
    useEffect(() => {
        loadAllTabGroup().then(r => {
            console.log(r)
            setTabs(r);
        });
    }, []);

    useEffect(() => {
        chrome.runtime.onMessage.addListener((msg: { action: string }) => {
            if (msg.action === "tabGroups-changed") {
                loadAllTabGroup().then(r => {
                    setTabs(r);
                });
            }
        });
    }, []);

    function deleteTabGroup(tabGroup: TabGroup) {
        chrome.storage.local.get("tabGroupIds", (s: { tabGroupIds: string[] }) => {
            chrome.storage.local.set({tabGroupIds: s.tabGroupIds.filter(x => x !== tabGroup.id)})
        });
        chrome.storage.local.remove(tabGroup.id);
        setTabs(tabs.filter(x => x.id !== tabGroup.id));
    }


    function openInThisWindow(tabGroup: TabGroup) {
        for (let tab of tabGroup.tabs) {
            chrome.tabs.create({url: tab.url});
        }
    }

    function lockTabGroup(tabGroup: TabGroup) {
        tabGroup.lock = true;
        // chrome.storage.local.set()
    }

    function renameTabGroup(tabGroup: TabGroup) {

    }

    function deleteTab(tabGroup: TabGroup, tab: BrowserTab) {
        tabGroup.tabs = tabGroup.tabs.filter(x => x.id === tab.id);
        updateTabGroup(tabGroup);
    }

    function upTabGroup(tabGroup: TabGroup) {
        //     未实现
    }

    function shareTabGroup(x: TabGroup) {
        //     未实现
    }

    return (
        <div>
            {tabs.map(x =>
                <div id={x.id} className="tabgroup m-3">
                    <div className="tabgroup-title">
                        <h4>
                            {x.title.length !== 0 ? x.title : "未命名标签组"}
                            {/*<span className="tabgroup-date">{Date. x.created_at}</span>*/}
                            <a className="btn btn-link" onClick={() => openInThisWindow(x)}>打开标签组</a>
                            <a className="btn btn-link" onClick={() => deleteTabGroup(x)}>删除标签组</a>
                            {/*<a className="btn btn-link" onClick={() => shareTabGroup(x)}>分享标签组</a>*/}
                            {/*<a className="btn btn-link" onClick={() => lockTabGroup(x)}>锁定标签组</a>*/}
                            {/*<a className="btm btn-link" onClick={upTabGroup}>上移标签组</a>*/}
                            {/*<a className="btn btn-link" onClick={() => renameTabGroup(x)}>重命名标签组</a>*/}
                        </h4>
                    </div>

                    <ul className="list-group">
                        {x.tabs.map((tab: BrowserTab) =>
                            <a className="list-group-item d-flex justify-content-between align-items-center"
                               key={tab.id} href={tab.url} target="_blank">
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