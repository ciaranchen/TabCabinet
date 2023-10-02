// 生成唯一标识
// refer: https://gist.github.com/solenoid/1372386
export function genObjectId() {
    const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
    return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/x/g, function () {
        return (Math.random() * 16 | 0).toString(16);
    }).toLowerCase();
}