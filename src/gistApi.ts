import {TabGroup, saveSettings, Settings} from "./storage";

export class GistApi {
    gistToken: string;
    gistId: string;

    protected name: string;
    protected apiUrl: string;
    protected gistApiUrl: string;

    constructor(gistToken: string, gistId: string) {
        this.gistToken = gistToken;
        this.gistId = gistId;
    }

    gistDataConstructor(tabGroups: TabGroup[], settings: Settings) {
        return {
            "description": "TabCabinet Data Storage", "public": false, "files": {
                "TabGroups.json": {"content": JSON.stringify(tabGroups)},
                "Settings.json": {"content": JSON.stringify(settings)}
            }
        };
    }

    // 新建Gist
    createGist(tabGroups: TabGroup[], settings: Settings): Promise<string> {
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
    updateGist(tabGroups: TabGroup[], settings: Settings) {
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
                .then(() => {
                    console.info(`${chrome.i18n.getMessage("updateSuccess")}`);
                    resolve();
                })
                .catch(error => {
                    console.info(`${chrome.i18n.getMessage("updateFailed")}-->${error.message}`);
                });
        });
    }

    pushData(tabGroups: TabGroup[], settings: Settings) {
        return new Promise<void>((resolve, reject) => {
            if (this.gistToken && this.gistToken !== "") {
                if (this.gistId && this.gistId !== "") {
                    this.updateGist(tabGroups, settings).then(() => resolve());
                } else {
                    this.createGist(tabGroups, settings).then(id => {
                        this.gistId = id;
                        saveSettings({...settings, [this.name + "Id"]: id})
                            // 再更新一次将 Gist Id 上传到同步中
                            // .then(() => this.updateGist(tabGroups, settings))
                            .then(() => resolve);
                    });
                }
            } else {
                reject("should set gistToken first");
            }
        });
    }

    pullData() {
        return new Promise<{ tabGroups: TabGroup[], settings: Settings }>((resolve, reject) => {
            if (this.gistToken && this.gistToken !== "" && this.gistId && this.gistId !== "") {
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
                        const tabGroups = JSON.parse(tabGroupsContent) as TabGroup[];
                        const settings: Settings = JSON.parse(settingsContent) as Settings;
                        resolve({
                            tabGroups: tabGroups,
                            settings: settings
                        });
                    })
                    .catch((error) => {
                        reject(error);
                        // alert("根据gistId拉取gist失败了");
                        console.info(`${chrome.i18n.getMessage("pullFailed")}-->${error.message}`);
                    });
            } else {
                reject("Need push first.")
            }
        });
    }
}


export class GiteeApi extends GistApi {
    name = 'gitee';
    apiUrl = "https://gitee.com/api/v5";
    gistApiUrl = "/gists/";
}

export class GithubApi extends GistApi {
    name = 'github';
    apiUrl = "https://api.github.com";
    protected gistApiUrl = "/gists/";
}
