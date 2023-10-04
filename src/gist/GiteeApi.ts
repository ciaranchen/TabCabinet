import {GistApi} from "./common";
import {BrowserTabGroup} from "../storage";

export class GiteeApi extends GistApi {
    name = 'gitee';
    apiUrl = "https://gitee.com/api/v5";

    protected i18nGetMessage(name: string): string {
        const msg_map = new Map([
            ["startCheckGistIdSaved", "startCheckGiteeTokenSaved"],
            ["gistIdSaved", "giteeTokenSaved"],
            ["gistIdNoSaved", "giteeTokenNoSaved"],
            ["autoPushToGist", "autoPushToGiteeGist"],
            // ["endPushToGist", "endPushToGiteeGist"],
            ["autoPush", "autoPushGitee"],
            ["pushToGistIng", "pushToGiteeGistIng"],
            ["startPushToGistTask", "startPushToGiteeGistTask"],
            ["endPushToGistTask", "endPushToGiteeGistTask"],
        ]);
        return chrome.i18n.getMessage(msg_map.get(name) ? msg_map.get(name) : name);
    }

    // 更新gitee的gist
    protected updateGist(tabGroups: BrowserTabGroup[]) {
        console.log("更新 gitee 的gist")
        console.info(`${chrome.i18n.getMessage("directUpdate")}`)
        const _content = JSON.stringify(tabGroups);
        // TODO: get settings
        const data = {
            "description": "myCloudSkyMonster", "public": false, "files": {
                "TabGroups.json": {"content": _content}, "Settings.json": {"content": ""}
            }
        };
        // 使用Fetch API发送PATCH请求到Gitee Gist
        fetch(`${this.apiUrl}/gists/${this.gistId}`, {
            method: "PATCH", headers: {
                "Authorization": `token ${this.gistToken}`, "Content-Type": "application/json"
            }, body: JSON.stringify(data)
        })
            .then(response => {
                if (response.status === 200) {
                    console.log("更新成功");
                    return response.json();
                } else {
                    console.log("更新失败");
                    throw new Error(response.statusText);
                }
            })
            .then(data => {
                chrome.storage.local.set({"taskJsUrl": data.files['brower_tasks.js'].raw_url});
                console.info(`${chrome.i18n.getMessage("updateSuccess")}`);
            })
            .catch(error => {
                console.info(`${chrome.i18n.getMessage("updateFailed")}-->${error.message}`);
            })
            .finally(() => {
                this.gistStatus = undefined;
            });
    }

    checkCommunicationStatus(callback: (request: Promise<Response>, api_name: string, status_elem_id: string, success: string, failed: string) => Promise<void>): void {
        callback(fetch(this.apiUrl + "/emojis"), this.name, "giteeStatus", "giteeApiStatusSuccess", "giteeApiStatusFailed");
    }
}


