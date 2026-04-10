// Action type constants
export const ActionTypes = {
  // Filters
  SET_SELECTED_CAMPAIGN: "SET_SELECTED_CAMPAIGN",
  SET_SEARCH_QUERY: "SET_SEARCH_QUERY",
  SET_STATUS_FILTER: "SET_STATUS_FILTER",
  SET_SECTOR_FILTER: "SET_SECTOR_FILTER",
  SET_CLINIC_FILTER: "SET_CLINIC_FILTER",
  SET_QUALITY_FILTER: "SET_QUALITY_FILTER",
  SET_NAME_FILTER: "SET_NAME_FILTER",
  SET_CORRESPONDENCE_FILTER: "SET_CORRESPONDENCE_FILTER",
  SET_CONTACT_ENRICH_FILTER: "SET_CONTACT_ENRICH_FILTER",
  SET_GROWTH_SIGNALS_FILTER: "SET_GROWTH_SIGNALS_FILTER",
  SET_RATIONALE_FILTER: "SET_RATIONALE_FILTER",
  SET_PERSONALIZATION_FILTER: "SET_PERSONALIZATION_FILTER",
  SET_HEALTH_FILTER: "SET_HEALTH_FILTER",

  // Sort
  SET_SORT_FIELD: "SET_SORT_FIELD",
  SET_SORT_DIRECTION: "SET_SORT_DIRECTION",
  TOGGLE_SORT: "TOGGLE_SORT",

  // Pagination
  SET_CURRENT_PAGE: "SET_CURRENT_PAGE",

  // Selection
  SET_SELECTED_TARGETS: "SET_SELECTED_TARGETS",
  TOGGLE_TARGET: "TOGGLE_TARGET",
  TOGGLE_SELECT_ALL: "TOGGLE_SELECT_ALL",

  // Operations
  SET_RESCORING: "SET_RESCORING",
  SET_CRAWLING: "SET_CRAWLING",
  SET_CRAWL_PROGRESS: "SET_CRAWL_PROGRESS",
  SET_ENRICHING_CONTACTS: "SET_ENRICHING_CONTACTS",
  SET_ENRICH_PROGRESS: "SET_ENRICH_PROGRESS",
  SET_SCORING_QUALITY: "SET_SCORING_QUALITY",
  SET_QUALITY_PROGRESS: "SET_QUALITY_PROGRESS",
  SET_RECLASSIFYING_SECTORS: "SET_RECLASSIFYING_SECTORS",
  SET_SECTOR_PROGRESS: "SET_SECTOR_PROGRESS",
  SET_GENERATING_SHORT_NAMES: "SET_GENERATING_SHORT_NAMES",
  SET_SHORT_NAME_PROGRESS: "SET_SHORT_NAME_PROGRESS",
  SET_PERSONALIZING_TARGETS: "SET_PERSONALIZING_TARGETS",
  SET_PERSONALIZE_PROGRESS: "SET_PERSONALIZE_PROGRESS",
  SET_DETECTING_GROWTH: "SET_DETECTING_GROWTH",
  SET_GROWTH_PROGRESS: "SET_GROWTH_PROGRESS",
  SET_GENERATING_RATIONALES: "SET_GENERATING_RATIONALES",
  SET_RATIONALE_PROGRESS: "SET_RATIONALE_PROGRESS",
  SET_GENERATING_SINGLE_RATIONALE: "SET_GENERATING_SINGLE_RATIONALE",
  SET_REFRESHING_DATA: "SET_REFRESHING_DATA",
  SET_CLEANING_NAMES: "SET_CLEANING_NAMES",
  SET_CLEAN_PROGRESS: "SET_CLEAN_PROGRESS",
  SET_ENRICHING_ALL: "SET_ENRICHING_ALL",
  SET_ENRICH_ALL_PROGRESS: "SET_ENRICH_ALL_PROGRESS",
  SET_ENRICHING_COMPANY_DATA: "SET_ENRICHING_COMPANY_DATA",
  SET_COMPANY_DATA_PROGRESS: "SET_COMPANY_DATA_PROGRESS",
  SET_EXTRACTING_NAMES: "SET_EXTRACTING_NAMES",
  SET_EXTRACT_PROGRESS: "SET_EXTRACT_PROGRESS",
  SET_PUSHING_TO_OUTREACH: "SET_PUSHING_TO_OUTREACH",

  // UI
  SET_DRAWER_TARGET: "SET_DRAWER_TARGET",
  SET_SHOW_BULK_SECTOR_DIALOG: "SET_SHOW_BULK_SECTOR_DIALOG",
  SET_BULK_SECTOR_VALUE: "SET_BULK_SECTOR_VALUE",
  SET_ALERT_MESSAGE: "SET_ALERT_MESSAGE",
  SET_INSIGHTS: "SET_INSIGHTS",
  SET_EMAIL_SUBJECT: "SET_EMAIL_SUBJECT",
  SET_EMAIL_BODY: "SET_EMAIL_BODY",

  // Settings
  SET_FIT_KEYWORDS: "SET_FIT_KEYWORDS",
};

export const initialState = {
  // Filters
  filters: {
    selectedCampaign: "all",
    searchQuery: "",
    statusFilter: "all",
    sectorFilter: "all",
    clinicFilter: "all",
    qualityFilter: "all",
    nameFilter: "all",
    correspondenceFilter: "all",
    contactEnrichFilter: "all",
    growthSignalsFilter: "all",
    rationaleFilter: "all",
    personalizationFilter: "all",
    healthFilter: "all",
  },

  // Sort
  sort: {
    sortField: null,
    sortDirection: "desc",
  },

  // Pagination
  pagination: {
    currentPage: 1,
    itemsPerPage: 50,
  },

  // Selection
  selection: {
    selectedTargets: new Set(),
  },

  // Operations
  operations: {
    rescoring: false,
    crawling: false,
    crawlProgress: { current: 0, total: 0 },
    enrichingContacts: false,
    enrichProgress: { current: 0, total: 0 },
    scoringQuality: false,
    qualityProgress: { current: 0, total: 0 },
    reclassifyingSectors: false,
    sectorProgress: { current: 0, total: 0 },
    generatingShortNames: false,
    shortNameProgress: { current: 0, total: 0 },
    personalizingTargets: false,
    personalizeProgress: { current: 0, total: 0 },
    detectingGrowth: false,
    growthProgress: { current: 0, total: 0 },
    generatingRationales: false,
    rationaleProgress: { current: 0, total: 0 },
    generatingSingleRationale: null,
    refreshingData: null,
    cleaningNames: false,
    cleanProgress: { current: 0, total: 0 },
    enrichingAll: false,
    enrichAllProgress: { step: "", current: 0, total: 0 },
    enrichingCompanyData: false,
    companyDataProgress: { current: 0, total: 0 },
    extractingNames: false,
    extractProgress: { current: 0, total: 0 },
    pushingToOutreach: false,
  },

  // UI
  ui: {
    drawerTarget: null,
    showBulkSectorDialog: false,
    bulkSectorValue: "",
    alertMessage: "",
    insights: "",
    emailSubject: "BD Targets & Market Snapshot",
    emailBody: "",
  },

  // Settings
  settings: {
    fitKeywords: "Healthcare Services",
  },
};

export function reducer(state, action) {
  switch (action.type) {
    // --- Filters ---
    case ActionTypes.SET_SELECTED_CAMPAIGN:
      return { ...state, filters: { ...state.filters, selectedCampaign: action.payload } };
    case ActionTypes.SET_SEARCH_QUERY:
      return { ...state, filters: { ...state.filters, searchQuery: action.payload } };
    case ActionTypes.SET_STATUS_FILTER:
      return { ...state, filters: { ...state.filters, statusFilter: action.payload } };
    case ActionTypes.SET_SECTOR_FILTER:
      return { ...state, filters: { ...state.filters, sectorFilter: action.payload } };
    case ActionTypes.SET_CLINIC_FILTER:
      return { ...state, filters: { ...state.filters, clinicFilter: action.payload } };
    case ActionTypes.SET_QUALITY_FILTER:
      return { ...state, filters: { ...state.filters, qualityFilter: action.payload } };
    case ActionTypes.SET_NAME_FILTER:
      return { ...state, filters: { ...state.filters, nameFilter: action.payload } };
    case ActionTypes.SET_CORRESPONDENCE_FILTER:
      return { ...state, filters: { ...state.filters, correspondenceFilter: action.payload } };
    case ActionTypes.SET_CONTACT_ENRICH_FILTER:
      return { ...state, filters: { ...state.filters, contactEnrichFilter: action.payload } };
    case ActionTypes.SET_GROWTH_SIGNALS_FILTER:
      return { ...state, filters: { ...state.filters, growthSignalsFilter: action.payload } };
    case ActionTypes.SET_RATIONALE_FILTER:
      return { ...state, filters: { ...state.filters, rationaleFilter: action.payload } };
    case ActionTypes.SET_PERSONALIZATION_FILTER:
      return { ...state, filters: { ...state.filters, personalizationFilter: action.payload } };
    case ActionTypes.SET_HEALTH_FILTER:
      return { ...state, filters: { ...state.filters, healthFilter: action.payload } };

    // --- Sort ---
    case ActionTypes.SET_SORT_FIELD:
      return { ...state, sort: { ...state.sort, sortField: action.payload } };
    case ActionTypes.SET_SORT_DIRECTION:
      return { ...state, sort: { ...state.sort, sortDirection: action.payload } };
    case ActionTypes.TOGGLE_SORT: {
      const { field } = action.payload;
      if (state.sort.sortField === field) {
        return {
          ...state,
          sort: {
            ...state.sort,
            sortDirection: state.sort.sortDirection === "asc" ? "desc" : "asc",
          },
        };
      }
      return {
        ...state,
        sort: { sortField: field, sortDirection: "desc" },
      };
    }

    // --- Pagination ---
    case ActionTypes.SET_CURRENT_PAGE:
      return { ...state, pagination: { ...state.pagination, currentPage: action.payload } };

    // --- Selection ---
    case ActionTypes.SET_SELECTED_TARGETS:
      return { ...state, selection: { ...state.selection, selectedTargets: action.payload } };
    case ActionTypes.TOGGLE_TARGET: {
      const newSelected = new Set(state.selection.selectedTargets);
      if (newSelected.has(action.payload)) {
        newSelected.delete(action.payload);
      } else {
        newSelected.add(action.payload);
      }
      return { ...state, selection: { ...state.selection, selectedTargets: newSelected } };
    }
    case ActionTypes.TOGGLE_SELECT_ALL: {
      const { filteredIds } = action.payload;
      if (state.selection.selectedTargets.size === filteredIds.length) {
        return { ...state, selection: { ...state.selection, selectedTargets: new Set() } };
      }
      return { ...state, selection: { ...state.selection, selectedTargets: new Set(filteredIds) } };
    }

    // --- Operations ---
    case ActionTypes.SET_RESCORING:
      return { ...state, operations: { ...state.operations, rescoring: action.payload } };
    case ActionTypes.SET_CRAWLING:
      return { ...state, operations: { ...state.operations, crawling: action.payload } };
    case ActionTypes.SET_CRAWL_PROGRESS:
      return { ...state, operations: { ...state.operations, crawlProgress: action.payload } };
    case ActionTypes.SET_ENRICHING_CONTACTS:
      return { ...state, operations: { ...state.operations, enrichingContacts: action.payload } };
    case ActionTypes.SET_ENRICH_PROGRESS:
      return { ...state, operations: { ...state.operations, enrichProgress: action.payload } };
    case ActionTypes.SET_SCORING_QUALITY:
      return { ...state, operations: { ...state.operations, scoringQuality: action.payload } };
    case ActionTypes.SET_QUALITY_PROGRESS:
      return { ...state, operations: { ...state.operations, qualityProgress: action.payload } };
    case ActionTypes.SET_RECLASSIFYING_SECTORS:
      return { ...state, operations: { ...state.operations, reclassifyingSectors: action.payload } };
    case ActionTypes.SET_SECTOR_PROGRESS:
      return { ...state, operations: { ...state.operations, sectorProgress: action.payload } };
    case ActionTypes.SET_GENERATING_SHORT_NAMES:
      return { ...state, operations: { ...state.operations, generatingShortNames: action.payload } };
    case ActionTypes.SET_SHORT_NAME_PROGRESS:
      return { ...state, operations: { ...state.operations, shortNameProgress: action.payload } };
    case ActionTypes.SET_PERSONALIZING_TARGETS:
      return { ...state, operations: { ...state.operations, personalizingTargets: action.payload } };
    case ActionTypes.SET_PERSONALIZE_PROGRESS:
      return { ...state, operations: { ...state.operations, personalizeProgress: action.payload } };
    case ActionTypes.SET_DETECTING_GROWTH:
      return { ...state, operations: { ...state.operations, detectingGrowth: action.payload } };
    case ActionTypes.SET_GROWTH_PROGRESS:
      return { ...state, operations: { ...state.operations, growthProgress: action.payload } };
    case ActionTypes.SET_GENERATING_RATIONALES:
      return { ...state, operations: { ...state.operations, generatingRationales: action.payload } };
    case ActionTypes.SET_RATIONALE_PROGRESS:
      return { ...state, operations: { ...state.operations, rationaleProgress: action.payload } };
    case ActionTypes.SET_GENERATING_SINGLE_RATIONALE:
      return { ...state, operations: { ...state.operations, generatingSingleRationale: action.payload } };
    case ActionTypes.SET_REFRESHING_DATA:
      return { ...state, operations: { ...state.operations, refreshingData: action.payload } };
    case ActionTypes.SET_CLEANING_NAMES:
      return { ...state, operations: { ...state.operations, cleaningNames: action.payload } };
    case ActionTypes.SET_CLEAN_PROGRESS:
      return { ...state, operations: { ...state.operations, cleanProgress: action.payload } };
    case ActionTypes.SET_ENRICHING_ALL:
      return { ...state, operations: { ...state.operations, enrichingAll: action.payload } };
    case ActionTypes.SET_ENRICH_ALL_PROGRESS:
      return { ...state, operations: { ...state.operations, enrichAllProgress: action.payload } };
    case ActionTypes.SET_ENRICHING_COMPANY_DATA:
      return { ...state, operations: { ...state.operations, enrichingCompanyData: action.payload } };
    case ActionTypes.SET_COMPANY_DATA_PROGRESS:
      return { ...state, operations: { ...state.operations, companyDataProgress: action.payload } };
    case ActionTypes.SET_EXTRACTING_NAMES:
      return { ...state, operations: { ...state.operations, extractingNames: action.payload } };
    case ActionTypes.SET_EXTRACT_PROGRESS:
      return { ...state, operations: { ...state.operations, extractProgress: action.payload } };
    case ActionTypes.SET_PUSHING_TO_OUTREACH:
      return { ...state, operations: { ...state.operations, pushingToOutreach: action.payload } };

    // --- UI ---
    case ActionTypes.SET_DRAWER_TARGET:
      return { ...state, ui: { ...state.ui, drawerTarget: action.payload } };
    case ActionTypes.SET_SHOW_BULK_SECTOR_DIALOG:
      return { ...state, ui: { ...state.ui, showBulkSectorDialog: action.payload } };
    case ActionTypes.SET_BULK_SECTOR_VALUE:
      return { ...state, ui: { ...state.ui, bulkSectorValue: action.payload } };
    case ActionTypes.SET_ALERT_MESSAGE:
      return { ...state, ui: { ...state.ui, alertMessage: action.payload } };
    case ActionTypes.SET_INSIGHTS:
      return { ...state, ui: { ...state.ui, insights: action.payload } };
    case ActionTypes.SET_EMAIL_SUBJECT:
      return { ...state, ui: { ...state.ui, emailSubject: action.payload } };
    case ActionTypes.SET_EMAIL_BODY:
      return { ...state, ui: { ...state.ui, emailBody: action.payload } };

    // --- Settings ---
    case ActionTypes.SET_FIT_KEYWORDS:
      return { ...state, settings: { ...state.settings, fitKeywords: action.payload } };

    default:
      return state;
  }
}
