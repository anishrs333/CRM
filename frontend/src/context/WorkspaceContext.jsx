import React, { createContext, useContext, useState, useEffect } from 'react';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const [workspace, setWorkspaceState] = useState(() => {
    return localStorage.getItem('apexcrm_active_workspace') || 'institute';
  });

  const setWorkspace = (ws) => {
    if (ws === 'institute' || ws === 'school') {
      setWorkspaceState(ws);
      localStorage.setItem('apexcrm_active_workspace', ws);
    }
  };

  useEffect(() => {
    localStorage.setItem('apexcrm_active_workspace', workspace);
  }, [workspace]);

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    return { workspace: 'institute', setWorkspace: () => {} };
  }
  return context;
};
