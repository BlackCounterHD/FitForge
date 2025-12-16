function ThemeSelector({ currentTheme, onThemeChange }) {
  const themes = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'high-contrast', label: 'High Contrast' }
  ]

  return (
    <div className="theme-selector">
      {themes.map(theme => (
        <button
          key={theme.id}
          className={`theme-btn ${currentTheme === theme.id ? 'active' : ''}`}
          onClick={() => onThemeChange(theme.id)}
        >
          {theme.label}
        </button>
      ))}
    </div>
  )
}

export default ThemeSelector
