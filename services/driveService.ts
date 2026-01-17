
let activeClientId = process.env.GOOGLE_CLIENT_ID || ''; 
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
// We search for files with this name.
const BACKUP_FILENAME_QUERY = "name contains 'wealthflow' and name contains '.json'";

export interface DriveFile {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
}

// Global declaration for the Google GIS client
declare global {
  interface Window {
    google: any;
  }
}

let tokenClient: any;
let storedCallback: ((tokenResponse: any) => void) | null = null;

export const setDynamicClientId = (id: string) => {
  activeClientId = id;
};

export const isDriveScriptLoaded = () => {
  return typeof window !== 'undefined' && 
         window.google && 
         window.google.accounts && 
         window.google.accounts.oauth2;
};

export const initGoogleDrive = (callback: (tokenResponse: any) => void) => {
  storedCallback = callback;
  
  if (!activeClientId) {
    // console.warn("Client ID is missing. Waiting for user input.");
    return;
  }

  const initialize = () => {
    if (isDriveScriptLoaded()) {
      try {
        // Revoke previous client if exists to be safe, though not strictly necessary in JS API
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: SCOPES,
          callback: callback,
        });
        return true;
      } catch (error) {
        console.error("Error initializing Google Token Client:", error);
        return false;
      }
    }
    return false;
  };

  // Attempt immediately
  if (!initialize()) {
    // Retry a few times if script is lazy loading
    let retries = 0;
    const interval = setInterval(() => {
      retries++;
      if (initialize() || retries > 10) {
        clearInterval(interval);
      }
    }, 500);
  }
};

export const requestAccessToken = () => {
  if (!activeClientId) {
    alert("Configuration Error: Client ID is missing. Please enter it in the settings panel.");
    return;
  }

  if (!isDriveScriptLoaded()) {
    alert("Google Drive API script is not loaded yet. Please check your internet connection or wait a moment.");
    return;
  }

  if (!tokenClient) {
    // Try to re-init if it failed previously or if ID was just set
    if (storedCallback) {
        initGoogleDrive(storedCallback);
    }
    
    // Check immediately after re-init attempt
    // We add a small delay to allow the initTokenClient to finish if it's synchronous logic wrapped in async script loading
    setTimeout(() => {
        if (!tokenClient) {
             // Attempting one last direct init
             if (window.google && window.google.accounts && window.google.accounts.oauth2 && storedCallback) {
                 try {
                     tokenClient = window.google.accounts.oauth2.initTokenClient({
                        client_id: activeClientId,
                        scope: SCOPES,
                        callback: storedCallback,
                     });
                     tokenClient.requestAccessToken();
                 } catch(e) {
                     alert("Failed to initialize Google Drive Client. Please refresh the page.");
                 }
             } else {
                 alert("Failed to initialize Google Drive Client.");
             }
        } else {
            try {
                tokenClient.requestAccessToken();
            } catch (e) {
                console.error(e);
                alert("Error opening Google Sign-In popup. Please allow popups for this site.");
            }
        }
    }, 200);
    return;
  }

  try {
    // This triggers the popup
    tokenClient.requestAccessToken();
  } catch (e) {
    console.error(e);
    alert("Error opening Google Sign-In popup. Please allow popups for this site.");
  }
};

export const listBackupFiles = async (accessToken: string): Promise<DriveFile[]> => {
  // Search for JSON files created by this app
  const query = `mimeType = 'application/json' and trashed = false`; 
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, modifiedTime, createdTime)&orderBy=modifiedTime desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error('Failed to list files');
  }

  const data = await response.json();
  return data.files || [];
};

export const saveToDrive = async (data: any, accessToken: string, existingFileId?: string): Promise<string> => {
  const fileName = `wealthflow_backup_${new Date().toISOString().split('T')[0]}.json`;
  const fileContent = JSON.stringify(data, null, 2);
  const file = new Blob([fileContent], { type: 'application/json' });
  
  const metadata = {
    name: fileName, 
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  if (existingFileId) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
    method = 'PATCH';
  }

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to save to Drive: ${err}`);
  }

  const result = await response.json();
  return result.id;
};

export const getFileContent = async (fileId: string, accessToken: string): Promise<any> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download file content');
  }

  return await response.json();
};
