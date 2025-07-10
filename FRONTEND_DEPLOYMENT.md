# Frontend Deployment Guide

This guide explains how to deploy the React frontend for the Financial Advisor application.

## 🚀 Quick Start

### 1. **Build the Frontend**

Navigate to the client directory and build the production version:

```bash
cd client
npm install
npm run build
```

This creates a `build/` folder with optimized production files.

### 2. **Deploy Options**

#### Option A: Deploy to Netlify (Recommended)

1. **Create a Netlify account** at https://netlify.com
2. **Connect your GitHub repository**
3. **Configure build settings:**
   - **Build command:** `cd client && npm install && npm run build`
   - **Publish directory:** `client/build`
   - **Base directory:** (leave empty)

4. **Set environment variables:**
   - Go to Site settings → Environment variables
   - Add: `REACT_APP_API_URL=https://financial-advisor-4yle.onrender.com/api/v1`

5. **Deploy!** Netlify will automatically build and deploy your site.

#### Option B: Deploy to Vercel

1. **Create a Vercel account** at https://vercel.com
2. **Import your GitHub repository**
3. **Configure build settings:**
   - **Framework Preset:** Create React App
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

4. **Set environment variables:**
   - Add: `REACT_APP_API_URL=https://financial-advisor-4yle.onrender.com/api/v1`

5. **Deploy!**

#### Option C: Deploy to GitHub Pages

1. **Add homepage to package.json:**
   ```json
   {
     "homepage": "https://yourusername.github.io/financial_advisor"
   }
   ```

2. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Add deploy scripts to package.json:**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d build"
     }
   }
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

#### Option D: Serve Locally

For testing the production build locally:

```bash
cd client
npm run build
npx serve -s build
```

## 🔧 Configuration

### Environment Variables

The frontend uses environment variables to configure API endpoints:

- **Development:** Uses `http://127.0.0.1:5000` (configured in `config.js`)
- **Production:** Uses `https://financial-advisor-4yle.onrender.com` (configured in `config.js`)

### API Configuration

The frontend automatically detects the environment and uses the appropriate API URL:

- **Development:** `NODE_ENV=development` → Local backend
- **Production:** `NODE_ENV=production` → Deployed backend

## 📁 Project Structure

```
client/
├── src/
│   ├── pages/           # React page components
│   │   ├── HomePage.js  # Landing page
│   │   ├── DashboardPage.js
│   │   └── ...
│   ├── ui/              # Reusable UI components
│   ├── utils/           # Frontend utilities
│   ├── config.js        # API configuration
│   └── App.js           # Main app component
├── public/              # Static assets
├── build/               # Production build (generated)
└── package.json         # Dependencies and scripts
```

## 🛠️ Development

### Local Development

1. **Start the backend:**
   ```bash
   python -m app.main
   ```

2. **Start the frontend:**
   ```bash
   cd client
   npm start
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check that the backend is running
   - Verify API URL in `config.js`
   - Check CORS settings in backend

2. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for syntax errors in React components
   - Verify all imports are correct

3. **Deployment Issues**
   - Ensure all environment variables are set
   - Check build logs for errors
   - Verify the correct build directory is specified

### Debug Mode

To enable debug logging, add to your browser console:

```javascript
localStorage.setItem('debug', 'true');
```

## 📱 Features

The frontend includes:

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern UI** - Clean, professional interface
- **Real-time Chat** - Interactive AI conversations
- **Financial Calculators** - Retirement, mortgage, compound interest
- **Document Upload** - PDF, CSV, Excel analysis
- **Goal Tracking** - Set and monitor financial goals
- **Dashboard** - Financial overview and analytics

## 🔒 Security

- **HTTPS Only** - All production deployments use HTTPS
- **CORS Configured** - Backend allows frontend domain
- **Environment Variables** - Sensitive data not in code
- **Input Validation** - Client-side and server-side validation

## 📊 Performance

- **Code Splitting** - Automatic route-based splitting
- **Optimized Build** - Minified and compressed for production
- **Lazy Loading** - Components load on demand
- **Caching** - Static assets cached for performance

## 🚀 Next Steps

After deployment:

1. **Test all features** - Ensure everything works in production
2. **Monitor performance** - Use browser dev tools and analytics
3. **Set up monitoring** - Error tracking and performance monitoring
4. **Configure domain** - Set up custom domain if needed
5. **Enable HTTPS** - Ensure SSL certificate is active

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify the backend API is accessible
3. Test with a simple API call: `curl https://financial-advisor-4yle.onrender.com/health`
4. Check the deployment platform's logs
5. Review the backend logs for any errors 