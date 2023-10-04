import {BrowserTabGroup, loadAllTabGroup, saveSettings, Settings} from "./storage";

export class GistApi {
    gistToken: string;
    gistId: string;

    protected name: string;
    protected apiUrl: string;
    protected gistApiUrl: string;

    protected i18nGetMessage?(name: string): string;
    protected checkCommunicationStatus?(callback: (request: Promise<Response>, api_name: string, status_elem_id: string, success: string, failed: string) => Promise<void>): void;


    constructor(gistToken: string, gistId: string) {
        this.gistToken = gistToken;
        this.gistId = gistId;
    }

    gistDataConstructor(tabGroups: BrowserTabGroup[], settings: Settings) {
        return {
            "description": "TabMonster Data Storage", "public": false, "files": {
                "TabGroups.json": {"content": JSON.stringify(tabGroups)},
                "Settings.json": {"content": JSON.stringify(settings)}
            }
        };
    }

    // 新建Gist
    createGist(tabGroups: BrowserTabGroup[], settings: Settings): Promise<string> {
        console.log("还没有创建gist,开始创建");
        console.info(`${chrome.i18n.getMessage("startCreateGithubGist")}`)
        const data = this.gistDataConstructor(tabGroups, settings);

        // 发送Fetch请求
        return fetch(this.apiUrl + this.gistApiUrl, {
            method: "POST", // 使用POST方法
            headers: {
                "Authorization": `token ${this.gistToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data), // 将数据转换为JSON字符串并发送
        })
            .then((response) => {
                if (response.ok) {
                    console.log("创建成功！");
                    return response.json(); // 解析响应的JSON数据
                } else {
                    console.log("创建失败！");
                    throw new Error("创建失败");
                }
            })
            .then((data) => {
                // 处理成功的响应数据
                console.info(chrome.i18n.getMessage("createSuccess"));
                return data.id;
            })
            .catch((error) => {
                // 处理错误
                console.error(error);
                console.info(`${chrome.i18n.getMessage("createFailed")}-->${error.message}`);
            });
    }

    // 更新Gist
    updateGist(tabGroups: BrowserTabGroup[], settings: Settings) {
        console.log(`更新 ${this.name} 的gist`)
        console.info(`${chrome.i18n.getMessage("directUpdate")}`)
        const data = this.gistDataConstructor(tabGroups, settings);
        return new Promise<void>((resolve) => {
            // 使用Fetch API发送PATCH请求到Gitee Gist
            fetch(`${this.apiUrl}${this.gistApiUrl}${this.gistId}`, {
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
                    console.info(`${chrome.i18n.getMessage("updateSuccess")}`);
                    resolve();
                })
                .catch(error => {
                    console.info(`${chrome.i18n.getMessage("updateFailed")}-->${error.message}`);
                });
        });
    }

    pushData(tabGroups: BrowserTabGroup[], settings: Settings) {
        if (this.gistToken && this.gistToken !== "") {
            if (this.gistId && this.gistId !== "") {
                this.updateGist(tabGroups, settings);
            } else {
                this.createGist(tabGroups, settings).then(id => {
                    this.gistId = id;
                    saveSettings({...settings, [this.name + "Id"]: id});
                        // 再更新一次将 Gist Id 上传到同步中
                        // .then(() => this.updateGist(tabGroups, settings));
                });
            }
        } else {
            console.error("should set gistToken first");
        }
    }

    pullData() {
        return new Promise((resolve, reject) => {
            // 发送Fetch请求
            fetch(`${this.apiUrl}${this.gistApiUrl}${this.gistId}`, {
                method: "GET", headers: {
                    "Authorization": `token ${this.gistToken}`,
                }
            })
                .then((response) => {
                    if (response.ok) {
                        return response.json(); // 解析响应的JSON数据
                    } else {
                        throw new Error("根据gistId拉取gist失败了");
                    }
                })
                .then((data) => {
                    const tabGroupsContent = data.files['TabGroups.json'].content;
                    const settingsContent = data.files['Settings.json'].content;
                    const tabGroups = JSON.parse(tabGroupsContent) as BrowserTabGroup;
                    const settings: Settings = JSON.parse(settingsContent) as Settings;
                    resolve({
                        tabGroups: tabGroups,
                        settings: settings
                    });
                })
                .catch((error) => {
                    console.error(error);
                    // alert("根据gistId拉取gist失败了");
                    console.info(`${chrome.i18n.getMessage("pullFailed")}-->${error.message}`);
                });

        });
    }

    checkAutoSync() {
    }
}


export class GiteeApi extends GistApi {
    name = 'gitee';
    apiUrl = "https://gitee.com/api/v5";
    gistApiUrl = "/gists/";

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
}

export class GithubApi extends GistApi {
    name = 'github';
    apiUrl = "https://api.github.com";
    protected gistApiUrl = "/gists/";

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
}
