import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const INDIA_BOUNDS = [
  [68.1, 6.5],
  [97.4, 37.6],
];

function buildGeoJson(points) {
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      properties: {
        id: point.id,
        city: point.city,
        ward: point.ward,
        category: point.category,
        intensity: point.intensity,
      },
      geometry: {
        type: "Point",
        coordinates: point.coordinates,
      },
    })),
  };
}

function IssueHeatmap({ points }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const popupRef = useRef(null);
  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  const geoJson = useMemo(() => buildGeoJson(points), [points]);

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) {
      return undefined;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [78.9629, 22.5937],
      zoom: 3.7,
      maxBounds: INDIA_BOUNDS,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource("complaints", {
        type: "geojson",
        data: geoJson,
      });

      map.addLayer({
        id: "complaints-heat",
        type: "heatmap",
        source: "complaints",
        maxzoom: 12,
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "intensity"],
            0,
            0.2,
            1,
            1,
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            0.7,
            8,
            1.5,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(35, 87, 58, 0)",
            0.2,
            "#41a36c",
            0.4,
            "#b2d66b",
            0.65,
            "#f0ba4e",
            1,
            "#e35342",
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            24,
            8,
            40,
          ],
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            0.95,
            12,
            0.55,
          ],
        },
      });

      map.addLayer({
        id: "complaints-points",
        type: "circle",
        source: "complaints",
        minzoom: 5,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "intensity"],
            0.5,
            5,
            1,
            10,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "intensity"],
            0.4,
            "#8ee786",
            0.7,
            "#f6c453",
            1,
            "#ff6b57",
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#f5f8ef",
          "circle-opacity": 0.9,
        },
      });

      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 16,
      });

      map.on("mouseenter", "complaints-points", (event) => {
        map.getCanvas().style.cursor = "pointer";

        const feature = event.features?.[0];
        if (!feature) {
          return;
        }

        const coordinates = feature.geometry.coordinates.slice();
        const { city, ward, category, intensity } = feature.properties;

        popupRef.current
          ?.setLngLat(coordinates)
          .setHTML(
            `
              <div class="map-popup">
                <strong>${city}</strong>
                <p>${ward}</p>
                <span>${category}</span>
                <small>Severity ${(Number(intensity) * 100).toFixed(0)}%</small>
              </div>
            `,
          )
          .addTo(map);
      });

      map.on("mouseleave", "complaints-points", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [geoJson, token]);

  useEffect(() => {
    if (!mapRef.current?.isStyleLoaded()) {
      return;
    }

    const map = mapRef.current;
    const source = map.getSource("complaints");
    if (source) {
      source.setData(geoJson);
    }

    if (points.length === 0) {
      map.easeTo({ center: [78.9629, 22.5937], zoom: 3.7, duration: 800 });
      return;
    }

    if (points.length === 1) {
      map.easeTo({ center: points[0].coordinates, zoom: 7, duration: 800 });
      return;
    }

    const bounds = points.reduce(
      (accumulator, point) => accumulator.extend(point.coordinates),
      new mapboxgl.LngLatBounds(points[0].coordinates, points[0].coordinates),
    );

    map.fitBounds(bounds, {
      padding: 80,
      maxZoom: 7.5,
      duration: 800,
    });
  }, [geoJson, points]);

  if (!token) {
    return (
      <div className="map-empty-state">
        <div className="map-empty-card">
          <span>Mapbox token needed</span>
          <strong>Add `VITE_MAPBOX_TOKEN` to show the live heatmap</strong>
          <p>
            Create a `.env` file in the project root and add your Mapbox access token. The dashboard
            will automatically load the issue heatmap after restart.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="mapbox-canvas" aria-label="Civic issue heatmap map" />;
}

export default IssueHeatmap;
