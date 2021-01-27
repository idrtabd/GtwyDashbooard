import React, { useState, useEffect, useRef } from "react";
import {
  HashRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
  useHistory,
  useLocation
} from "react-router-dom";
import PieChart, {
  Series,
  Label,
  Connector,
  Size,
  Export
} from "devextreme-react/pie-chart";
import {
  Chart,
  ArgumentAxis,
  CommonSeriesSettings,
  Legend,
  Margin,
  Title,
  Subtitle,
  Tooltip,
  Grid
} from "devextreme-react/chart";
import PivotGrid, { FieldChooser } from "devextreme-react/pivot-grid";
import PivotGridDataSource from "devextreme/ui/pivot_grid/data_source";
import Bullet from "devextreme-react/bullet";
import { Button } from "devextreme-react/button";
import {
  loadVerificationsWithCalculatedInfo,
  loadSyncLog,
  loadDNGSyncDataRequirements,
  loadRequirementPivotData,
  loadDNGLatestR,
  loadDNGLatestV
} from "./MyUtils";

export default function App() {
  const [allSyncRunsR, setallSyncRunsR] = useState([]);
  const [allSyncRunsV, setallSyncRunsV] = useState([]);
  const [latestSyncRunR, setlatestSyncRunR] = useState([]);
  const [latestSyncRunV, setlatestSyncRunV] = useState([]);
  const [lineChartXVal, setlineChartXVal] = useState("ID");
  //const [verifData, setverifData] = useState([]);
  const [syncDataReqs, setsyncDataReqs] = useState([]);
  const [reqsPivotData, setreqsPivotData] = useState([]);

  useEffect(() => {
    // loadVerificationsWithCalculatedInfo().then((verificationData) => {
    //   setverifData(verificationData);
    // });

    loadDNGSyncDataRequirements().then((reqData) => {
      //console.log(reqData);
      reqData.forEach((x) => {
        x.Timestamp = new Date();
        x.CountVal = 1;
      });
      setsyncDataReqs(reqData);

      // loadDNGLatestR().then((missingDngSyncData) => {
      //   console.log(missingDngSyncData);
      // });

      const p1 = loadRequirementPivotData();
      const p2 = loadDNGLatestR();

      Promise.all([p1, p2]).then((values) => {
        const [reqPivotResult, missingDngSyncData] = values;

        /////////////////////////////////////
        let reqsMap = new Map();
        reqData.forEach((r) => {
          reqsMap.set(r.SPID, r);
        });

        reqPivotResult.forEach((x) => {
          //Find sync item
          const foudnReqSyncItem = reqsMap.get(x.ID);
          x.SyncResult = foudnReqSyncItem.Result;
          x.SyncActionType = foudnReqSyncItem.ActionType;
          x.SyncExternalId = foudnReqSyncItem.ExternalId;
          x.Folder = foudnReqSyncItem.Folder;
          x.SyncCountVal = 1;
        });
        missingDngSyncData.forEach((x) => {
          reqPivotResult.push(x);
        });
        setreqsPivotData(reqPivotResult);
        /////////////////////////////////////////S
      });

      loadRequirementPivotData();
    });

    loadSyncLog().then((synclogData) => {
      synclogData.forEach((x) => {
        x.ModifiedDisplay = new Date(x.Modified).formatUnique().toString();
      });
      const latestSync = synclogData[0];
      //console.log(latestSync);
      // let tempPieData = [];
      // const balance =
      //   latestSync.DestinationCount - (latestSync.NewItemsCount + latestSync.DeleteItemsCount + latestSync.UpdateItemsCount);
      // tempPieData.push({ type: "Existing", count: balance });
      // tempPieData.push({ type: "Added", count: latestSync.NewItemsCount });
      // tempPieData.push({ type: "Removed", count: latestSync.DeleteItemsCount });
      // tempPieData.push({ type: "Updated", count: latestSync.UpdateItemsCount });
      // setlatestSyncRunR(tempPieData);

      setallSyncRunsR(synclogData.filter((x) => x.SyncType === "Requirements"));
      setallSyncRunsV(
        synclogData.filter((x) => x.SyncType === "Verifications")
      );

      const currentReqLog = synclogData
        .filter((x) => x.SyncType === "Requirements")
        .pop();
      setlatestSyncRunR(currentReqLog);

      const currentVerifLog = synclogData
        .filter((x) => x.SyncType === "Verifications")
        .pop();
      setlatestSyncRunV(currentVerifLog);

      // console.log(currentReqLog);
      // console.log(currentVerifLog);
      // console.log(synclogData);
    });
  }, []);

  const pointClickHandler = (e) => {
    toggleVisibility(e.target);
  };

  const legendClickHandler = (e) => {
    let arg = e.target;
    let item = e.component.getAllSeries()[0].getPointsByArg(arg)[0];

    toggleVisibility(item);
  };

  const toggleVisibility = (item) => {
    item.isVisible() ? item.hide() : item.show();
  };

  const RequirementsPivotdataSource = new PivotGridDataSource({
    fields: [
      {
        caption: "Folder",
        width: "200",
        dataField: "RootContentFolder",
        area: "row"
      },
      {
        caption: "SyncActionType",
        dataField: "SyncActionType",
        area: "row"
      },
      {
        caption: "Result",
        dataField: "Result",
        area: "row"
      },
      {
        caption: "Count",
        dataField: "SyncCountVal",
        dataType: "number",
        summaryType: "sum",
        area: "data"
      }
    ],
    store: reqsPivotData
  });

  return (
    <div>
      <Router>
        <Link to={"/SyncDetails"} className="commandButton">
          <Button
            width={320}
            text="Browse Sync Data"
            type="default"
            stylingMode="outlined"
            // onClick={submitItemToSP}
          />
        </Link>
        <Link to={"/"} className="commandButton">
          <Button
            width={320}
            text="Dashboard"
            type="default"
            stylingMode="outlined"
            // onClick={submitItemToSP}
          />
        </Link>
        <Switch>
          <Route path="/SyncDetails">
            <div>
              Total DNG Source Count:{" "}
              {latestSyncRunR && latestSyncRunR.SourceCount}{" "}
            </div>
            <PivotGrid
              id="Current Verifications"
              dataSource={RequirementsPivotdataSource}
              allowSortingBySummary={true}
              allowSorting={true}
              allowFiltering={true}
              allowExpandAll={true}
              showBorders={true}
            >
              <FieldChooser enabled={true} />
            </PivotGrid>
          </Route>
          <Route path="/">
            <React.Fragment>
              <div>Requirements - Count Target</div>

              {new Date(latestSyncRunR.Modified).toLocaleString()}
              <Bullet
                className="bullet"
                startScaleValue={latestSyncRunR.SourceCount * 0.3}
                endScaleValue={latestSyncRunR.SourceCount * 1.3}
                target={latestSyncRunR.SourceCount}
                value={latestSyncRunR.DestinationCount}
                color={"#e8c267"}
              />

              <div>Verifications - Count Target</div>

              {new Date(latestSyncRunV.Modified).toLocaleString()}
              <Bullet
                className="bullet"
                startScaleValue={latestSyncRunV.SourceCount * 0.3}
                endScaleValue={latestSyncRunV.SourceCount * 1.3}
                target={latestSyncRunV.SourceCount}
                value={latestSyncRunV.DestinationCount}
                color={"#ebdd8f"}
              />

              <div>
                <Chart palette="Material" dataSource={allSyncRunsR}>
                  <CommonSeriesSettings argumentField={lineChartXVal} />
                  <Series
                    key="NewItemsCount"
                    valueField="NewItemsCount"
                    name="Added"
                    type="line"
                  />
                  <Series
                    key="UpdateItemsCount"
                    valueField="UpdateItemsCount"
                    name="Updated"
                    type="line"
                  />
                  <Series
                    key="DeleteItemsCount"
                    valueField="DeleteItemsCount"
                    name="Removed"
                    type="line"
                  />
                  <Margin bottom={20} />
                  <ArgumentAxis
                    valueMarginsEnabled={false}
                    discreteAxisDivisionMode="crossLabels"
                  >
                    <Grid visible={true} />
                  </ArgumentAxis>
                  <Legend
                    verticalAlignment="bottom"
                    horizontalAlignment="center"
                    itemTextPosition="bottom"
                  />
                  <Export enabled={true} />
                  <Title text="Requirements - Sync Activity">
                    <Subtitle text="" />
                  </Title>
                  <Tooltip enabled={true} />
                </Chart>
              </div>
              <div>
                <Chart palette="Material" dataSource={allSyncRunsV}>
                  <CommonSeriesSettings argumentField={lineChartXVal} />
                  <Series
                    key="NewItemsCount"
                    valueField="NewItemsCount"
                    name="Added"
                    type="line"
                  />
                  <Series
                    key="UpdateItemsCount"
                    valueField="UpdateItemsCount"
                    name="Updated"
                    type="line"
                  />
                  <Series
                    key="DeleteItemsCount"
                    valueField="DeleteItemsCount"
                    name="Removed"
                    type="line"
                  />

                  <Margin bottom={20} />
                  <ArgumentAxis
                    valueMarginsEnabled={false}
                    discreteAxisDivisionMode="crossLabels"
                  >
                    <Grid visible={true} />
                  </ArgumentAxis>
                  <Legend
                    verticalAlignment="bottom"
                    horizontalAlignment="center"
                    itemTextPosition="bottom"
                  />
                  <Export enabled={true} />
                  <Title text="Verifications - Sync Activity">
                    <Subtitle text="" />
                  </Title>
                  <Tooltip enabled={true} />
                </Chart>
              </div>

              {/* <PieChart
        id="pie"
        dataSource={latestSyncRun}
        palette="Bright"
        title="SharePoint DNG Mirror - Requirements"
        onPointClick={pointClickHandler}
        onLegendClick={legendClickHandler}
      >
        <Series argumentField="type" valueField="count">
          <Label visible={true}>
            <Connector visible={true} width={1} />
          </Label>
        </Series>

        <Size width={500} />
        <Export enabled={true} />
      </PieChart> */}
            </React.Fragment>
          </Route>
        </Switch>
      </Router>
    </div>
  );
}
