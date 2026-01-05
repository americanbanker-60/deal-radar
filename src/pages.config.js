import Documentation from './pages/Documentation';
import Home from './pages/Home';
import OAuthCallback from './pages/OAuthCallback';
import OpsConsole from './pages/OpsConsole';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SavedTargets from './pages/SavedTargets';
import TermsOfService from './pages/TermsOfService';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Documentation": Documentation,
    "Home": Home,
    "OAuthCallback": OAuthCallback,
    "OpsConsole": OpsConsole,
    "PrivacyPolicy": PrivacyPolicy,
    "SavedTargets": SavedTargets,
    "TermsOfService": TermsOfService,
}

export const pagesConfig = {
    mainPage: "OpsConsole",
    Pages: PAGES,
    Layout: __Layout,
};