const WORD_ADVENTURE_STORAGE_KEY = "wordAdventureProgress.v2";
const WORD_ADVENTURE_CUSTOM_WORDS_KEY = "wordAdventureCustomWords.v1";
const DATASTORE_CHANGE_EVENT = "wordAdventure:dataStoreChange";
const FIREBASE_VERSION = "12.15.0";
const FIREBASE_FIRESTORE_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`;
const FIREBASE_STORAGE_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-storage.js`;
const FIRESTORE_FAMILY_ID = "jiang-family";
const FIRESTORE_COLLECTION_PATH = ["families", FIRESTORE_FAMILY_ID, "state", "appState"];
const ACCESSORY_IMAGE_FIELDS = ["wearableSrc", "wearImage", "image", "iconSrc", "iconImage"];

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
const DATA_PROTECTION_MESSAGE = "偵測到可能會清除孩子進度或配件，已停止儲存，請先備份。";
const IMPORTANT_CHILD_ARRAYS = [
  "learnedWordIds",
  "masteredWordIds",
  "wrongWordIds",
  "completedStageIds",
  "claimedStageRewardIds",
  "rewardCoupons",
  "customWords",
  "customAccessories",
  "unlockedAccessories",
  "equippedAccessories"
];
const REQUIRED_CHILD_IDS = ["jim", "ethan", "ai"];

const STAGE_ALIAS_GROUPS = {
  adventure_animals: ["animals", "nature"],
  daily_food_home: ["foods", "tableware", "home"],
  people_body: ["body", "family", "people", "titles", "jobs", "health"],
  school_words: ["school"],
  numbers_time: ["numbers", "time", "money"],
  colors_sizes: ["colors", "sizeMeasurement"],
  places_play: ["hobbies", "clothes", "transportation", "places", "geography", "holidays"],
  useful_words: ["others", "prepositions", "auxiliaries", "conjunctions", "interjections", "traits", "determiners", "pronouns", "questionWords"]
};

const STAGE_ALIAS_LOOKUP = Object.entries(STAGE_ALIAS_GROUPS).reduce((lookup, [groupId, categories]) => {
  categories.forEach((categoryId) => {
    lookup[categoryId.toLowerCase()] = groupId;
  });
  return lookup;
}, {});

function splitStageId(stageId) {
  const match = String(stageId || "").match(/^(.+)_(easy|medium|hard|stage_\d+)$/);
  if (!match) return null;
  return { categoryId: match[1], stageKey: match[2] };
}

function canonicalStageId(stageId) {
  const parts = splitStageId(stageId);
  if (!parts) return String(stageId || "");
  const groupId = STAGE_ALIAS_GROUPS[parts.categoryId]
    ? parts.categoryId
    : STAGE_ALIAS_LOOKUP[parts.categoryId.toLowerCase()] || parts.categoryId;
  return STAGE_ALIAS_GROUPS[groupId] ? `${groupId}_${parts.stageKey}` : String(stageId || "");
}

function equivalentStageIds(stageId) {
  const ids = new Set();
  const original = String(stageId || "");
  if (!original) return ids;
  ids.add(original);
  const canonical = canonicalStageId(original);
  ids.add(canonical);
  const parts = splitStageId(canonical);
  if (parts && STAGE_ALIAS_GROUPS[parts.categoryId]) {
    STAGE_ALIAS_GROUPS[parts.categoryId].forEach((categoryId) => ids.add(`${categoryId}_${parts.stageKey}`));
  }
  return ids;
}

function hasEquivalentStageId(stageIds, stageId) {
  const aliases = equivalentStageIds(stageId);
  return (stageIds || []).some((id) => aliases.has(String(id)));
}

function pushCanonicalStageId(stageIds, stageId) {
  const list = Array.isArray(stageIds) ? [...stageIds] : [];
  if (hasEquivalentStageId(list, stageId)) return list;
  list.push(canonicalStageId(stageId));
  return list;
}

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
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved);
  } catch (error) {
    console.warn("Word Adventure localStorage read fallback:", error);
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

function compactAccessoryImagesForCloud(state) {
  const next = cloneState(state);
  const compactList = (items) => {
    if (!Array.isArray(items)) return items;
    return items.map((item) => {
      if (!item || typeof item !== "object") return item;
      const compact = { ...item };
      delete compact.wearImage;
      delete compact.image;
      delete compact.iconImage;
      if (isDataUrl(compact.iconSrc)) delete compact.iconSrc;
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
  next.accessoryLibrary = next.accessoryLibrary && typeof next.accessoryLibrary === "object"
    ? next.accessoryLibrary
    : { customAccessories: [], hiddenAccessoryIds: [], accessoryPositionOverrides: {} };
  next.accessoryLibrary.customAccessories = Array.isArray(next.accessoryLibrary.customAccessories)
    ? next.accessoryLibrary.customAccessories
    : [];
  next.accessoryLibrary.hiddenAccessoryIds = Array.isArray(next.accessoryLibrary.hiddenAccessoryIds)
    ? next.accessoryLibrary.hiddenAccessoryIds
    : [];
  next.accessoryLibrary.accessoryPositionOverrides = next.accessoryLibrary.accessoryPositionOverrides
    && typeof next.accessoryLibrary.accessoryPositionOverrides === "object"
    ? next.accessoryLibrary.accessoryPositionOverrides
    : {};
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
  const updatedAt = new Date().toISOString();
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

function deepMergeDefaults(defaultState, existingState) {
  if (Array.isArray(defaultState)) return Array.isArray(existingState) ? existingState : defaultState;
  if (!defaultState || typeof defaultState !== "object") return existingState === undefined ? defaultState : existingState;
  if (!existingState || typeof existingState !== "object" || Array.isArray(existingState)) return cloneState(defaultState);
  const merged = { ...cloneState(defaultState), ...cloneState(existingState) };
  Object.keys(defaultState).forEach((key) => {
    merged[key] = deepMergeDefaults(defaultState[key], existingState[key]);
  });
  Object.keys(existingState).forEach((key) => {
    if (!(key in defaultState)) merged[key] = existingState[key];
  });
  return merged;
}

function getCustomAccessories(state) {
  return Array.isArray(state?.accessoryLibrary?.customAccessories) ? state.accessoryLibrary.customAccessories : [];
}

function getAllCustomAccessoryLists(state) {
  const lists = [];
  if (Array.isArray(state?.accessoryLibrary?.customAccessories)) lists.push(state.accessoryLibrary.customAccessories);
  Object.values(state?.children || {}).forEach((child) => {
    if (Array.isArray(child?.customAccessories)) lists.push(child.customAccessories);
  });
  return lists;
}

function accessoryImageFields(item) {
  return ACCESSORY_IMAGE_FIELDS.map((field) => item?.[field])
    .filter((value) => typeof value === "string" && value.trim());
}

function hasInlineAccessoryImages(state) {
  return getAllCustomAccessoryLists(state).some((items) => (
    items.some((item) => item && ACCESSORY_IMAGE_FIELDS.some((field) => isDataUrl(item[field])))
  ));
}

function countMeaningfulArray(value) {
  return Array.isArray(value) ? value.filter((item) => item && item !== "none").length : 0;
}

function losesAccessoryImages(previousState, nextState) {
  const nextById = new Map(getCustomAccessories(nextState).map((item) => [item.id, item]));
  return getCustomAccessories(previousState).some((previousItem) => {
    if (!previousItem?.id || !accessoryImageFields(previousItem).length) return false;
    const nextItem = nextById.get(previousItem.id);
    return !nextItem || !accessoryImageFields(nextItem).length;
  });
}

function isDangerousStateLoss(previousState, nextState) {
  if (!previousState || !hasMeaningfulStateData(previousState)) return false;
  if (!nextState || typeof nextState !== "object") return true;
  if (!nextState.children || typeof nextState.children !== "object") return true;
  if (REQUIRED_CHILD_IDS.some((childId) => !nextState.children?.[childId])) return true;
  if (!nextState.accessoryLibrary || typeof nextState.accessoryLibrary !== "object") return true;
  if (getCustomAccessories(previousState).length > 0 && getCustomAccessories(nextState).length === 0) return true;
  if (losesAccessoryImages(previousState, nextState)) return true;

  return REQUIRED_CHILD_IDS.some((childId) => {
    const previousChild = previousState.children?.[childId];
    const nextChild = nextState.children?.[childId];
    if (!previousChild || !hasMeaningfulStateData({ children: { [childId]: previousChild } })) return false;
    if (!nextChild) return true;
    return IMPORTANT_CHILD_ARRAYS.some((field) => (
      countMeaningfulArray(previousChild[field]) > 0 && countMeaningfulArray(nextChild[field]) === 0
    ));
  });
}

function showProtectionWarning(options = {}) {
  console.error(DATA_PROTECTION_MESSAGE);
  if (options.silent) return;
  try {
    window.dispatchEvent(new CustomEvent("wordAdventure:dataProtectionBlocked", {
      detail: { message: DATA_PROTECTION_MESSAGE }
    }));
  } catch {
    // The console error above is the reliable fallback for non-browser contexts.
  }
}

function protectStateBeforeSave(nextState, previousState = memoryState || readJson(WORD_ADVENTURE_STORAGE_KEY, null), options = {}) {
  const next = ensureStateShape(nextState);
  if (!next.children || REQUIRED_CHILD_IDS.some((childId) => !next.children?.[childId])) {
    showProtectionWarning(options);
    return false;
  }
  if (!next.accessoryLibrary || typeof next.accessoryLibrary !== "object") {
    showProtectionWarning(options);
    return false;
  }
  if (!hasMeaningfulStateData(next) && hasMeaningfulStateData(previousState)) {
    showProtectionWarning(options);
    return false;
  }
  if (isDangerousStateLoss(previousState, next)) {
    showProtectionWarning(options);
    return false;
  }
  return true;
}

function itemMergeKey(item) {
  if (item && typeof item === "object") {
    return item.id || item.wordId || item.code || item.name || JSON.stringify(item);
  }
  return String(item);
}

function richerItem(a, b) {
  if (a == null) return cloneState(b);
  if (b == null) return cloneState(a);
  if (typeof a !== "object" || typeof b !== "object") {
    return String(b).length > String(a).length ? cloneState(b) : cloneState(a);
  }
  return JSON.stringify(b).length > JSON.stringify(a).length ? cloneState(b) : cloneState(a);
}

function unionArrayByKey(a, b) {
  const map = new Map();
  [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])].forEach((item) => {
    const key = itemMergeKey(item);
    map.set(key, map.has(key) ? richerItem(map.get(key), item) : cloneState(item));
  });
  return [...map.values()];
}

function unionStageArray(a, b) {
  const list = unionArrayByKey(a, b);
  const seen = new Set();
  return list.reduce((next, id) => {
    const canonical = canonicalStageId(id);
    if (!canonical || seen.has(canonical)) return next;
    seen.add(canonical);
    next.push(canonical);
    return next;
  }, []);
}

function mergeChildForCloudPush(localChild = {}, remoteChild = {}) {
  const merged = { ...remoteChild, ...localChild };
  IMPORTANT_CHILD_ARRAYS.forEach((field) => {
    merged[field] = unionArrayByKey(remoteChild[field], localChild[field]);
  });
  ["quizHistory", "quizResults", "ownedItems", "unlocked", "learned"].forEach((field) => {
    if (Array.isArray(remoteChild[field]) || Array.isArray(localChild[field])) {
      merged[field] = unionArrayByKey(remoteChild[field], localChild[field]);
    }
  });
  merged.completedStageIds = unionStageArray(remoteChild.completedStageIds, localChild.completedStageIds);
  merged.claimedStageRewardIds = unionStageArray(remoteChild.claimedStageRewardIds, localChild.claimedStageRewardIds);
  merged.completed = unionStageArray(remoteChild.completed, localChild.completed);
  merged.stars = Math.max(Number(remoteChild.stars) || 0, Number(localChild.stars) || 0);
  merged.diamonds = Math.max(Number(remoteChild.diamonds) || 0, Number(localChild.diamonds) || 0);
  return merged;
}

function mergeStateForCloudPush(localState, remoteState) {
  if (!remoteState || typeof remoteState !== "object") return localState;
  const local = ensureStateShape(cloneState(localState));
  const remote = ensureStateShape(cloneState(remoteState));
  const activeChildId = REQUIRED_CHILD_IDS.includes(local.activeChildId) ? local.activeChildId : null;
  const mergedChildren = { ...(remote.children || {}) };

  REQUIRED_CHILD_IDS.forEach((childId) => {
    mergedChildren[childId] = mergeChildForCloudPush(local.children?.[childId] || {}, remote.children?.[childId] || {});
  });

  return ensureStateShape({
    ...remote,
    ...local,
    activeChildId: remote.activeChildId || local.activeChildId,
    children: mergedChildren,
    garden: mergeGardenForCloudPush(local.garden, remote.garden, activeChildId),
    accessoryLibrary: chooseAccessoryLibraryForCloudPush(local.accessoryLibrary, remote.accessoryLibrary),
    customWords: unionArrayByKey(remote.customWords, local.customWords),
    settings: { ...(remote.settings || {}), ...(local.settings || {}) }
  });
}

function chooseAccessoryLibraryForCloudPush(localLibrary, remoteLibrary) {
  const local = localLibrary || {};
  const remote = remoteLibrary || {};
  return {
    ...remote,
    ...local,
    customAccessories: unionArrayByKey(remote.customAccessories, local.customAccessories),
    hiddenAccessoryIds: unionArrayByKey(remote.hiddenAccessoryIds, local.hiddenAccessoryIds),
    accessoryPositionOverrides: {
      ...(remote.accessoryPositionOverrides || {}),
      ...(local.accessoryPositionOverrides || {})
    }
  };
}

function mergeGardenForCloudPush(localGarden, remoteGarden, activeChildId) {
  const local = localGarden && typeof localGarden === "object" ? localGarden : {};
  const remote = remoteGarden && typeof remoteGarden === "object" ? remoteGarden : {};
  return {
    ...remote,
    ...local,
    sharedGardenPoints: Math.max(Number(remote.sharedGardenPoints) || 0, Number(local.sharedGardenPoints) || 0),
    sharedGardenLevel: Math.max(Number(remote.sharedGardenLevel) || 1, Number(local.sharedGardenLevel) || 1),
    childGarden: {
      ...(remote.childGarden || {}),
      ...(activeChildId && local.childGarden?.[activeChildId] ? { [activeChildId]: local.childGarden[activeChildId] } : {})
    }
  };
}

function countArray(value) {
  return Array.isArray(value) ? value.length : 0;
}

function childProgressAhead(localChild, remoteChild) {
  if (!localChild || typeof localChild !== "object") return false;
  if (!remoteChild || typeof remoteChild !== "object") return hasMeaningfulStateData({ children: { child: localChild } });
  const progressFields = [
    "learnedWordIds",
    "masteredWordIds",
    "completedStageIds",
    "claimedStageRewardIds",
    "quizHistory",
    "quizResults"
  ];
  if (progressFields.some((field) => countArray(localChild[field]) > countArray(remoteChild[field]))) return true;
  const localDiamondProgress = countArray(localChild.claimedStageRewardIds) > countArray(remoteChild.claimedStageRewardIds);
  if (localDiamondProgress && (Number(localChild.diamonds) || 0) > (Number(remoteChild.diamonds) || 0)) return true;
  return false;
}

function hasLocalProgressAhead(localState, remoteState) {
  const local = ensureStateShape(cloneState(localState));
  const remote = ensureStateShape(cloneState(remoteState));
  return REQUIRED_CHILD_IDS.some((childId) => childProgressAhead(local.children?.[childId], remote.children?.[childId]));
}

function backupFileName(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `word-adventure-backup-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.json`;
}

function downloadStateBackup(state = getMutableState()) {
  const backup = ensureStateShape(cloneState(state));
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = backupFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return backup;
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
  return memoryState ? ensureStateShape(cloneState(memoryState)) : loadLocal();
}

function getMutableState() {
  const defaults = {
    syncMode: "local",
    children: {},
    garden: { sharedGardenPoints: 0, sharedGardenLevel: 1, childGarden: {} }
  };
  return ensureStateShape(deepMergeDefaults(defaults, cloneState(memoryState || readJson(WORD_ADVENTURE_STORAGE_KEY, null) || {})));
}

function loadLocal() {
  const state = readJson(WORD_ADVENTURE_STORAGE_KEY, null);
  memoryState = state ? ensureStateShape(state) : null;
  return memoryState ? cloneState(memoryState) : null;
}

function saveLocal(state, options = {}) {
  const next = options.keepUpdatedAt ? ensureStateShape(state) : withUpdatedAt(state);
  if (!options.skipProtection && !protectStateBeforeSave(next, undefined, { silent: options.silentProtection })) {
    throw new Error(DATA_PROTECTION_MESSAGE);
  }
  memoryState = cloneState(next);
  let savedState = next;
  try {
    writeJson(WORD_ADVENTURE_STORAGE_KEY, next);
  } catch (error) {
    if (!isStorageQuotaError(error)) throw error;
    const compact = compactAccessoryImagesForLocalStorage(next);
    try {
      writeJson(WORD_ADVENTURE_STORAGE_KEY, compact);
      memoryState = cloneState(next);
      savedState = next;
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

async function getStorageModules() {
  const firebase = await import("./firebase.js");
  const storage = await import(FIREBASE_STORAGE_URL);
  const session = await firebase.initFirebase();
  return { firebase, storage, user: session.user };
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error("無法讀取配件圖片資料");
  return response.blob();
}

function extensionForImageType(type) {
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  return "webp";
}

function storageSafeId(value) {
  return String(value || "image").replace(/[^\w-]/g, "_").slice(0, 80) || "image";
}

async function uploadInlineAccessoryImage(storageModule, firebaseModule, user, itemId, field, dataUrl) {
  const blob = await dataUrlToBlob(dataUrl);
  const extension = extensionForImageType(blob.type);
  const imageRef = storageModule.ref(
    firebaseModule.storage,
    `accessories/${user.uid}/${storageSafeId(itemId)}/${storageSafeId(field)}.${extension}`
  );
  await storageModule.uploadBytes(imageRef, blob, { contentType: blob.type || "image/webp" });
  return storageModule.getDownloadURL(imageRef);
}

async function moveInlineAccessoryImagesToStorage(state) {
  const next = cloneState(state);
  const itemsWithInlineImages = getAllCustomAccessoryLists(next)
    .flatMap((items) => items)
    .filter((item) => item && ACCESSORY_IMAGE_FIELDS.some((field) => isDataUrl(item[field])));
  if (!itemsWithInlineImages.length) return next;

  try {
    const { firebase, storage, user } = await getStorageModules();
    const uploaded = new Map();

    for (const item of itemsWithInlineImages) {
      const fieldUrlMap = new Map();
      for (const field of ACCESSORY_IMAGE_FIELDS) {
        const value = item[field];
        if (!isDataUrl(value)) continue;
        if (!uploaded.has(value)) {
          uploaded.set(value, await uploadInlineAccessoryImage(storage, firebase, user, item.id, field, value));
        }
        fieldUrlMap.set(field, uploaded.get(value));
      }
      fieldUrlMap.forEach((url, field) => {
        item[field] = url;
      });
    }
  } catch (error) {
    throw new Error(`配件圖片搬到雲端圖片庫失敗，本機資料已保留：${error?.message || String(error)}`);
  }

  return ensureStateShape(next);
}

function scheduleInlineAccessoryImageMigration(state) {
  if (!hasInlineAccessoryImages(state)) return;
  window.setTimeout(async () => {
    try {
      await Promise.race([
        syncToCloud(state),
        new Promise((_, reject) => window.setTimeout(() => reject(new Error("Accessory image migration timed out")), 15000))
      ]);
    } catch (error) {
      console.warn("Word Adventure accessory image migration postponed:", error?.message || error);
      cloudStatus = {
        ...cloudStatus,
        syncMode: "cloud",
        online: true,
        syncing: false,
        error: null
      };
      notifyStateChange(getMutableState(), { source: "cloud-image-migration-postponed" });
    }
  }, 1200);
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
    const existingSnapshot = await firestore.getDoc(progressRef);
    const existingRemoteState = existingSnapshot.exists() ? fromCloudAppState(existingSnapshot.data()) : null;
    let stateForCloud = existingRemoteState ? mergeStateForCloudPush(state, existingRemoteState) : state;
    if (existingRemoteState && !protectStateBeforeSave(stateForCloud, existingRemoteState, { silent: true })) {
      applyRemoteState(existingRemoteState);
      return existingRemoteState;
    }
    if (!existingRemoteState && !hasMeaningfulStateData(stateForCloud)) {
      showProtectionWarning();
      throw new Error(DATA_PROTECTION_MESSAGE);
    }
    stateForCloud = compactAccessoryImagesForCloud(stateForCloud);
    const cloudAppState = toCloudAppState(stateForCloud, firestore);
    await firestore.setDoc(progressRef, cloudAppState, { merge: true });
    const next = fromCloudAppState(cloudAppState);
    lastCloudPushedJson = JSON.stringify(next);
    cloudStatus = { ...cloudStatus, syncMode: "cloud", online: true, syncing: false, lastSyncedAt: new Date().toISOString(), error: null };
    memoryState = cloneState(next);
    saveLocal(next, { keepUpdatedAt: true, skipProtection: true });
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
      if (hasLocalProgressAhead(localState, remoteState)) {
        try {
          await syncToCloud(localState);
        } catch (error) {
          console.warn("Word Adventure cloud push postponed for local progress:", error?.message || error);
          cloudStatus = { ...cloudStatus, syncMode: "cloud", online: false, syncing: false, error: error?.message || String(error) };
          notifyStateChange(getMutableState(), { source: "cloud-error" });
        }
        return;
      }
      if (hasMeaningfulStateData(remoteState) && isDangerousStateLoss(remoteState, localState)) {
        try {
          applyRemoteState(remoteState);
        } catch (error) {
          console.warn("Word Adventure blocked unsafe cloud pull:", error);
        }
        return;
      }
      if (!hasMeaningfulStateData(localState) && hasMeaningfulStateData(remoteState)) {
        try {
          applyRemoteState(remoteState);
        } catch (error) {
          console.warn("Word Adventure blocked unsafe cloud pull:", error);
        }
        return;
      }
      if (localUpdatedAt > remoteUpdatedAt) {
        try {
          await syncToCloud(localState);
        } catch (error) {
          console.warn("Word Adventure cloud push postponed from listener:", error?.message || error);
          cloudStatus = { ...cloudStatus, syncMode: "cloud", online: true, syncing: false, error: null };
          notifyStateChange(getMutableState(), { source: "cloud-push-postponed" });
        }
        return;
      }

      if (localUpdatedAt === remoteUpdatedAt && JSON.stringify(localState) !== remoteJson) return;

      try {
        applyRemoteState(remoteState);
      } catch (error) {
        console.warn("Word Adventure blocked unsafe cloud pull:", error);
      }
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
      scheduleInlineAccessoryImageMigration(remoteState);
      return remoteState;
    }

    if (hasMeaningfulStateData(remoteState) && isDangerousStateLoss(remoteState, localState)) {
      applyRemoteState(remoteState);
      scheduleInlineAccessoryImageMigration(remoteState);
      return remoteState;
    }

    if (hasLocalProgressAhead(localState, remoteState)) {
      try {
        return await syncToCloud(localState);
      } catch (error) {
        console.warn("Word Adventure cloud push postponed for local progress during init:", error?.message || error);
        return localState;
      }
    }

    if (timestampMs(localState.updatedAt) > timestampMs(remoteState.updatedAt)) {
      try {
        return await syncToCloud(localState);
      } catch (error) {
        console.warn("Word Adventure cloud push postponed during init:", error?.message || error);
        applyRemoteState(remoteState);
        scheduleInlineAccessoryImageMigration(remoteState);
        return remoteState;
      }
    }

    scheduleInlineAccessoryImageMigration(remoteState);
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
  const alreadyClaimed = hasEquivalentStageId(child.claimedStageRewardIds || [], stageId);
  child.claimedStageRewardIds = pushCanonicalStageId(child.claimedStageRewardIds, stageId);
  child.completedStageIds = pushCanonicalStageId(child.completedStageIds, stageId);
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
  if (REQUIRED_CHILD_IDS.some((childId) => !current.children?.[childId])) {
    notifyStateChange(current, { source: "enable-cloud" });
    return;
  }
  saveState(current, { keepUpdatedAt: true, skipCloudPush: true, source: "enable-cloud" });
}

function applyRemoteState(remoteState) {
  if (!remoteState || typeof remoteState !== "object") return;
  const next = ensureStateShape(remoteState);
  next.syncMode = "cloud";
  cloudStatus = { ...cloudStatus, syncMode: "cloud", online: true, syncing: false, lastSyncedAt: new Date().toISOString(), error: null };
  saveState(next, { fromCloud: true, source: "cloud-pull", silentProtection: true });
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
    stopCloudListener,
    backupState: downloadStateBackup,
    deepMergeDefaults,
    protectStateBeforeSave,
    hasMeaningfulStateData
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
    stopCloudListener,
    backupState: downloadStateBackup,
    deepMergeDefaults,
    protectStateBeforeSave,
    hasMeaningfulStateData
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
