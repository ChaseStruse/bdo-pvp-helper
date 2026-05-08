const { createApp, ref } = Vue;

createApp({
  setup() {
    const selectedFile = ref(null);
    const previewUrl = ref(null);
    const extractionResults = ref(null);
    const isExtracting = ref(false);
    const sortKey = ref('Dealt'); // Default sort by Dealt
    const sortOrder = ref(-1); // Default descending
    const activeTab = ref('home');
    const historyData = ref([]);
    const searchQuery = ref('');
    const searchResults = ref([]);
    const hasSearched = ref(false);

    // Basic client-side routing logic
    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:5000/history/${userId.value}`);
        const data = await response.json();
        historyData.value = data.map(m => ({ ...m, expanded: false }));
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };

    const navigateTo = (tab) => {
      // Map 'aos' URL to 'extract' tab internally
      const internalTab = tab === 'aos' ? 'extract' : tab;
      activeTab.value = internalTab;
      
      const path = tab === 'home' ? '/' : `/${tab}`;
      window.history.pushState({ tab: internalTab }, '', path);
      
      if (internalTab === 'history') fetchHistory();
    };


    // Handle back/forward buttons
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.tab) {
        activeTab.value = event.state.tab;
      } else {
        activeTab.value = 'home';
      }
    });

    // Initialize tab based on URL
    const initRoute = () => {
      const path = window.location.pathname.replace('/', '');
      if (['aos', 'history', 'search'].includes(path)) {
        activeTab.value = path === 'aos' ? 'extract' : path;
      } else {
        activeTab.value = 'home';
      }
    };
    initRoute();


    const runSearch = async () => {
      if (!searchQuery.value) return;
      activeTab.value = 'search';
      hasSearched.value = true;
      try {
        const response = await fetch(`http://localhost:5000/search?name=${encodeURIComponent(searchQuery.value)}`);
        const data = await response.json();
        searchResults.value = data.map(m => ({ ...m, expanded: false }));
      } catch (error) {
        console.error('Error during search:', error);
        alert('Search failed. Make sure the backend is running.');
      }
    };



    const classes = [
      "Archer", "Berserker", "Corsair", "Dark Knight", "Deadeye", "Dosa", 
      "Drakania", "Guardian", "Hashashin", "Kunoichi", "Lahn", "Maegu", 
      "Maehwa", "Musa", "Mystic", "Ninja", "Nova", "Ranger", "Sage", 
      "Scholar", "Seraph", "Shai", "Sorceress", "Striker", "Tamer", 
      "Valkyrie", "Warrior", "Witch", "Wizard", "Woosa", "Wukong"
    ];

    const specs = ["Ascension", "Awakening", "Succession"];
    const ascensionClasses = ["Archer", "Deadeye", "Seraph", "Wukong"];

    const userId = ref('User123'); 
    const isLoggedIn = ref(false);

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        selectedFile.value = file;
        previewUrl.value = URL.createObjectURL(file);
        extractionResults.value = null;
      }
    };

    const handleFileDrop = (event) => {
      const file = event.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        selectedFile.value = file;
        previewUrl.value = URL.createObjectURL(file);
        extractionResults.value = null;
      }
    };

    const handleClassChange = (player) => {
        if (ascensionClasses.includes(player.selectedClass)) {
            player.selectedSpec = "Ascension";
        } else if (player.selectedSpec === "Ascension") {
            player.selectedSpec = "Awakening";
        }
    };

    const loginWithDiscord = () => {
      isLoggedIn.value = true;
      userId.value = "Tester#1337";
      alert("Logged in as: " + userId.value);
    };


    const sortedResults = Vue.computed(() => {
      if (!extractionResults.value) return [];
      
      const results = Object.entries(extractionResults.value).map(([name, stats]) => {
        // Map backend detected values to the frontend dropdown models
        return { 
          name, 
          ...stats,
          selectedClass: stats.Class || "",
          selectedSpec: stats.Spec || ""
        };
      });


      return results.sort((a, b) => {
        if (a.Enemy !== b.Enemy) return a.Enemy ? 1 : -1;
        let aVal = a[sortKey.value];
        let bVal = b[sortKey.value];
        if (sortKey.value === 'name') return aVal.localeCompare(bVal) * sortOrder.value;
        return (aVal - bVal) * sortOrder.value;
      });
    });

    const isSaveDisabled = Vue.computed(() => {
      if (!sortedResults.value || sortedResults.value.length === 0) return true;
      return sortedResults.value.some(p => !p.selectedClass || !p.selectedSpec);
    });


    const saveAndUpload = async () => {
      isExtracting.value = true;
      try {
        const response = await fetch('http://localhost:5000/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId.value,
            data: sortedResults.value
          })
        });


        const result = await response.json();
        if (result.status === 'success') {
          alert('Successfully saved to database! Scoreboard ID: ' + result.scoreboard_id);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Error saving:', error);
        alert('Failed to save: ' + error.message);
      } finally {
        isExtracting.value = false;
      }
    };

    const sortBy = (key) => {
      if (sortKey.value === key) {
        sortOrder.value *= -1;
      } else {
        sortKey.value = key;
        sortOrder.value = -1;
      }
    };

    const runExtraction = async () => {
      if (!selectedFile.value) return;
      isExtracting.value = true;
      extractionResults.value = null;
      const formData = new FormData();
      formData.append('file', selectedFile.value);

      try {
        const response = await fetch('http://localhost:5000/extract', {
          method: 'POST',
          body: formData
        });
        if (!response.ok) throw new Error('Extraction failed');
        const data = await response.json();
        extractionResults.value = data;
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to extract stats. Make sure the backend is running.');
      } finally {
        isExtracting.value = false;
      }
    };

    return {
      selectedFile,
      previewUrl,
      extractionResults,
      sortedResults,
      isExtracting,
      sortKey,
      sortOrder,
      activeTab,
      historyData,
      fetchHistory,
      navigateTo,
      searchQuery,

      searchResults,
      hasSearched,
      runSearch,
      classes,

      specs,
      userId,
      isLoggedIn,
      handleFileSelect,
      handleFileDrop,
      handleClassChange,
      loginWithDiscord,
      sortBy,
      isSaveDisabled,
      saveAndUpload,
      runExtraction
    };

  }
}).mount('#app');
