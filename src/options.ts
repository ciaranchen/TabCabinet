import '../styles/options.scss';

// Import all of Bootstrap's JS
import 'bootstrap';
import {createElement} from "react";
import {createRoot} from "react-dom/client";

import {GithubApi, GiteeApi, GistApi} from "./gistApi";
import {exportDefault, importDefault, importOneTab} from "./imports";
import TabsApp from './Apps/TabsApp'
import SettingsApp from "./Apps/SettingsApp";
import {
    BrowserTabGroup,
    loadAllTabGroup,
    loadSettings,
    saveSettings,
    saveTabGroup,
    Settings,
    tabGroupFromTabArr
} from "./storage";


// 加载Settings，初始化Api
let settings, githubApi: GithubApi, giteeApi: GiteeApi;
updateWithSettingsChanged();

chrome.runtime.onMessage.addListener((msg: {action: string}) => {
    updateWithSettingsChanged();
});

function updateWithSettingsChanged() {
    loadSettings().then(r => {
        settings = r;
        githubApi = new GithubApi(settings.githubToken, settings.githubId);
        giteeApi = new GiteeApi(settings.giteeToken, settings.giteeId);
        // 检查跟github的通讯是否正常
        // githubApi.checkCommunicationStatus(checkStatusCallback);
        // 检查跟gitee的通讯是否正常
        // giteeApi.checkCommunicationStatus(checkStatusCallback);
    });
}

// Load React App for TabGroups
const tabsContainerNode = document.getElementById("tabs-container");
const tabsContainerRoot = createRoot(tabsContainerNode);
tabsContainerRoot.render(createElement(TabsApp));
// Load React App for Settings
const settingsContainerNode = document.getElementById("settings-container");
const settingsContainerRoot = createRoot(settingsContainerNode);
settingsContainerRoot.render(createElement(SettingsApp));


document.addEventListener('DOMContentLoaded', function () {
    // 处理i18n字串
    // 选取所有带有class="i18n"的<span>元素
    const i18nSpans = document.querySelectorAll('span.i18n');

    // 遍历每个选中的<span>元素
    i18nSpans.forEach(function (span) {
        // 获取<span>元素的title属性值
        const title = span.getAttribute('title');

        // 如果title属性存在，则将其作为国际化消息的键获取消息并替换文本内容
        if (title) {
            const message = chrome.i18n.getMessage(title);
            if (message) {
                span.textContent = message;
            } else {
                span.textContent = title;
            }
        }
    });
});


// 检查API状态
async function checkStatusCallback(request: Promise<Response>, api_name: string, status_elem_id: string, success: string, failed: string) {
    try {
        const response = await request;
        if (response.ok) {
            console.log(`与 ${api_name} 通信正常！`);
            await response.json();
        } else {
            throw new Error(`${api_name} API 请求失败`);
        }

        document.getElementById(status_elem_id).innerHTML = chrome.i18n.getMessage(success);
        // 在这里处理从 GitHub API 返回的数据
    } catch (error) {
        document.getElementById(status_elem_id).innerHTML = chrome.i18n.getMessage(failed);
        // 处理请求失败的情况
        console.error(error);
    }
}


// 检查存储空间用量
chrome.storage.local.get(null, function (items) {
    // 一load完就算一下storage占用了多少空间
    chrome.storage.local.getBytesInUse(null, function (bytes) {
        console.log("total is " + bytes / 1024 / 1024 + "mb");
        document.getElementById('usage').innerHTML = `${chrome.i18n.getMessage("usedSpace")}${Math.round(bytes / 1024 / 1024 * 100) / 100}mb/5mb`;
    });
});


// 实现Imports和Exports的绑定
const onetabImportButton = document.getElementById("importOnetabMode");
onetabImportButton.onclick = importOneTab;
const defaultImportButton = document.getElementById("importDefaultMode");
defaultImportButton.onclick = importDefault;
const exportDefaultButton = document.getElementById("exportDefaultMode");
exportDefaultButton.onclick = exportDefault;


// Handle Gist Push
const pushGithubButton = document.getElementById("pushToGithubGist");
const pushGiteeButton = document.getElementById("pushToGiteeGist");
pushGithubButton.onclick = () => pushGist(githubApi);
pushGiteeButton.onclick = () => pushGist(giteeApi);

function pushGist(api: GistApi) {
    // TODO: 提供更明显的提示。
    if (!giteeApi || !giteeApi.gistToken) {
        console.error("No token");
        return;
    }

    loadAllTabGroup().then(
        tabGroups => {
            loadSettings().then(settings => {
                api.pushData(tabGroups, settings);
            });
        }
    )
}

// Handle Gist Pull
const pullGithubButton = document.getElementById("pullFromGithubGist");
const pullGiteeButton = document.getElementById("pullFromGiteeGist");
pullGithubButton.onclick = () => pullGist(githubApi);
pullGiteeButton.onclick = () => pullGist(giteeApi);

function pullGist(api: GistApi) {
    // TODO: 提供更明显的提示。
    if (!giteeApi || !giteeApi.gistToken) {
        console.error("No token");
        return;
    }

    api.pullData().then((r: {tabGroups: BrowserTabGroup[], settings: Settings}) => {
        saveSettings(r.settings);
        for (let group of r.tabGroups) {
            chrome.storage.local.set({[group.id]: group});
        }
        // TODO: 清除Storage中的原有数据。
        chrome.storage.local.set({tabGroupIds: r.tabGroups.map(x => x.id)}).then(() => {
            chrome.runtime.sendMessage({action: "tabGroup-changed"});
        });
    });
}
