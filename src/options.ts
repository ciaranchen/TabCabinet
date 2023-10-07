import '../styles/options.scss';

// Import all of Bootstrap's JS
import 'bootstrap';
import {createElement} from "react";
import {createRoot} from "react-dom/client";
import {OptionsApp} from "./Apps/OptionsApp";


const reactAppNode = document.getElementById("react-app");
const reactAppRoot = createRoot(reactAppNode);
reactAppRoot.render(createElement(OptionsApp));

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

    // 检查存储空间用量
    chrome.storage.local.getBytesInUse(null, function (bytes) {
        console.log("total is " + bytes / 1024 / 1024 + "mb");
        document.getElementById('usage').innerHTML = `${chrome.i18n.getMessage("usedSpace")}${Math.round(bytes / 1024 / 1024 * 100) / 100}mb/5mb`;
    });
});
