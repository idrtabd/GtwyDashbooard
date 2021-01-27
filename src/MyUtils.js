const hostUrl = "https://gateway.sp-d.iss.nasa.gov";
const REACT_APP_RESTURL_SPWEBURL = hostUrl + "/sites/VSI/TVToolChain";
const REACT_APP_RESTURL_VERIFICATIONS =
  REACT_APP_RESTURL_SPWEBURL +
  "/_api/Web/Lists(guid%277366f489-77b9-49b0-a66b-1932a68d125d%27)/Items?%24to&%24select=Id,ID,ExternalModifiedOn,Status,Key,Requirement%2FTitle,Requirement%2FRootContentFolder,Requirement%2FOwner,Requirement%2FAllocated_x0020_To,Status,Verification_Method,Verifies_Key&%24expand=Requirement&%24top=5000";

const REACT_APP_RESTURL_SYNCLOGITEMS =
  REACT_APP_RESTURL_SPWEBURL +
  "/_api/Web/Lists(guid%270bf4b5c2-d8ee-4d2f-b7fa-7a4121bdaffc%27)/Items?%24orderby=Modified%20asc";

const REACT_APP_RESTURL_REQUIREMENTS_FORPIVOT =
  REACT_APP_RESTURL_SPWEBURL +
  "/_api/lists/GetByTitle(%27Requirements%27)/items?%24top=5000&%24select=ID,Id,Key,Status,Owner,RootContentFolder,ExternalID";
export const loadVerifications = () => {
  return loadSpRestCall(REACT_APP_RESTURL_VERIFICATIONS);
};

export const loadSyncLog = () => {
  return loadSpRestCall(REACT_APP_RESTURL_SYNCLOGITEMS);
};

const loadSpRestCall = (requestUrl) => {
  return new Promise((resolve, reject) => {
    fetch(requestUrl, {
      method: "GET",
      headers: {
        accept: "application/json;odata=verbose"
      }
    })
      .then((response) => response.json())
      .then((data) => {
        resolve(data.d.results);
      });
  });
};

const loadTextCall = (requestUrl) => {
  return new Promise((resolve, reject) => {
    fetch(requestUrl, {
      method: "GET",
      headers: {
        accept: "application/json;odata=verbose"
      }
    })
      .then((response) => response.json())
      .then((data) => {
        resolve(data);
      });
  });
};

export const loadRequirementPivotData = () => {
  return loadSpRestCall(REACT_APP_RESTURL_REQUIREMENTS_FORPIVOT);
};

export const loadDNGSyncDataVerifications = () => {
  const url =
    "https://gateway.sp-d.iss.nasa.gov/sites/VSI/TVToolChain/Shared%20Documents/Validation/SyncActivityLogJsonArray_Verifications.json.txt";
  return loadTextCall(url);
};

export const loadDNGSyncDataRequirements = () => {
  const url =
    "https://gateway.sp-d.iss.nasa.gov/sites/VSI/TVToolChain/Shared%20Documents/Validation/SyncActivityLogJsonArray_Requirements.json.txt";
  return loadTextCall(url);
};

export const loadDNGLatestR = () => {
  return new Promise((resolve, reject) => {
    const url =
      "https://gateway.sp-d.iss.nasa.gov/sites/VSI/TVToolChain/Shared%20Documents/Validation/Requirments.json.txt";
    const p1 = loadTextCall(url);
    const p2 = loadRequirementPivotData();
    Promise.all([p1, p2]).then((values) => {
      const [latestDngData, spRequirementsData] = values;

      let spMap = new Map();
      spRequirementsData.forEach((x) => {
        if (x.ExternalID) {
          spMap[x.ExternalID] = x;
        }
      });
      console.log(spMap);
      let missingDngItems = [];
      latestDngData.forEach((x) => {
        const foundSpItem = spMap[x.ExternalID];
        if (!foundSpItem) {
          const [
            method,
            subSystem,
            module1,
            level,
            keyId
          ] = extractLevelSubsystemFromKey(x.Key);

          const syncLogItem = {
            ItemType: "Requirements",
            SyncActionType: "Missing",
            SPID: null,
            SyncResult: "Missing",
            Notes: null,
            SyncExternalId: x.ExternalID,
            RootContentFolder: x.RootContentFolder,
            SyncCountVal: 1,
            Level: level,
            SubSystem: subSystem,
            Module: module1,
            KeyID: keyId,
            Method: method
          };

          missingDngItems.push(syncLogItem);
        }
      });
      resolve(missingDngItems);
    });
  });
};

export const loadDNGLatestV = () => {
  const url =
    "https://gateway.sp-d.iss.nasa.gov/sites/VSI/TVToolChain/Shared%20Documents/Validation/Verifications.json.txt";
  return loadTextCall(url);
};

const extractLevelSubsystemFromKey = (key) => {
  let method = "";
  let subSystem = "";
  let module1 = "";
  let level = "";
  let keyId = "";

  const hyphenLen =
    key && key.length && key.indexOf("-") >= 1
      ? key.match(/-/g || []).length
      : 0;
  if (hyphenLen > 1) {
    const idx1 = key.toUpperCase().lastIndexOf("V");
    const mCode = key.substr(idx1 + 1, 3);
    method = mCode;
  }
  if (hyphenLen === 2) {
    const [levelval, subSys, num] = key.split("-");
    level = levelval;
    subSystem = subSys;
    keyId = num;
  } else if (hyphenLen === 3) {
    const [levelval, subSys, moduleVal, num] = key.split("-");
    level = levelval;
    subSystem = subSys;
    module1 = moduleVal;
    keyId = num;
  }
  return [method, subSystem, module1, level, keyId];
};

export const loadVerificationsWithCalculatedInfo = () => {
  return new Promise((resolve, reject) => {
    loadVerifications().then((vData) => {
      let tmpData = [];
      vData.forEach((x) => {
        x.CountVal = 1;
        x.ExternalModifiedOn =
          x.ExternalModifiedOn && new Date(x.ExternalModifiedOn);
        x.RootContentFolder = x.Requirement && x.Requirement.RootContentFolder;
        x.Level = null;
        x.SubSystem = null;
        x.Module = null;
        x.KeyID = null;

        const [
          method,
          subSystem,
          module1,
          level,
          keyId
        ] = extractLevelSubsystemFromKey(x.Key);
        x.Level = level;
        x.SubSystem = subSystem;
        x.Module = module1;
        x.KeyID = keyId;
        x.Method = method;

        tmpData.push(x);
      }); //foreach
      resolve(tmpData);
    }); //load verifications
  }); //promise
}; //function

Date.prototype.formatUnique = function () {
  return (
    this.getMonth() +
    1 +
    "/" +
    this.getDate() +
    "/" +
    this.getFullYear() +
    " : " +
    this.getUTCMinutes()
  );
};
Date.prototype.formatMMDDYYYY = function () {
  return this.getMonth() + 1 + "/" + this.getDate() + "/" + this.getFullYear();
};
