import * as React from 'react';
import {useEffect, useState} from "react";
import {defaultSettings, loadSettings, saveSettings, Settings} from "../storage";
import {useToasts} from "react-bootstrap-toasts";


export default function SettingsApp(props: {
    setGithubPushAvail: (arg0: boolean) => void; setGithubPullAvail: (arg0: boolean) => void;
    setGiteePushAvail: (arg0: boolean) => void; setGiteePullAvail: (arg0: boolean) => void;
}) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);

    useEffect(() => {
        loadSettings().then(r => {
            setSettings(r);
            props.setGithubPushAvail(r.githubToken !== "");
            props.setGiteePushAvail(r.giteeToken !== "");
            props.setGithubPullAvail(r.githubId !== "");
            props.setGiteePullAvail(r.giteeId !== "");
        });
    }, []);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value, type, checked} = event.target;
        let finalValue: string | boolean | number;
        if (name === 'autoSyncInterval') {
            finalValue = parseInt(value);
        } else {
            finalValue =  type === 'checkbox' ? checked : value
        }
        setSettings((prevState) => ({
            ...prevState,
            [name]: finalValue,
        }));
    }

    const toasts = useToasts();
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        // 将数据保存至storage
        saveSettings(settings).then(() => toasts.show({
            headerContent: <span className="me-auto">{chrome.i18n.getMessage("Settings")}</span>,
            bodyContent: chrome.i18n.getMessage("saveSettingsSuccess")
        }));
    }

    return (<div className="container">
        <h2><span className="i18n" title="Settings"></span></h2>
        <form onSubmit={handleSubmit}>
            <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" role="switch" id="deleteAfterOpenTabGroup"
                       name="deleteAfterOpenTabGroup"
                       onChange={handleInputChange} checked={settings.deleteAfterOpenTabGroup}/>
                <label className="form-check-label" htmlFor="deleteAfterOpenTabGroup">
                    <span className="i18n" title="deleteAfterOpenTabGroup"></span>
                </label>
            </div>
            <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" role="switch" id="openOptionsAfterSendTab"
                       name="openOptionsAfterSendTab"
                       onChange={handleInputChange} checked={settings.openOptionsAfterSendTab}/>
                <label className="form-check-label" htmlFor="openOptionsAfterSendTab">
                    <span className="i18n" title="openOptionsAfterSendTab"></span>
                </label>
            </div>

            <div className="mb-3 row">
                <label htmlFor="githubToken" className="col-sm-2 col-form-label">
                    <span className="i18n" title="githubToken"></span></label>
                <div className="col-sm-5">
                    <input type="password" className="form-control" id="githubToken" placeholder="Github Token"
                           name="githubToken" onChange={handleInputChange} value={settings.githubToken}/>
                </div>
            </div>

            <div className="mb-3 row">
                <label htmlFor="githubId" className="col-sm-2 col-form-label">
                    <span className="i18n" title="githubId"></span></label>
                <div className="col-sm-5">
                    <input className="form-control" id="githubId" value={settings.githubId}
                           placeholder={chrome.i18n.getMessage("githubIdPlaceholder")} disabled={true}/>
                </div>
            </div>

            <div className="mb-3 row">
                <label htmlFor="giteeToken" className="col-sm-2 col-form-label">
                    <span className="i18n" title="giteeToken"></span></label>
                <div className="col-sm-5">
                    <input type="password" className="form-control" id="giteeToken" placeholder="Gitee Token"
                           name="giteeToken" onChange={handleInputChange} value={settings.giteeToken}/>
                </div>
            </div>

            <div className="mb-3 row">
                <label htmlFor="giteeId" className="col-sm-2 col-form-label">
                    <span className="i18n" title="giteeId"></span></label>
                <div className="col-sm-5">
                    <input className="form-control" id="giteeId" value={settings.giteeId}
                           placeholder={chrome.i18n.getMessage("giteeIdPlaceholder")} disabled={true}/>
                </div>
            </div>

            <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" role="switch" id="inTimeSync"
                       name="inTimeSync"
                       onChange={handleInputChange} checked={settings.inTimeSync}/>
                <label className="form-check-label" htmlFor="inTimeSync">
                    <span className="i18n" title="inTimeSync"></span>
                </label>
            </div>

            <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" role="switch" id="autoSync"
                       name="autoSync"
                       onChange={handleInputChange} checked={settings.autoSync}/>
                <label className="form-check-label" htmlFor="autoSync">
                    <span className="i18n" title="autoSync"></span>
                </label>
            </div>

            <div className="mb-3 row" hidden={!settings.autoSync}>
                <label htmlFor="autoSyncInterval" className="col-sm-2 col-form-label">
                    <span className="i18n" title="autoSyncInterval"></span></label>
                <div className="col-sm-5">
                    <input type="number" min="1" className="form-control" id="autoSyncInterval"
                           name="autoSyncInterval" onChange={handleInputChange} value={settings.autoSyncInterval.toString()}/>
                </div>
            </div>

            <button type="submit" className="btn btn-primary">
                <span className="i18n" title="saveButtonValue"></span>
            </button>
        </form>

    </div>)
}
