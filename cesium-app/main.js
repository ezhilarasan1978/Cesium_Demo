import "cesium/Build/Cesium/Widgets/widgets.css";
import * as Cesium from "cesium";



Cesium.Ion.defaultAccessToken ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMGEyZTg5Mi0xOWQ4LTQ3YTMtYmJmYi1mOGNjMzI3ZjU3M2YiLCJpZCI6MTk4ODA5LCJpYXQiOjE3MDkyMDE3MTd9.ix45fVFfzjTDQPmHlZPlK7-OXG6iZGuskLBXYRSODFk";

const viewer = new Cesium.Viewer("cesiumContainer", {
    terrain: Cesium.Terrain.fromWorldTerrain(),
    timeline: false,
    animation: false,
  });
