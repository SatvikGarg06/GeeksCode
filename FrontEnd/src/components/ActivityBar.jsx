import React from 'react';

const icons = [
    {
        id: 'explorer',
        title: 'Explorer',
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 7V17C3 18.1 3.9 19 5 19H19C20.1 19 21 18.1 21 17V9C21 7.9 20.1 7 19 7H11L9 5H5C3.9 5 3 5.9 3 7Z" />
            </svg>
        ),
    },
    {
        id: 'search',
        title: 'Search',
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7" />
                <path d="M16 16L21 21" />
            </svg>
        ),
    },
    {
        id: 'git',
        title: 'Source Control',
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="6" r="2.5" />
                <circle cx="12" cy="18" r="2.5" />
                <circle cx="18" cy="12" r="2.5" />
                <path d="M12 8.5V15.5" />
                <path d="M14.5 12H15.5" />
            </svg>
        ),
    },
    {
        id: 'extensions',
        title: 'Extensions',
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="8" height="8" rx="1" />
                <rect x="13" y="3" width="8" height="8" rx="1" />
                <rect x="3" y="13" width="8" height="8" rx="1" />
                <rect x="13" y="13" width="8" height="8" rx="1" />
            </svg>
        ),
    },
];

export default function ActivityBar({ activePanel, onPanelChange, isDark, onToggleTheme }) {
    return (
        <div id="activity-bar">
            {icons.map((item) => (
                <div
                    key={item.id}
                    className={`activity-icon${activePanel === item.id ? ' active' : ''}`}
                    data-panel={item.id}
                    title={item.title}
                    onClick={() => onPanelChange(item.id)}
                >
                    {item.svg}
                </div>
            ))}
            <div className="activity-spacer"></div>
            <button id="theme-toggle" className="theme-toggle" title="Toggle Theme" onClick={onToggleTheme}>
                {/* Moon icon (visible in dark mode) */}
                <svg className="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                {/* Sun icon (visible in light mode) */}
                <svg className="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            </button>
        </div>
    );
}
