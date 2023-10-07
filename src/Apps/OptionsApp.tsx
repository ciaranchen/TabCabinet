import * as React from "react";
import TabsApp from "./TabsApp";
import SettingsApp from "./SettingsApp";
import {ImportsApp} from "./ImportsApp";

export function OptionsApp() {
    // TODO: 提供更明显的提示。
    return (
        <div>
            <nav className="navbar navbar-expand-lg bg-body-tertiary">
                <div className="container-fluid">
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                            data-bs-target="#navbarTogglerDemo03"
                            aria-controls="navbarTogglerDemo03" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <a className="home navbar-brand" href="#">Tab Cabinet</a>
                    <div id="navbar" className="navbar-collapse collapse">
                        <ul className="nav navbar-nav">
                            <li className="nav-item">
                                <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#home-tab-pane"
                                        type="button"
                                        role="tab" aria-controls="home-tab-pane" aria-selected="true">
                                    <span className="i18n" title="home"></span>
                                </button>
                            </li>
                            <li className="nav-item">
                                <button className="nav-link" data-bs-toggle="tab" data-bs-target="#settings-tab-pane"
                                        type="button"
                                        role="tab" aria-controls="settings-tab-pane" aria-selected="false">
                                    <span className="i18n" title="Settings"></span>
                                </button>
                            </li>
                            <li className="nav-item">
                                <button className="nav-link" data-bs-toggle="tab"
                                        data-bs-target="#imports-exports-tab-pane"
                                        type="button" role="tab" aria-controls="imports-exports-tab-pane"
                                        aria-selected="false">
                                    <span className="i18n" title="ImportsExports"></span>
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div className="d-flex">
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <a className="nav-link disabled"><span id="usage"></span></a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link disabled"><span id="githubStatus"></span></a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link disabled"><span id="giteeStatus"></span></a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <div className="container-fluid tab-content">
                <div className="tab-pane fade show active m-3" id="home-tab-pane" role="tabpanel"
                     aria-labelledby="home-tab">
                    <div className="container">
                        <div className="row">
                            <div className="col">
                                <button type="button" className="btn btn-light" id="pushToGithubGist"
                                        onClick={() => chrome.runtime.sendMessage({
                                            action: "push-gist",
                                            api: "github"
                                        })}>
                                    <span className="i18n" title="pushToGithubGist"></span>
                                </button>
                            </div>
                            <div className="col">
                                <button type="button" className="btn btn-light" id="pullFromGithubGist"
                                        onClick={() => chrome.runtime.sendMessage({
                                            action: "pull-gist",
                                            api: "github"
                                        })}>
                                    <span className="i18n" title="pullFromGithubGist"></span>
                                </button>
                            </div>
                            <div className="col">
                                <button type="button" className="btn btn-light" id="pushToGiteeGist"
                                        onClick={() => chrome.runtime.sendMessage({action: "push-gist", api: "gitee"})}>
                                    <span className="i18n" title="pushToGiteeGist"></span>
                                </button>
                            </div>
                            <div className="col">
                                <button type="button" className="btn btn-light" id="pullFromGiteeGist"
                                        onClick={() => chrome.runtime.sendMessage({action: "pull-gist", api: "gitee"})}>
                                    <span className="i18n" title="pullFromGiteeGist"></span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <TabsApp/>
                </div>

                <div className="tab-pane fade m-3" id="settings-tab-pane" role="tabpanel"
                     aria-labelledby="settings-tab">
                    <SettingsApp/>
                </div>

                <div className="tab-pane fade m-3" id="imports-exports-tab-pane" role="tabpanel"
                     aria-labelledby="imports-exports-tab">
                    <ImportsApp/>
                </div>
            </div>
        </div>
    )
}
