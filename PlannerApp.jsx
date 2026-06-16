import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Edit2, Check, X, Plus, BookOpen, Settings, ArrowLeft } from 'lucide-react';

const CATEGORIES = [
  { id: 'work', label: 'Работа', color: 'bg-blue-100', textColor: 'text-blue-800', borderColor: 'border-blue-300' },
  { id: 'personal', label: 'Личное', color: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-300' },
  { id: 'health', label: 'Здоровье', color: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-300' },
  { id: 'shopping', label: 'Покупки', color: 'bg-purple-100', textColor: 'text-purple-800', borderColor: 'border-purple-300' },
  { id: 'other', label: 'Прочее', color: 'bg-gray-100', textColor: 'text-gray-800', borderColor: 'border-gray-300' },
];

const PLANNER_COLORS = [
  { id: 'blue', label: 'Синий', bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700' },
  { id: 'green', label: 'Зелёный', bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700' },
  { id: 'red', label: 'Красный', bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-700' },
  { id: 'purple', label: 'Фиолетовый', bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700' },
  { id: 'yellow', label: 'Жёлтый', bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-700' },
  { id: 'pink', label: 'Розовый', bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-700' },
];

const PlannerApp = () => {
  const [view, setView] = useState('home'); // 'home' или 'planner'
  const [planners, setPlanners] = useState(() => {
    const saved = localStorage.getItem('planners_list');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPlannerId, setCurrentPlannerId] = useState(null);
  const [newPlannerName, setNewPlannerName] = useState('');
  const [newPlannerColor, setNewPlannerColor] = useState('blue');
  const [showNewPlannerForm, setShowNewPlannerForm] = useState(false);

  // Сохранение списка ежедневников
  useEffect(() => {
    localStorage.setItem('planners_list', JSON.stringify(planners));
  }, [planners]);

  const createPlanner = () => {
    if (!newPlannerName.trim()) return;
    
    const newPlanner = {
      id: `planner-${Date.now()}`,
      name: newPlannerName.trim(),
      color: newPlannerColor,
      createdAt: new Date().toISOString(),
    };

    setPlanners([...planners, newPlanner]);
    setNewPlannerName('');
    setNewPlannerColor('blue');
    setShowNewPlannerForm(false);
  };

  const deletePlanner = (id) => {
    if (window.confirm('Вы уверены? Все задачи будут удалены.')) {
      setPlanners(planners.filter(p => p.id !== id));
      localStorage.removeItem(`planner_tasks_${id}`);
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

  const getCurrentPlanner = () => {
    return planners.find(p => p.id === currentPlannerId);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {view === 'home' ? (
        <HomeView 
          planners={planners}
          onOpenPlanner={openPlanner}
          onDeletePlanner={deletePlanner}
          showNewPlannerForm={showNewPlannerForm}
          setShowNewPlannerForm={setShowNewPlannerForm}
          newPlannerName={newPlannerName}
          setNewPlannerName={setNewPlannerName}
          newPlannerColor={newPlannerColor}
          setNewPlannerColor={setNewPlannerColor}
          onCreatePlanner={createPlanner}
        />
      ) : (
        <PlannerView 
          planner={getCurrentPlanner()}
          plannerId={currentPlannerId}
          planners={planners}
          currentPlannerId={currentPlannerId}
          onSelectPlanner={setCurrentPlannerId}
          onBack={goBack}
        />
      )}
    </div>
  );
};

// === HOME VIEW (Список ежедневников) ===
const HomeView = ({
  planners,
  onOpenPlanner,
  onDeletePlanner,
  showNewPlannerForm,
  setShowNewPlannerForm,
  newPlannerName,
  setNewPlannerName,
  newPlannerColor,
  setNewPlannerColor,
  onCreatePlanner,
}) => {
  const colorInfo = PLANNER_COLORS.find(c => c.id === newPlannerColor);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Заголовок */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen size={40} className="text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Мои ежедневники</h1>
          </div>
          <p className="text-gray-600 text-lg">Создавайте и управляйте своими ежедневниками для разных проектов и целей</p>
        </div>

        {/* Форма создания нового ежедневника */}
        {showNewPlannerForm ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Новый ежедневник</h2>
            
            <div className="space-y-6">
              {/* Название */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Название</label>
                <input
                  type="text"
                  value={newPlannerName}
                  onChange={(e) => setNewPlannerName(e.target.value)}
                  placeholder="Например: Проект X, Личные задачи, Здоровье..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onCreatePlanner();
                    }
                  }}
                />
              </div>

              {/* Цвет */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Цвет</label>
                <div className="flex gap-3 flex-wrap">
                  {PLANNER_COLORS.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setNewPlannerColor(color.id)}
                      className={`w-12 h-12 rounded-full transition-transform ${color.bg} ${
                        newPlannerColor === color.id ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onCreatePlanner}
                  className={`flex-1 px-6 py-3 ${colorInfo.bg} text-white font-bold rounded-lg hover:opacity-90 transition-opacity text-lg`}
                >
                  <Plus size={20} className="inline mr-2" />
                  Создать
                </button>
                <button
                  onClick={() => {
                    setShowNewPlannerForm(false);
                    setNewPlannerName('');
                    setNewPlannerColor('blue');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors text-lg"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewPlannerForm(true)}
            className="mb-8 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-lg flex items-center gap-2"
          >
            <Plus size={24} />
            Новый ежедневник
          </button>
        )}

        {/* Сетка ежедневников */}
        {planners.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-500 mb-2">Ежедневников нет</h3>
            <p className="text-gray-400 mb-6">Создайте первый ежедневник, чтобы начать планировать</p>
            <button
              onClick={() => setShowNewPlannerForm(true)}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Создать ежедневник
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planners.map(planner => {
              const colorInfo = PLANNER_COLORS.find(c => c.id === planner.color);
              return (
                <div
                  key={planner.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 overflow-hidden group cursor-pointer"
                  onClick={() => onOpenPlanner(planner)}
                >
                  {/* Цветная полоса сверху */}
                  <div className={`h-3 ${colorInfo.bg}`}></div>

                  <div className="p-6">
                    {/* Иконка и название */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${colorInfo.light}`}>
                        <BookOpen className={`${colorInfo.text}`} size={24} />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePlanner(planner.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {planner.name}
                    </h3>

                    {/* Дата создания */}
                    <p className="text-sm text-gray-500 mb-4">
                      Создан {new Date(planner.createdAt).toLocaleDateString('ru-RU')}
                    </p>

                    {/* Кнопка открытия */}
                    <button className={`w-full py-2.5 ${colorInfo.bg} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity`}>
                      Открыть →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// === PLANNER VIEW (Сам планер) ===
const PlannerView = ({ planner, plannerId, planners, currentPlannerId, onSelectPlanner, onBack }) => {
  const [view, setView] = useState('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem(`planner_tasks_${plannerId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingCategory, setEditingCategory] = useState('work');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(new Set(CATEGORIES.map(c => c.id)));
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`planner_tasks_${plannerId}`, JSON.stringify(tasks));
    }, 500);
    return () => clearTimeout(timer);
  }, [tasks, plannerId]);

  const formatDate = (date) => {
    if (!date) return "";
    return date.toISOString().split('T')[0];
  };

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addTask = (dateStr, text, category = 'work') => {
    if (!text.trim()) return;
    const dateTasks = tasks[dateStr] || [];
    const newTask = {
      id: generateId(),
      text: text.trim(),
      category: category,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks({ ...tasks, [dateStr]: [...dateTasks, newTask] });
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
    if (dateTasks.length === 0) {
      delete newTasks[dateStr];
    } else {
      newTasks[dateStr] = dateTasks;
    }
    setTasks(newTasks);
  };

  const toggleTaskCompletion = (dateStr, id) => {
    const task = (tasks[dateStr] || []).find(t => t.id === id);
    if (task) {
      updateTask(dateStr, id, { completed: !task.completed });
    }
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditingText(task.text);
    setEditingCategory(task.category || 'work');
  };

  const finishEdit = (dateStr, id) => {
    if (editingText.trim()) {
      updateTask(dateStr, id, { text: editingText.trim(), category: editingCategory });
    }
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

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[4];
  };

  const getFilteredTasks = (dateTasks) => {
    return (dateTasks || []).filter(task => {
      const categoryMatch = selectedCategories.has(task.category || 'work');
      const searchMatch = searchQuery === '' || task.text.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && searchMatch;
    });
  };

  // --- ВИД "ДЕНЬ" ---
  const renderDayView = () => {
    const dateStr = formatDate(currentDate);
    const allDayTasks = tasks[dateStr] || [];
    const dayTasks = getFilteredTasks(allDayTasks);
    const weekday = currentDate.toLocaleDateString('ru-RU', { weekday: 'long' });
    const dayNum = currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

    const emptyLines = Math.max(0, 15 - dayTasks.length);

    return (
      <div className="mx-auto bg-white shadow-2xl border border-gray-300 min-h-[800px] rounded-lg relative overflow-hidden" 
           style={{ maxWidth: '1400px' }}>
        
        <div className="p-8 flex justify-between items-start bg-slate-50 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Категории ({selectedCategories.size})
              </button>
              {showCategoryFilter && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-10 min-w-[200px]">
                  {CATEGORIES.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input 
                        type="checkbox"
                        checked={selectedCategories.has(cat.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedCategories);
                          if (e.target.checked) {
                            newSet.add(cat.id);
                          } else {
                            newSet.delete(cat.id);
                          }
                          setSelectedCategories(newSet);
                        }}
                        className="w-4 h-4"
                      />
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${cat.color} ${cat.textColor}`}>
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
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                🔍 Поиск
              </button>
              {showSearch && (
                <input 
                  type="text"
                  placeholder="Найти задачу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="absolute top-full left-0 mt-2 w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-serif font-bold text-gray-800 capitalize">{weekday}</h2>
            <p className="text-xl text-gray-500 font-serif">{dayNum}</p>
          </div>
        </div>

        <div className="relative min-h-[700px] bg-white">
          <div className="flex flex-col">
            {dayTasks.map((task, i) => {
              const catInfo = getCategoryInfo(task.category);
              const isEditing = editingId === task.id;

              return (
                <div key={task.id} className="group flex items-center h-12 border-b border-blue-100 hover:bg-blue-50 px-20 text-xl text-gray-700 font-medium italic relative">
                  <span className="mr-4 text-gray-300 text-sm">{i + 1}.</span>
                  
                  {isEditing ? (
                    <>
                      <select 
                        value={editingCategory}
                        onChange={(e) => setEditingCategory(e.target.value)}
                        className="mr-2 px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                      <input 
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="flex-grow bg-white border border-blue-400 px-2 py-1 text-base rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        autoFocus
                      />
                      <button 
                        onClick={() => finishEdit(formatDate(currentDate), task.id)}
                        className="ml-2 p-1 text-green-600 hover:bg-green-100 rounded"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="ml-1 p-1 text-gray-400 hover:bg-gray-200 rounded"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <input 
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskCompletion(formatDate(currentDate), task.id)}
                        className="mr-2 w-5 h-5 cursor-pointer"
                      />
                      <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded mr-3 ${catInfo.color} ${catInfo.textColor}`}>
                        {catInfo.label}
                      </span>
                      <span className={`flex-grow ${task.completed ? 'line-through text-gray-400' : ''}`}>
                        {task.text}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-2 ml-4 transition-opacity">
                        <button 
                          onClick={() => startEdit(task)}
                          className="text-blue-400 hover:bg-blue-100 p-1 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteTask(formatDate(currentDate), task.id)}
                          className="text-red-400 hover:bg-red-100 p-1 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            <div className="flex items-center h-12 border-b border-blue-100 px-20 focus-within:bg-amber-50">
              <span className="mr-4 text-gray-300 text-sm">{dayTasks.length + 1}.</span>
              <input 
                className="w-full bg-transparent border-none outline-none text-xl text-black placeholder-gray-300 italic"
                placeholder="Напишите задачу и нажмите Enter..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTask(formatDate(currentDate), e.target.value, 'work');
                    e.target.value = '';
                  }
                }}
              />
            </div>

            {[...Array(emptyLines)].map((_, i) => (
              <div key={i} className="h-12 border-b border-blue-50"></div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- ВИД "НЕДЕЛЯ" ---
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    return (
      <div className="grid grid-cols-7 gap-4 min-h-[500px]">
        {[...Array(7)].map((_, i) => {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          const dStr = formatDate(d);
          const isToday = dStr === formatDate(new Date());
          const allDayTasks = tasks[dStr] || [];
          const dayTasks = getFilteredTasks(allDayTasks);
          
          return (
            <div 
              key={i} 
              onClick={() => { setCurrentDate(d); setView('day'); }}
              className={`border-2 rounded-xl p-4 bg-white hover:border-blue-400 cursor-pointer transition-all shadow-sm ${isToday ? 'border-blue-500' : 'border-transparent'}`}
            >
              <div className={`text-sm font-bold mb-3 pb-2 border-b ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                {d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })}
              </div>
              <div className="space-y-2">
                {dayTasks.slice(0, 5).map((t, idx) => {
                  const catInfo = getCategoryInfo(t.category);
                  return (
                    <div key={idx} className={`text-xs truncate p-1 rounded ${catInfo.color} ${catInfo.textColor} ${t.completed ? 'line-through opacity-60' : ''}`}>
                      • {t.text}
                    </div>
                  );
                })}
                {dayTasks.length > 5 && <div className="text-[10px] text-gray-400 pl-1">...ещё {dayTasks.length - 5}</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // --- ВИД "МЕСЯЦ" ---
  const renderMonthView = () => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayIndex = (start.getDay() || 7) - 1;

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-100 border-b">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-bold text-gray-500 uppercase">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {[...Array(42)].map((_, i) => {
            const dayNum = i - firstDayIndex + 1;
            const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
            const dStr = formatDate(dayDate);
            const allDayTasks = tasks[dStr] || [];
            const dayTasks = getFilteredTasks(allDayTasks);

            return (
              <div 
                key={i}
                onClick={() => isValidDay && (setCurrentDate(dayDate), setView('day'))}
                className={`h-32 border-b border-r p-2 transition-colors ${isValidDay ? 'cursor-pointer hover:bg-blue-50' : 'bg-gray-50'}`}
              >
                {isValidDay && (
                  <>
                    <span className={`inline-block w-7 h-7 text-center leading-7 rounded-full text-sm font-bold ${dStr === formatDate(new Date()) ? 'bg-blue-500 text-white' : 'text-gray-700'}`}>
                      {dayNum}
                    </span>
                    <div className="mt-2 space-y-1">
                      {dayTasks.slice(0, 3).map((t, idx) => {
                        const catInfo = getCategoryInfo(t.category);
                        return (
                          <div key={idx} className={`text-[10px] px-1 rounded truncate ${catInfo.color} ${catInfo.textColor} ${t.completed ? 'line-through opacity-60' : ''}`}>
                            {t.text}
                          </div>
                        );
                      })}
                      {dayTasks.length > 3 && <div className="text-[10px] text-gray-400 pl-1">+{dayTasks.length - 3}</div>}
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
    <div className="min-h-screen bg-[#f8fafc] p-6 text-gray-900 font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Верхняя панель с возвратом и выбором ежедневника */}
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
          >
            <ArrowLeft size={20} />
            Вернуться к ежедневникам
          </button>
          
          {/* Выпадающий список для выбора ежедневника */}
          <select 
            value={currentPlannerId || ''}
            onChange={(e) => onSelectPlanner(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 text-base cursor-pointer"
          >
            <option value="" disabled>Выберите ежедневник</option>
            {planners.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        
        {/* Панель управления */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="inline-flex bg-white p-1 rounded-xl shadow-md border border-gray-100">
            {[
              { id: 'day', label: 'День' },
              { id: 'week', label: 'Неделя' },
              { id: 'month', label: 'Месяц' }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setView(btn.id)}
                className={`px-8 py-2.5 rounded-lg font-medium transition-all ${view === btn.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-blue-600'}`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 bg-white px-6 py-3 rounded-xl shadow-md border border-gray-100">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft size={28} className="text-blue-600" />
            </button>
            <span className="text-xl font-bold min-w-[200px] text-center text-gray-700">
              {view === 'day' 
                ? currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
                : currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
              }
            </span>
            <button onClick={() => navigate(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronRight size={28} className="text-blue-600" />
            </button>
          </div>
        </div>

        {/* Основной контент */}
        <div className="transition-all duration-300">
          {view === 'day' && renderDayView()}
          {view === 'week' && renderWeekView()}
          {view === 'month' && renderMonthView()}
        </div>
      </div>
    </div>
  );
};

export default PlannerApp;