import * as moment from "moment";
import {genObjectId} from "../utils";
import {BrowserTabGroup, loadAllTabGroup} from "../storage";

export class GistApi {
    name: string;
    apiUrl: string;
    gistLog: string[] = [];
    gistStatus: string;
    gistToken: string;
    gistId: string;
    intervalId: NodeJS.Timer;

    protected i18nGetMessage?(name: string): string;

    // 构造操作gist的日志结构
    setHandleGistLog(type: string, handleGistLog: string[]) {
        const handleGistLogMap = {id: genObjectId(), handleGistType: type, handleGistLogs: handleGistLog};
        chrome.storage.local.get(null, function (storage) {
            if (storage.gistLog) {
                console.log("gistLog有值");
                if (storage.gistLog.length >= 100) {
                    const newArr = storage.gistLog;
                    newArr.splice(-1, 1)
                    newArr.unshift(handleGistLogMap);
                    chrome.storage.local.set({gistLog: newArr});
                } else {
                    const newArr = storage.gistLog;
                    newArr.unshift(handleGistLogMap);
                    chrome.storage.local.set({gistLog: newArr});
                }
            } else {
                console.log("gistLog没有值，第一次");
                chrome.storage.local.set({gistLog: [handleGistLogMap]});
            }
        });
    }


    // 操作gist的全局状态，1分钟自动解锁，防止死锁
    setHandleGistStatus(status: string) {
        const expireTime = moment().add(1, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        const gistStatusMap = {type: status, expireTime: expireTime};
        chrome.storage.local.set({handleGistStatus: gistStatusMap});
    }

    // 判断是否已经保存了gistId
    isIdStoreLocal(updateAction = false): void {
        console.log(`是否已经保存了${this.name}的gistId`)
        this.gistLog.push(`${this.i18nGetMessage("startCheckGistIdSaved")}`)
        chrome.storage.local.get("this.gistId", (storage) => {
            if (storage.this.gistId) {
                console.log(`已经保存了${this.name}的gistId`)
                this.gistLog.push(`${this.i18nGetMessage("gistIdSaved")}`)
                this.gistId = storage.this.gistId;
                if (updateAction) {
                    loadAllTabGroup()
                        .then(r => this.updateGist(r));
                }
            } else {
                console.log(`没有保存了${this.name}的gistId`)
                this.gistLog.push(`${this.i18nGetMessage("gistIdNoSaved")}`)
                this.gistStatus = undefined;
            }
        });
    }

    // 判断是否已经保存Token
    isTokenStoreLocal(updateAction = false) {
        console.log(`是否已经保存${this.name}的Token`)
        this.gistLog.push(`${this.i18nGetMessage("startCheckTokenSaved")}`);
        chrome.storage.local.get("this.gistToken", (storage) => {
            if (storage.this.gistToken) {
                console.log(`已经保存${this.name}的Token`)
                this.gistLog.push(`${this.i18nGetMessage("TokenSaved")}`);
                this.gistToken = storage.this.gistToken;
                this.isIdStoreLocal(updateAction);
            } else {
                console.log(`没有保存${this.name}的Token`)
                this.gistLog.push(`${this.i18nGetMessage("TokenNoSaved")}`);
                this.gistStatus = undefined;
            }
        });
    }

    // 开始推送gist
    startPushToGist() {
        console.log(`开始推送${this.name}`)
        this.gistLog.length = 0;
        this.gistLog.push(`${this.i18nGetMessage("start")}${moment().format('YYYY-MM-DD HH:mm:ss')}`);
        this.gistLog.push(`${this.i18nGetMessage("autoPushToGist")}`)
        chrome.storage.local.get(null, (storage) => {
            console.log(storage.handleGistStatus);
            if (storage.handleGistStatus) {
                console.log("handleGistStatus有值");
                if (storage.handleGistStatus.type === "IDLE") {
                    this.pushToGist();
                } else {
                    const time = moment().format('YYYY-MM-DD HH:mm:ss');
                    const expireTime = storage.handleGistStatus.expireTime;
                    console.log(expireTime)
                    if (time > expireTime) {
                        this.pushToGist();
                    } else {
                        this.gistLog.push(storage.handleGistStatus.type)
                        this.gistLog.push(`${this.i18nGetMessage("endPushToGistTask")}`)
                        this.gistLog.push(`${this.i18nGetMessage("end")}${moment().format('YYYY-MM-DD HH:mm:ss')}`);
                        this.setHandleGistLog(`${this.i18nGetMessage("autoPush")}`, this.gistLog);
                    }
                }
            } else {
                console.log("handleGistStatus没有值，第一次");
                this.pushToGist();
            }
        });
    }


    // 推送到gist
    pushToGist(): void {
        console.log(`推送${this.name}`)
        this.setHandleGistStatus(`${this.i18nGetMessage("pushToGistIng")}`);
        let usedSeconds = 0;
        this.gistStatus = `${this.i18nGetMessage("startPushToGistTask")}`;
        this.gistLog.push(`${this.i18nGetMessage("startPushToGistTask")}`)
        if (typeof (this.gistStatus) != "undefined") {
            this.intervalId = setInterval(() => {
                if (typeof (this.gistStatus) != "undefined") {
                    usedSeconds++;
                } else {
                    clearInterval(this.intervalId);
                    this.gistLog.push(`${usedSeconds}${this.i18nGetMessage("secondWait")}`);
                    this.gistLog.push(`${this.i18nGetMessage("endPushToGistTask")}`);
                    this.gistLog.push(`${this.i18nGetMessage("end")}${moment().format('YYYY-MM-DD HH:mm:ss')}`);
                    this.setHandleGistStatus("IDLE");
                    this.setHandleGistLog(`${this.i18nGetMessage("autoPush")}`, this.gistLog);
                }
            }, 1000);
            console.log(this.intervalId)
            this.isTokenStoreLocal(true);
        }
    }

    // 更新gist
    // TODO: 更新Settings的基类方法。
    protected updateGist?(tabGroups: BrowserTabGroup[]): void;

    protected checkCommunicationStatus?(callback: (request: Promise<Response>, api_name: string, status_elem_id: string, success: string, failed: string) => Promise<void>): void;

    // 检查是否同步gist
    checkAutoSync(): void {
        console.log(`检查是否同步`)
        chrome.storage.local.get(null, (items) => {
            const autoSync = items.autoSync;
            if (autoSync === true) {
                console.log("autoSync open");
                this.startPushToGist();
            }
        });
    }

}
