import React, { useState, useCallback } from 'react';
import { getFileIcon, FOLDER_ICON, FOLDER_OPEN_ICON } from '../utils/fileUtils';

function TreeItem({ entry, depth, onFileClick, activeFile }) {
    const [isOpen, setIsOpen] = useState(false);
    const [children, setChildren] = useState(null);

    const handleClick = useCallback(async (e) => {
        e.stopPropagation();
        if (entry.isDirectory) {
            if (!isOpen && children === null) {
                const entries = await window.electronAPI.readDir(entry.path);
                setChildren(entries);
            }
            setIsOpen((prev) => !prev);
        } else {
            onFileClick(entry.path, entry.name);
        }
    }, [entry, isOpen, children, onFileClick]);

    const isSelected = !entry.isDirectory && entry.path === activeFile;

    return (
        <>
            <div
                className={`tree-item${isSelected ? ' selected' : ''}`}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                data-path={entry.path}
                onClick={handleClick}
            >
                {entry.isDirectory ? (
                    <>
                        <span className={`chevron${isOpen ? ' open' : ''}`}>
                            <svg viewBox="0 0 16 16" fill="currentColor">
                                <path d="M6 4l4 4-4 4z" />
                            </svg>
                        </span>
                        <span className="file-icon">{isOpen ? FOLDER_OPEN_ICON : FOLDER_ICON}</span>
                    </>
                ) : (
                    <>
                        <span className="chevron" style={{ visibility: 'hidden' }}>
                            <svg viewBox="0 0 16 16"><path /></svg>
                        </span>
                        <span className="file-icon">{getFileIcon(entry.name).icon}</span>
                    </>
                )}
                <span className="file-label">{entry.name}</span>
            </div>
            {entry.isDirectory && isOpen && children && (
                <div className="tree-children open">
                    {children.map((child) => (
                        <TreeItem
                            key={child.path}
                            entry={child}
                            depth={depth + 1}
                            onFileClick={onFileClick}
                            activeFile={activeFile}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

export default function Sidebar({ folderName, folderPath, entries, onOpenFolder, onFileClick, activeFile, style }) {
    return (
        <div id="sidebar" style={style}>
            <div className="sidebar-header">
                <span className="sidebar-title">EXPLORER</span>
            </div>
            {folderPath ? (
                <>
                    <div id="folder-header" style={{ display: 'block' }}>
                        <span id="folder-name" className="folder-name">{folderName}</span>
                    </div>
                    <div id="file-tree">
                        {entries.map((entry) => (
                            <TreeItem
                                key={entry.path}
                                entry={entry}
                                depth={0}
                                onFileClick={onFileClick}
                                activeFile={activeFile}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div id="open-folder-prompt">
                    <p>No folder opened</p>
                    <button className="btn-primary" onClick={onOpenFolder}>
                        Open Folder
                    </button>
                </div>
            )}
        </div>
    );
}
