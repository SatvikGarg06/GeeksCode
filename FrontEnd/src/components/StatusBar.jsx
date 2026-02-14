import React from 'react';

export default function StatusBar({ position, language, encoding }) {
    return (
        <div id="status-bar">
            <div className="status-left">
                <span className="status-item" id="status-branch">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="6" r="2.5" />
                        <circle cx="12" cy="18" r="2.5" />
                        <path d="M12 8.5V15.5" />
                    </svg>
                    main
                </span>
            </div>
            <div className="status-right">
                <span className="status-item" id="status-position">{position}</span>
                <span className="status-item" id="status-encoding">{encoding}</span>
                <span className="status-item" id="status-language">{language}</span>
            </div>
        </div>
    );
}
