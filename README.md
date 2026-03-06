# EasyPrint 🖨️

A full-stack web application connecting students who need documents printed with local xerox shops.

## 🎯 Project Overview

**EasyPrint** simplifies the document printing process by providing a platform where:
- **Students** can upload documents, configure print settings, and place orders
- **Xerox Shops** can receive, process, and manage print orders efficiently

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **PDF.js** - Document preview

### Backend
- **Flask** - Python web framework
- **Gunicorn** - Production WSGI server
- **PyPDF2** - PDF processing
- **Pillow** - Image manipulation
- **python-docx** - DOCX conversion

## 📁 Project Structure

```
PROJECT/
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   └── components/   # Reusable components
│   ├── package.json
│   └── next.config.ts
│
├── backend/              # Flask backend API
│   ├── app.py           # Main application
│   ├── requirements.txt # Python dependencies
│   ├── Procfile        # Deployment config
│   ├── uploads/        # Uploaded files
│   └── processed/      # Processed files
│
├── DEPLOYMENT.md        # Comprehensive deployment guide
├── docker-compose.yml   # Docker configuration
└── README.md           # This file
```

## 🏃‍♂️ Quick Start

### Prerequisites
- **Node.js 20+**
- **Python 3.11+**
- **npm** or **yarn**
- **pip**

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/easyprint.git
cd easyprint
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start backend server
python app.py
```

Backend will run on `http://localhost:5000`

### 3. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Access the Application

- **Student Interface**: http://localhost:3000
- **Shop Dashboard**: http://localhost:3000/shop
- **API**: http://localhost:5000

## ✨ Features

### For Students
- 📄 Upload multiple documents (PDF, DOCX, images)
- 🎨 Configure print settings (color, copies, binding, etc.)
- 👀 Live document preview
- 📋 Track order status
- 💰 View pricing estimates

### For Shop Owners
- 📊 Dashboard to view all orders
- ✅ Update order status
- 📥 Download processed documents
- 🔔 Real-time order notifications

### Document Processing
- Merge multiple PDFs
- Convert DOCX to PDF
- Convert images to PDF
- Custom page ranges
- Duplicate copies generation
- Print optimization

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🌐 Production Deployment

We've created a comprehensive deployment guide covering multiple platforms.

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed instructions on:

- ✅ **Vercel + Render** (Recommended - easiest)
- ✅ **Railway** (Full-stack platform)
- ✅ **DigitalOcean App Platform**
- ✅ **AWS** (Elastic Beanstalk + Amplify)
- ✅ **Google Cloud Run** (Docker)
- ✅ **VPS Setup** (Manual deployment)

### Recommended: Vercel + Render

**Cost**: Free tier available, ~$7/month for production

1. **Backend**: Deploy to [Render](https://render.com) (5 minutes)
2. **Frontend**: Deploy to [Vercel](https://vercel.com) (5 minutes)
3. **Done!** ✨

[Full deployment guide →](./DEPLOYMENT.md)

## 📝 Environment Variables

### Backend (.env)
```env
FLASK_ENV=production
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🛠️ Development

### Backend Development

```bash
cd backend

# Install dev dependencies
pip install black pylint pytest

# Format code
black app.py

# Lint code
pylint app.py

# Run tests
pytest
```

### Frontend Development

```bash
cd frontend

# Run development server with turbo
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## 📚 API Documentation

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders/create` | Create new print order |
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/<id>` | Get order details |
| PUT | `/api/orders/<id>/status` | Update order status |
| GET | `/api/orders/<id>/download` | Download processed file |
| GET | `/api/shop/orders` | Get shop dashboard orders |

See [backend README](./backend/README.md) for detailed API documentation.

## 🔒 Security Considerations

For production deployment:

- ✅ Enable HTTPS/SSL
- ✅ Configure CORS properly
- ✅ Implement authentication
- ✅ Add rate limiting
- ✅ Sanitize file uploads
- ✅ Use environment variables for secrets
- ✅ Replace JSON database with PostgreSQL
- ✅ Use cloud storage for files (AWS S3, Cloudinary)

## 📊 Production Checklist

Before going live:

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] Database setup (PostgreSQL recommended)
- [ ] File storage configured (S3/Cloudinary)
- [ ] SSL/HTTPS enabled
- [ ] Error monitoring setup (Sentry)
- [ ] Logging configured
- [ ] Backups automated
- [ ] Domain configured
- [ ] Authentication implemented

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

**CORS errors?**
- Check `ALLOWED_ORIGINS` in backend `.env`
- Verify frontend `NEXT_PUBLIC_API_URL`

**Backend won't start?**
- Verify Python version: `python --version` (should be 3.11+)
- Reinstall dependencies: `pip install -r requirements.txt`

**Frontend build fails?**
- Clear cache: `rm -rf .next node_modules && npm install`
- Check Node version: `node --version` (should be 20+)

### Getting Help

- 📖 Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- 📝 Review backend [README](./backend/README.md)
- 🎨 Review frontend [README](./frontend/README.md)
- 🐛 Open an issue on GitHub

## 🗺️ Roadmap

- [ ] User authentication (student/shop accounts)
- [ ] Payment integration
- [ ] Shop location mapping
- [ ] Real-time order tracking
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Advanced document editing
- [ ] Multi-shop support
- [ ] Analytics dashboard

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Flask community for excellent documentation
- All contributors who help improve this project

---

**Made with ❤️ for students and local businesses**

🌟 Star this repo if you find it helpful!
