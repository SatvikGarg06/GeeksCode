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
        </div>
    );
}
