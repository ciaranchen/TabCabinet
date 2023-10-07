// 生成唯一标识
// refer: https://gist.github.com/solenoid/1372386
export function genObjectId() {
    const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
    return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/x/g, function () {
        return (Math.random() * 16 | 0).toString(16);
    }).toLowerCase();
}

export function downloadJsonFile(obj: any, filename: string) {
    const blob = new Blob([JSON.stringify(obj)], {type: 'application/json'});
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 释放URL对象
    window.URL.revokeObjectURL(url);
}