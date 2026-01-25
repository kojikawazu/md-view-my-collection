export interface DesignSystem {
  id: string;
  name: string;
  description: string;
  fontPrimary: string;
  fontHeader: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    accent: string;
    text: string;
    muted: string;
    border: string;
  };
  layout: 'sidebar-left' | 'sidebar-right' | 'grid' | 'centered';
  headerStyle: 'sticky' | 'fixed' | 'static';
  sidebarStyle: 'full-height' | 'card' | 'none';
  borderRadius: string;
}

export interface ReportItem {
  id: string;
  title: string;
  summary?: string | null;
  content: string;
  category: string;
  author: string;
  publishDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  tags: string[];
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'user';
}
