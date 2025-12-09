import OpsConsole from './pages/OpsConsole';
import OAuthCallback from './pages/OAuthCallback';
import SavedTargets from './pages/SavedTargets';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';


export const PAGES = {
    "OpsConsole": OpsConsole,
    "OAuthCallback": OAuthCallback,
    "SavedTargets": SavedTargets,
    "PrivacyPolicy": PrivacyPolicy,
    "TermsOfService": TermsOfService,
}

export const pagesConfig = {
    mainPage: "OpsConsole",
    Pages: PAGES,
};