/**
 * Proxy Server for iframe bypass
 * Google Gemini 페이지를 프록시로 제공
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;

// CORS 설정
app.use(cors({
    origin: ['http://localhost:8000', 'http://localhost:8080', 'http://127.0.0.1:8000'],
    credentials: true
}));

// 방법 1: 단순 프록시 (직접 전달)
app.use('/gemini-proxy', createProxyMiddleware({
    target: 'https://gemini.google.com',
    changeOrigin: true,
    pathRewrite: {
        '^/gemini-proxy': ''
    },
    onProxyRes: function(proxyRes, req, res) {
        // X-Frame-Options 헤더 제거
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['X-Frame-Options'];

        // Content Security Policy 수정
        if (proxyRes.headers['content-security-policy']) {
            delete proxyRes.headers['content-security-policy'];
        }

        // 추가 헤더 설정
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    }
}));

// 방법 2: HTML 콘텐츠 수정 방식
app.get('/gemini-iframe/*', async (req, res) => {
    try {
        const geminiUrl = 'https://gemini.google.com' + req.path.replace('/gemini-iframe', '');

        const response = await axios.get(geminiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br'
            }
        });

        let html = response.data;

        // base 태그 추가하여 리소스 경로 수정
        if (!html.includes('<base')) {
            html = html.replace('<head>', `<head><base href="https://gemini.google.com/">`);
        }

        // X-Frame-Options 관련 스크립트 제거
        html = html.replace(/if\s*\(\s*top\s*!==?\s*self\s*\)/gi, 'if(false)');
        html = html.replace(/top\.location\s*=\s*self\.location/gi, '');

        // 응답 헤더 설정
        res.removeHeader('X-Frame-Options');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);

    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).send('Proxy error: ' + error.message);
    }
});

// 방법 3: embed 전용 URL 시도
app.get('/gemini-embed', (req, res) => {
    // Google의 embed 가능한 URL 포맷 시도
    const embedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Gemini AI</title>
            <style>
                body { margin: 0; padding: 0; overflow: hidden; }
                iframe { width: 100%; height: 100vh; border: none; }
            </style>
        </head>
        <body>
            <iframe
                src="https://gemini.google.com/gem/1tWO58mOJuoVdeKxEOCNYWHHUvUeAEXla?usp=sharing&embed=true"
                allow="clipboard-write; clipboard-read; microphone; camera"
                allowfullscreen>
            </iframe>
        </body>
        </html>
    `;
    res.send(embedHtml);
});

app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('- http://localhost:3001/gemini-proxy/[path]');
    console.log('- http://localhost:3001/gemini-iframe/[path]');
    console.log('- http://localhost:3001/gemini-embed');
});