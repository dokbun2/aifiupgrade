# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 기본 설정
**언어**: 한국어로 답변해주세요.

## Project Overview

AIFI FRAMEWORK - A modern, responsive web application with a shadcn/ui-inspired design system featuring dark/light theme support and mobile-first responsive layout.

## Development Commands

### Local Development Server
```bash
# Python 3 (recommended for simple static serving)
python3 -m http.server 8000

# Node.js alternative
npx http-server -p 8000 -c-1

# VSCode Live Server extension
# Set port to 8000 in settings
```

Access the site at `http://localhost:8000`

### Asset Management
- **Videos**: Place in `assets/video/` (e.g., hero.mp4)
- **Images**: Place in `assets/images/`

## Architecture & Structure

### Page Organization
```
/                       # Root directory
├── index.html         # Main landing page with hero section
├── start/index.html   # START section with stage selection
├── storyboard/index.html
├── conceptart/index.html
├── gallery/index.html
└── banana/index.html
```

Each page maintains consistent structure:
- Header with logo, GitHub link, theme toggle
- Collapsible sidebar (hidden by default, toggle button)
- Main content area
- Mobile bottom navigation (visible <768px)
- Footer

### Core Components

#### CSS Architecture (`css/style.css`)
- **CSS Variables**: Theme colors defined in `:root` and `body.dark`
- **Responsive Breakpoints**:
  - 1280px, 1024px, 768px, 640px, 480px
  - Mobile nav appears at 768px
- **Key Classes**:
  - `.sidebar` - Left navigation, hidden by default (-240px)
  - `.mobile-nav` - Bottom navigation for mobile
  - `.stage-card` - Interactive cards with hover effects
  - `.hero-section` - Landing page hero with video background

#### JavaScript Functionality (`js/main.js`)
- **Theme Toggle**: Dark/light mode with localStorage persistence
- **Sidebar Management**:
  - `toggleSidebarSection()` - Dropdown functionality
  - Mobile overlay handling
- **Mobile Menu**: `openMobileMenu()`, `closeMobileMenu()`
- **Global Functions**: Exposed via `window` object

### Sidebar Behavior
- Each section (START, STORYBOARD, etc.) is collapsible
- Active page's section auto-expands
- Dropdowns animate with CSS transitions
- Korean labels: 영상제작, 스토리보드, 컨셉아트, 갤러리, 바나나

### Mobile Optimizations
- Bottom navigation bar (60px height)
- Sidebar becomes overlay on mobile
- Grid layouts adjust columns (3→2→1)
- Touch-optimized tap targets

## Key Implementation Notes

### Path References
- Subpages use relative paths (`../css/style.css`, `../js/main.js`)
- Internal navigation uses folder structure (`../start/index.html`)

### Styling Patterns
- Glassmorphism effects with `backdrop-filter: blur()`
- Gradient accents using `linear-gradient`
- Consistent hover states with `transform` and `box-shadow`
- CSS transitions for smooth interactions

### JavaScript Patterns
- Event delegation for dynamic content
- localStorage for persistent settings
- Global function exposure for inline onclick handlers
- Responsive checks via `window.innerWidth`