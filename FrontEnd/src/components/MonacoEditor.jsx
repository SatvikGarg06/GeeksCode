import React, { useRef, useEffect, useCallback } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Configure monaco-editor to use local node_modules
loader.config({ monaco });

export default function MonacoEditor({
    activeTab,
    tabs,
    isDark,
    onCursorChange,
    onContentChange,
    onSave,
    editorRef,
}) {
    const monacoRef = useRef(null);

    const handleEditorDidMount = useCallback((editor, mon) => {
        monacoRef.current = mon;
        editorRef.current = editor;

        // Define dark theme
        mon.editor.defineTheme('codeEditorDark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#1e1e1e',
                'editor.foreground': '#d4d4d4',
                'editorCursor.foreground': '#aeafad',
                'editor.lineHighlightBackground': '#2a2d2e',
                'editorLineNumber.foreground': '#858585',
                'editor.selectionBackground': '#264f78',
                'editor.inactiveSelectionBackground': '#3a3d41',
                'editorWidget.background': '#252526',
                'editorWidget.border': '#454545',
                'editorSuggestWidget.background': '#252526',
                'editorSuggestWidget.border': '#454545',
                'editorSuggestWidget.selectedBackground': '#04395e',
            },
        });

        // Define light theme
        mon.editor.defineTheme('codeEditorLight', {
            base: 'vs',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#ffffff',
                'editor.foreground': '#333333',
                'editorCursor.foreground': '#333333',
                'editor.lineHighlightBackground': '#f0f0f0',
                'editorLineNumber.foreground': '#999999',
                'editor.selectionBackground': '#add6ff',
                'editor.inactiveSelectionBackground': '#e5ebf1',
                'editorWidget.background': '#f3f3f3',
                'editorWidget.border': '#c8c8c8',
                'editorSuggestWidget.background': '#f3f3f3',
                'editorSuggestWidget.border': '#c8c8c8',
                'editorSuggestWidget.selectedBackground': '#d6ebff',
            },
        });

        mon.editor.setTheme(isDark ? 'codeEditorDark' : 'codeEditorLight');

        // Cursor position tracking
        editor.onDidChangeCursorPosition((e) => {
            onCursorChange(e.position.lineNumber, e.position.column);
        });

        // Ctrl/Cmd + S to save
        editor.addCommand(mon.KeyMod.CtrlCmd | mon.KeyCode.KeyS, () => {
            onSave();
        });
    }, [isDark, onCursorChange, onSave, editorRef]);

    // Sync theme when isDark changes
    useEffect(() => {
        if (monacoRef.current) {
            monacoRef.current.editor.setTheme(isDark ? 'codeEditorDark' : 'codeEditorLight');
        }
    }, [isDark]);

    // Find active tab
    const currentTab = tabs.find((t) => t.filePath === activeTab);

    if (!currentTab) return null;

    return (
        <div id="monaco-container" style={{ display: 'block' }}>
            <Editor
                key={currentTab.filePath}
                defaultValue={currentTab.content}
                language={currentTab.language}
                theme={isDark ? 'codeEditorDark' : 'codeEditorLight'}
                onMount={handleEditorDidMount}
                onChange={(value) => onContentChange(currentTab.filePath, value)}
                options={{
                    automaticLayout: true,
                    fontSize: 14,
                    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    renderWhitespace: 'selection',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    bracketPairColorization: { enabled: true },
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    smoothScrolling: true,
                    padding: { top: 8 },
                    wordWrap: 'off',
                    tabSize: 2,
                    insertSpaces: true,
                    renderLineHighlight: 'all',
                    matchBrackets: 'always',
                    suggest: { showWords: true },
                }}
            />
        </div>
    );
}
