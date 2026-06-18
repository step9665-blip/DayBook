import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Check, Plus, BookOpen, Pencil } from 'lucide-react';
import { auth, googleProvider, db } from './firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
  getDocs,
} from 'firebase/firestore';

const CATEGORIES = [
  { id: 'work',     label: 'Работа',   color: 'bg-[#e8f0fe]', textColor: 'text-[#1a56db]' },
  { id: 'personal', label: 'Личное',   color: 'bg-[#e6f4ea]', textColor: 'text-[#137333]' },
  { id: 'health',   label: 'Здоровье', color: 'bg-[#fce8e6]', textColor: 'text-[#c5221f]' },
  { id: 'shopping', label: 'Покупки',  color: 'bg-[#f3e8fd]', textColor: 'text-[#7b1fa2]' },
  { id: 'other',    label: 'Прочее',   color: 'bg-[#f1f0ef]', textColor: 'text-[#37352f]' },
];

const PLANNER_COLORS = [
  { id: 'blue',   label: 'Синий',      bg: 'bg-blue-500',   dot: '#3b82f6' },
  { id: 'green',  label: 'Зелёный',    bg: 'bg-green-500',  dot: '#22c55e' },
  { id: 'red',    label: 'Красный',    bg: 'bg-red-500',    dot: '#ef4444' },
  { id: 'purple', label: 'Фиолетовый', bg: 'bg-purple-500', dot: '#a855f7' },
  { id: 'yellow', label: 'Жёлтый',     bg: 'bg-yellow-400', dot: '#facc15' },
  { id: 'pink',   label: 'Розовый',    bg: 'bg-pink-500',   dot: '#ec4899' },
];

// === LOGIN SCREEN ===
const LoginScreen = () => {
  const handleLogin = () => {
    signInWithPopup(auth, googleProvider).catch(err => console.error('Login error:', err));
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] flex items-center justify-center">
      <div className="bg-white rounded-lg border border-[#e9e9e7] p-10 max-w-sm w-full mx-4 text-center">
        <BookOpen size={36} className="mx-auto text-[#37352f] mb-5" />
        <h1 className="text-2xl font-semibold text-[#37352f] mb-1 tracking-tight">DayBook</h1>
        <p className="text-sm text-[#9b9a97] mb-8">Ваш личный ежедневник</p>
        <button
          onClick={handleLogin}
          className="w-full px-5 py-2.5 bg-[#37352f] text-white text-sm font-medium rounded-md hover:bg-[#2f2d27] transition-colors flex items-center justify-center gap-2.5"
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Войти через Google
        </button>
      </div>
    </div>
  );
};

const PlannerApp = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState('home');
  const [planners, setPlanners] = useState([]);
  const [currentPlannerId, setCurrentPlannerId] = useState(null);
  const [newPlannerName, setNewPlannerName] = useState('');
  const [newPlannerColor, setNewPlannerColor] = useState('blue');
  const [showNewPlannerForm, setShowNewPlannerForm] = useState(false);
  const [editingPlanner, setEditingPlanner] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setPlanners([]);
        setView('home');
        setCurrentPlannerId(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const plannersRef = collection(db, 'users', user.uid, 'planners');
    const unsubscribe = onSnapshot(plannersRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setPlanners(list);
    });
    return unsubscribe;
  }, [user]);

  const createPlanner = async () => {
    if (!newPlannerName.trim() || !user) return;
    const plannersRef = collection(db, 'users', user.uid, 'planners');
    await addDoc(plannersRef, {
      name: newPlannerName.trim(),
      color: newPlannerColor,
      createdAt: new Date().toISOString(),
    });
    setNewPlannerName('');
    setNewPlannerColor('blue');
    setShowNewPlannerForm(false);
  };

  const updatePlanner = async (id, name, color) => {
    if (!user) return;
    const plannerRef = doc(db, 'users', user.uid, 'planners', id);
    await updateDoc(plannerRef, { name, color });
    setEditingPlanner(null);
  };

  const deletePlanner = async (id) => {
    if (!user) return;
    if (window.confirm('Вы уверены? Все задачи будут удалены.')) {
      const tasksRef = collection(db, 'users', user.uid, 'planners', id, 'tasks');
      const taskDocs = await getDocs(tasksRef);
      await Promise.all(taskDocs.docs.map(d => deleteDoc(d.ref)));
      await deleteDoc(doc(db, 'users', user.uid, 'planners', id));
      if (currentPlannerId === id) {
        setCurrentPlannerId(null);
        setView('home');
      }
    }
  };

  const openPlanner = (planner) => {
    setCurrentPlannerId(planner.id);
    setView('planner');
  };

  const goBack = () => {
    setView('home');
    setCurrentPlannerId(null);
  };

  const getCurrentPlanner = () => planners.find(p => p.id === currentPlannerId);

  const handleSignOut = () => {
    signOut(auth).catch(err => console.error('Sign out error:', err));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f7f6f3] flex items-center justify-center">
        <div className="text-[#9b9a97] text-sm">Загрузка...</div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      {view === 'home' ? (
        <HomeView
          planners={planners}
          onOpenPlanner={openPlanner}
          onDeletePlanner={deletePlanner}
          onUpdatePlanner={updatePlanner}
          editingPlanner={editingPlanner}
          setEditingPlanner={setEditingPlanner}
          showNewPlannerForm={showNewPlannerForm}
          setShowNewPlannerForm={setShowNewPlannerForm}
          newPlannerName={newPlannerName}
          setNewPlannerName={setNewPlannerName}
          newPlannerColor={newPlannerColor}
          setNewPlannerColor={setNewPlannerColor}
          onCreatePlanner={createPlanner}
          user={user}
          onSignOut={handleSignOut}
        />
      ) : (
        <PlannerView
          planner={getCurrentPlanner()}
          plannerId={currentPlannerId}
          planners={planners}
          currentPlannerId={currentPlannerId}
          onSelectPlanner={setCurrentPlannerId}
          onBack={goBack}
          onNewPlanner={() => { goBack(); setShowNewPlannerForm(true); }}
          user={user}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
};

// === HOME VIEW ===
const HomeView = ({
  planners, onOpenPlanner, onDeletePlanner, onUpdatePlanner,
  editingPlanner, setEditingPlanner,
  showNewPlannerForm, setShowNewPlannerForm,
  newPlannerName, setNewPlannerName,
  newPlannerColor, setNewPlannerColor,
  onCreatePlanner, user, onSignOut,
}) => {
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('blue');

  const openEdit = (e, planner) => {
    e.stopPropagation();
    setEditName(planner.name);
    setEditColor(planner.color);
    setEditingPlanner(planner);
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">

      {/* Модал редактирования */}
      {editingPlanner && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg border border-[#e9e9e7] p-7 w-full max-w-md mx-4 shadow-lg">
            <h2 className="text-base font-semibold text-[#37352f] mb-5">Редактировать ежедневник</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#9b9a97] mb-1.5 uppercase tracking-wide">Название</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e9e9e7] rounded-md text-sm text-[#37352f] focus:outline-none focus:border-[#37352f] transition-colors"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && onUpdatePlanner(editingPlanner.id, editName, editColor)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9b9a97] mb-2 uppercase tracking-wide">Цвет</label>
                <div className="flex gap-2.5">
                  {PLANNER_COLORS.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setEditColor(color.id)}
                      style={{ backgroundColor: color.dot }}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        editColor === color.id ? 'ring-2 ring-offset-2 ring-[#37352f] scale-110' : 'hover:scale-110'
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onUpdatePlanner(editingPlanner.id, editName, editColor)}
                  className="flex-1 px-4 py-2 bg-[#37352f] text-white text-sm font-medium rounded-md hover:bg-[#2f2d27] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  Сохранить
                </button>
                <button
                  onClick={() => setEditingPlanner(null)}
                  className="flex-1 px-4 py-2 bg-[#f1f0ef] text-[#37352f] text-sm font-medium rounded-md hover:bg-[#e9e9e7] transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Шапка */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 pt-2">
        <div className="flex items-center gap-2.5">
          <BookOpen size={22} className="text-[#37352f]" />
          <h1 className="text-xl font-semibold text-[#37352f] tracking-tight">Мои ежедневники</h1>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-[#9b9a97] hidden sm:inline">{user.displayName || user.email}</span>
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 text-xs text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f1f0ef] rounded-md transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Форма создания */}
      {showNewPlannerForm ? (
        <div className="bg-white rounded-lg border border-[#e9e9e7] p-6 mb-6">
          <h2 className="text-sm font-semibold text-[#37352f] mb-4">Новый ежедневник</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9b9a97] mb-1.5 uppercase tracking-wide">Название</label>
              <input
                type="text"
                value={newPlannerName}
                onChange={(e) => setNewPlannerName(e.target.value)}
                placeholder="Например: Проект X, Личные задачи..."
                className="w-full px-3 py-2 border border-[#e9e9e7] rounded-md text-sm text-[#37352f] placeholder-[#c7c6c4] focus:outline-none focus:border-[#37352f] transition-colors"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && onCreatePlanner()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9b9a97] mb-2 uppercase tracking-wide">Цвет</label>
              <div className="flex gap-2.5">
                {PLANNER_COLORS.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setNewPlannerColor(color.id)}
                    style={{ backgroundColor: color.dot }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      newPlannerColor === color.id ? 'ring-2 ring-offset-2 ring-[#37352f] scale-110' : 'hover:scale-110'
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={onCreatePlanner}
                className="flex-1 px-4 py-2 bg-[#37352f] text-white text-sm font-medium rounded-md hover:bg-[#2f2d27] transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                Создать
              </button>
              <button
                onClick={() => { setShowNewPlannerForm(false); setNewPlannerName(''); setNewPlannerColor('blue'); }}
                className="flex-1 px-4 py-2 bg-[#f1f0ef] text-[#37352f] text-sm font-medium rounded-md hover:bg-[#e9e9e7] transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewPlannerForm(true)}
          className="mb-6 flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f1f0ef] rounded-md transition-colors"
        >
          <Plus size={16} />
          Новый ежедневник
        </button>
      )}

      {/* Список / пусто */}
      {planners.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={40} className="mx-auto text-[#e9e9e7] mb-3" />
          <p className="text-sm text-[#9b9a97] mb-4">Ежедневников нет</p>
          <button
            onClick={() => setShowNewPlannerForm(true)}
            className="px-4 py-2 bg-[#37352f] text-white text-sm font-medium rounded-md hover:bg-[#2f2d27] transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            Создать ежедневник
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {planners.map(planner => {
            const colorInfo = PLANNER_COLORS.find(c => c.id === planner.color);
            return (
              <div
                key={planner.id}
                className="group bg-white rounded-lg border border-[#e9e9e7] hover:border-[#c7c6c4] hover:shadow-sm transition-all cursor-pointer overflow-hidden"
                onClick={() => onOpenPlanner(planner)}
              >
                <div className="h-1 w-full" style={{ backgroundColor: colorInfo.dot }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-[#37352f] group-hover:text-black transition-colors leading-snug">
                      {planner.name}
                    </h3>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                      <button
                        onClick={(e) => openEdit(e, planner)}
                        className="p-1.5 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f1f0ef] rounded transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeletePlanner(planner.id); }}
                        className="p-1.5 text-[#9b9a97] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[#9b9a97]">
                    {new Date(planner.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// === PLANNER VIEW ===
const PlannerView = ({ planner, plannerId, planners, currentPlannerId, onSelectPlanner, onBack, onNewPlanner, user, onSignOut }) => {
  const [view, setView] = useState('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingCategory, setEditingCategory] = useState('work');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(new Set(CATEGORIES.map(c => c.id)));
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showPlannerDropdown, setShowPlannerDropdown] = useState(false);

  const debounceTimers = useRef({});

  useEffect(() => {
    if (!user || !plannerId) return;
    setTasks({});
    const tasksRef = collection(db, 'users', user.uid, 'planners', plannerId, 'tasks');
    getDocs(tasksRef).then(snapshot => {
      const loaded = {};
      snapshot.docs.forEach(d => { loaded[d.id] = d.data().tasks || []; });
      setTasks(loaded);
    }).catch(err => console.error('Error loading tasks:', err));
  }, [user, plannerId]);

  useEffect(() => {
    if (!user || !plannerId) return;
    Object.keys(tasks).forEach(dateStr => {
      if (debounceTimers.current[dateStr]) clearTimeout(debounceTimers.current[dateStr]);
      debounceTimers.current[dateStr] = setTimeout(() => {
        const taskDocRef = doc(db, 'users', user.uid, 'planners', plannerId, 'tasks', dateStr);
        const dateTasks = tasks[dateStr];
        if (dateTasks && dateTasks.length > 0) {
          setDoc(taskDocRef, { tasks: dateTasks }).catch(err => console.error('Error saving tasks:', err));
        } else {
          deleteDoc(taskDocRef).catch(err => console.error('Error deleting task doc:', err));
        }
      }, 500);
    });
  }, [tasks, user, plannerId]);

  const formatDate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addTask = (dateStr, text, category = 'work') => {
    if (!text.trim()) return;
    const newTask = { id: generateId(), text: text.trim(), category, completed: false, createdAt: new Date().toISOString() };
    setTasks({ ...tasks, [dateStr]: [...(tasks[dateStr] || []), newTask] });
  };

  const updateTask = (dateStr, id, updates) => {
    const dateTasks = [...(tasks[dateStr] || [])];
    const index = dateTasks.findIndex(t => t.id === id);
    if (index !== -1) {
      dateTasks[index] = { ...dateTasks[index], ...updates };
      setTasks({ ...tasks, [dateStr]: dateTasks });
    }
  };

  const deleteTask = (dateStr, id) => {
    const dateTasks = (tasks[dateStr] || []).filter(t => t.id !== id);
    const newTasks = { ...tasks };
    if (dateTasks.length === 0) delete newTasks[dateStr];
    else newTasks[dateStr] = dateTasks;
    setTasks(newTasks);
  };

  const toggleTaskCompletion = (dateStr, id) => {
    const task = (tasks[dateStr] || []).find(t => t.id === id);
    if (task) updateTask(dateStr, id, { completed: !task.completed });
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditingText(task.text);
    setEditingCategory(task.category || 'work');
  };

  const finishEdit = (dateStr, id) => {
    if (editingText.trim()) updateTask(dateStr, id, { text: editingText.trim(), category: editingCategory });
    setEditingId(null);
    setEditingText('');
  };

  const navigate = (amount) => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(newDate.getDate() + amount);
    if (view === 'week') newDate.setDate(newDate.getDate() + amount * 7);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + amount);
    setCurrentDate(newDate);
  };

  const getCategoryInfo = (categoryId) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[4];

  const getFilteredTasks = (dateTasks) => (dateTasks || []).filter(task => {
    const categoryMatch = selectedCategories.has(task.category || 'work');
    const searchMatch = searchQuery === '' || task.text.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const currentColorInfo = PLANNER_COLORS.find(c => c.id === planner?.color);

  // --- ДЕНЬ ---
  const renderDayView = () => {
    const dateStr = formatDate(currentDate);
    const allDayTasks = tasks[dateStr] || [];
    const dayTasks = getFilteredTasks(allDayTasks);
    const weekday = currentDate.toLocaleDateString('ru-RU', { weekday: 'long' });
    const dayNum = currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const emptyLines = Math.max(0, 15 - dayTasks.length);

    return (
      <div className="bg-white rounded-lg border border-[#e9e9e7] overflow-hidden">
        <div className="px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-[#e9e9e7]">
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className="px-3 py-1.5 text-xs text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f1f0ef] rounded-md transition-colors border border-[#e9e9e7]"
              >
                Категории ({selectedCategories.size})
              </button>
              {showCategoryFilter && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#e9e9e7] rounded-lg shadow-sm p-2 z-10 min-w-[180px]">
                  {CATEGORIES.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 py-1.5 px-2 cursor-pointer hover:bg-[#f1f0ef] rounded-md">
                      <input
                        type="checkbox"
                        checked={selectedCategories.has(cat.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedCategories);
                          if (e.target.checked) newSet.add(cat.id);
                          else newSet.delete(cat.id);
                          setSelectedCategories(newSet);
                        }}
                        className="w-3.5 h-3.5"
                      />
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${cat.color} ${cat.textColor}`}>
                        {cat.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="px-3 py-1.5 text-xs text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f1f0ef] rounded-md transition-colors border border-[#e9e9e7]"
              >
                Поиск
              </button>
              {showSearch && (
                <input
                  type="text"
                  placeholder="Найти задачу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="absolute top-full left-0 mt-1 w-56 px-3 py-2 border border-[#e9e9e7] rounded-lg text-sm text-[#37352f] placeholder-[#c7c6c4] focus:outline-none focus:border-[#37352f] bg-white shadow-sm"
                  autoFocus
                />
              )}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-base font-semibold text-[#37352f] capitalize">{weekday}</p>
            <p className="text-xs text-[#9b9a97]">{dayNum}</p>
          </div>
        </div>

        <div className="min-h-[600px]">
          {dayTasks.map((task, i) => {
            const catInfo = getCategoryInfo(task.category);
            const isEditing = editingId === task.id;
            return (
              <div
                key={task.id}
                className="group flex items-center min-h-[44px] border-b border-[#f1f0ef] hover:bg-[#f7f6f3] px-3 sm:px-8 md:px-16 text-sm text-[#37352f] relative"
              >
                <span className="mr-3 text-[#c7c6c4] text-xs w-5 shrink-0">{i + 1}</span>
                {isEditing ? (
                  <div
                    className="flex items-center flex-grow gap-2"
                    onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) finishEdit(formatDate(currentDate), task.id); }}
                  >
                    <select
                      value={editingCategory}
                      onChange={(e) => setEditingCategory(e.target.value)}
                      className="px-2 py-1 text-xs border border-[#e9e9e7] rounded bg-white text-[#37352f] focus:outline-none"
                    >
                      {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                    </select>
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishEdit(formatDate(currentDate), task.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-grow bg-white border border-[#37352f] px-2 py-1 text-sm rounded focus:outline-none text-[#37352f]"
                      autoFocus
                    />
                  </div>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompletion(formatDate(currentDate), task.id)}
                      className="mr-2.5 w-4 h-4 cursor-pointer accent-[#37352f]"
                    />
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded mr-2.5 ${catInfo.color} ${catInfo.textColor}`}>
                      {catInfo.label}
                    </span>
                    <span
                      onClick={() => startEdit(task)}
                      className={`flex-grow cursor-text py-2.5 ${task.completed ? 'line-through text-[#c7c6c4]' : ''}`}
                    >
                      {task.text}
                    </span>
                    <button
                      onClick={() => deleteTask(formatDate(currentDate), task.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#9b9a97] hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-all ml-2"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            );
          })}

          <div className="flex items-center min-h-[44px] border-b border-[#f1f0ef] px-3 sm:px-8 md:px-16 focus-within:bg-[#f7f6f3]">
            <span className="mr-3 text-[#c7c6c4] text-xs w-5 shrink-0">{dayTasks.length + 1}</span>
            <input
              className="flex-grow bg-transparent border-none outline-none text-sm text-[#37352f] placeholder-[#c7c6c4]"
              placeholder="Добавить задачу..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addTask(formatDate(currentDate), e.target.value, 'work');
                  e.target.value = '';
                }
              }}
            />
          </div>

          {[...Array(emptyLines)].map((_, i) => (
            <div key={i} className="min-h-[44px] border-b border-[#f1f0ef]" />
          ))}
        </div>
      </div>
    );
  };

  // --- НЕДЕЛЯ ---
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day + (day === 0 ? -6 : 1));

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
        {[...Array(7)].map((_, i) => {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          const dStr = formatDate(d);
          const isToday = dStr === formatDate(new Date());
          const dayTasks = getFilteredTasks(tasks[dStr] || []);

          return (
            <div
              key={i}
              onClick={() => { setCurrentDate(d); setView('day'); }}
              className={`bg-white rounded-lg border transition-all cursor-pointer p-2.5 sm:p-3 min-h-[120px] hover:border-[#c7c6c4] ${isToday ? 'border-[#37352f]' : 'border-[#e9e9e7]'}`}
            >
              <div className={`text-xs font-semibold mb-2 pb-1.5 border-b border-[#f1f0ef] ${isToday ? 'text-[#37352f]' : 'text-[#9b9a97]'}`}>
                {d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 5).map((t, idx) => (
                  <div key={idx} className={`text-[10px] truncate rounded px-1 py-0.5 ${getCategoryInfo(t.category).color} ${getCategoryInfo(t.category).textColor} ${t.completed ? 'line-through opacity-50' : ''}`}>
                    {t.text}
                  </div>
                ))}
                {dayTasks.length > 5 && <div className="text-[10px] text-[#9b9a97]">+{dayTasks.length - 5}</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // --- МЕСЯЦ ---
  const renderMonthView = () => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayIndex = (start.getDay() || 7) - 1;

    return (
      <div className="bg-white rounded-lg border border-[#e9e9e7] overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#e9e9e7]">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold text-[#9b9a97] uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {[...Array(42)].map((_, i) => {
            const dayNum = i - firstDayIndex + 1;
            const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
            const dStr = formatDate(dayDate);
            const dayTasks = getFilteredTasks(tasks[dStr] || []);
            const isToday = dStr === formatDate(new Date());

            return (
              <div
                key={i}
                onClick={() => isValidDay && (setCurrentDate(dayDate), setView('day'))}
                className={`h-14 sm:h-24 md:h-28 border-b border-r border-[#f1f0ef] p-1 sm:p-1.5 transition-colors ${isValidDay ? 'cursor-pointer hover:bg-[#f7f6f3]' : 'bg-[#fafaf9]'}`}
              >
                {isValidDay && (
                  <>
                    <span className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-xs font-semibold ${isToday ? 'bg-[#37352f] text-white' : 'text-[#37352f]'}`}>
                      {dayNum}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayTasks.slice(0, 2).map((t, idx) => (
                        <div key={idx} className={`hidden sm:block text-[9px] px-1 rounded truncate ${getCategoryInfo(t.category).color} ${getCategoryInfo(t.category).textColor} ${t.completed ? 'opacity-40' : ''}`}>
                          {t.text}
                        </div>
                      ))}
                      {dayTasks.length > 2 && <div className="hidden sm:block text-[9px] text-[#9b9a97] px-1">+{dayTasks.length - 2}</div>}
                      {dayTasks.length > 0 && <div className="sm:hidden w-1.5 h-1.5 rounded-full bg-[#37352f] mx-auto mt-1" />}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] p-2 sm:p-6">
      <div className="max-w-5xl mx-auto">

        {/* Шапка */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowPlannerDropdown(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e9e9e7] rounded-md hover:border-[#c7c6c4] transition-colors text-sm text-[#37352f] w-full sm:w-auto justify-between sm:justify-start min-w-0 sm:min-w-[200px]"
            >
              <span className="flex items-center gap-2 truncate">
                {currentColorInfo && (
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: currentColorInfo.dot }} />
                )}
                <span className="truncate">{planners.find(p => p.id === currentPlannerId)?.name || 'Ежедневник'}</span>
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-[#9b9a97] transition-transform shrink-0 ${showPlannerDropdown ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {showPlannerDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#e9e9e7] rounded-lg shadow-md z-50 min-w-[200px] py-1" onMouseLeave={() => setShowPlannerDropdown(false)}>
                {planners.map(p => {
                  const pColor = PLANNER_COLORS.find(c => c.id === p.color);
                  return (
                    <button
                      key={p.id}
                      onClick={() => { onSelectPlanner(p.id); setShowPlannerDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[#f1f0ef] transition-colors ${p.id === currentPlannerId ? 'text-[#37352f] font-medium' : 'text-[#6b6a68]'}`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pColor?.dot }} />
                      {p.name}
                      {p.id === currentPlannerId && <Check size={12} className="ml-auto" />}
                    </button>
                  );
                })}
                <div className="border-t border-[#f1f0ef] mt-1 pt-1">
                  <button
                    onClick={() => { onBack(); setShowPlannerDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-[#9b9a97] hover:bg-[#f1f0ef] transition-colors"
                  >
                    ← Все ежедневники
                  </button>
                  <button
                    onClick={() => { onNewPlanner(); setShowPlannerDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-[#37352f] hover:bg-[#f1f0ef] transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    Создать новый
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-[#9b9a97] hidden sm:inline">{user.displayName || user.email}</span>
            <button
              onClick={onSignOut}
              className="px-3 py-1.5 text-xs text-[#9b9a97] hover:text-[#37352f] hover:bg-white border border-transparent hover:border-[#e9e9e7] rounded-md transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Переключатель вид + навигация */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-5 gap-3">
          <div className="flex bg-white border border-[#e9e9e7] rounded-md overflow-hidden">
            {[{ id: 'day', label: 'День' }, { id: 'week', label: 'Неделя' }, { id: 'month', label: 'Месяц' }].map(btn => (
              <button
                key={btn.id}
                onClick={() => setView(btn.id)}
                className={`px-4 sm:px-6 py-2 text-sm font-medium transition-all ${view === btn.id ? 'bg-[#37352f] text-white' : 'text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f1f0ef]'}`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white border border-[#e9e9e7] rounded-md px-2 py-1">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-[#f1f0ef] rounded transition-colors">
              <ChevronLeft size={18} className="text-[#37352f]" />
            </button>
            <span className="text-sm font-medium text-[#37352f] min-w-[130px] sm:min-w-[160px] text-center">
              {view === 'day'
                ? currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
                : currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => navigate(1)} className="p-1.5 hover:bg-[#f1f0ef] rounded transition-colors">
              <ChevronRight size={18} className="text-[#37352f]" />
            </button>
          </div>
        </div>

        {/* Контент */}
        {view === 'day' && renderDayView()}
        {view === 'week' && renderWeekView()}
        {view === 'month' && renderMonthView()}
      </div>
    </div>
  );
};

export default PlannerApp;
