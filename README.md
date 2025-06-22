# Smart Image Editor

A modern web-based banner editor with TypeScript support and Supabase backend integration for creating social media and marketing content.

## Features

- Multiple banner types and device formats (PC/Mobile)
- Text editing with custom positioning and partial color support
- Logo upload and positioning
- Image upload and editing with smart cropping
- Real-time preview with Canvas rendering
- Project management with cloud storage
- User authentication (Supabase)
- File storage (Supabase Storage)
- Drag and drop interface
- Modern UI with animations

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Supabase (Database & Storage)
- React Dropzone
- Canvas API

## Getting Started

### 1. Clone and Install
```bash
git clone <repository-url>
cd smart-image-editor
npm install
```

### 2. Set up Supabase

1. Create a new project at [Supabase](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up the database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `supabase/schema.sql`

This will create:
- `projects` table for storing projects
- `banners` table for storing banner data
- Storage buckets for images and logos
- Row Level Security policies
- Proper indexes for performance

### 4. Start development server
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

## Supabase Setup Details

### Database Tables

**projects**
- id (UUID, Primary Key)
- name (VARCHAR)
- user_id (UUID, Foreign Key to auth.users)
- created_at, updated_at (TIMESTAMP)

**banners**
- id (UUID, Primary Key)
- project_id (UUID, Foreign Key to projects)
- title (VARCHAR)
- banner_type (VARCHAR)
- device_type (VARCHAR)
- image_url (TEXT)
- logo_url (TEXT, Optional)
- text_elements (JSONB)
- created_at, updated_at (TIMESTAMP)

### Storage Buckets

- `banner-images`: For storing banner background images
- `logos`: For storing logo files

### Security

- Row Level Security (RLS) enabled
- Users can only access their own projects and banners
- Public access for viewing uploaded images
- Authenticated access required for uploads

## Features Overview

### Text Editing
- Global color picker for entire text
- Partial color selection (select specific characters)
- 12-color palette with Korean names
- Character count limits
- Line break support (up to 2 lines)
- Font weight customization (Bold/Medium)

### Banner Types
- Basic banners (with/without logo)
- Splash banners
- Interactive banners
- Full-screen banners
- PC and Mobile variants

### Project Management
- Create, update, delete projects
- Cloud storage integration
- Real-time synchronization
- File upload with automatic optimization

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
  ├── components/         # React components
  │   ├── BannerEditor.tsx
  │   ├── BannerPreview.tsx
  │   ├── TextEditSidebar.tsx
  │   └── ...
  ├── config/            # Configuration files
  │   ├── bannerConfigs.ts
  │   └── deviceConfigs.ts
  ├── hooks/             # Custom React hooks
  │   └── useSupabase.ts
  ├── lib/               # External library configurations
  │   └── supabase.ts
  ├── services/          # API service functions
  │   └── supabaseService.ts
  ├── types/             # TypeScript type definitions
  │   └── index.ts
  ├── App.tsx            # Main application component
  ├── main.tsx           # Application entry point
  └── index.css          # Global styles
```

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 