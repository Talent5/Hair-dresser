import React, { createContext, useContext, useState, ReactNode } from 'react';
import DrawerOverlay from '@/components/DrawerOverlay';

interface DrawerContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

interface DrawerProviderProps {
  children: ReactNode;
}

export const DrawerProvider: React.FC<DrawerProviderProps> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = () => {
    console.log('Opening drawer...');
    setIsDrawerOpen(true);
  };
  
  const closeDrawer = () => {
    console.log('Closing drawer...');
    setIsDrawerOpen(false);
  };
  
  const toggleDrawer = () => {
    console.log('Toggling drawer...', !isDrawerOpen);
    setIsDrawerOpen(prev => !prev);
  };

  const contextValue: DrawerContextType = {
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  };

  return (
    <DrawerContext.Provider value={contextValue}>
      {children}
      <DrawerOverlay />
    </DrawerContext.Provider>
  );
};

export const useDrawer = (): DrawerContextType => {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
};

export default DrawerContext;