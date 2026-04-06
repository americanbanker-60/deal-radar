import { describe, it, expect } from 'vitest';
import { reducer, initialState, ActionTypes } from './useOpsConsoleReducer';

describe('OpsConsole reducer', () => {
  it('returns initial state for unknown action', () => {
    const state = reducer(initialState, { type: 'UNKNOWN_ACTION' });
    expect(state).toBe(initialState);
  });

  it('sets loading state', () => {
    const state = reducer(initialState, { type: ActionTypes.SET_LOADING, payload: true });
    expect(state.loading).toBe(true);
  });

  it('sets upload error', () => {
    const state = reducer(initialState, { type: ActionTypes.SET_UPLOAD_ERROR, payload: 'File too large' });
    expect(state.uploadError).toBe('File too large');
  });

  it('clears upload error', () => {
    const stateWithError = { ...initialState, uploadError: 'Some error' };
    const state = reducer(stateWithError, { type: ActionTypes.SET_UPLOAD_ERROR, payload: null });
    expect(state.uploadError).toBe(null);
  });

  it('sets success message', () => {
    const state = reducer(initialState, { type: ActionTypes.SET_SUCCESS_MESSAGE, payload: 'Saved!' });
    expect(state.successMessage).toBe('Saved!');
  });

  it('sets raw companies data', () => {
    const data = [{ name: 'Acme' }, { name: 'Beta' }];
    const state = reducer(initialState, { type: ActionTypes.SET_GR_COMPANIES_RAW, payload: data });
    expect(state.grCompaniesRaw).toEqual(data);
    expect(state.grCompaniesRaw).toHaveLength(2);
  });

  it('sets headers', () => {
    const headers = ['Name', 'Revenue', 'Employees'];
    const state = reducer(initialState, { type: ActionTypes.SET_GR_HEADERS, payload: headers });
    expect(state.grHeaders).toEqual(headers);
  });

  it('sets crawling state and progress', () => {
    let state = reducer(initialState, { type: ActionTypes.SET_CRAWLING, payload: true });
    expect(state.crawling).toBe(true);

    state = reducer(state, { type: ActionTypes.SET_CRAWL_PROGRESS, payload: { current: 5, total: 10 } });
    expect(state.crawlProgress).toEqual({ current: 5, total: 10 });
  });

  it('updates filter state', () => {
    const state = reducer(initialState, { type: ActionTypes.SET_REGION_FILTER, payload: 'CA' });
    expect(state.regionFilter).toBe('CA');
  });

  it('updates weights', () => {
    const newWeights = { employees: 50, clinics: 20, revenue: 10, website: 10, keywords: 10 };
    const state = reducer(initialState, { type: ActionTypes.SET_WEIGHTS, payload: newWeights });
    expect(state.weights).toEqual(newWeights);
  });

  it('updates target ranges', () => {
    let state = reducer(initialState, { type: ActionTypes.SET_TARGET_MIN_EMP, payload: 50 });
    expect(state.targetMinEmp).toBe(50);

    state = reducer(state, { type: ActionTypes.SET_TARGET_MAX_EMP, payload: 200 });
    expect(state.targetMaxEmp).toBe(200);
  });

  it('manages campaign state', () => {
    const campaigns = [{ id: '1', name: 'Q1' }, { id: '2', name: 'Q2' }];
    let state = reducer(initialState, { type: ActionTypes.SET_CAMPAIGNS, payload: campaigns });
    expect(state.campaigns).toHaveLength(2);

    state = reducer(state, { type: ActionTypes.SET_SELECTED_CAMPAIGN_ID, payload: '1' });
    expect(state.selectedCampaignId).toBe('1');
  });

  it('manages save progress', () => {
    let state = reducer(initialState, { type: ActionTypes.SET_SAVING, payload: true });
    expect(state.saving).toBe(true);

    state = reducer(state, {
      type: ActionTypes.SET_SAVE_PROGRESS,
      payload: { current: 50, total: 100, step: 'Processing batch 1...' }
    });
    expect(state.saveProgress.current).toBe(50);
    expect(state.saveProgress.step).toBe('Processing batch 1...');
  });

  it('toggles selected targets', () => {
    const state = reducer(initialState, { type: ActionTypes.SET_SELECTED_TARGETS, payload: new Set([0, 1, 2]) });
    expect(state.selectedTargets.size).toBe(3);
    expect(state.selectedTargets.has(1)).toBe(true);
  });

  it('manages UI state', () => {
    let state = reducer(initialState, { type: ActionTypes.SET_SHOW_HOW_TO, payload: true });
    expect(state.showHowTo).toBe(true);

    state = reducer(state, { type: ActionTypes.SET_PAGE, payload: 'settings' });
    expect(state.page).toBe('settings');
  });

  it('manages health alert count', () => {
    const state = reducer(initialState, { type: ActionTypes.SET_HEALTH_ALERT_COUNT, payload: 5 });
    expect(state.healthAlertCount).toBe(5);
  });

  it('has correct default weights in initial state', () => {
    expect(initialState.weights.employees).toBe(35);
    expect(initialState.weights.clinics).toBe(25);
    expect(initialState.weights.revenue).toBe(15);
    expect(initialState.weights.website).toBe(15);
    expect(initialState.weights.keywords).toBe(10);
  });
});
