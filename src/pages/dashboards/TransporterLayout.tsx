import React from 'react';
import { Outlet } from 'react-router-dom';

export const TransporterLayout: React.FC = () => {
  return (
    <>
      <Outlet />
    </>
  );
};
