import '../styles/options.scss';

// Import all of Bootstrap's JS
import 'bootstrap';
import {createRoot} from "react-dom/client";

import TabsApp from './Apps/TabsApp'
import {createElement} from "react";
import {GithubApi} from "./gist/GithubApi";
import {GiteeApi} from "./gist/GiteeApi";
import {importOneTab} from "./imports";

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


// Load React App for TabGroups
const domNode = document.getElementById("tabs-container");
const root = createRoot(domNode);
root.render(createElement(TabsApp));


// 检查API状态
// 检查跟github的通讯是否正常
new GithubApi().checkCommunicationStatus(checkStatusCallback);
// 检查跟gitee的通讯是否正常
new GiteeApi().checkCommunicationStatus(checkStatusCallback);

async function checkStatusCallback(request: Promise<Response>, api_name: string, status_elem_id: string, success: string, failed: string) {
    try {
        let response = await request;
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

