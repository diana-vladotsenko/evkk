import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Box } from '@mui/material';
import ContentCard from '../components/library/shared/ContentCard';
import AddStudyMaterialButton from '../components/library/studymaterial/AddStudyMaterialButton';
import AddStudyMaterial from '../components/library/studymaterial/AddStudyMaterial';
import StudyMaterialPopup from '../components/library/studymaterial/StudyMaterialPopup';
import SearchBar from '../components/library/search/SearchBar';
import LibraryNavbar from '../components/library/shared/LibraryNavbar';
import CategoryFilters from '../components/library/search/CategoryFilters';
import TypeFilters from '../components/library/search/TypeFilters';
import LanguageFilters from '../components/library/search/LanguageFilters';
import SortButton from '../components/library/search/SortButton';
import Pagination from '../components/library/shared/Pagination';
import usePagination from '../hooks/library/usePagination';
import './styles/Home.css';
import './styles/Library.css';
import { ElleOuterDivStyle } from '../const/StyleConstants';
import { useTranslation } from 'react-i18next';
import Can from "../components/security/Can";

export default function StudyMaterial() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const openId = searchParams.get('open');
  const [modalOpen, setModalOpen] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [sortType, setSortType] = useState('newest');
  const materialsPerPage = 5;
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const { t } = useTranslation();

  const applySort = (items, type) => {
    const sorted = [...items];
    switch (type) {
      case 'az': return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'za': return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'oldest': return sorted.sort((a, b) => a.id - b.id);
      case 'newest':
      default: return sorted.sort((a, b) => b.id - a.id);
    }
  };

  const {
    currentPage,
    totalPages,
    currentItems: currentMaterials,
    goToPrev: prev,
    goToNext: next,
    setCurrentPage
  } = usePagination(materials, materialsPerPage);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (selectedCategories.length) {
      params.append('categories', selectedCategories.join(','));
    }
    if (selectedLanguages.length) {
      params.append('languageLevel', selectedLanguages.join(','));
    }
    if (selectedTypes.length) {
      params.append('materialType', selectedTypes.join(','));
    }

    try {
      const url = `http://localhost:9090/api/study-material/results?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP error ' + res.status);
      const data = await res.json();
      setMaterials(applySort(data, sortType));
    } catch (err) {
      console.error('Error fetching materials:', err);
      setMaterials([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategories, selectedLanguages, selectedTypes, sortType]);

  useEffect(() => {
    if (openId && materials.length > 0) {
      const match = materials.find(m => m.id === parseInt(openId));
      if (match) {
        setSelectedMaterial(match);
        setPopupOpen(true);
      }
    }
  }, [openId, materials]);

  const handleSearch = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      await fetchData();
      setCurrentPage(1);
      return;
    }

    const url = `http://localhost:9090/api/study-material/search?query=${encodeURIComponent(trimmed)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setMaterials(applySort(data, 'newest'));
      setSortType('newest');
      setCurrentPage(1);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleCardClick = (material) => {
    setSelectedMaterial(material);
    setPopupOpen(true);
    const newSearch = new URLSearchParams(location.search);
    newSearch.set('open', material.id);
    navigate(`${location.pathname}?${newSearch.toString()}`, { replace: true });
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
    setSelectedMaterial(null);
    const newSearch = new URLSearchParams(location.search);
    newSearch.delete('open');
    navigate(`${location.pathname}?${newSearch.toString()}`, { replace: true });
  };

  const handleCategoriesChange = (val) => setSelectedCategories(val);
  const handleLanguagesChange = (val) => setSelectedLanguages(val);
  const handleTypesChange = (val) => setSelectedTypes(val);

  return (
    <div>
      <AddStudyMaterial
        isOpen={modalOpen}
        setIsOpen={() => setModalOpen(false)}
        onSubmitSuccess={async (newMaterial) => {
          try {
            const url = `http://localhost:9090/api/study-material/${newMaterial.id}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error();
            const fullMaterial = await res.json();
            setMaterials(prev => applySort([fullMaterial, ...prev], sortType));
          } catch {
            setMaterials(prev => applySort([newMaterial, ...prev], sortType));
          }
          setCurrentPage(1);
        }}
      />
      <StudyMaterialPopup
        open={popupOpen}
        onClose={handleClosePopup}
        material={selectedMaterial}
      />
      <Box className="adding-rounded-corners" sx={ElleOuterDivStyle}>
        <Box className="library-container">
          <h1 className="library-page-title">{t('study_materials')}</h1>
          <div className="library-main-content">
            <div className="library-filters">
              <div className="library-navbar-section">
                <LibraryNavbar />
              </div>
              <div className="library-filters-section">
                <CategoryFilters selected={selectedCategories} onChange={handleCategoriesChange} />
                <br />
                <LanguageFilters selected={selectedLanguages} onChange={handleLanguagesChange} />
                <br />
                <TypeFilters selected={selectedTypes} onChange={handleTypesChange} />
              </div>
            </div>
            <div className="library-infoContainer">
              <SearchBar onSearch={handleSearch} />
              <div className="library-header-actions">
                <Can requireAuth={true}>
                  <AddStudyMaterialButton onClick={() => setModalOpen(true)} />
                </Can>
                <SortButton
                  selectedSort={sortType}
                  onSortChange={(type) => {
                    setSortType(type);
                  }}
                />
              </div>
              <div className="library-results-count">
                <Box>{t('query_found') + ':'} {materials.length}</Box>
              </div>
              <div className="library-results">
                {currentMaterials.length > 0 ? (
                  currentMaterials.map(m => (
                    <ContentCard key={m.id} item={m} type="material" onClick={() => handleCardClick(m)} />
                  ))
                ) : (
                  <Box sx={{ padding: 2, textAlign: 'center', color: 'gray' }}>
                    {t('cant_find_data')}
                  </Box>
                )}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPrev={prev}
                onNext={next}
              />
            </div>
          </div>
        </Box>
      </Box>
    </div>
  );
}
