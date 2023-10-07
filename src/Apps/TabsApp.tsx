import * as React from 'react';
import {useEffect, useState} from 'react';
import {TabGroup, loadAllTabGroup, updateTabGroup, BrowserTab} from "../storage";
import * as moment from 'moment';


export default function TabsApp() {
    const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
    useEffect(() => {
        loadAllTabGroup().then(r => {
            console.log(r)
            setTabGroups(r);
        });
    }, []);

    useEffect(() => {
        chrome.runtime.onMessage.addListener((msg: { action: string }) => {
            if (msg.action === "tabGroups-changed") {
                loadAllTabGroup().then(r => {
                    setTabGroups(r);
                });
            }
        });
    }, []);

    function deleteTabGroup(tabGroup: TabGroup) {
        chrome.storage.local.get("tabGroupIds", (s: { tabGroupIds: string[] }) => {
            chrome.storage.local.set({tabGroupIds: s.tabGroupIds.filter(x => x !== tabGroup.id)})
        });
        chrome.storage.local.remove(tabGroup.id);
        setTabGroups(tabGroups.filter(x => x.id !== tabGroup.id));
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
        const updatedItem = [...tabGroups]
        const index = updatedItem.findIndex(x => x.id === tabGroup.id);
        updatedItem[index].tabs = tabGroup.tabs.filter(x => x.id !== tab.id);
        updateTabGroup(updatedItem[index]).then(() => {
            setTabGroups(updatedItem);
        });
    }

    function upTabGroup(tabGroup: TabGroup) {
        //     未实现
    }

    function shareTabGroup(x: TabGroup) {
        //     未实现
    }

    // TODO: 针对空组的时候应有提示。
    return (
        <div>
            {tabGroups.map(group =>
                <div id={group.id} className="tabgroup m-3" key={group.id}>
                    <div className="tabgroup-title">
                        <h4>
                            {group.title.length !== 0 ? group.title : "未命名标签组"}
                            {/*<span className="tabgroup-date">{x.created_at}</span>*/}
                            <a className="btn btn-link" onClick={() => openInThisWindow(group)}>打开标签组</a>
                            <a className="btn btn-link" onClick={() => deleteTabGroup(group)}>删除标签组</a>
                            {/*<a className="btn btn-link" onClick={() => shareTabGroup(group)}>分享标签组</a>*/}
                            {/*<a className="btn btn-link" onClick={() => lockTabGroup(group)}>锁定标签组</a>*/}
                            {/*<a className="btm btn-link" onClick={upTabGroup}>上移标签组</a>*/}
                            {/*<a className="btn btn-link" onClick={() => renameTabGroup(group)}>重命名标签组</a>*/}
                        </h4>
                    </div>

                    <ul className="list-group">
                        {group.tabs.map((tab: BrowserTab) =>
                            <a className="list-group-item d-flex justify-content-between align-items-center"
                               key={tab.id} href={tab.url} target="_blank">
                                {tab.title ? tab.title : " "}
                                <button type="button" className="btn-close " aria-label="Close"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            deleteTab(group, tab);
                                        }}></button>
                            </a>
                        )}
                    </ul>
                </div>
            )}
        </div>
    )
}