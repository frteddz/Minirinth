import { ref } from 'vue'

const searchOpen = ref(false)

export function useSearchOverlay() {
  function openSearch() {
    searchOpen.value = true
  }

  function closeSearch() {
    searchOpen.value = false
  }

  function toggleSearch() {
    searchOpen.value = !searchOpen.value
  }

  return { searchOpen, openSearch, closeSearch, toggleSearch }
}
