import {GistApi} from "./common";
import {BrowserTabGroup} from "../storage";

export class GithubApi extends GistApi {
    name = 'github';
    apiUrl = "https://api.github.com";

    protected i18nGetMessage(name: string): string {
        const msg_map = new Map([
            ["startCheckGistIdSaved", "startCheckGithubTokenSaved"],
            ["gistIdSaved", "githubTokenSaved"],
            ["gistIdNoSaved", "githubTokenNoSaved"],
            ["autoPushToGist", "autoPushToGithubGist"],
            // ["endPushToGist", "endPushToGithubGist"],
            ["autoPush", "autoPushGithub"],
            ["pushToGistIng", "pushToGithubGistIng"],
            ["startPushToGistTask", "startPushToGithubGistTask"],
            ["endPushToGistTask", "endPushToGithubGistTask"],
        ]);
        return chrome.i18n.getMessage(msg_map.get(name) ? msg_map.get(name) : name);
    }

    protected updateGist(tabGroups: BrowserTabGroup[]) {
        console.log("更新github的gist")
        console.info(`${chrome.i18n.getMessage("directUpdate")}`)
        const _content = JSON.stringify(tabGroups);
        const data = {
            "description": "Tab Monster Data", "public": false, "files": {
                "brower_Tabs.json": {"content": _content}
            }
        };
        // 使用Fetch API发送PATCH请求
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

    // 检查跟github的通讯是否正常
    checkCommunicationStatus(callback: (request: Promise<Response>, api_name: string, status_elem_id: string, success: string, failed: string) => Promise<void>): void {
        callback(fetch(this.apiUrl), this.name, "githubStatus", "githubApiStatusSuccess", "githubApiStatusFailed");
    }
}


