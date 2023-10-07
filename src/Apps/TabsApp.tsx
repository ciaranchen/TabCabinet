import * as React from 'react';
import {useEffect, useState} from 'react';
import {TabGroup, loadAllTabGroup, updateTabGroup, BrowserTab, deleteTabGroup} from "../storage";
import {DragDropContext, Droppable, Draggable, DropResult} from "react-beautiful-dnd";

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

    function deleteTabGroupAction(tabGroup: TabGroup) {
        deleteTabGroup(tabGroup).then(() => {
            setTabGroups(tabGroups.filter(x => x.id !== tabGroup.id));
        });
    }


    function openInThisWindow(tabGroup: TabGroup) {
        for (let tab of tabGroup.tabs) {
            chrome.tabs.create({url: tab.url});
        }
        chrome.runtime.sendMessage({action: "tabGroup-open", tabGroup: tabGroup})
    }

    function lockTabGroup(group_index: number) {
        const updatedItem = [...tabGroups];
        updatedItem[group_index].lock = true;
        updateTabGroup(updatedItem[group_index], false).then(() => {
            setTabGroups(updatedItem);
        });
    }

    function renameTabGroup(tabGroup: TabGroup) {

    }

    function deleteTab(group_index: number, tab: BrowserTab) {
        const updatedItem = [...tabGroups];
        updatedItem[group_index].tabs = updatedItem[group_index].tabs.filter(x => x.id !== tab.id);
        updateTabGroup(updatedItem[group_index], false).then(() => {
            setTabGroups(updatedItem);
        });
    }

    function upTabGroup(group_index: number) {
        const updatedItem = [...tabGroups];
        if (group_index <= 0) {
            return;
        }
        setTabGroups(updatedItem.slice(0, group_index - 1)
            .concat(updatedItem.slice(group_index - 1, group_index + 1).reverse())
            .concat(updatedItem.slice(group_index + 1)));
    }

    function shareTabGroup(x: TabGroup) {
        //     未实现
    }

    function onDragEnd(result: DropResult) {
        console.log(result);
        const {source, destination, draggableId} = result;

        // dropped outside the list
        if (!destination) {
            return;
        }

        const targetIndex = destination.index,
            sourceTabGroupId = source.droppableId,
            targetTabGroupId = destination.droppableId,
            sourceTabGroup = tabGroups.find(x => x.id === sourceTabGroupId),
            targetTabGroup = tabGroups.find(x => x.id === targetTabGroupId),
            tab = sourceTabGroup.tabs.find(x => x.id.toString() === draggableId);

        if (sourceTabGroupId === targetTabGroupId) {
            // 修改Tab顺序即可
            sourceTabGroup.tabs = sourceTabGroup.tabs.filter(x => x.id !== tab.id);
            sourceTabGroup.tabs.splice(targetIndex, 0, tab);
            const updatedItem = [...tabGroups];
            updatedItem.splice(updatedItem.findIndex(x => x.id === sourceTabGroup.id), 1, sourceTabGroup);
            updateTabGroup(sourceTabGroup, false).then(() => {
                setTabGroups(updatedItem);
            });
        } else {
            sourceTabGroup.tabs = sourceTabGroup.tabs.filter(x => x.id !== tab.id);
            targetTabGroup.tabs.splice(targetIndex, 0, tab);
            updateTabGroup(sourceTabGroup, false).then(() => {
                updateTabGroup(targetTabGroup, false).then(() => {
                    const updatedItem = [...tabGroups];
                    updatedItem.splice(updatedItem.findIndex(x => x.id === sourceTabGroup.id), 1, sourceTabGroup);
                    updatedItem.splice(updatedItem.findIndex(x => x.id === targetTabGroup.id), 1, targetTabGroup);
                    setTabGroups(updatedItem);
                });
            });
        }
    }

    // TODO: 针对空组的时候应有提示。
    return (
        <div>
            <DragDropContext onDragEnd={onDragEnd}>
                {tabGroups.map((group, index) =>
                    <div id={group.id} className="tabgroup m-3" key={group.id}>
                        <div className="tabgroup-title me-0">
                            <h3>
                                {group.title.length !== 0 ? group.title : "未命名标签组"}
                            </h3>
                            {/*<span className="tabgroup-date">{x.created_at}</span>*/}
                            <a className="btn btn-link" onClick={() => openInThisWindow(group)}>打开标签组</a>
                            <a className="btn btn-link" onClick={() => deleteTabGroupAction(group)}>删除标签组</a>
                            {/*<a className="btn btn-link" onClick={() => shareTabGroup(group)}>分享标签组</a>*/}
                            {/*<a className="btn btn-link" onClick={() => lockTabGroup(index)}>锁定标签组</a>*/}
                            <a className="btm btn-link" onClick={() => upTabGroup(index)}
                               hidden={index === 0}>上移标签组</a>
                            {/*<a className="btn btn-link" onClick={() => renameTabGroup(group)}>重命名标签组</a>*/}
                        </div>
                        <Droppable key={group.id} droppableId={`${group.id}`}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="list-group"
                                >
                                    {group.tabs.map((tab: BrowserTab, tab_index) =>
                                        <Draggable draggableId={tab.id.toString()} index={tab_index}
                                                   key={tab.id.toString()}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                >
                                                    <a className="list-group-item d-flex justify-content-between align-items-center"
                                                       key={tab.id} href={tab.url} target="_blank">
                                                        {tab.title ? tab.title : " "}
                                                        <button type="button" className="btn-close " aria-label="Close"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    deleteTab(index, tab);
                                                                }}></button>
                                                    </a>
                                                </div>
                                            )}
                                        </Draggable>
                                    )}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                )}
            </DragDropContext>
        </div>
    )
}