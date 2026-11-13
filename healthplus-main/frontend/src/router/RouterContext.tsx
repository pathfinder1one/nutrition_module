import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface RouterContextType {
  currentPath: string;
  navigate: (path: string, options?: { replace?: boolean; scroll?: boolean }) => void;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

// Normalizes path by handling hash fragments or pathname
export function normalizePath(rawPath: string): string {
  let path = rawPath.trim();
  if (path.startsWith('#')) {
    path = path.substring(1);
  }
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  // Strip trailing slash if not root
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  // Route aliases
  if (path === '/scanner') return '/food-scanner';
  if (path === '/diary') return '/nutrition-diary';
  if (path === '/exercise') return '/exercise-studio';
  if (path === '/insights') return '/health-patterns';
  if (path === '/coach') return '/ai-coach';
  return path;
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/')) return normalizePath(hash);
      if (window.location.pathname && window.location.pathname !== '/') {
        return normalizePath(window.location.pathname);
      }
    }
    return '/';
  });

  const navigate = useCallback((path: string, options?: { replace?: boolean; scroll?: boolean }) => {
    const normalized = normalizePath(path);
    setCurrentPath(normalized);
    if (typeof window !== 'undefined') {
      window.location.hash = normalized;
      if (options?.scroll !== false) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, []);

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/')) {
        setCurrentPath(normalizePath(hash));
      } else if (!hash) {
        setCurrentPath('/');
      }
    };

    const handlePopState = () => {
      if (window.location.hash) {
        handleHashChange();
      } else if (window.location.pathname) {
        setCurrentPath(normalizePath(window.location.pathname));
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <RouterContext.Provider value={{ currentPath, navigate, goBack }}>
      {children}
    </RouterContext.Provider>
  );
};

export function useRouter(): RouterContextType {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}

export const Link: React.FC<LinkProps> = ({
  to,
  className = '',
  activeClassName = '',
  children,
  onClick,
  ...props
}) => {
  const { currentPath, navigate } = useRouter();
  const normalizedTarget = normalizePath(to);
  const isActive = currentPath === normalizedTarget;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <a
      href={`#${normalizedTarget}`}
      onClick={handleClick}
      className={`${className} ${isActive ? activeClassName : ''}`.trim()}
      {...props}
    >
      {children}
    </a>
  );
};
