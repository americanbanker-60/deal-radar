import OpsConsole from './pages/OpsConsole';
import OAuthCallback from './pages/OAuthCallback';
import SavedTargets from './pages/SavedTargets';


export const PAGES = {
    "OpsConsole": OpsConsole,
    "OAuthCallback": OAuthCallback,
    "SavedTargets": SavedTargets,
}

export const pagesConfig = {
    mainPage: "OpsConsole",
    Pages: PAGES,
};