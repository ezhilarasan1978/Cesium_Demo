import "cesium/Build/Cesium/Widgets/widgets.css";
import * as Cesium from "cesium";
import { Viewer, Cartesian3, Math as CesiumMath } from "cesium";

Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMGEyZTg5Mi0xOWQ4LTQ3YTMtYmJmYi1mOGNjMzI3ZjU3M2YiLCJpZCI6MTk4ODA5LCJpYXQiOjE3MDkyMDE3MTd9.ix45fVFfzjTDQPmHlZPlK7-OXG6iZGuskLBXYRSODFk";

const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
  timeline: false,
  animation: false,
  infoBox: true
});

viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(-0.0741104, 52.2010834, 500),
  orientation: {
    heading: CesiumMath.toRadians(0), // 0° means north
    pitch: CesiumMath.toRadians(-30), // Tilt down slightly
    roll: 0.0,
  },
});

let googleTileset, osmBuildings;

async function loadLayers() {
  try {
    googleTileset = await Cesium.createGooglePhotorealistic3DTileset();
    viewer.scene.primitives.add(googleTileset);
    googleTileset.show = false;
  } catch (error) {
    console.log(`Failed to load Google tileset: ${error}`);
  }

  osmBuildings = await Cesium.createOsmBuildingsAsync();
  viewer.scene.primitives.add(osmBuildings);
}

loadLayers();

// Toggle OSM Buildings
document.getElementById("toggleOsm").addEventListener("change", (event) => {
  if (osmBuildings) {
    osmBuildings.show = event.target.checked;
  }
});

// Toggle Google Photorealistic 3D Tiles
document
  .getElementById("togglePhotorealistic")
  .addEventListener("change", (event) => {
    if (googleTileset) {
      googleTileset.show = event.target.checked;
    }
  });

const geojsonLayers = [
  "Accurate_Route",
  "Cable_Segment",
  "Isolating_Equipment_Installation",
  "Pole",
  "Service_Point",
  "Tower",
  "Wire_Segment",
  "Sub_Substation",
];
const style = {
  Accurate_Route: Cesium.Color.ANTIQUEWHITE,
  Cable_Segment: Cesium.Color.CADETBLUE,
  Isolating_Equipment_Installation: Cesium.Color.DARKGRAY,
  Pole: Cesium.Color.DEEPPINK,
  Service_Point: Cesium.Color.DEEPSKYBLUE,
  Tower: Cesium.Color.KHAKI,
  Wire_Segment: Cesium.Color.PLUM,
};

// Store loaded layers for toggling
const layerSources = {};
function computeCircle(radius) {
  console.log("circle");

  const positions = [];
  for (let i = 0; i < 360; i++) {
    const radians = Cesium.Math.toRadians(i);
    positions.push(
      new Cesium.Cartesian2(
        radius * Math.cos(radians),
        radius * Math.sin(radians)
      )
    );
  }
  return positions;
}
function formatDescription(properties) {
  let html = "<table style='width:100%; border-collapse: collapse;'>";
  for (const key in properties) {
    html += `
      <tr>
        <td style="font-weight: bold; padding: 4px; border: 1px solid #ccc;">${key}</td>
        <td style="padding: 4px; border: 1px solid #ccc;">${properties[key]}</td>
      </tr>`;
  }
  html += "</table>";
  return html;
}
async function loadGeoJsonManually(layerName) {
  try {
    const url = `http://localhost:5001/cesium/${layerName}.geojson`;
    const response = await fetch(url);
    const geojson = await response.json();
    geojson.features.forEach((feature) => {
      const { type, coordinates } = feature.geometry;
      const properties = feature.properties || {}; 

      let entity;
      switch (type) {
        case "Point":
          entity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(...coordinates),
            // point: {
            //   pixelSize: 10,
            //   color: style[layerName],
            //   outlineColor: Cesium.Color.WHITE,
            //   outlineWidth: 2,
            //   heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            // },
            cylinder: {
              length: 8, // Height of the cylinder
              topRadius: 1, // Top radius
              bottomRadius: 2, // Bottom radius
              material: style[layerName] || Cesium.Color.YELLOW, // Default to yellow if undefined
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // Ensure it's on the ground
            },
            // properties: new Cesium.PropertyBag(properties), // Ensure properties are assigned correctly
            description: formatDescription(properties),
          });
          break;

        case "LineString":
          entity = viewer.entities.add({
            polyline: {
              positions: coordinates.map((coord) =>
                Cesium.Cartesian3.fromDegrees(...coord)
              ),
              width: 3,
              material: style[layerName],
              clampToGround: true,
            },
            // polylineVolume: {
            //   positions: coordinates.map((coord) =>
            //     Cesium.Cartesian3.fromDegrees(...coord, 1000) // Slightly raised for visibility
            //   ),
            //   shape: computeCircle(4.0),
            //   material: Cesium.Color.RED,
            // },
            properties,
          });
          break;

        case "Polygon":
          entity = viewer.entities.add({
            polygon: {
              hierarchy: new Cesium.PolygonHierarchy(
                coordinates[0].map((coord) =>
                  Cesium.Cartesian3.fromDegrees(...coord, 100)
                )
              ),
              material: Cesium.Color.THISTLE,
              outline: true,
              outlineColor: Cesium.Color.BLACK,
              extrudedHeight: 100,
            },
            properties,
          });
          break;

        default:
          console.warn(`Unsupported geometry type: ${type}`);
      }

      if (entity) {
        layerSources[layerName] = layerSources[layerName] || [];
        layerSources[layerName].push(entity);
      }
    });
  } catch (error) {
    console.error(`Failed to load ${layerName}:`, error);
  }
}

// Load all layers initially
geojsonLayers.forEach(loadGeoJsonManually);

// Function to toggle layers
function toggleLayer(layerName, show) {
  if (layerSources[layerName]) {
    layerSources[layerName].forEach((entity) => {
      entity.show = show;
    });
  }
}

// Add checkboxes for toggling layers
geojsonLayers.forEach((layer) => {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `toggle_${layer}`;
  checkbox.checked = true;

  checkbox.addEventListener("change", () => {
    toggleLayer(layer, checkbox.checked);
  });

  const label = document.createElement("label");
  label.htmlFor = `toggle_${layer}`;
  label.textContent = layer.replace(/_/g, " ");

  const div = document.createElement("div");
  div.classList.add("form-check");
  div.appendChild(checkbox);
  div.appendChild(label);

  overlay.appendChild(div);
});
