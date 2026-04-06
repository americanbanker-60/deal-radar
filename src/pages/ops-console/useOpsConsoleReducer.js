// Action type constants
export const ActionTypes = {
  // Upload
  SET_LOADING: "SET_LOADING",
  SET_UPLOAD_ERROR: "SET_UPLOAD_ERROR",
  SET_SUCCESS_MESSAGE: "SET_SUCCESS_MESSAGE",
  SET_GR_COMPANIES_RAW: "SET_GR_COMPANIES_RAW",
  SET_GR_HEADERS: "SET_GR_HEADERS",

  // Crawl
  SET_CRAWLING: "SET_CRAWLING",
  SET_CRAWL_PROGRESS: "SET_CRAWL_PROGRESS",

  // Enrich
  SET_ENRICHING: "SET_ENRICHING",
  SET_ENRICH_PROGRESS: "SET_ENRICH_PROGRESS",
  SET_RECLASSIFYING_SECTORS: "SET_RECLASSIFYING_SECTORS",
  SET_SECTOR_PROGRESS: "SET_SECTOR_PROGRESS",
  SET_RECALCULATING_SCORES: "SET_RECALCULATING_SCORES",

  // Filters
  SET_REGION_FILTER: "SET_REGION_FILTER",
  SET_MIN_REV: "SET_MIN_REV",
  SET_MAX_REV: "SET_MAX_REV",
  SET_OWNER_PREF: "SET_OWNER_PREF",

  // Scoring
  SET_WEIGHTS: "SET_WEIGHTS",
  SET_TARGET_MIN_EMP: "SET_TARGET_MIN_EMP",
  SET_TARGET_MAX_EMP: "SET_TARGET_MAX_EMP",
  SET_TARGET_MIN_REV: "SET_TARGET_MIN_REV",
  SET_TARGET_MAX_REV: "SET_TARGET_MAX_REV",

  // Campaign
  SET_CAMPAIGN_NAME: "SET_CAMPAIGN_NAME",
  SET_SELECTED_CAMPAIGN_ID: "SET_SELECTED_CAMPAIGN_ID",
  SET_CAMPAIGNS: "SET_CAMPAIGNS",
  PREPEND_CAMPAIGN: "PREPEND_CAMPAIGN",
  SET_LOADING_CAMPAIGNS: "SET_LOADING_CAMPAIGNS",
  SET_SHOW_NEW_CAMPAIGN_DIALOG: "SET_SHOW_NEW_CAMPAIGN_DIALOG",
  SET_NEW_CAMPAIGN_DATA: "SET_NEW_CAMPAIGN_DATA",

  // Save
  SET_SAVING: "SET_SAVING",
  SET_SAVE_PROGRESS: "SET_SAVE_PROGRESS",

  // UI
  SET_PAGE: "SET_PAGE",
  SET_SHOW_HOW_TO: "SET_SHOW_HOW_TO",
  SET_SHOW_LOOKALIKE_DIALOG: "SET_SHOW_LOOKALIKE_DIALOG",
  SET_LOOKALIKE_TARGET: "SET_LOOKALIKE_TARGET",
  SET_LOOKALIKES: "SET_LOOKALIKES",
  SET_FINDING_LOOKALIKES: "SET_FINDING_LOOKALIKES",
  SET_ADDING_LOOKALIKE: "SET_ADDING_LOOKALIKE",

  // Selection
  SET_SELECTED_TARGETS: "SET_SELECTED_TARGETS",

  // Settings
  SET_VERTICAL: "SET_VERTICAL",
  SET_TAG: "SET_TAG",

  // Personalize
  SET_PERSONALIZING_TARGETS: "SET_PERSONALIZING_TARGETS",
  SET_PERSONALIZE_PROGRESS: "SET_PERSONALIZE_PROGRESS",

  // Growth
  SET_DETECTING_GROWTH: "SET_DETECTING_GROWTH",
  SET_GROWTH_PROGRESS: "SET_GROWTH_PROGRESS",

  // Rationale
  SET_GENERATING_RATIONALES: "SET_GENERATING_RATIONALES",
  SET_RATIONALE_PROGRESS: "SET_RATIONALE_PROGRESS",

  // Health
  SET_HEALTH_ALERT_COUNT: "SET_HEALTH_ALERT_COUNT",

  // Batch actions
  RESET_AFTER_SAVE: "RESET_AFTER_SAVE",
  OPEN_LOOKALIKE_DIALOG: "OPEN_LOOKALIKE_DIALOG",
  CAMPAIGN_CREATED: "CAMPAIGN_CREATED",
  RESET_NEW_CAMPAIGN_DIALOG: "RESET_NEW_CAMPAIGN_DIALOG",
};

const DEFAULT_WEIGHTS = { employees: 35, clinics: 25, revenue: 15, website: 15, keywords: 10 };

const DEFAULT_NEW_CAMPAIGN_DATA = {
  name: "",
  description: "",
  vertical: "Healthcare Services",
  status: "active",
};

function loadWeights() {
  try {
    const saved = localStorage.getItem("ops_console_weights");
    return saved ? JSON.parse(saved) : DEFAULT_WEIGHTS;
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

export const initialState = {
  // Upload
  loading: false,
  uploadError: null,
  successMessage: null,
  grCompaniesRaw: [],
  grHeaders: [],

  // Crawl
  crawling: false,
  crawlProgress: { current: 0, total: 0 },

  // Enrich
  enriching: false,
  enrichProgress: { current: 0, total: 0 },
  reclassifyingSectors: false,
  sectorProgress: { current: 0, total: 0 },
  recalculatingScores: false,

  // Filters
  regionFilter: "",
  minRev: 0,
  maxRev: 100000,
  ownerPref: "Any",

  // Scoring
  weights: loadWeights(),
  targetMinEmp: localStorage.getItem("ops_console_targetMinEmp") || "",
  targetMaxEmp: localStorage.getItem("ops_console_targetMaxEmp") || "",
  targetMinRev: localStorage.getItem("ops_console_targetMinRev") || "",
  targetMaxRev: localStorage.getItem("ops_console_targetMaxRev") || "",
  scoreThreshold: 70,

  // Campaign
  campaignName: "",
  selectedCampaignId: "",
  campaigns: [],
  loadingCampaigns: false,
  showNewCampaignDialog: false,
  newCampaignData: { ...DEFAULT_NEW_CAMPAIGN_DATA },

  // Save
  saving: false,
  saveProgress: { current: 0, total: 0, step: "" },

  // UI
  page: "grata",
  showHowTo: false,
  showLookalikeDialog: false,
  lookalikeTarget: null,
  lookalikes: [],
  findingLookalikes: false,
  addingLookalike: null,

  // Selection
  selectedTargets: new Set(),

  // Settings
  vertical: localStorage.getItem("ops_console_vertical") || "Healthcare Services",
  tag: localStorage.getItem("ops_console_tag") || "BD-Priority",

  // Personalize
  personalizingTargets: false,
  personalizeProgress: { current: 0, total: 0 },

  // Growth
  detectingGrowth: false,
  growthProgress: { current: 0, total: 0 },

  // Rationale
  generatingRationales: false,
  rationaleProgress: { current: 0, total: 0 },

  // Health
  healthAlertCount: 0,
};

export function reducer(state, action) {
  switch (action.type) {
    // Upload
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionTypes.SET_UPLOAD_ERROR:
      return { ...state, uploadError: action.payload };
    case ActionTypes.SET_SUCCESS_MESSAGE:
      return { ...state, successMessage: action.payload };
    case ActionTypes.SET_GR_COMPANIES_RAW:
      return { ...state, grCompaniesRaw: action.payload };
    case ActionTypes.SET_GR_HEADERS:
      return { ...state, grHeaders: action.payload };

    // Crawl
    case ActionTypes.SET_CRAWLING:
      return { ...state, crawling: action.payload };
    case ActionTypes.SET_CRAWL_PROGRESS:
      return { ...state, crawlProgress: action.payload };

    // Enrich
    case ActionTypes.SET_ENRICHING:
      return { ...state, enriching: action.payload };
    case ActionTypes.SET_ENRICH_PROGRESS:
      return { ...state, enrichProgress: action.payload };
    case ActionTypes.SET_RECLASSIFYING_SECTORS:
      return { ...state, reclassifyingSectors: action.payload };
    case ActionTypes.SET_SECTOR_PROGRESS:
      return { ...state, sectorProgress: action.payload };
    case ActionTypes.SET_RECALCULATING_SCORES:
      return { ...state, recalculatingScores: action.payload };

    // Filters
    case ActionTypes.SET_REGION_FILTER:
      return { ...state, regionFilter: action.payload };
    case ActionTypes.SET_MIN_REV:
      return { ...state, minRev: action.payload };
    case ActionTypes.SET_MAX_REV:
      return { ...state, maxRev: action.payload };
    case ActionTypes.SET_OWNER_PREF:
      return { ...state, ownerPref: action.payload };

    // Scoring
    case ActionTypes.SET_WEIGHTS:
      return { ...state, weights: action.payload };
    case ActionTypes.SET_TARGET_MIN_EMP:
      return { ...state, targetMinEmp: action.payload };
    case ActionTypes.SET_TARGET_MAX_EMP:
      return { ...state, targetMaxEmp: action.payload };
    case ActionTypes.SET_TARGET_MIN_REV:
      return { ...state, targetMinRev: action.payload };
    case ActionTypes.SET_TARGET_MAX_REV:
      return { ...state, targetMaxRev: action.payload };

    // Campaign
    case ActionTypes.SET_CAMPAIGN_NAME:
      return { ...state, campaignName: action.payload };
    case ActionTypes.SET_SELECTED_CAMPAIGN_ID:
      return { ...state, selectedCampaignId: action.payload };
    case ActionTypes.SET_CAMPAIGNS:
      return { ...state, campaigns: action.payload };
    case ActionTypes.PREPEND_CAMPAIGN:
      return { ...state, campaigns: [action.payload, ...state.campaigns] };
    case ActionTypes.SET_LOADING_CAMPAIGNS:
      return { ...state, loadingCampaigns: action.payload };
    case ActionTypes.SET_SHOW_NEW_CAMPAIGN_DIALOG:
      return { ...state, showNewCampaignDialog: action.payload };
    case ActionTypes.SET_NEW_CAMPAIGN_DATA:
      return { ...state, newCampaignData: action.payload };

    // Save
    case ActionTypes.SET_SAVING:
      return { ...state, saving: action.payload };
    case ActionTypes.SET_SAVE_PROGRESS:
      return { ...state, saveProgress: action.payload };

    // UI
    case ActionTypes.SET_PAGE:
      return { ...state, page: action.payload };
    case ActionTypes.SET_SHOW_HOW_TO:
      return { ...state, showHowTo: action.payload };
    case ActionTypes.SET_SHOW_LOOKALIKE_DIALOG:
      return { ...state, showLookalikeDialog: action.payload };
    case ActionTypes.SET_LOOKALIKE_TARGET:
      return { ...state, lookalikeTarget: action.payload };
    case ActionTypes.SET_LOOKALIKES:
      return { ...state, lookalikes: action.payload };
    case ActionTypes.SET_FINDING_LOOKALIKES:
      return { ...state, findingLookalikes: action.payload };
    case ActionTypes.SET_ADDING_LOOKALIKE:
      return { ...state, addingLookalike: action.payload };

    // Selection
    case ActionTypes.SET_SELECTED_TARGETS:
      return { ...state, selectedTargets: action.payload };

    // Settings
    case ActionTypes.SET_VERTICAL:
      return { ...state, vertical: action.payload };
    case ActionTypes.SET_TAG:
      return { ...state, tag: action.payload };

    // Personalize
    case ActionTypes.SET_PERSONALIZING_TARGETS:
      return { ...state, personalizingTargets: action.payload };
    case ActionTypes.SET_PERSONALIZE_PROGRESS:
      return { ...state, personalizeProgress: action.payload };

    // Growth
    case ActionTypes.SET_DETECTING_GROWTH:
      return { ...state, detectingGrowth: action.payload };
    case ActionTypes.SET_GROWTH_PROGRESS:
      return { ...state, growthProgress: action.payload };

    // Rationale
    case ActionTypes.SET_GENERATING_RATIONALES:
      return { ...state, generatingRationales: action.payload };
    case ActionTypes.SET_RATIONALE_PROGRESS:
      return { ...state, rationaleProgress: action.payload };

    // Health
    case ActionTypes.SET_HEALTH_ALERT_COUNT:
      return { ...state, healthAlertCount: action.payload };

    // Batch actions
    case ActionTypes.RESET_AFTER_SAVE:
      return {
        ...state,
        saving: false,
        saveProgress: { current: 0, total: 0, step: "" },
        selectedTargets: new Set(),
        selectedCampaignId: "",
        campaignName: "",
      };

    case ActionTypes.OPEN_LOOKALIKE_DIALOG:
      return {
        ...state,
        lookalikeTarget: action.payload,
        showLookalikeDialog: true,
        findingLookalikes: true,
        lookalikes: [],
      };

    case ActionTypes.CAMPAIGN_CREATED:
      return {
        ...state,
        campaigns: [action.payload, ...state.campaigns],
        selectedCampaignId: action.payload.id,
        campaignName: action.payload.name,
        showNewCampaignDialog: false,
        newCampaignData: { ...DEFAULT_NEW_CAMPAIGN_DATA },
      };

    case ActionTypes.RESET_NEW_CAMPAIGN_DIALOG:
      return {
        ...state,
        showNewCampaignDialog: false,
        newCampaignData: { ...DEFAULT_NEW_CAMPAIGN_DATA },
      };

    default:
      console.warn("Unknown action type:", action.type);
      return state;
  }
}
