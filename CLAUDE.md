# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 기본 설정
**언어**: 한국어로 답변해주세요.

## Project Overview

AIFI FRAMEWORK - AI-powered concept art generation and creative workflow management system with Node.js backend and Google Gemini integration.

## Development Commands

### Frontend Development
```bash
# Python 3 (recommended for simple static serving)
python3 -m http.server 8000

# Node.js alternative
npx http-server -p 8000 -c-1
```
Access at: `http://localhost:8000`

### Backend Development
```bash
# Start backend server
npm start

# Development mode with auto-reload
npm run dev

# Initialize SQLite database
npm run init-db

# Seed database with sample data
npm run seed
```
Backend runs on port 3000 by default.

### Deployment
```bash
# Deploy to Cloudflare Pages
./deploy.sh
```

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

## API Integration

### Google Gemini API Configuration

#### Models
- **Text Generation**: `gemini-2.5-flash` - For text content generation
- **Image Analysis**: `gemini-2.5-flash-image-preview` (Nano Banana) - For image analysis and description
  - Note: Nano Banana is primarily for image analysis, not generation
  - Returns text descriptions rather than actual images
  - Cost: $0.039 per image (1290 tokens)

#### API Setup
```javascript
// Initialize Gemini API
window.geminiAPI = new GeminiAPIManager();
window.geminiAPI.init('YOUR_API_KEY');

// Test connection
const result = await window.geminiAPI.testConnection();

// API is stored in sessionStorage for persistence
// Auto-loads on page refresh if previously configured
```

#### Key Files
- `/js/gemini-api.js` - Main Gemini API manager
- `/js/gemini-ui.js` - API modal UI and settings
- `/js/nano-banana-api.js` - Specialized Nano Banana image handler

#### API Modal Features
- Connection test with immediate visual feedback
- Save button enables after successful test
- Settings persist in sessionStorage
- Modal closes immediately on save (improved UX)
- Success state shown with green button + animation

#### Important Notes
1. **API Key Storage**: Stored in sessionStorage (not localStorage) for security
2. **Image Generation**: Nano Banana primarily analyzes images, actual generation requires external service
3. **Test Mode**: Falls back to placeholder images when API unavailable
4. **Error Handling**: Comprehensive error messages with Korean localization

### External Image Services (Alternative Options)
For actual image generation, consider:
- Replicate API (Stable Diffusion, FLUX)
- OpenAI DALL-E 3
- Stability AI
- Midjourney API

### Environment Variables
Create `.env` file (see `.env.example`):
```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

## Backend Architecture

### Database (SQLite)
- **Database File**: `database.db`
- **Schema**: Users, sessions, generated content tracking
- **Initialization**: Run `npm run init-db` to create tables
- **Seeding**: Run `npm run seed` for sample data

### API Endpoints (`server.js`)
- **Auth Routes** (`/api/auth/*`): User registration, login, JWT management
- **Content Routes** (`/api/content/*`): Image generation, gallery management
- **User Routes** (`/api/users/*`): Profile management

### Middleware
- **JWT Authentication**: `middleware/auth.js`
- **CORS**: Configured for local development and production
- **Rate Limiting**: Applied to API endpoints
- **Helmet**: Security headers

## Critical Implementation Details

### Gemini API Integration
- **Model Selection**: `gemini-2.5-flash` for text, `gemini-2.5-flash-image-preview` for image analysis
- **Session Storage**: API keys stored in sessionStorage (not localStorage) for security
- **Fallback Mode**: Placeholder images when API unavailable
- **Error Messages**: Korean localization for user-facing errors

### Authentication Flow
1. Client-side: `js/auth.js` handles login/signup forms
2. Server validates credentials against SQLite database
3. JWT token issued and stored in localStorage
4. Token included in API request headers

### Image Generation Pipeline
1. User input processed in `js/conceptart.js`
2. Request sent to Gemini API via `js/gemini-api.js`
3. Nano Banana model analyzes prompts (not generates images)
4. Results displayed with fallback to placeholder images

### Responsive Design Strategy
- **Breakpoints**: 1280px, 1024px, 768px, 640px, 480px
- **Mobile Navigation**: Bottom nav appears <768px
- **Sidebar**: Transforms to overlay on mobile
- **Grid Layouts**: Auto-adjust columns (3→2→1)