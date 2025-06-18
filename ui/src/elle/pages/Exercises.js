import { Box, Button } from '@mui/material';
import './styles/Home.css';
import './styles/Library.css';
import { ElleOuterDivStyle, DefaultButtonStyleSmall } from '../const/StyleConstants';
import LibraryNavbar from '../components/library/shared/LibraryNavbar';
import SortButton from '../components/library/search/SortButton';
import CategoryFilters from '../components/library/search/CategoryFilters';
import LanguageFilters from '../components/library/search/LanguageFilters';
import TypeFilters from '../components/library/search/TypeFilters';
import SearchBar from '../components/library/search/SearchBar';
import ExerciseModal from '../components/library/exercises/ExerciseModal';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { useState, useEffect } from 'react';
import ContentCard from '../components/library/shared/ContentCard';
import Can from '../components/security/Can';
import usePagination from '../hooks/library/usePagination';
import Pagination from '../components/library/shared/Pagination';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Exercise() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [sortType, setSortType] = useState('newest');
  const itemsPerPage = 5;
  const navigate = useNavigate();
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

  const handleSearch = (query) => {
    const trimmed = query.trim();

    if (!trimmed) {
      fetch("http://localhost:9090/api/exercises")
        .then(res => res.json())
        .then(json => {
          setSortType('newest');
          setExercises(applySort(json, 'newest'));
          setCurrentPage(1);
        });
      return;
    }

    fetch(`http://localhost:9090/api/exercises/search?query=${encodeURIComponent(trimmed)}`)
      .then(res => res.json())
      .then(json => {
        setSortType('newest');
        setExercises(applySort(json, 'newest'));
        setCurrentPage(1);
      });
  };

  const {
    currentPage,
    totalPages,
    currentItems: currentExercises,
    goToPrev: prev,
    goToNext: next,
    setCurrentPage
  } = usePagination(exercises, itemsPerPage);

  useEffect(() => {
    fetch("http://localhost:9090/api/exercises")
      .then(res => res.json())
      .then(json => setExercises(applySort(json, sortType)));
  }, []);

  return (
    <div>
      <ExerciseModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
      <Box className="adding-rounded-corners" sx={ElleOuterDivStyle}>
        <Box className="library-container">
          <h1 className="library-page-title">{t('exercises')}</h1>

          <div className="library-main-content">
            <div className="library-filters">
              <div className="library-navbar-section">
                <LibraryNavbar />
              </div>
              <div className="library-filters-section">
                <CategoryFilters />
                <br />
                <LanguageFilters />
                <br />
                <TypeFilters />
              </div>
            </div>

            <div className="library-infoContainer">
              <div className="library-search-container">
                <SearchBar onSearch={handleSearch} />
              </div>

              <div className="library-buttons">
                <Can requireAuth={true}>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    sx={DefaultButtonStyleSmall}
                    className="library-add-button"
                  >
                    <EditNoteIcon />
                    {t('exercise_page_create_new_exercise')}
                  </Button>
                </Can>
                <SortButton
                  selectedSort={sortType}
                  onSortChange={(type) => {
                    setSortType(type);
                    setExercises(applySort(exercises, type));
                  }}
                />
              </div>

              <div className="library-results-count">
                <Box>{t('query_found')}: {exercises.length}</Box>
              </div>

              <div className="library-results">
                {currentExercises.length > 0 ? (
                  currentExercises.map(item => (
                    <div key={item.id} onClick={() => navigate(`/library/exercises/${item.id}`)} style={{ cursor: 'pointer' }}>
                      <ContentCard item={item} type="exercise" />
                    </div>
                  ))
                ) : (
                  <Box sx={{ padding: 2, textAlign: 'center', color: 'gray' }}>
                    {t('cant_find_data')}
                  </Box>
                )}
              </div>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={prev}
            onNext={next}
          />
        </Box>
      </Box>
    </div>
  );
}
