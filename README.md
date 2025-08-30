# React Admin Dashboard

A modern, responsive admin dashboard built with React, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Modern Design**: Clean and professional UI with Tailwind CSS
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile devices
- 📊 **Dashboard Widgets**: Statistics cards, charts, and data tables
- 🔔 **Real-time Updates**: Activity feed and notifications
- 🎯 **TypeScript**: Full type safety and better development experience
- ⚡ **Fast**: Optimized performance with React 18

## Components

- **Sidebar**: Navigation menu with collapsible design
- **Header**: Search bar, notifications, and user profile
- **Dashboard**: Main dashboard with statistics and charts
- **StatCard**: Individual statistics cards with icons and trends
- **Chart**: Custom chart component for data visualization
- **RecentActivity**: Timeline of recent user activities
- **DataTable**: Responsive data table with sorting and actions

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (not recommended)

## Project Structure

```
src/
├── components/
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── Header.tsx           # Top header with search and notifications
│   ├── Dashboard.tsx        # Main dashboard layout
│   ├── StatCard.tsx         # Statistics cards
│   ├── Chart.tsx            # Chart component
│   ├── RecentActivity.tsx   # Activity timeline
│   └── DataTable.tsx        # Data table component
├── App.tsx                  # Main app component
├── index.tsx               # React entry point
└── index.css               # Global styles with Tailwind
```

## Customization

### Colors and Themes

The dashboard uses Tailwind CSS for styling. You can customize colors, spacing, and other design tokens by modifying the `tailwind.config.js` file.

### Adding New Components

1. Create a new component in the `src/components/` directory
2. Import and use it in the appropriate parent component
3. Follow the existing TypeScript patterns for props and interfaces

### Data Integration

The dashboard currently uses mock data. To integrate with real APIs:

1. Replace the mock data in `Dashboard.tsx` with API calls
2. Add state management (Redux, Zustand, or React Context) if needed
3. Implement error handling and loading states

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Create React App** - Build tool and development environment

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

