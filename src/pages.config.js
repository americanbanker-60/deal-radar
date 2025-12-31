import Home from './pages/Home';
import OAuthCallback from './pages/OAuthCallback';
import OpsConsole from './pages/OpsConsole';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SavedTargets from './pages/SavedTargets';
import TermsOfService from './pages/TermsOfService';
import Documentation from './pages/Documentation';


export const PAGES = {
    "Home": Home,
    "OAuthCallback": OAuthCallback,
    "OpsConsole": OpsConsole,
    "PrivacyPolicy": PrivacyPolicy,
    "SavedTargets": SavedTargets,
    "TermsOfService": TermsOfService,
    "Documentation": Documentation,
}

export const pagesConfig = {
    mainPage: "OpsConsole",
    Pages: PAGES,
};