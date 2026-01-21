export default function ThemeSelector({ currentTheme, onThemeChange }) {
  return (
    <div className="theme-selector">
      {['light', 'dark', 'high-contrast'].map(t => (
        <button
          key={t}
          className={`theme-btn ${currentTheme === t ? 'active' : ''}`}
          onClick={() => onThemeChange(t)}
        >
          {t === 'high-contrast' ? 'High Contrast' : t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  )
}
