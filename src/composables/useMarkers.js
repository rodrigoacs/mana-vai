import { ref, watch } from 'vue'

export function useMarkers(standardMarkersConfig, opponents) {
  const markers = ref({})
  const markerDeltas = ref({})
  const markerDialogs = ref({})
  const markerLabels = ref({})

  const initializeAllMarkers = () => {
    standardMarkersConfig.forEach(config => {
      if (markers.value[config.name] === undefined) {
        markers.value[config.name] = 0
        markerDeltas.value[config.name] = 0
        markerDialogs.value[config.name] = false
        markerLabels.value[config.name] = config
      }
    })

    opponents.value.forEach(opponent => {
      const key = `commander_${opponent.id}`
      if (markers.value[key] === undefined) {
        markers.value[key] = 0
        markerDeltas.value[key] = 0
        markerDialogs.value[key] = false
      }
    })
  }

  const changeMarker = (name, amount) => {
    if (markers.value[name] === undefined) return
    if (amount < 0 && markers.value[name] <= 0) return

    markers.value[name] += amount
    markerDeltas.value[name] += amount

    setTimeout(() => {
      markerDeltas.value[name] = 0
    }, 1000)
  }

  const resetMarkers = () => {
    Object.keys(markers.value).forEach(key => {
      markers.value[key] = 0
      markerDeltas.value[key] = 0
    })
  }

  watch(opponents, initializeAllMarkers, { immediate: true, deep: true })

  return { markers, markerDeltas, markerDialogs, markerLabels, changeMarker, resetMarkers, }
}