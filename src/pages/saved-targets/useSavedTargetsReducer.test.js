import { describe, it, expect } from 'vitest';
import { reducer, initialState, ActionTypes } from './useSavedTargetsReducer';

describe('SavedTargets reducer', () => {
  it('returns initial state for unknown action', () => {
    const state = reducer(initialState, { type: 'UNKNOWN_ACTION' });
    expect(state).toBe(initialState);
  });

  // Filter state (nested under state.filters)
  it('sets campaign filter', () => {
    const state = reducer(initialState, { type: ActionTypes.SET_SELECTED_CAMPAIGN, payload: 'Q1-2026' });
    expect(state.filters.selectedCampaign).toBe('Q1-2026');
  });

  it('sets search query', () => {
    const state = reducer(initialState, { type: ActionTypes.SET_SEARCH_QUERY, payload: 'dental' });
    expect(state.filters.searchQuery).toBe('dental');
  });

  it('sets status filter', () => {
    const state = reducer(initialState, { type: ActionTypes.SET_STATUS_FILTER, payload: 'qualified' });
    expect(state.filters.statusFilter).toBe('qualified');
  });

  it('sets multiple filters independently', () => {
    let state = reducer(initialState, { type: ActionTypes.SET_CLINIC_FILTER, payload: 'has' });
    state = reducer(state, { type: ActionTypes.SET_QUALITY_FILTER, payload: 'great' });
    state = reducer(state, { type: ActionTypes.SET_SECTOR_FILTER, payload: 'HS: Dentistry' });
    expect(state.filters.clinicFilter).toBe('has');
    expect(state.filters.qualityFilter).toBe('great');
    expect(state.filters.sectorFilter).toBe('HS: Dentistry');
  });

  // Sort state (nested under state.sort)
  it('sets sort field and direction', () => {
    let state = reducer(initialState, { type: ActionTypes.SET_SORT_FIELD, payload: 'employees' });
    expect(state.sort.sortField).toBe('employees');

    state = reducer(state, { type: ActionTypes.SET_SORT_DIRECTION, payload: 'asc' });
    expect(state.sort.sortDirection).toBe('asc');
  });

  // Pagination (nested under state.pagination)
  it('sets current page', () => {
    const state = reducer(initialState, { type: ActionTypes.SET_CURRENT_PAGE, payload: 3 });
    expect(state.pagination.currentPage).toBe(3);
  });

  it('defaults to page 1', () => {
    expect(initialState.pagination.currentPage).toBe(1);
  });

  // Selection (nested under state.selection)
  it('sets selected targets', () => {
    const selected = new Set(['id1', 'id2', 'id3']);
    const state = reducer(initialState, { type: ActionTypes.SET_SELECTED_TARGETS, payload: selected });
    expect(state.selection.selectedTargets.size).toBe(3);
    expect(state.selection.selectedTargets.has('id2')).toBe(true);
  });

  // Operation states (nested under state.operations)
  it('sets rescoring state', () => {
    const state = reducer(initialState, { type: ActionTypes.SET_RESCORING, payload: true });
    expect(state.operations.rescoring).toBe(true);
  });

  it('manages crawl progress', () => {
    let state = reducer(initialState, { type: ActionTypes.SET_CRAWLING, payload: true });
    expect(state.operations.crawling).toBe(true);

    state = reducer(state, { type: ActionTypes.SET_CRAWL_PROGRESS, payload: { current: 10, total: 50 } });
    expect(state.operations.crawlProgress).toEqual({ current: 10, total: 50 });
  });

  it('manages quality scoring progress', () => {
    let state = reducer(initialState, { type: ActionTypes.SET_SCORING_QUALITY, payload: true });
    expect(state.operations.scoringQuality).toBe(true);

    state = reducer(state, { type: ActionTypes.SET_QUALITY_PROGRESS, payload: { current: 5, total: 20 } });
    expect(state.operations.qualityProgress).toEqual({ current: 5, total: 20 });
  });

  it('manages enrichment progress', () => {
    let state = reducer(initialState, { type: ActionTypes.SET_ENRICHING_CONTACTS, payload: true });
    expect(state.operations.enrichingContacts).toBe(true);

    state = reducer(state, { type: ActionTypes.SET_ENRICH_PROGRESS, payload: { current: 3, total: 15 } });
    expect(state.operations.enrichProgress).toEqual({ current: 3, total: 15 });
  });

  it('manages enrich all progress with step', () => {
    const state = reducer(initialState, {
      type: ActionTypes.SET_ENRICH_ALL_PROGRESS,
      payload: { step: 'Processing chunk 2 of 5', current: 10, total: 25 }
    });
    expect(state.operations.enrichAllProgress.step).toBe('Processing chunk 2 of 5');
    expect(state.operations.enrichAllProgress.current).toBe(10);
  });

  // UI state (nested under state.ui)
  it('sets drawer target', () => {
    const target = { id: '123', name: 'Test Corp' };
    const state = reducer(initialState, { type: ActionTypes.SET_DRAWER_TARGET, payload: target });
    expect(state.ui.drawerTarget).toEqual(target);
  });

  it('manages bulk sector dialog', () => {
    let state = reducer(initialState, { type: ActionTypes.SET_SHOW_BULK_SECTOR_DIALOG, payload: true });
    expect(state.ui.showBulkSectorDialog).toBe(true);

    state = reducer(state, { type: ActionTypes.SET_BULK_SECTOR_VALUE, payload: 'HS: Urgent Care' });
    expect(state.ui.bulkSectorValue).toBe('HS: Urgent Care');
  });

  it('manages insights and email state', () => {
    let state = reducer(initialState, { type: ActionTypes.SET_INSIGHTS, payload: 'Top 5 targets...' });
    expect(state.ui.insights).toBe('Top 5 targets...');

    state = reducer(state, { type: ActionTypes.SET_EMAIL_SUBJECT, payload: 'Q1 Targets' });
    expect(state.ui.emailSubject).toBe('Q1 Targets');
  });

  // Initial state correctness
  it('has correct default values', () => {
    expect(initialState.filters.selectedCampaign).toBe('all');
    expect(initialState.filters.statusFilter).toBe('all');
    expect(initialState.sort.sortDirection).toBe('desc');
    expect(initialState.pagination.itemsPerPage).toBe(50);
    expect(initialState.settings.fitKeywords).toBe('Healthcare Services');
    expect(initialState.ui.emailSubject).toBe('BD Targets & Market Snapshot');
  });

  it('has empty defaults for operation states', () => {
    expect(initialState.operations.rescoring).toBe(false);
    expect(initialState.operations.crawling).toBe(false);
    expect(initialState.operations.enrichingContacts).toBe(false);
    expect(initialState.operations.crawlProgress).toEqual({ current: 0, total: 0 });
  });
});
