import React from 'react';
import { getFileIcon } from '../utils/fileUtils';

export default function TabsBar({ tabs, activeTab, onSwitchTab, onCloseTab }) {
    const hasTabs = tabs.length > 0;

    return (
        <div id="tabs-bar" className={hasTabs ? 'has-tabs' : ''}>
            <div id="tabs-container">
                {tabs.map((tab) => {
                    const iconInfo = getFileIcon(tab.fileName);
                    const isActive = tab.filePath === activeTab;
                    let className = 'tab';
                    if (isActive) className += ' active';
                    if (tab.isDirty) className += ' dirty';

                    return (
                        <div
                            key={tab.filePath}
                            className={className}
                            data-path={tab.filePath}
                            onClick={() => onSwitchTab(tab.filePath)}
                        >
                            <span className="tab-icon">{iconInfo.icon}</span>
                            <span className="tab-label">{tab.fileName}</span>
                            <span className="tab-dirty"></span>
                            <span
                                className="tab-close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab(tab.filePath);
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M2 2L10 10M10 2L2 10" />
                                </svg>
                            </span>
                        </div>
                    );
                })}
            </div>
            {hasTabs && (
                <div className="editor-title-actions">
                    <button className="run-code-btn" title="Run Code">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M3.78 2a.77.77 0 0 0-.78.78v10.44c0 .43.35.78.78.78.14 0 .27-.04.39-.11l8.44-5.22a.78.78 0 0 0 0-1.34L4.17 2.11A.77.77 0 0 0 3.78 2z" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
