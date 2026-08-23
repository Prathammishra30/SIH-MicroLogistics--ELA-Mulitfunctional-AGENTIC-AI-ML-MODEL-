import React from 'react';
import { Outlet } from 'react-router-dom';

export const FarmerLayout: React.FC = () => {
  return (
    <>
      <Outlet />
    </>
  );
};
