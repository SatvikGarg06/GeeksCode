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

export default function Sidebar({ folderName, folderPath, entries, onOpenFolder, onFileClick, activeFile, style, onRefresh }) {
    const [isCreating, setIsCreating] = useState(null);
    const [newName, setNewName] = useState('');

    return (
        <div id="sidebar" style={style}>
            <div className="sidebar-header">
                <span className="sidebar-title">EXPLORER</span>
            </div>
            {folderPath ? (
                <>
                    <div id="folder-header">
                        <span id="folder-name" className="folder-name">{folderName}</span>
                        <div className="folder-actions">
                            <button className="folder-action-btn" title="New File" onClick={() => {
                                setIsCreating('file');
                            }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1">
                                    <path d="M9.5 1H3.5C3.22 1 3 1.22 3 1.5V14.5C3 14.78 3.22 15 3.5 15H12.5C12.78 15 13 14.78 13 14.5V4.5L9.5 1Z" fill="none" />
                                    <path d="M9.5 1V4.5H13" fill="none" />
                                    <path d="M8 7V13M5 10H11" strokeWidth="1.2" />
                                </svg>
                            </button>
                            <button className="folder-action-btn" title="New Folder" onClick={() => {
                                setIsCreating('folder');
                            }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1">
                                    <path d="M1.5 3H6.5L8 4.5H14.5V13.5H1.5V3Z" fill="none" />
                                    <path d="M8 7V12M5.5 9.5H10.5" strokeWidth="1.2" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div id="file-tree">
                        {isCreating && (
                            <div className='tree-item' style={{ paddingLeft: '28px' }}>
                                <span className='file-icon'>
                                    {isCreating === 'file' ? getFileIcon(newName).icon : FOLDER_ICON}
                                </span>
                                <input
                                    autoFocus
                                    className='inline-rename-input'
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && newName.trim()) {
                                            const fullPath = folderPath + '/' + newName.trim();
                                            if (isCreating === 'file') {
                                                await window.electronAPI.createFile(fullPath);
                                                onFileClick(fullPath, newName.trim());
                                            } else {
                                                await window.electronAPI.createFolder(fullPath);
                                            }
                                            setIsCreating(null);
                                            setNewName('');
                                            if (onRefresh) onRefresh()
                                        }
                                        if (e.key === 'Escape') {
                                            setIsCreating(null);
                                            setNewName('');
                                        }
                                    }}
                                    onBlur={() => {
                                        // Small delay so Enter's async handler can finish first
                                        setTimeout(() => {
                                            setIsCreating(null);
                                            setNewName('');
                                        }, 150);
                                    }} />
                            </div>
                        )}
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
