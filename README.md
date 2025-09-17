# AIFI UPGRADE 🚀

A modern web application for AI-powered concept art generation and creative workflow management.

## ✨ Features

- 🎨 **AI Image Generation** - Powered by Google Gemini's Nano Banana (gemini-2.5-flash-image-preview)
- 📱 **Responsive Design** - Mobile-first approach with adaptive layouts
- 🌓 **Dark/Light Theme** - Automatic theme switching with persistent storage
- 🎬 **Video Production Workflow** - Interactive stage cards for creative process
- 🖼️ **Gallery Management** - Organize and manage generated artwork
- 🔐 **Secure Authentication** - Supabase-powered user management
- 🍌 **AIFI Banana** - Unique creative tools section

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI Integration**: Google Gemini API (Nano Banana model)
- **Authentication**: Supabase
- **Deployment**: Cloudflare Pages
- **Version Control**: GitHub

## 🚀 Quick Start

### Prerequisites
- Modern web browser
- Python 3.x or Node.js (for local development)
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/dokbun2/aifiupgrade.git
cd aifiupgrade

# Copy environment template
cp .env.example .env
# Edit .env with your API keys

# Run locally with Python
python3 -m http.server 8000

# Or with Node.js
npx http-server -p 8000 -c-1
```

Visit `http://localhost:8000`

## 🔐 Configuration

1. **Google Gemini API**
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Set up in the app's API settings modal

2. **Supabase (Optional)**
   - Create a project at [Supabase](https://supabase.com)
   - Configure authentication settings

## 📁 Project Structure

```
aifiupgrade/
├── assets/         # Media files (images, videos)
├── conceptart/     # Concept art generation module
├── css/           # Stylesheets
├── gallery/       # Gallery module
├── js/            # JavaScript modules
│   ├── gemini-api.js  # Gemini API integration
│   ├── conceptart.js  # Art generation logic
│   └── auth.js        # Authentication
├── start/         # Start page
├── storyboard/    # Storyboard module
└── index.html     # Main entry point
```

## 🌐 Deployment

### Automatic Deployment
Push to `main` branch triggers automatic deployment via Cloudflare Pages.

### Manual Deployment
```bash
# Using deployment script
./deploy.sh

# Or via Cloudflare Dashboard
# 1. Visit Cloudflare Pages Dashboard
# 2. Click "Retry deployment" for aifiup project
```

## 🔗 Links

- **Live Site**: [https://aifiup.pages.dev](https://aifiup.pages.dev)
- **GitHub**: [https://github.com/dokbun2/aifiupgrade](https://github.com/dokbun2/aifiupgrade)
- **AIFI Manual**: [https://aifi-guide.pages.dev](https://aifi-guide.pages.dev)
- **Community**: [AIFI Naver Cafe](https://cafe.naver.com/aifi)

## 📄 License

MIT License

---

Built with ❤️ by AIFI Team