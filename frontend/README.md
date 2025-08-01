# Recruitment Portal Frontend

A modern React-based frontend for the Recruitment Portal application.

## Features

- Modern UI/UX with glassmorphism effects
- Responsive design with Tailwind CSS
- Real-time data updates
- Role-based access control (Admin/HR)
- Interactive dashboards with charts
- Form validation and error handling
- Toast notifications

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable components
├── contexts/           # React contexts (Auth, RealTime)
├── pages/             # Page components
│   ├── admin/         # Admin pages
│   └── hr/           # HR pages
├── services/          # API services
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## Key Components

- **Layout.jsx**: Main layout with sidebar and navigation
- **AuthContext.jsx**: Authentication state management
- **RealTimeContext.jsx**: Real-time data updates
- **ProtectedRoute.jsx**: Route protection based on roles

## Troubleshooting

### Common Issues

1. **Build Errors**: Make sure all dependencies are installed
2. **API Connection**: Ensure backend is running on localhost:8000
3. **Styling Issues**: Check if Tailwind CSS is properly configured

### Error Handling

The application includes comprehensive error handling:
- Error boundaries for React errors
- API error interceptors
- Toast notifications for user feedback
- Automatic retry logic for failed requests

## Development

- Uses Vite for fast development
- Hot module replacement enabled
- ESLint for code quality
- PostCSS for CSS processing

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest) 