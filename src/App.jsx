import React, { useState, useEffect, useCallback, useRef } from 'react';
import TitleBar from './components/TitleBar';
import ActivityBar from './components/ActivityBar';
import Sidebar from './components/Sidebar';
import TabsBar from './components/TabsBar';
import WelcomeView from './components/WelcomeView';
import MonacoEditor from './components/MonacoEditor';
import TerminalPanel from './components/TerminalPanel';
import StatusBar from './components/StatusBar';
import { getLanguage, getLanguageLabel } from './utils/fileUtils';

export default function App() {
    // ─── State ──────────────────────────────────────────
    const [isDark, setIsDark] = useState(true);
    const [activePanel, setActivePanel] = useState('explorer');
    const [folderPath, setFolderPath] = useState(null);
    const [folderName, setFolderName] = useState('');
    const [fileEntries, setFileEntries] = useState([]);
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTab, setActiveTab] = useState(null);
    const [panelVisible, setPanelVisible] = useState(false);
    const [panelHeight, setPanelHeight] = useState(250);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
    const [sidebarWidth, setSidebarWidth] = useState(260);

    const editorRef = useRef(null);

    // ─── Theme ──────────────────────────────────────────
    useEffect(() => {
        document.body.classList.toggle('light', !isDark);
    }, [isDark]);

    // ─── Start from last-opened folder ──────────────
    useEffect(() => {
        const loadLastFolder = async () => {
            const lastFolder = await window.electronAPI.getLastFolder();
            if (!lastFolder) return;

            // Check folder exists and open folder
            const entries = await window.electronAPI.readDir(lastFolder);
            if (entries) {
                setFolderPath(lastFolder);
                setFolderName(lastFolder.split('/').pop() || lastFolder.split('\\').pop());
                setFileEntries(entries);

                window.electronAPI.setTerminalCwd(lastFolder);
            }
        }
        loadLastFolder();
    }, []);

    // ─── Titlebar height (macOS vs windows) ──────────────
    useEffect(() => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        if (!isMac) {
            document.documentElement.style.setProperty('--titlebar-height', '0px');
        }
    }, []);

    // ─── IPC: Close Tab from Main Process (Cmd+W) ──────
    useEffect(() => {
        window.electronAPI.onCloseTab(() => {
            setOpenTabs((prev) => {
                setActiveTab((currentActive) => {
                    if (!currentActive) return null;
                    const idx = prev.findIndex((t) => t.filePath === currentActive);
                    if (idx === -1) return currentActive;
                    const newTabs = prev.filter((t) => t.filePath !== currentActive);
                    if (newTabs.length > 0) {
                        const newIdx = Math.min(idx, newTabs.length - 1);
                        return newTabs[newIdx].filePath;
                    }
                    return null;
                });
                return prev.filter((t) => t.filePath !== activeTab);
            });
        });
    }, [activeTab]);

    // ─── Keyboard Shortcuts ─────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl/Cmd + ` → toggle terminal
            if ((e.ctrlKey || e.metaKey) && e.key === '`') {
                e.preventDefault();
                setPanelVisible((v) => !v);
            }
            // Ctrl/Cmd + S → save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [activeTab, openTabs]);

    // ─── Open Folder ────────────────────────────────────
    const handleOpenFolder = useCallback(async () => {
        const path = await window.electronAPI.openFolder();
        if (!path) return;

        setFolderPath(path);
        const name = path.split('/').pop() || path.split('\\').pop();
        setFolderName(name);

        const entries = await window.electronAPI.readDir(path);
        setFileEntries(entries);

        // Save last opened folder
        window.electronAPI.setLastFolder(path);

        // Update terminal CWD
        window.electronAPI.setTerminalCwd(path);
    }, []);

    // ─── Open File ──────────────────────────────────────
    const handleFileClick = useCallback(async (filePath, fileName) => {
        // Already open?
        const existing = openTabs.find((t) => t.filePath === filePath);
        if (existing) {
            setActiveTab(filePath);
            return;
        }

        const content = await window.electronAPI.readFile(filePath);
        if (content === null) return;

        const language = getLanguage(filePath);
        const newTab = { filePath, fileName, content, language, isDirty: false };
        setOpenTabs((prev) => [...prev, newTab]);
        setActiveTab(filePath);
    }, [openTabs]);

    // ─── Switch Tab ─────────────────────────────────────
    const handleSwitchTab = useCallback((filePath) => {
        setActiveTab(filePath);
    }, []);

    // ─── Close Tab ──────────────────────────────────────
    const handleCloseTab = useCallback((filePath) => {
        setOpenTabs((prev) => {
            const idx = prev.findIndex((t) => t.filePath === filePath);
            if (idx === -1) return prev;
            const newTabs = prev.filter((t) => t.filePath !== filePath);

            // If closing the active tab, switch to neighbor
            if (filePath === activeTab) {
                if (newTabs.length > 0) {
                    const newIdx = Math.min(idx, newTabs.length - 1);
                    setActiveTab(newTabs[newIdx].filePath);
                } else {
                    setActiveTab(null);
                }
            }
            return newTabs;
        });
    }, [activeTab]);

    // ─── Content Change ─────────────────────────────────
    const handleContentChange = useCallback((filePath, value) => {
        setOpenTabs((prev) =>
            prev.map((t) => {
                if (t.filePath === filePath && !t.isDirty) {
                    return { ...t, isDirty: true, content: value };
                }
                if (t.filePath === filePath) {
                    return { ...t, content: value };
                }
                return t;
            })
        );
    }, []);

    // ─── Update File Tree ─────────────────────────────────
    const refreshTree = useCallback(async () => {
        if (!folderPath) return;
        const entries = await window.electronAPI.readDir(folderPath);
        setFileEntries(entries);
    }, [folderPath]);

    // ─── Save ───────────────────────────────────────────
    const handleSave = useCallback(async () => {
        if (!activeTab) return;
        const tab = openTabs.find((t) => t.filePath === activeTab);
        if (!tab) return;

        // Get value from editor if available
        let content = tab.content;
        if (editorRef.current) {
            content = editorRef.current.getValue();
        }

        const ok = await window.electronAPI.writeFile(tab.filePath, content);
        if (ok) {
            setOpenTabs((prev) =>
                prev.map((t) => (t.filePath === activeTab ? { ...t, isDirty: false, content } : t))
            );
        }
    }, [activeTab, openTabs]);

    // ─── Cursor Position ───────────────────────────────
    const handleCursorChange = useCallback((line, col) => {
        setCursorPos({ line, col });
    }, []);

    // ─── Sidebar Resize ────────────────────────────────
    const handleSidebarMouseDown = useCallback((e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = sidebarWidth;

        const handleMouseMove = (moveE) => {
            const activityBarWidth = 48;
            const newWidth = startWidth + (moveE.clientX - startX);
            if (newWidth >= 150 && newWidth <= 600) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        };

        document.body.style.cursor = 'col-resize';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [sidebarWidth]);

    // ─── Derived State ──────────────────────────────────
    const currentTab = openTabs.find((t) => t.filePath === activeTab);
    const languageLabel = currentTab ? getLanguageLabel(currentTab.language) : 'Plain Text';
    const positionText = `Ln ${cursorPos.line}, Col ${cursorPos.col}`;

    return (
        <>
            <TitleBar folderName={folderName || null} />
            <div id="main-container">
                <ActivityBar
                    activePanel={activePanel}
                    onPanelChange={setActivePanel}
                    isDark={isDark}
                    onToggleTheme={() => setIsDark((d) => !d)}
                />
                <Sidebar
                    folderName={folderName}
                    folderPath={folderPath}
                    entries={fileEntries}
                    onOpenFolder={handleOpenFolder}
                    onFileClick={handleFileClick}
                    activeFile={activeTab}
                    style={{ width: `${sidebarWidth}px` }}
                    onRefresh={refreshTree}
                />
                <div id="sidebar-resize" onMouseDown={handleSidebarMouseDown}></div>
                <div id="editor-panel-area">
                    <div id="editor-area">
                        <TabsBar
                            tabs={openTabs}
                            activeTab={activeTab}
                            onSwitchTab={handleSwitchTab}
                            onCloseTab={handleCloseTab}
                        />
                        {activeTab ? (
                            <MonacoEditor
                                activeTab={activeTab}
                                tabs={openTabs}
                                isDark={isDark}
                                onCursorChange={handleCursorChange}
                                onContentChange={handleContentChange}
                                onSave={handleSave}
                                editorRef={editorRef}
                            />
                        ) : (
                            <WelcomeView onOpenFolder={handleOpenFolder} />
                        )}
                    </div>
                    <TerminalPanel
                        visible={panelVisible}
                        onClose={() => setPanelVisible(false)}
                        panelHeight={panelHeight}
                        onResize={setPanelHeight}
                        isDark={isDark}
                    />
                </div>
            </div>
            <StatusBar
                position={positionText}
                language={languageLabel}
                encoding="UTF-8"
            />
        </>
    );
}
