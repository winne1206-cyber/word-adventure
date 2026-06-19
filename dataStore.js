const WORD_ADVENTURE_STORAGE_KEY = "wordAdventureProgress.v2";
const WORD_ADVENTURE_CUSTOM_WORDS_KEY = "wordAdventureCustomWords.v1";
const DATASTORE_CHANGE_EVENT = "wordAdventure:dataStoreChange";
const FIREBASE_VERSION = "12.15.0";
const FIREBASE_FIRESTORE_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`;
const FIRESTORE_FAMILY_ID = "jiang-family";
const FIRESTORE_COLLECTION_PATH = ["families", FIRESTORE_FAMILY_ID, "state", "appState"];

let cloudPushState = null;
let cloudStatus = {
  syncMode: "local",
  online: false,
  syncing: false,
  lastSyncedAt: null,
  error: null
};
let pushTimer = null;
let lastCloudPushedJson = "";
let initializedEmptyCloudDocument = false;
let cloudUnsubscribe = null;
let memoryState = null;
const listeners = new Set();

const GARDEN_LEVEL_RULES = [
  { level: 1, points: 0 },
  { level: 2, points: 20 },
  { level: 3, points: 50 },
  { level: 4, points: 100 },
  { level: 5, points: 180 },
  { level: 6, points: 300 },
  { level: 7, points: 450 },
  { level: 8, points: 650 },
  { level: 9, points: 900 },
  { level: 10, points: 1200 }
];

function gardenLevelFromPoints(points) {
  const safePoints = Math.max(0, Number(points) || 0);
  return GARDEN_LEVEL_RULES.reduce((level, item) => (safePoints >= item.points ? item.level : level), 1);
}

function readJson(key, fallback = null) {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function isStorageQuotaError(error) {
  return error?.name === "QuotaExceededError"
    || error?.name === "NS_ERROR_DOM_QUOTA_REACHED"
    || error?.code === 22
    || error?.code === 1014;
}

function isDataUrl(value) {
  return typeof value === "string" && value.startsWith("data:");
}

function shouldStripDataUrl(value) {
  return isDataUrl(value) && value.length > 450000;
}

function compactAccessoryImagesForLocalStorage(state) {
  const next = cloneState(state);
  const compactList = (items) => {
    if (!Array.isArray(items)) return items;
    return items
      .map((item) => {
        if (!item || typeof item !== "object") return item;
        const compact = { ...item };
        ["wearableSrc", "wearImage", "image", "iconSrc", "iconImage"].forEach((field) => {
          if (shouldStripDataUrl(compact[field])) compact[field] = "";
        });
        return compact;
      });
  };

  const library = next?.accessoryLibrary;
  if (library?.customAccessories) {
    library.customAccessories = compactList(library.customAccessories);
  }
  if (next?.children && typeof next.children === "object") {
    Object.values(next.children).forEach((child) => {
      if (child?.customAccessories) child.customAccessories = compactList(child.customAccessories);
    });
  }
  return next;
}

function cloneState(value) {
  if (!value || typeof value !== "object") return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function notifyStateChange(state, detail = {}) {
  const payload = { state: ensureStateShape(state), status: { ...cloudStatus }, ...detail };
  listeners.forEach((listener) => listener(payload));
  window.dispatchEvent(new CustomEvent(DATASTORE_CHANGE_EVENT, { detail: payload }));
}

function ensureStateShape(state) {
  const next = state && typeof state === "object" ? state : {};
  next.syncMode = cloudStatus.syncMode || next.syncMode || "local";
  next.children = next.children && typeof next.children === "object" ? next.children : {};
  next.garden = next.garden && typeof next.garden === "object"
    ? next.garden
    : { sharedGardenPoints: 0, sharedGardenLevel: 1, childGarden: {} };
  next.garden.childGarden = next.garden.childGarden && typeof next.garden.childGarden === "object"
    ? next.garden.childGarden
    : {};
  next.customWords = Array.isArray(next.customWords) ? next.customWords : [];
  next.settings = next.settings && typeof next.settings === "object" ? next.settings : {};
  return next;
}

function timestampMs(value) {
  const ms = Date.parse(value || "");
  return Number.isFinite(ms) ? ms : 0;
}

function hasMeaningfulStateData(state) {
  if (!state || typeof state !== "object") return false;
  if (Array.isArray(state.customWords) && state.customWords.length > 0) return true;
  const library = state.accessoryLibrary;
  if (Array.isArray(library?.customAccessories) && library.customAccessories.length > 0) return true;
  const garden = state.garden;
  if ((Number(garden?.sharedGardenPoints) || 0) > 0 || (Number(garden?.sharedGardenLevel) || 1) > 1) return true;

  return Object.values(state.children || {}).some((child) => {
    if (!child || typeof child !== "object") return false;
    if ((Number(child.stars) || 0) > 0 || (Number(child.diamonds) || 0) > 0) return true;
    return [
      "learnedWordIds",
      "masteredWordIds",
      "wrongWordIds",
      "completedStageIds",
      "claimedStageRewardIds",
      "rewardCoupons",
      "customWords",
      "customAccessories"
    ].some((field) => Array.isArray(child[field]) && child[field].length > 0)
      || (Array.isArray(child.unlockedAccessories) && child.unlockedAccessories.some((id) => id && id !== "none"))
      || (Array.isArray(child.equippedAccessories) && child.equippedAccessories.some((id) => id && id !== "none"));
  });
}

function withUpdatedAt(state, updatedAt = new Date().toISOString()) {
  return ensureStateShape({ ...state, updatedAt });
}

function toCloudAppState(state, firestore) {
  const next = ensureStateShape({ ...state, syncMode: "cloud" });
  const updatedAt = next.updatedAt || new Date().toISOString();
  return {
    ...next,
    customWords: Array.isArray(next.customWords) ? next.customWords : [],
    settings: next.settings && typeof next.settings === "object" ? next.settings : {},
    updatedAt,
    cloudUpdatedAt: firestore.serverTimestamp()
  };
}

function fromCloudAppState(data) {
  if (!data || typeof data !== "object") return null;
  const source = data.state && typeof data.state === "object" ? data.state : data;
  const { cloudUpdatedAt, ...rest } = source;
  return ensureStateShape(rest);
}

function uniquePush(list, value) {
  const next = Array.isArray(list) ? [...list] : [];
  if (!next.includes(value)) next.push(value);
  return next;
}

function getChild(state, childId) {
  state.children = state.children || {};
  state.children[childId] = state.children[childId] || {};
  return state.children[childId];
}

function getState() {
  return memoryState ? ensureStateShape(compactAccessoryImagesForLocalStorage(memoryState)) : loadLocal();
}

function getMutableState() {
  return ensureStateShape(compactAccessoryImagesForLocalStorage(cloneState(memoryState || readJson(WORD_ADVENTURE_STORAGE_KEY, {
    syncMode: "local",
    children: {},
    garden: { sharedGardenPoints: 0, sharedGardenLevel: 1, childGarden: {} }
  }))));
}

function loadLocal() {
  const state = readJson(WORD_ADVENTURE_STORAGE_KEY, null);
  memoryState = state ? ensureStateShape(compactAccessoryImagesForLocalStorage(state)) : null;
  return memoryState ? cloneState(memoryState) : null;
}

function saveLocal(state, options = {}) {
  const next = options.keepUpdatedAt ? ensureStateShape(state) : withUpdatedAt(state);
  memoryState = cloneState(next);
  let savedState = next;
  try {
    writeJson(WORD_ADVENTURE_STORAGE_KEY, next);
  } catch (error) {
    if (!isStorageQuotaError(error)) throw error;
    const compact = compactAccessoryImagesForLocalStorage(next);
    memoryState = cloneState(compact);
    savedState = compact;
    try {
      writeJson(WORD_ADVENTURE_STORAGE_KEY, compact);
    } catch (retryError) {
      if (!isStorageQuotaError(retryError)) throw retryError;
      console.warn("Word Adventure localStorage quota fallback: progress kept in memory for this session.", retryError);
    }
  }
  if (!options.silent) notifyStateChange(savedState, { source: options.source || "local-save" });
  return savedState;
}

async function getCloudModules() {
  const firebase = await import("./firebase.js");
  const firestore = await import(FIREBASE_FIRESTORE_URL);
  await firebase.initFirebase();
  return { firebase, firestore };
}

async function getProgressDocRef() {
  const { firebase, firestore } = await getCloudModules();
  return firestore.doc(firebase.db, ...FIRESTORE_COLLECTION_PATH);
}

async function loadFromCloud() {
  try {
    cloudStatus = { ...cloudStatus, syncMode: "cloud", syncing: true, error: null };
    notifyStateChange(getMutableState(), { source: "cloud-syncing" });
    const { firestore } = await getCloudModules();
    const progressRef = await getProgressDocRef();
    const snapshot = await firestore.getDoc(progressRef);
    if (!snapshot.exists()) {
      cloudStatus = { ...cloudStatus, syncMode: "cloud", online: true, syncing: false, error: null };
      notifyStateChange(getMutableState(), { source: "cloud-empty" });
      return null;
    }

    const remoteState = fromCloudAppState(snapshot.data());
    if (!remoteState) {
      cloudStatus = { ...cloudStatus, syncMode: "cloud", online: true, syncing: false, error: null };
      notifyStateChange(getMutableState(), { source: "cloud-empty" });
      return null;
    }

    cloudStatus = { ...cloudStatus, syncMode: "cloud", online: true, syncing: false, error: null };
    notifyStateChange(getMutableState(), { source: "cloud-loaded" });
    return ensureStateShape(remoteState);
  } catch (error) {
    cloudStatus = { ...cloudStatus, syncMode: "cloud", online: false, syncing: false, error: error?.message || String(error) };
    notifyStateChange(getMutableState(), { source: "cloud-error" });
    throw error;
  }
}

async function syncToCloud(state = getMutableState()) {
  try {
    cloudStatus = { ...cloudStatus, syncMode: "cloud", syncing: true, error: null };
    notifyStateChange(getMutableState(), { source: "cloud-syncing" });
    const { firestore } = await getCloudModules();
    const progressRef = await getProgressDocRef();
    const cloudAppState = toCloudAppState(state, firestore);
    await firestore.setDoc(progressRef, cloudAppState, { merge: true });
    const next = fromCloudAppState(cloudAppState);
    lastCloudPushedJson = JSON.stringify(next);
    cloudStatus = { ...cloudStatus, syncMode: "cloud", online: true, syncing: false, lastSyncedAt: new Date().toISOString(), error: null };
    memoryState = cloneState(next);
    notifyStateChange(next, { source: "cloud-push" });
    return next;
  } catch (error) {
    cloudStatus = { ...cloudStatus, syncMode: "cloud", online: false, syncing: false, error: error?.message || String(error) };
    notifyStateChange(getMutableState(), { source: "cloud-error" });
    throw error;
  }
}

async function initFirebaseForCloud() {
  const { firebase } = await getCloudModules();
  return firebase.getCurrentUser?.() || null;
}

async function startCloudListener() {
  try {
    const { firestore } = await getCloudModules();
    const progressRef = await getProgressDocRef();
    if (cloudUnsubscribe) cloudUnsubscribe();

    cloudUnsubscribe = firestore.onSnapshot(progressRef, async (snapshot) => {
      if (!snapshot.exists()) {
        if (initializedEmptyCloudDocument) return;
        initializedEmptyCloudDocument = true;
        const localState = loadLocal();
        if (localState) {
          try {
            await syncToCloud(localState);
          } catch (error) {
            cloudStatus = { ...cloudStatus, syncMode: "cloud", online: false, syncing: false, error: error?.message || String(error) };
            notifyStateChange(getMutableState(), { source: "cloud-error" });
          }
        }
        return;
      }

      const remoteState = fromCloudAppState(snapshot.data());
      if (!remoteState) return;

      const remoteJson = JSON.stringify(remoteState);
      if (remoteJson === lastCloudPushedJson) return;

      const localState = getMutableState();
      const remoteUpdatedAt = timestampMs(remoteState.updatedAt);
      const localUpdatedAt = timestampMs(localState.updatedAt);
      if (!hasMeaningfulStateData(localState) && hasMeaningfulStateData(remoteState)) {
        applyRemoteState(remoteState);
        return;
      }
      if (localUpdatedAt > remoteUpdatedAt) {
        try {
          await syncToCloud(localState);
        } catch (error) {
          cloudStatus = { ...cloudStatus, syncMode: "cloud", online: false, syncing: false, error: error?.message || String(error) };
          notifyStateChange(getMutableState(), { source: "cloud-error" });
        }
        return;
      }

      if (localUpdatedAt === remoteUpdatedAt && JSON.stringify(localState) !== remoteJson) return;

      applyRemoteState(remoteState);
    }, (error) => {
      cloudStatus = { ...cloudStatus, syncMode: "cloud", online: false, syncing: false, error: error?.message || String(error) };
      notifyStateChange(getMutableState(), { source: "cloud-error" });
      console.warn("Word Adventure Firebase sync error:", error);
    });

    cloudStatus = { ...cloudStatus, syncMode: "cloud", online: true, syncing: false, error: null };
    notifyStateChange(getMutableState(), { source: "cloud-listener" });
    return cloudUnsubscribe;
  } catch (error) {
    cloudStatus = { ...cloudStatus, syncMode: "cloud", online: false, syncing: false, error: error?.message || String(error) };
    notifyStateChange(getMutableState(), { source: "cloud-error" });
    throw error;
  }
}

function stopCloudListener() {
  if (!cloudUnsubscribe) return;
  cloudUnsubscribe();
  cloudUnsubscribe = null;
}

async function init() {
  const localState = loadLocal();
  if (localState) notifyStateChange(localState, { source: "local-init" });

  try {
    await initFirebaseForCloud();
    const remoteState = await loadFromCloud();

    if (!remoteState) {
      if (localState) return await syncToCloud(localState);
      return getMutableState();
    }

    if (!localState || !hasMeaningfulStateData(localState) || timestampMs(remoteState.updatedAt) > timestampMs(localState.updatedAt)) {
      applyRemoteState(remoteState);
      return remoteState;
    }

    if (timestampMs(localState.updatedAt) > timestampMs(remoteState.updatedAt)) {
      return await syncToCloud(localState);
    }

    return remoteState;
  } catch (error) {
    console.info("Word Adventure dataStore cloud fallback:", error?.message || error);
  }
  return localState || getMutableState();
}

function scheduleCloudPush(state) {
  if (!cloudPushState) return;
  cloudStatus = { ...cloudStatus, syncMode: "cloud", syncing: true, error: null };
  notifyStateChange(getMutableState(), { source: "cloud-syncing" });
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(async () => {
    try {
      await cloudPushState(ensureStateShape(state));
      cloudStatus = { ...cloudStatus, syncMode: "cloud", online: true, syncing: false, lastSyncedAt: new Date().toISOString(), error: null };
      notifyStateChange(getMutableState(), { source: "cloud-push" });
    } catch (error) {
      cloudStatus = { ...cloudStatus, online: false, syncing: false, error: error?.message || String(error) };
      notifyStateChange(getMutableState(), { source: "cloud-error" });
    }
  }, 450);
}

function saveState(state, options = {}) {
  const next = saveLocal(state, { ...options, keepUpdatedAt: options.keepUpdatedAt || options.fromCloud });
  if (!options.skipCloudPush && !options.fromCloud) scheduleCloudPush(next);
  return next;
}

function updateChild(childId, patch) {
  const state = getMutableState();
  state.children[childId] = { ...getChild(state, childId), ...(patch || {}) };
  saveState(state);
  return state.children[childId];
}

function addLearnedWord(childId, wordId) {
  const state = getMutableState();
  const child = getChild(state, childId);
  child.learnedWordIds = uniquePush(child.learnedWordIds, wordId);
  saveState(state);
  return child;
}

function addMasteredWord(childId, wordId) {
  const state = getMutableState();
  const child = getChild(state, childId);
  child.masteredWordIds = uniquePush(child.masteredWordIds, wordId);
  child.wrongWordIds = (child.wrongWordIds || []).filter((id) => id !== wordId);
  saveState(state);
  return child;
}

function addWrongWord(childId, wordId) {
  const state = getMutableState();
  const child = getChild(state, childId);
  child.wrongWordIds = uniquePush(child.wrongWordIds, wordId);
  saveState(state);
  return child;
}

function claimStageReward(childId, stageId) {
  const state = getMutableState();
  const child = getChild(state, childId);
  const alreadyClaimed = (child.claimedStageRewardIds || []).includes(stageId);
  child.claimedStageRewardIds = uniquePush(child.claimedStageRewardIds, stageId);
  child.completedStageIds = uniquePush(child.completedStageIds, stageId);
  if (!alreadyClaimed) child.diamonds = (Number(child.diamonds) || 0) + 1;
  saveState(state);
  return child;
}

function addGardenPoints(childId, points) {
  const state = getMutableState();
  const garden = state.garden;
  const childGarden = garden.childGarden[childId] || { gardenPoints: 0, gardenLevel: 1, unlockedGardenItems: [] };
  const add = Number(points) || 0;
  childGarden.gardenPoints = (Number(childGarden.gardenPoints) || 0) + add;
  childGarden.gardenLevel = gardenLevelFromPoints(childGarden.gardenPoints);
  garden.childGarden[childId] = childGarden;
  garden.sharedGardenPoints = (Number(garden.sharedGardenPoints) || 0) + add;
  garden.sharedGardenLevel = gardenLevelFromPoints(garden.sharedGardenPoints);
  saveState(state);
  return garden;
}

function getLegacyCustomWords() {
  const parsed = readJson(WORD_ADVENTURE_CUSTOM_WORDS_KEY, null);
  if (!parsed) return null;
  return {
    beginner: Array.isArray(parsed.beginner) ? parsed.beginner : [],
    elementary: Array.isArray(parsed.elementary) ? parsed.elementary : []
  };
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSyncStatus() {
  return { ...cloudStatus };
}

function setSyncStatus(patch) {
  cloudStatus = { ...cloudStatus, ...(patch || {}) };
  notifyStateChange(getMutableState(), { source: "sync-status" });
}

function enableCloudSync(adapter) {
  cloudPushState = adapter?.pushState || syncToCloud;
  cloudStatus = { ...cloudStatus, syncMode: "cloud", online: false, syncing: true, error: null };
  const current = getMutableState();
  current.syncMode = "cloud";
  saveState(current, { keepUpdatedAt: true, skipCloudPush: true, source: "enable-cloud" });
}

function applyRemoteState(remoteState) {
  if (!remoteState || typeof remoteState !== "object") return;
  const next = ensureStateShape(remoteState);
  next.syncMode = "cloud";
  cloudStatus = { ...cloudStatus, syncMode: "cloud", online: true, syncing: false, lastSyncedAt: new Date().toISOString(), error: null };
  saveState(next, { fromCloud: true, source: "cloud-pull" });
}

function createLocalDataStore() {
  return {
    syncMode: "local",
    init,
    getState,
    saveState,
    loadLocal,
    saveLocal,
    loadFromCloud,
    syncToCloud,
    updateChild,
    addLearnedWord,
    addMasteredWord,
    addWrongWord,
    claimStageReward,
    addGardenPoints,
    getLegacyCustomWords,
    subscribe,
    getSyncStatus,
    setSyncStatus,
    enableCloudSync,
    applyRemoteState,
    startCloudListener,
    stopCloudListener
  };
}

function createCloudDataStore() {
  return {
    syncMode: "cloud",
    init,
    getState,
    saveState,
    loadLocal,
    saveLocal,
    loadFromCloud,
    syncToCloud,
    updateChild() {
      return updateChild(...arguments);
    },
    addLearnedWord() {
      return addLearnedWord(...arguments);
    },
    addMasteredWord() {
      return addMasteredWord(...arguments);
    },
    addWrongWord() {
      return addWrongWord(...arguments);
    },
    claimStageReward() {
      return claimStageReward(...arguments);
    },
    addGardenPoints() {
      return addGardenPoints(...arguments);
    },
    getLegacyCustomWords,
    subscribe,
    getSyncStatus,
    setSyncStatus,
    enableCloudSync,
    applyRemoteState,
    startCloudListener,
    stopCloudListener
  };
}

function createDataStore(syncMode = "local") {
  if (syncMode === "cloud") return createCloudDataStore();
  return createLocalDataStore();
}

window.createDataStore = createDataStore;
window.localDataStore = createLocalDataStore();
window.cloudDataStore = createCloudDataStore();
window.FirebaseDataStore = createCloudDataStore;
window.dataStore = createDataStore("local");

/*
Future cloud adapter sketch:
window.dataStore = createDataStore("cloud");
Implement createCloudDataStore with Firebase/Firestore methods using the same API.
*/
