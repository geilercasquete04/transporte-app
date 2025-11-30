// MapaRutasUnificado.tsx
import MapLibreGL from "@maplibre/maplibre-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { CrearRutaData, Ruta, rutasApi } from "../../services/rutasAPI";

/**
 * Componente unificado:
 * - Muestra mapa con estilo local: MapLibreGL.StyleURL.Street
 * - Lista de rutas (izquierda/abajo)
 * - Permite trazar tocando el mapa (modoTrazado)
 * - Ver una ruta existente (cargar coordenadas desde API)
 * - Guardar ruta nueva llamando a rutasApi.crearRuta
 *
 * Ajustes posibles:
 * - Cambiar perfil_id por el real
 * - Adaptar el body de crearRuta si tu API exige perfil_id en query params
 */

const perfil_id = "09a3de3c-d389-4049-a670-1081dc02dfed"; // <- ajusta si hace falta

export default function MapaRutasUnificado() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loadingRutas, setLoadingRutas] = useState(false);
  const [selectedRuta, setSelectedRuta] = useState<Ruta | null>(null);
  const [coordenadasRuta, setCoordenadasRuta] = useState<Array<[number, number]>>([]);

  const [modoTrazado, setModoTrazado] = useState(false);
  const [puntos, setPuntos] = useState<Array<[number, number]>>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [showCrearModal, setShowCrearModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#FF5733");

const mapRef = useRef<any>(null);
const cameraRef = useRef<any>(null);

  // Cargar rutas al inicio
  useEffect(() => {
    cargarRutas();
  }, []);

  const cargarRutas = async () => {
    try {
      setLoadingRutas(true);
      const data = await rutasApi.obtenerRutas(perfil_id);
      setRutas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando rutas:", err);
      Alert.alert("Error", "No se pudieron cargar las rutas.");
    } finally {
      setLoadingRutas(false);
    }
  };

  // Al tocar el mapa
  const onPressMapa = (e: any) => {
    if (!modoTrazado) return;
    try {
      // MapLibre proporciona event.geometry.coordinates
      const coord: [number, number] = e?.geometry?.coordinates;
      if (!coord || coord.length !== 2) return;
      setPuntos((prev) => [...prev, coord]);
    } catch (err) {
      console.error("onPressMapa error:", err);
    }
  };

  // Mostrar una ruta existente: trae coordenadas desde API usando rutasApi.obtenerCoordinadasDeRuta
  const verRuta = async (ruta: Ruta) => {
    try {
      setSelectedRuta(ruta);
      const coords = await rutasApi.obtenerCoordinadasDeRuta(ruta);
      if (!coords || coords.length === 0) {
        Alert.alert("Sin coordenadas", "La ruta no contiene coordenadas válidas.");
        setCoordenadasRuta([]);
        return;
      }
      setCoordenadasRuta(coords);

      // centrar cámara en el primer punto y hacer zoom
      const first = coords[0];
      cameraRef.current?.setCamera({
        centerCoordinate: first,
        zoomLevel: 15,
        animationDuration: 500,
      } as any); // typing libre según versión
    } catch (err) {
      console.error("Error cargando coordenadas de ruta:", err);
      Alert.alert("Error", "No se pudieron cargar las coordenadas de la ruta");
    }
  };

  const toggleTrazado = () => {
    setModoTrazado((m) => {
      const nuevo = !m;
      if (!nuevo) {
        // cuando salimos del modo trazado, no hacemos nada especial
      }
      return nuevo;
    });
  };

  const deshacerUltimo = () => {
    setPuntos((prev) => prev.slice(0, -1));
  };

  const limpiarTrazado = () => {
    setPuntos([]);
  };

  const guardarRuta = async () => {
    if (puntos.length < 2) {
      Alert.alert("Error", "Debes trazar al menos dos puntos para guardar una ruta.");
      return;
    }

    // pedir nombre si no se definió
    if (!nuevoNombre.trim()) {
      setShowCrearModal(true);
      return;
    }

    const shapeData = {
      type: "LineString",
      coordinates: puntos,
    };

    const rutaData: CrearRutaData = {
      nombre_ruta: nuevoNombre.trim() || "Ruta desde mapa",
      perfil_id,
      shape: JSON.stringify(shapeData),
      calles_ids: [], // si tienes lógica para calles, reemplaza aquí
      color_hex: nuevoColor,
    };

    try {
      setIsSaving(true);
      await rutasApi.crearRuta(rutaData);

      Alert.alert("Éxito", "Ruta guardada correctamente.");
      setShowCrearModal(false);
      setNuevoNombre("");
      limpiarTrazado();
      cargarRutas();
    } catch (err: any) {
      console.error("Error guardando ruta:", err);
      const mensaje = err?.response?.data?.message || err?.message || "Error al crear la ruta.";
      Alert.alert("Error", mensaje);
    } finally {
      setIsSaving(false);
    }
  };

  // GeoJSON para la línea trazada (modo trazar) o ruta seleccionada
  const geoJsonTrazado = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: puntos,
    },
  } as GeoJSON.Feature<GeoJSON.LineString>;

  const geoJsonRutaSeleccionada = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: coordenadasRuta,
    },
  } as GeoJSON.Feature<GeoJSON.LineString>;

  return (
    <View style={styles.flex}>
      {/* MAPA */}
      <MapLibreGL.MapView
        ref={(r) => {
            mapRef.current = r;
        }}
      >
        <MapLibreGL.Camera
  ref={(c) => {
    cameraRef.current = c;    // ✔ asignación explícita dentro de llaves
  }}
  centerCoordinate={[-74, 4.6]}
  zoomLevel={13}
/>


        {/* Línea trazada por el usuario (si hay puntos) */}
        {puntos.length > 1 && (
          <MapLibreGL.ShapeSource id="trazadoSource" shape={geoJsonTrazado}>
            <MapLibreGL.LineLayer
              id="trazadoLine"
              style={{
                lineColor: "#FF0000",
                lineWidth: 4,
                lineJoin: "round",
                lineCap: "round",
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Puntos como símbolos (marcadores) */}
        {puntos.map((pt, idx) => (
          <MapLibreGL.PointAnnotation
            key={`pt-${idx}`}
            id={`pt-${idx}`}
            coordinate={pt}
          >
            <View style={styles.marker}>
              <Text style={styles.markerText}>{idx + 1}</Text>
            </View>
          </MapLibreGL.PointAnnotation>
        ))}

        {/* Línea de ruta seleccionada desde API */}
        {coordenadasRuta.length > 1 && (
          <MapLibreGL.ShapeSource id="rutaApiSource" shape={geoJsonRutaSeleccionada}>
            <MapLibreGL.LineLayer
              id="rutaApiLine"
              style={{
                lineColor: selectedRuta?.color_hex || "#007AFF",
                lineWidth: 5,
                lineJoin: "round",
                lineCap: "round",
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>

      {/* PANEL INFERIOR: botones y lista de rutas */}
      <View style={styles.panel}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, modoTrazado ? styles.btnActive : null]}
            onPress={toggleTrazado}
          >
            <Text style={styles.btnText}>
              {modoTrazado ? "✔ Trazando" : "Trazar Ruta"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btn}
            onPress={deshacerUltimo}
            disabled={puntos.length === 0}
          >
            <Text style={styles.btnText}>Deshacer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSave]}
            onPress={guardarRuta}
            disabled={isSaving}
          >
            <Text style={styles.btnText}>{isSaving ? "Guardando..." : "Guardar"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listaRutas}>
          <Text style={styles.listaTitulo}>Rutas</Text>

          {loadingRutas ? (
            <ActivityIndicator />
          ) : (
            <FlatList
              data={rutas}
              keyExtractor={(i) => i.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.rutaCard,
                    { borderLeftColor: item.color_hex || "#007AFF" },
                  ]}
                  onPress={() => verRuta(item)}
                >
                  <Text style={styles.rutaNombre}>🗺️ {item.nombre_ruta}</Text>
                  <Text style={styles.rutaId} numberOfLines={1}>
                    {item.id}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => {
                // abrir modal para crear ruta (si quieres crear sin trazar)
                setShowCrearModal(true);
              }}
            >
              <Text style={styles.btnText}>+ Nueva</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => {
                cargarRutas();
              }}
            >
              <Text style={styles.btnText}>Refrescar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => {
                // Centrar mapa en el trazado o en la ruta seleccionada
                if (puntos.length > 0) {
                  const first = puntos[0];
                  cameraRef.current?.setCamera({
                    centerCoordinate: first,
                    zoomLevel: 15,
                    animationDuration: 500,
                  } as any);
                } else if (coordenadasRuta.length > 0) {
                  const first = coordenadasRuta[0];
                  cameraRef.current?.setCamera({
                    centerCoordinate: first,
                    zoomLevel: 15,
                    animationDuration: 500,
                  } as any);
                } else {
                  cameraRef.current?.setCamera({
                    centerCoordinate: [-76.989, 3.880],
                    zoomLevel: 14,
                    animationDuration: 500,
                  } as any);
                }
              }}
            >
              <Text style={styles.btnText}>Centrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal para crear ruta (nombre, color) */}
      <Modal
        visible={showCrearModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCrearModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Crear Ruta</Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Ruta Centro"
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
            />

            <Text style={styles.label}>Color (hex)</Text>
            <TextInput
              style={styles.input}
              placeholder="#FF5733"
              value={nuevoColor}
              onChangeText={setNuevoColor}
              maxLength={7}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.btn, { marginRight: 8 }]}
                onPress={() => {
                  setShowCrearModal(false);
                }}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSave}
                onPress={() => {
                  // Si ya hay puntos, guardar con ellos; si no, solo crear vacío (pero normalmente quieres puntos)
                  if (puntos.length >= 2) {
                    guardarRuta();
                  } else {
                    // crear ruta sin puntos (no recomendado)
                    Alert.alert("Sin puntos", "No hay puntos trazados para guardar.");
                  }
                }}
              >
                <Text style={styles.btnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  map: { flex: 1 },
  panel: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    padding: 8,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  btn: {
    backgroundColor: "#222",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnActive: {
    backgroundColor: "#0A84FF",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
  },
  btnSave: {
    backgroundColor: "green",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  listaRutas: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 10,
    padding: 8,
  },
  listaTitulo: {
    fontWeight: "700",
    marginBottom: 6,
  },
  rutaCard: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 3,
    borderLeftWidth: 6,
    backgroundColor: "#fff",
    width: 180,
  },
  rutaNombre: { fontWeight: "700" },
  rutaId: { fontSize: 12, opacity: 0.7 },
  smallBtn: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
  },

  // marker
  marker: {
    backgroundColor: "#0A84FF",
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  markerText: { color: "#fff", fontWeight: "700" },

  // modal
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modal: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  label: { fontWeight: "700", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
});
