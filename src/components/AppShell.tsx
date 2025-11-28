import React from "react";
import AppHeader, { type AppHeaderProps } from "./AppHeader";

type AppShellProps = {
  headerProps: AppHeaderProps;
  children: React.ReactNode;
  styles?: string;
};

export const AppShell: React.FC<AppShellProps> = ({ headerProps, children, styles }) => {
  return (
    <div className="dashboard">
      {styles && <style>{styles}</style>}
      <AppHeader {...headerProps} />
      <main className="app-main">{children}</main>
    </div>
  );
};

export default AppShell;
