import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Check, Plus, BookOpen, Pencil, X, ChevronDown, Calendar, Mic, ArrowRight, BarChart3, Target, Lightbulb, FileText, Bold, Italic, Underline, List, ListOrdered, ListChecks, Heading, Type, ArrowLeft, Undo2, Redo2, Clock, Star, Repeat, Search, ChevronsLeft, ChevronsRight, LogOut, Maximize2, History } from 'lucide-react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, setDoc, getDocs, getDoc } from 'firebase/firestore';

const PLANNER_COLORS = [
  { id: 'blue',   label: 'Синий',      dot: '#3b82f6' },
  { id: 'green',  label: 'Зелёный',    dot: '#22c55e' },
  { id: 'red',    label: 'Красный',    dot: '#ef4444' },
  { id: 'purple', label: 'Фиолетовый', dot: '#a855f7' },
  { id: 'yellow', label: 'Жёлтый',     dot: '#facc15' },
  { id: 'pink',   label: 'Розовый',    dot: '#ec4899' },
];

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// 0=Mon..6=Sun
const getDayOfWeek = (date) => (date.getDay() + 6) % 7;

// === TAG INPUT ===
const TagInput = ({ tags = [], onChange, placeholder = 'Добавить тег...' }) => {
  const [input, setInput] = useState('');

  const addTag = (val) => {
    const t = val.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  };

  const removeTag = (tag) => onChange(tags.filter(t => t !== tag));

  return (
    <div className="flex flex-wrap gap-1 items-center min-h-[28px] px-2 py-1 border border-[#DDEAE4] rounded-md bg-white focus-within:border-[#0B5D46] transition-colors">
      {tags.map(tag => (
        <span key={tag} className="flex items-center gap-1 px-1.5 py-0.5 bg-[#F1F8F4] text-[#0B5D46] text-xs rounded">
          #{tag}
          <button type="button" onClick={() => removeTag(tag)} className="text-[#6B8078] hover:text-[#0B5D46] leading-none">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ',') && input.trim()) { e.preventDefault(); addTag(input); }
          if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]);
        }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="text-xs outline-none bg-transparent min-w-[80px] text-[#0B5D46] placeholder-[#9DB8AC]"
      />
    </div>
  );
};

// === LOGIN SCREEN ===
const LoginScreen = () => {
  const handleLogin = () => signInWithPopup(auth, googleProvider).catch(err => console.error('Login error:', err));

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #E4F0EA, #F4F9F6)' }}>
      <div className="bg-surface rounded-[24px] shadow-card p-10 max-w-sm w-full text-center">
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#0B5D46" aria-hidden="true">
            <path d="M5 19c0-8 4-14 15-14 0 10-5 15-12 15-1 0-2-.3-3-1z" />
            <path d="M5 19c2-5 5-8 9-10" stroke="#E4F0EA" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">DayBook</h1>
        </div>
        <p className="text-sm text-ink-3 mb-8">Ваш личный ежедневник</p>
        <button
          onClick={handleLogin}
          className="w-full min-h-[48px] px-5 bg-primary text-white text-sm font-bold rounded-[14px] hover:bg-banner1 transition-colors flex items-center justify-center gap-2.5"
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

// === NOTE EDITOR (rich text) ===
const NoteEditor = ({ note, onChangeTitle, onChangeContent, onBack, onDelete }) => {
  const editorRef = useRef(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Загружаем содержимое при открытии / смене заметки
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = note.content || '';
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => { if (editorRef.current) onChangeContent(editorRef.current.innerHTML); };

  const exec = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current && editorRef.current.focus();
    save();
  };

  const insertChecklistItem = () => {
    editorRef.current && editorRef.current.focus();
    document.execCommand('insertHTML', false,
      '<div class="cl-item"><input type="checkbox" contenteditable="false"><span>&nbsp;</span></div><p><br></p>');
    save();
  };

  // Клик по чекбоксу внутри заметки — переключаем состояние и сохраняем в HTML
  const handleClick = (e) => {
    if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
      if (e.target.checked) e.target.setAttribute('checked', 'checked');
      else e.target.removeAttribute('checked');
      save();
    }
  };

  const ToolbarBtn = ({ onClick, title, children, active }) => (
    <button type="button" title={title}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors text-[#4C645B] hover:bg-[#F1F8F4] hover:text-[#0B5D46] ${active ? 'bg-[#F1F8F4] text-[#0B5D46]' : ''}`}>
      {children}
    </button>
  );

  return (
    <div className="bg-white rounded-3xl border border-[#DDEAE4] shadow-[0_4px_24px_rgba(16,71,54,0.06)] overflow-hidden">
      <style>{`
        .note-editor:focus { outline: none; }
        .note-editor h2 { font-size: 1.5rem; font-weight: 600; margin: 0.6em 0 0.3em; color: #0B5D46; }
        .note-editor ul { list-style: disc; padding-left: 1.6em; margin: 0.3em 0; }
        .note-editor ol { list-style: decimal; padding-left: 1.6em; margin: 0.3em 0; }
        .note-editor p { margin: 0.2em 0; }
        .note-editor .cl-item { display: flex; align-items: flex-start; gap: 0.5em; margin: 0.15em 0; }
        .note-editor .cl-item input { margin-top: 0.35em; width: 15px; height: 15px; accent-color: #12805F; cursor: pointer; flex-shrink: 0; }
        .note-editor .cl-item input:checked + span { text-decoration: line-through; color: #9DB8AC; }
        .note-editor:empty:before { content: attr(data-placeholder); color: #9DB8AC; }
      `}</style>

      {/* Шапка */}
      <div className="flex items-center gap-2 px-3 sm:px-5 py-3 border-b border-[#DDEAE4]">
        <button onClick={onBack} title="К списку заметок"
          className="p-1.5 text-[#6B8078] hover:text-[#0B5D46] hover:bg-[#F1F8F4] rounded-full transition-colors shrink-0">
          <ArrowLeft size={18} />
        </button>
        <input value={note.title}
          onChange={e => onChangeTitle(e.target.value)}
          placeholder="Название заметки"
          className="flex-grow bg-transparent text-lg font-semibold text-[#0B5D46] placeholder-[#9DB8AC] focus:outline-none min-w-0" />
        {confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onDelete} className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition-colors">Удалить</button>
            <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 text-xs text-[#6B8078] hover:bg-[#F1F8F4] rounded transition-colors">Отмена</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} title="Удалить заметку"
            className="p-1.5 text-[#9DB8AC] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Панель инструментов */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 sm:px-4 py-2 border-b border-[#DDEAE4] bg-[#f9fbf9]">
        <ToolbarBtn onClick={() => exec('undo')} title="Отменить (Ctrl+Z)"><Undo2 size={16} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('redo')} title="Вернуть (Ctrl+Y)"><Redo2 size={16} /></ToolbarBtn>
        <div className="w-px h-5 bg-[#DDEAE4] mx-1" />
        <ToolbarBtn onClick={() => exec('formatBlock', 'h2')} title="Заголовок"><Heading size={16} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'p')} title="Обычный текст"><Type size={16} /></ToolbarBtn>
        <div className="w-px h-5 bg-[#DDEAE4] mx-1" />
        <ToolbarBtn onClick={() => exec('bold')} title="Жирный"><Bold size={16} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('italic')} title="Курсив"><Italic size={16} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('underline')} title="Подчёркнутый"><Underline size={16} /></ToolbarBtn>
        <div className="w-px h-5 bg-[#DDEAE4] mx-1" />
        <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Маркированный список"><List size={16} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('insertOrderedList')} title="Нумерованный список"><ListOrdered size={16} /></ToolbarBtn>
        <ToolbarBtn onClick={insertChecklistItem} title="Чек-лист"><ListChecks size={16} /></ToolbarBtn>
        <div className="w-px h-5 bg-[#DDEAE4] mx-1" />
        <select onMouseDown={e => e.stopPropagation()} defaultValue=""
          onChange={e => { exec('fontSize', e.target.value); e.target.value = ''; }}
          className="text-xs text-[#4C645B] bg-transparent border border-[#DDEAE4] rounded-md px-1.5 py-1 focus:outline-none cursor-pointer">
          <option value="" disabled>Размер</option>
          <option value="1">Мелкий</option>
          <option value="3">Обычный</option>
          <option value="5">Крупный</option>
          <option value="7">Очень крупный</option>
        </select>
      </div>

      {/* Рабочая область */}
      <div
        ref={editorRef}
        className="note-editor px-4 sm:px-8 py-5 min-h-[50vh] text-sm text-[#14261F] leading-relaxed focus:outline-none"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Начните писать..."
        onInput={save}
        onBlur={save}
        onClick={handleClick}
      />
    </div>
  );
};

// === PLANNER APP ===
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
      if (!u) { setPlanners([]); setView('home'); setCurrentPlannerId(null); }
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
    await addDoc(collection(db, 'users', user.uid, 'planners'), {
      name: newPlannerName.trim(), color: newPlannerColor,
      createdAt: new Date().toISOString(), recurringTasks: [],
    });
    setNewPlannerName(''); setNewPlannerColor('blue'); setShowNewPlannerForm(false);
  };

  const updatePlanner = async (id, name, color) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'planners', id), { name, color });
    setEditingPlanner(null);
  };

  const updatePlannerRecurring = async (id, recurringTasks) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'planners', id), { recurringTasks });
  };

  const deletePlanner = async (id) => {
    if (!user) return;
    if (window.confirm('Вы уверены? Все задачи будут удалены.')) {
      const taskDocs = await getDocs(collection(db, 'users', user.uid, 'planners', id, 'tasks'));
      await Promise.all(taskDocs.docs.map(d => deleteDoc(d.ref)));
      await deleteDoc(doc(db, 'users', user.uid, 'planners', id));
      if (currentPlannerId === id) { setCurrentPlannerId(null); setView('home'); }
    }
  };

  const handleSignOut = () => signOut(auth).catch(err => console.error('Sign out error:', err));

  if (authLoading) return (
    <div className="min-h-screen bg-[#F1F8F4] flex items-center justify-center">
      <div className="text-[#6B8078] text-sm">Загрузка...</div>
    </div>
  );

  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-[#F1F8F4]">
      {view === 'home' ? (
        <HomeView
          planners={planners}
          onOpenPlanner={(p) => { setCurrentPlannerId(p.id); setView('planner'); }}
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
          planner={planners.find(p => p.id === currentPlannerId)}
          plannerId={currentPlannerId}
          planners={planners}
          currentPlannerId={currentPlannerId}
          onSelectPlanner={setCurrentPlannerId}
          onBack={() => { setView('home'); setCurrentPlannerId(null); }}
          onNewPlanner={() => { setView('home'); setCurrentPlannerId(null); setShowNewPlannerForm(true); }}
          onUpdateRecurring={(rt) => updatePlannerRecurring(currentPlannerId, rt)}
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
    setEditName(planner.name); setEditColor(planner.color); setEditingPlanner(planner);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10 sm:py-16" style={{ background: 'linear-gradient(135deg, #E4F0EA, #F4F9F6)' }}>

      {(editingPlanner || showNewPlannerForm) && (() => {
        const isEdit = !!editingPlanner;
        const name = isEdit ? editName : newPlannerName;
        const setName = isEdit ? setEditName : setNewPlannerName;
        const color = isEdit ? editColor : newPlannerColor;
        const setColor = isEdit ? setEditColor : setNewPlannerColor;
        const submit = () => isEdit ? onUpdatePlanner(editingPlanner.id, editName, editColor) : onCreatePlanner();
        const close = () => isEdit ? setEditingPlanner(null) : (setShowNewPlannerForm(false), setNewPlannerName(''), setNewPlannerColor('blue'));
        return (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={close}>
            <div className="bg-surface rounded-[22px] border border-line p-6 w-full max-w-md shadow-cal" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-extrabold text-ink mb-5">{isEdit ? 'Редактировать ежедневник' : 'Новый ежедневник'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-ink-3 mb-1.5 uppercase tracking-wider">Название</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Например: Личный, Работа, Учёба"
                    className="w-full px-3.5 min-h-[44px] border border-line rounded-[14px] text-sm text-ink placeholder-ink-3 focus:outline-none focus:border-primary bg-surface-soft"
                    autoFocus onKeyDown={e => e.key === 'Enter' && submit()} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-3 mb-2 uppercase tracking-wider">Цвет</label>
                  <div className="flex gap-2.5">
                    {PLANNER_COLORS.map(c => (
                      <button key={c.id} onClick={() => setColor(c.id)} style={{ backgroundColor: c.dot }}
                        className={`w-7 h-7 rounded-full transition-transform ${color === c.id ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={submit}
                    className="flex-1 min-h-[44px] px-4 bg-primary text-white text-sm font-bold rounded-[14px] hover:bg-banner1 transition-colors flex items-center justify-center gap-1.5">
                    {isEdit ? <Check size={15} /> : <Plus size={15} />} {isEdit ? 'Сохранить' : 'Создать'}
                  </button>
                  <button onClick={close}
                    className="flex-1 min-h-[44px] px-4 bg-surface-soft text-ink text-sm font-semibold rounded-[14px] hover:bg-nav-active transition-colors">
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Логотип */}
      <div className="flex items-center gap-2.5 font-extrabold text-2xl text-primary mb-6">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#0B5D46" aria-hidden="true">
          <path d="M5 19c0-8 4-14 15-14 0 10-5 15-12 15-1 0-2-.3-3-1z" />
          <path d="M5 19c2-5 5-8 9-10" stroke="#E4F0EA" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
        DayBook
      </div>

      <h1 className="text-3xl sm:text-[40px] font-extrabold text-ink text-center tracking-[-0.5px] mb-3">Какой ежедневник откроем?</h1>
      <p className="text-ink-3 text-center max-w-2xl mb-9 text-[15px] sm:text-base">Можно вести отдельно: для дома, работы и учёбы. Переключаться между ними легко в любой момент.</p>

      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {planners.map(planner => {
          const colorInfo = PLANNER_COLORS.find(c => c.id === planner.color);
          const dot = colorInfo?.dot || '#12805F';
          return (
            <div key={planner.id} onClick={() => onOpenPlanner(planner)}
              className="group relative bg-surface rounded-[20px] border-2 border-transparent hover:border-primary shadow-card p-5 cursor-pointer transition-all">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-4" style={{ backgroundColor: dot + '22' }}>
                <BookOpen size={22} style={{ color: dot }} />
              </div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-extrabold text-ink leading-snug">{planner.name}</h3>
                <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={e => openEdit(e, planner)} aria-label="Редактировать"
                    className="p-1.5 text-ink-3 hover:text-primary hover:bg-surface-soft rounded-lg transition-colors"><Pencil size={14} /></button>
                  <button onClick={e => { e.stopPropagation(); onDeletePlanner(planner.id); }} aria-label="Удалить"
                    className="p-1.5 text-ink-3 hover:text-danger hover:bg-danger-bg rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm text-ink-3 mt-1">Создан {new Date(planner.createdAt).toLocaleDateString('ru-RU')}</p>
            </div>
          );
        })}
      </div>

      {/* Создать ежедневник */}
      <button onClick={() => setShowNewPlannerForm(true)}
        className="w-full max-w-5xl mt-4 flex items-center justify-center gap-3 min-h-[88px] rounded-[20px] border-2 border-dashed border-[#BBD5C9] text-primary hover:bg-surface/50 transition-colors">
        <span className="w-12 h-12 rounded-[14px] bg-nav-active flex items-center justify-center"><Plus size={24} className="text-accent" /></span>
        <span className="text-lg font-bold">Создать ежедневник</span>
      </button>

      <div className="mt-8 text-sm text-ink-3">
        Вы вошли как {user.displayName || user.email} · <button onClick={onSignOut} className="underline hover:text-ink">Выйти</button>
      </div>
    </div>
  );
};

// === PLANNER VIEW ===
const PlannerView = ({ planner, plannerId, planners, currentPlannerId, onSelectPlanner, onBack, onNewPlanner, onUpdateRecurring, user, onSignOut }) => {
  const [view, setView] = useState('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayStage, setDayStage] = useState('day'); // 'day' | 'summary' | 'weekend' — стадия в дневном листании
  const [tasks, setTasks] = useState({});
  const [dayNotes, setDayNotes] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingTags, setEditingTags] = useState([]);
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { id, type: 'delete' | 'move' }
  const [detailTask, setDetailTask] = useState(null); // { dateStr, id }
  const [activityLog, setActivityLog] = useState([]); // [{ id, ts, label, undo }]
  const [showLog, setShowLog] = useState(false);
  const pushLog = (label, undo) => {
    setActivityLog(prev => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: Date.now(), label, undo }, ...prev].slice(0, 30));
  };
  const undoLogEntry = (entryId) => {
    setActivityLog(prev => {
      const entry = prev.find(e => e.id === entryId);
      if (entry && entry.undo) { try { entry.undo(); } catch (err) { console.error(err); } }
      return prev.filter(e => e.id !== entryId);
    });
  };
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [extraLines, setExtraLines] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const newTaskInputRef = useRef(null);
  const [showPlannerDropdown, setShowPlannerDropdown] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [calView, setCalView] = useState('day'); // последний выбранный вид календаря
  const [sidebarCompact, setSidebarCompact] = useState(() => {
    try { return localStorage.getItem('db_sidebar_compact') === '1'; } catch (e) { return false; }
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
  const toggleSidebar = () => setSidebarCompact(v => {
    const nv = !v;
    try { localStorage.setItem('db_sidebar_compact', nv ? '1' : '0'); } catch (e) {}
    return nv;
  });
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [importantTasks, setImportantTasks] = useState([]);
  const importantDebounce = useRef(null);
  const [monthlyReview, setMonthlyReview] = useState({ goals: [], ideas: [] });
  const reviewDebounce = useRef(null);
  const [notes, setNotes] = useState([]);
  const [openNoteId, setOpenNoteId] = useState(null);
  const notesDebounce = useRef({});

  const debounceTimers = useRef({});
  const noteDebounceTimers = useRef({});

  // Load tasks
  useEffect(() => {
    if (!user || !plannerId) return;
    setTasks({});
    setDayNotes({});
    getDocs(collection(db, 'users', user.uid, 'planners', plannerId, 'tasks')).then(snapshot => {
      const loadedTasks = {};
      const loadedNotes = {};
      snapshot.docs.forEach(d => {
        loadedTasks[d.id] = d.data().tasks || [];
        loadedNotes[d.id] = d.data().dayNotes || '';
      });
      setTasks(loadedTasks);
      setDayNotes(loadedNotes);
    }).catch(err => console.error('Error loading tasks:', err));
  }, [user, plannerId]);

  // Load important tasks
  useEffect(() => {
    if (!user || !plannerId) return;
    setImportantTasks([]);
    getDocs(collection(db, 'users', user.uid, 'planners', plannerId, 'important')).then(snapshot => {
      const d = snapshot.docs.find(d => d.id === 'list');
      if (d) setImportantTasks(d.data().tasks || []);
    }).catch(() => {});
    return () => { if (importantDebounce.current) clearTimeout(importantDebounce.current); };
  }, [user, plannerId]);

  // Load notes
  useEffect(() => {
    if (!user || !plannerId) return;
    setNotes([]);
    setOpenNoteId(null);
    getDocs(collection(db, 'users', user.uid, 'planners', plannerId, 'notes')).then(snapshot => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      setNotes(list);
    }).catch(err => console.error('Error loading notes:', err));
  }, [user, plannerId]);

  const createNote = () => {
    const id = generateId();
    const now = new Date().toISOString();
    const note = { title: '', content: '', createdAt: now, updatedAt: now };
    setNotes(prev => [{ id, ...note }, ...prev]);
    setOpenNoteId(id);
    if (user && plannerId) setDoc(doc(db, 'users', user.uid, 'planners', plannerId, 'notes', id), note).catch(err => console.error('Error creating note:', err));
  };

  const updateNote = (id, fields) => {
    const now = new Date().toISOString();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...fields, updatedAt: now } : n));
    if (notesDebounce.current[id]) clearTimeout(notesDebounce.current[id]);
    notesDebounce.current[id] = setTimeout(() => {
      if (!user || !plannerId) return;
      setDoc(doc(db, 'users', user.uid, 'planners', plannerId, 'notes', id), { ...fields, updatedAt: now }, { merge: true })
        .catch(err => console.error('Error saving note:', err));
    }, 500);
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setOpenNoteId(null);
    if (user && plannerId) deleteDoc(doc(db, 'users', user.uid, 'planners', plannerId, 'notes', id)).catch(() => {});
  };


  const saveImportantTasks = (updated) => {
    setImportantTasks(updated);
    if (importantDebounce.current) clearTimeout(importantDebounce.current);
    importantDebounce.current = setTimeout(() => {
      if (!user || !plannerId) return;
      const ref = doc(db, 'users', user.uid, 'planners', plannerId, 'important', 'list');
      setDoc(ref, { tasks: updated }).catch(err => console.error('Error saving important tasks:', err));
    }, 500);
  };

  // Auto-populate recurring tasks when date or planner changes
  useEffect(() => {
    if (!plannerId || !planner) return;
    const recurringTasks = planner.recurringTasks || [];
    if (!recurringTasks.length) return;
    const dateStr = formatDate(currentDate);
    const dow = getDayOfWeek(currentDate);
    const dayOfMonth = currentDate.getDate();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const isLastDay = dayOfMonth === daysInMonth;
    const applicable = recurringTasks.filter(rt => {
      if (rt.mode === 'month') {
        const md = rt.monthDays || [];
        // прямое совпадение числа ИЛИ выбранное число больше длины месяца → последний день
        return md.includes(dayOfMonth) || (isLastDay && md.some(d => d > daysInMonth));
      }
      return (rt.days || []).includes(dow);
    });
    if (!applicable.length) return;

    setTasks(prev => {
      const existing = prev[dateStr] || [];
      const existingRecurringIds = new Set(existing.map(t => t.recurringId).filter(Boolean));
      const toAdd = applicable.filter(rt => !existingRecurringIds.has(rt.id));
      if (!toAdd.length) return prev;
      const newTasks = toAdd.map(rt => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: rt.text,
        tags: rt.tags || [],
        notes: '',
        completed: false,
        createdAt: new Date().toISOString(),
        recurringId: rt.id,
      }));
      return { ...prev, [dateStr]: [...existing, ...newTasks] };
    });
  }, [currentDate, plannerId, planner]);

  // Save tasks to Firestore
  useEffect(() => {
    if (!user || !plannerId) return;
    Object.keys(tasks).forEach(dateStr => {
      if (debounceTimers.current[dateStr]) clearTimeout(debounceTimers.current[dateStr]);
      debounceTimers.current[dateStr] = setTimeout(() => {
        const taskDocRef = doc(db, 'users', user.uid, 'planners', plannerId, 'tasks', dateStr);
        const dateTasks = tasks[dateStr];
        const notes = dayNotes[dateStr] || '';
        if (dateTasks && dateTasks.length > 0) {
          setDoc(taskDocRef, { tasks: dateTasks, dayNotes: notes }).catch(err => console.error('Error saving tasks:', err));
        } else if (!notes) {
          deleteDoc(taskDocRef).catch(() => {});
        } else {
          setDoc(taskDocRef, { tasks: [], dayNotes: notes }).catch(err => console.error('Error saving notes:', err));
        }
      }, 500);
    });
  }, [tasks, dayNotes, user, plannerId]);

  // Save day notes
  useEffect(() => {
    if (!user || !plannerId) return;
    Object.keys(dayNotes).forEach(dateStr => {
      if (noteDebounceTimers.current[dateStr]) clearTimeout(noteDebounceTimers.current[dateStr]);
      noteDebounceTimers.current[dateStr] = setTimeout(() => {
        const taskDocRef = doc(db, 'users', user.uid, 'planners', plannerId, 'tasks', dateStr);
        const dateTasks = tasks[dateStr] || [];
        const notes = dayNotes[dateStr] || '';
        if (dateTasks.length > 0 || notes) {
          setDoc(taskDocRef, { tasks: dateTasks, dayNotes: notes }).catch(err => console.error('Error saving day notes:', err));
        }
      }, 500);
    });
  }, [dayNotes, tasks, user, plannerId]);

  const formatDate = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addTask = (dateStr, text) => {
    if (!text.trim()) return;
    const newTask = { id: generateId(), text: text.trim(), tags: [], notes: '', completed: false, createdAt: new Date().toISOString() };
    setTasks({ ...tasks, [dateStr]: [...(tasks[dateStr] || []), newTask] });
    pushLog(`Добавлена задача: «${newTask.text}»`, () => {
      setTasks(cur => ({ ...cur, [dateStr]: (cur[dateStr] || []).filter(t => t.id !== newTask.id) }));
    });
  };

  const updateTask = (dateStr, id, updates) => {
    const dateTasks = [...(tasks[dateStr] || [])];
    const index = dateTasks.findIndex(t => t.id === id);
    if (index !== -1) {
      const prevTask = dateTasks[index];
      dateTasks[index] = { ...prevTask, ...updates };
      setTasks({ ...tasks, [dateStr]: dateTasks });
      if ('completed' in updates && updates.completed !== prevTask.completed) {
        const was = prevTask.completed;
        pushLog(`${updates.completed ? 'Выполнена' : 'Снята отметка'}: «${prevTask.text}»`, () => {
          setTasks(cur => ({ ...cur, [dateStr]: (cur[dateStr] || []).map(t => t.id === id ? { ...t, completed: was } : t) }));
        });
      }
    }
  };

  const deleteTask = (dateStr, id) => {
    const removed = (tasks[dateStr] || []).find(t => t.id === id);
    const removedIndex = (tasks[dateStr] || []).findIndex(t => t.id === id);
    const dateTasks = (tasks[dateStr] || []).filter(t => t.id !== id);
    setTasks({ ...tasks, [dateStr]: dateTasks });
    if (expandedNoteId === id) setExpandedNoteId(null);
    if (removed) {
      pushLog(`Удалена задача: «${removed.text}»`, () => {
        setTasks(cur => {
          const arr = [...(cur[dateStr] || [])];
          const at = Math.min(removedIndex < 0 ? arr.length : removedIndex, arr.length);
          arr.splice(at, 0, removed);
          return { ...cur, [dateStr]: arr };
        });
      });
    }
  };

  const startEdit = (task) => { setEditingId(task.id); setEditingText(task.text); setEditingTags(task.tags || []); };

  const finishEdit = (dateStr, id) => {
    if (editingText.trim()) updateTask(dateStr, id, { text: editingText.trim(), tags: editingTags });
    setEditingId(null); setEditingText('');
  };

  // Понедельник недели для заданной даты
  const mondayOf = (date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - getDayOfWeek(d));
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Слот дневного листания: 0-4 = Пн-Пт, 5 = выходные (Сб-Вс), 6 = итоги недели
  const getDaySlot = () => {
    if (dayStage === 'weekend') return 5;
    if (dayStage === 'summary') return 6;
    const dow = getDayOfWeek(currentDate);
    return dow >= 5 ? 5 : dow;
  };

  const applyDaySlot = (weekStart, slot) => {
    if (slot <= 4) {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + slot);
      setCurrentDate(d); setDayStage('day');
    } else if (slot === 5) {
      const sat = new Date(weekStart); sat.setDate(weekStart.getDate() + 5);
      setCurrentDate(sat); setDayStage('weekend');
    } else {
      setCurrentDate(new Date(weekStart)); setDayStage('summary');
    }
  };

  const navigate = (amount) => {
    if (view === 'day') {
      const weekStart = mondayOf(currentDate);
      let slot = getDaySlot() + amount;
      const newWeekStart = new Date(weekStart);
      while (slot > 6) { slot -= 7; newWeekStart.setDate(newWeekStart.getDate() + 7); }
      while (slot < 0) { slot += 7; newWeekStart.setDate(newWeekStart.getDate() - 7); }
      applyDaySlot(newWeekStart, slot);
      setExtraLines(0);
      return;
    }
    const newDate = new Date(currentDate);
    if (view === 'week') newDate.setDate(newDate.getDate() + amount * 7);
    if (view === 'weekend') newDate.setDate(newDate.getDate() + amount * 7);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + amount);
    if (view === 'summary') newDate.setMonth(newDate.getMonth() + amount);
    setCurrentDate(newDate);
    setExtraLines(0);
  };

  // Горячие клавиши ← / → для переключения дней
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  useEffect(() => {
    const onKey = (e) => {
      if (!['day', 'week', 'weekend', 'month'].includes(view)) return;
      if (showCalendar || showRecurringModal) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); navigateRef.current(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); navigateRef.current(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, showCalendar, showRecurringModal]);

  // Collect all tags from all loaded tasks
  const allTags = [...new Set(Object.values(tasks).flat().flatMap(t => t.tags || []))];

  const getFilteredTasks = (dateTasks) => (dateTasks || []).filter(task => {
    const tagMatch = selectedTags.size === 0 || (task.tags || []).some(t => selectedTags.has(t));
    const searchMatch = searchQuery === '' || task.text.toLowerCase().includes(searchQuery.toLowerCase());
    return tagMatch && searchMatch;
  });

  const currentColorInfo = PLANNER_COLORS.find(c => c.id === planner?.color);

  // Ключ месяца ГГГГ-ММ для обзора
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  // Сегодняшний ключ даты (для определения просрочки) — на базе того же formatDate
  const todayStr = formatDate(new Date());

  // Загрузка обзора месяца (цели/идеи)
  useEffect(() => {
    if (!user || !plannerId) return;
    const ref = doc(db, 'users', user.uid, 'planners', plannerId, 'reviews', monthKey);
    getDoc(ref).then(snap => {
      if (snap.exists()) setMonthlyReview({ goals: snap.data().goals || [], ideas: snap.data().ideas || [] });
      else setMonthlyReview({ goals: [], ideas: [] });
    }).catch(() => setMonthlyReview({ goals: [], ideas: [] }));
  }, [user, plannerId, monthKey]);

  const saveReview = (updated) => {
    setMonthlyReview(updated);
    if (reviewDebounce.current) clearTimeout(reviewDebounce.current);
    reviewDebounce.current = setTimeout(() => {
      if (!user || !plannerId) return;
      const ref = doc(db, 'users', user.uid, 'planners', plannerId, 'reviews', monthKey);
      setDoc(ref, updated).catch(err => console.error('Error saving review:', err));
    }, 500);
  };

  // Перенос задачи с одной даты на другую
  const moveTaskToDate = (fromDateStr, task, toDateStr) => {
    if (!toDateStr || toDateStr === fromDateStr) return;
    setTasks(prev => ({
      ...prev,
      [fromDateStr]: (prev[fromDateStr] || []).filter(t => t.id !== task.id),
      [toDateStr]: [...(prev[toDateStr] || []), { ...task }],
    }));
    const dLabel = new Date(toDateStr + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    pushLog(`Перенесена на ${dLabel}: «${task.text}»`, () => {
      setTasks(cur => ({ ...cur, [toDateStr]: (cur[toDateStr] || []).filter(t => t.id !== task.id), [fromDateStr]: [...(cur[fromDateStr] || []), { ...task }] }));
    });
  };

  // Перенос задачи в «Важные задачи»
  const moveTaskToImportant = (fromDateStr, task) => {
    const newImp = {
      id: generateId(), text: task.text, tags: task.tags || [], notes: task.notes || '',
      deadline: '', link: '', completed: false, createdAt: new Date().toISOString(),
    };
    saveImportantTasks([...importantTasks, newImp]);
    setTasks(prev => ({ ...prev, [fromDateStr]: (prev[fromDateStr] || []).filter(t => t.id !== task.id) }));
    pushLog(`Перенесена в «Важные»: «${task.text}»`, () => {
      saveImportantTasks(importantTasks.filter(t => t.id !== newImp.id));
      setTasks(cur => ({ ...cur, [fromDateStr]: [...(cur[fromDateStr] || []), { ...task }] }));
    });
  };

  // Создать «Важную задачу» из текста (для целей)
  const addTextToImportant = (text) => {
    if (!text.trim()) return;
    saveImportantTasks([...importantTasks, {
      id: generateId(), text: text.trim(), tags: [], notes: '',
      deadline: '', link: '', completed: false, createdAt: new Date().toISOString(),
    }]);
  };

  // Добавить задачу на конкретную дату из текста (для целей)
  const addTextToDate = (text, dateStr) => {
    if (!text.trim() || !dateStr) return;
    const newTask = { id: generateId(), text: text.trim(), tags: [], notes: '', completed: false, createdAt: new Date().toISOString() };
    setTasks(prev => ({ ...prev, [dateStr]: [...(prev[dateStr] || []), newTask] }));
  };

  const moveToNextDay = (task, dateStr) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    const nextDate = d.toISOString().slice(0, 10);
    if (nextDate === dateStr) return;
    setTasks(prev => ({
      ...prev,
      [dateStr]: (prev[dateStr] || []).filter(t => t.id !== task.id),
      [nextDate]: [...(prev[nextDate] || []), { ...task }],
    }));
    pushLog(`Перенесена на следующий день: «${task.text}»`, () => {
      setTasks(cur => ({ ...cur, [nextDate]: (cur[nextDate] || []).filter(t => t.id !== task.id), [dateStr]: [...(cur[dateStr] || []), { ...task }] }));
    });
  };

  const openInCalendar = (task, dateStr) => {
    const d = dateStr.replace(/-/g, '');
    const next = dateStr.replace(/-/g, '').slice(0, 6) + String(Number(dateStr.slice(8)) + 1).padStart(2, '0');
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: task.text,
      dates: `${d}/${next}`,
      details: task.notes || '',
    });
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  };

  const startVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      if (newTaskInputRef.current) newTaskInputRef.current.value = text;
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // --- ПОВТОРЯЮЩИЕСЯ ЗАДАЧИ МОДАЛ ---
  const RecurringModal = () => {
    const [newText, setNewText] = useState('');
    const [newTags, setNewTags] = useState([]);
    const [newDays, setNewDays] = useState([]);
    const [newMonthDays, setNewMonthDays] = useState([]);
    const [newMode, setNewMode] = useState('week');
    const recurringTasks = planner?.recurringTasks || [];

    const canAdd = newText.trim() && (newMode === 'week' ? newDays.length : newMonthDays.length);

    const addRecurring = () => {
      if (!canAdd) return;
      const base = { id: generateId(), text: newText.trim(), tags: newTags, mode: newMode };
      const task = newMode === 'week'
        ? { ...base, days: newDays }
        : { ...base, monthDays: [...newMonthDays].sort((a, b) => a - b) };
      onUpdateRecurring([...recurringTasks, task]);
      setNewText(''); setNewTags([]); setNewDays([]); setNewMonthDays([]);
    };

    const deleteRecurring = (id) => onUpdateRecurring(recurringTasks.filter(rt => rt.id !== id));

    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg border border-[#DDEAE4] p-6 w-full max-w-lg mx-4 shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-[#0B5D46]">Повторяющиеся задачи</h2>
            <button onClick={() => setShowRecurringModal(false)} className="p-1.5 text-[#6B8078] hover:text-[#0B5D46] hover:bg-[#F1F8F4] rounded">
              <X size={16} />
            </button>
          </div>

          {/* Список */}
          {recurringTasks.length > 0 && (
            <div className="mb-5 space-y-2">
              {recurringTasks.map(rt => (
                <div key={rt.id} className="flex items-start gap-3 p-3 bg-[#F1F8F4] rounded-lg">
                  <div className="flex-grow">
                    <p className="text-sm text-[#0B5D46] font-medium mb-1">{rt.text}</p>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {(rt.tags || []).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#DDEAE4] text-[#0B5D46] rounded">#{tag}</span>
                      ))}
                    </div>
                    {rt.mode === 'month' ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-[#6B8078] mr-0.5">Числа:</span>
                        {(rt.monthDays || []).map(d => (
                          <span key={d} className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#0B5D46] text-white">{d}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        {WEEKDAYS.map((d, i) => (
                          <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${(rt.days || []).includes(i) ? 'bg-[#0B5D46] text-white' : 'bg-[#DDEAE4] text-[#6B8078]'}`}>{d}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => deleteRecurring(rt.id)} className="p-1.5 text-[#6B8078] hover:text-red-500 hover:bg-red-50 rounded shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Форма добавления */}
          <div className="border-t border-[#DDEAE4] pt-4 space-y-3">
            <p className="text-xs font-medium text-[#6B8078] uppercase tracking-wide">Новая повторяющаяся задача</p>
            <input
              type="text" value={newText} onChange={e => setNewText(e.target.value)}
              placeholder="Текст задачи..."
              className="w-full px-3 py-2 border border-[#DDEAE4] rounded-md text-sm text-[#0B5D46] placeholder-[#9DB8AC] focus:outline-none focus:border-[#0B5D46]"
              onKeyDown={e => e.key === 'Enter' && addRecurring()}
            />
            <div>
              <p className="text-xs text-[#6B8078] mb-1.5">Теги</p>
              <TagInput tags={newTags} onChange={setNewTags} />
            </div>
            {/* Переключатель режима */}
            <div className="flex bg-[#F1F8F4] rounded-lg p-1 gap-1">
              {[{ id: 'week', label: 'По дням недели' }, { id: 'month', label: 'По числам месяца' }].map(m => (
                <button key={m.id} onClick={() => setNewMode(m.id)}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${newMode === m.id ? 'bg-[#0B5D46] text-white' : 'text-[#6B8078] hover:text-[#0B5D46]'}`}>
                  {m.label}
                </button>
              ))}
            </div>
            {newMode === 'week' ? (
              <div>
                <p className="text-xs text-[#6B8078] mb-1.5">Дни недели</p>
                <div className="flex gap-1.5">
                  {WEEKDAYS.map((d, i) => (
                    <button key={i} onClick={() => {
                      setNewDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
                    }}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${newDays.includes(i) ? 'bg-[#0B5D46] text-white' : 'bg-[#F1F8F4] text-[#6B8078] hover:text-[#0B5D46]'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-[#6B8078] mb-1.5">Числа месяца</p>
                <div className="grid grid-cols-7 gap-1">
                  {[...Array(31)].map((_, idx) => {
                    const day = idx + 1;
                    return (
                      <button key={day} onClick={() => {
                        setNewMonthDays(prev => prev.includes(day) ? prev.filter(x => x !== day) : [...prev, day]);
                      }}
                        className={`py-1.5 text-xs font-medium rounded transition-colors ${newMonthDays.includes(day) ? 'bg-[#0B5D46] text-white' : 'bg-[#F1F8F4] text-[#6B8078] hover:text-[#0B5D46]'}`}>
                        {day}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#9DB8AC] mt-1.5">Если выбранного числа нет в месяце (напр. 31 в феврале) — задача появится в последний день месяца.</p>
              </div>
            )}
            <button onClick={addRecurring} disabled={!canAdd}
              className="w-full px-4 py-2 bg-[#0B5D46] text-white text-sm font-medium rounded-md hover:bg-[#0A4D3A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5">
              <Plus size={14} /> Добавить
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- ДЕНЬ (бумага) ---
  const renderDayView = () => {
    const dateStr = formatDate(currentDate);
    const allDayTasks = tasks[dateStr] || [];
    const dayTasks = getFilteredTasks(allDayTasks)
      .slice()
      .sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));
    const emptyLines = Math.max(0, 10 - dayTasks.length) + extraLines;
    const titleToday = dateStr === todayStr ? 'Сегодня' : currentDate.toLocaleDateString('ru-RU', { weekday: 'long' });

    return (
      <div className="relative flex-1 min-h-0 bg-paper border border-paper-border rounded-[24px] shadow-card overflow-hidden flex flex-col">
        {/* Шапка бумаги: Сегодня + чипы */}
        <div className="flex-none h-14 flex items-center gap-2 px-5 border-b border-paper-border overflow-x-auto">
          <span className="text-lg font-extrabold capitalize mr-2 shrink-0">{titleToday}</span>
          <button onClick={() => setSelectedTags(new Set())}
            className={`shrink-0 text-[13px] font-semibold px-3.5 py-1.5 rounded-full ${selectedTags.size === 0 ? 'bg-primary text-white' : 'bg-tag-green-bg text-tag-green-text'}`}>
            Все
          </button>
          {allTags.map(tag => {
            const sel = selectedTags.has(tag);
            return (
              <button key={tag} onClick={() => { const s = new Set(selectedTags); if (s.has(tag)) s.delete(tag); else s.add(tag); setSelectedTags(s); }}
                className={`shrink-0 text-[13px] font-semibold px-3.5 py-1.5 rounded-full ${sel ? 'bg-primary text-white' : 'bg-tag-green-bg text-tag-green-text'}`}>
                #{tag}
              </button>
            );
          })}
        </div>

        {/* Область строк */}
        <div className="relative flex-1 min-h-0 overflow-y-auto">
          {/* Красное поле */}
          <div className="absolute top-0 left-10 sm:left-14 bottom-0 w-px bg-paper-margin z-[1] pointer-events-none" />

          {dayTasks.map((task, i) => {
            const isEditing = editingId === task.id;
            const isNoteOpen = expandedNoteId === task.id;
            const isOverdue = !task.completed && dateStr < todayStr;
            const important = (task.tags || []).includes('важное') || isOverdue;

            return (
              <div key={task.id}>
                {/* Строка задачи */}
                <div className={`group relative isolate flex items-center gap-3 ${task.completed ? 'min-h-[52px]' : 'min-h-[60px]'} pr-2 border-b border-paper-border`}>
                  {important && !task.completed && <div className="absolute inset-0 -z-10 bg-paper-important" />}
                  <span className="w-10 sm:w-14 shrink-0 text-center text-xs text-paper-num">{i + 1}</span>

                  {isEditing ? (
                    <div className="flex items-start flex-grow gap-2 py-2 pr-2"
                      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) finishEdit(dateStr, task.id); }}>
                      <div className="flex-grow space-y-2">
                        <input type="text" value={editingText} onChange={e => setEditingText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') finishEdit(dateStr, task.id); if (e.key === 'Escape') setEditingId(null); }}
                          className="w-full bg-white border border-primary px-2 py-1 text-sm rounded-lg focus:outline-none text-ink"
                          autoFocus />
                        <TagInput tags={editingTags} onChange={setEditingTags} placeholder="Добавить тег..." />
                      </div>
                      <button onClick={() => finishEdit(dateStr, task.id)}
                        className="p-1.5 bg-primary text-white rounded-lg hover:bg-[#0a4d3a] transition-colors shrink-0 mt-0.5">
                        <Check size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="shrink-0 cursor-pointer relative flex items-center">
                        <input type="checkbox" checked={task.completed}
                          onChange={() => updateTask(dateStr, task.id, { completed: !task.completed })}
                          className="peer sr-only" />
                        <span className={`w-[22px] h-[22px] rounded-[7px] border-[1.8px] flex items-center justify-center transition-colors ${task.completed ? 'bg-accent border-accent' : 'bg-[#FFFDF6] border-paper-cb'}`}>
                          {task.completed && <Check size={14} className="text-white" strokeWidth={3} />}
                        </span>
                      </label>
                      <div className="flex-grow py-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span onClick={() => startEdit(task)}
                            className={`cursor-text text-[15px] ${task.completed ? 'line-through text-done-text font-medium' : 'font-semibold text-ink'}`}>
                            {task.text}
                          </span>
                          {(task.tags || []).map(tag => (
                            <span key={tag} className="text-[11px] font-semibold px-2 py-0.5 bg-tag-green-bg text-tag-green-text rounded-full shrink-0">#{tag}</span>
                          ))}
                          {task.recurringId && <Repeat size={11} className="text-paper-num shrink-0" />}
                        </div>
                        {task.notes && !isNoteOpen && (
                          <p className="text-xs text-paper-muted mt-0.5 truncate">{task.notes}</p>
                        )}
                      </div>
                      {confirmAction && confirmAction.id === task.id ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-paper-muted hidden sm:inline">
                            {confirmAction.type === 'delete' ? 'Удалить?' : 'Перенести?'}
                          </span>
                          <button onClick={() => { if (confirmAction.type === 'delete') deleteTask(dateStr, task.id); else moveToNextDay(task, dateStr); setConfirmAction(null); }}
                            title={confirmAction.type === 'move' ? 'На следующий день' : undefined}
                            className={`px-2 py-1 text-xs rounded-lg transition-colors text-white ${confirmAction.type === 'delete' ? 'bg-danger hover:opacity-90' : 'bg-primary hover:bg-[#0a4d3a]'}`}>
                            Да
                          </button>
                          {confirmAction.type === 'move' && (
                            <label title="Выбрать дату переноса"
                              onClick={e => { const inp = e.currentTarget.querySelector('input'); try { inp.showPicker(); } catch (_) {} }}
                              className="px-2 py-1 text-xs rounded-lg bg-surface-soft text-primary hover:bg-nav-active transition-colors cursor-pointer relative">
                              Выбрать дату
                              <input type="date" onChange={e => { moveTaskToDate(dateStr, task, e.target.value); setConfirmAction(null); }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </label>
                          )}
                          <button onClick={() => setConfirmAction(null)}
                            className="px-2 py-1 text-xs text-paper-muted hover:text-ink rounded-lg transition-colors">Нет</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => { setDetailTask({ dateStr, id: task.id }); setView('details'); }} aria-label="Открыть сведения о задаче"
                            className="w-10 h-10 rounded-xl bg-details-btn text-primary flex items-center justify-center mr-1 shrink-0">
                            <Maximize2 size={16} />
                          </button>
                          <button onClick={() => setExpandedNoteId(isNoteOpen ? null : task.id)} aria-label="Заметка и подзадачи"
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isNoteOpen ? 'bg-white text-ink' : 'text-ink-3 hover:bg-white/60'}`}>
                            <ChevronDown size={18} className={`transition-transform ${isNoteOpen ? 'rotate-180' : ''}`} />
                          </button>
                          <button onClick={() => setConfirmAction({ id: task.id, type: 'move' })} aria-label="Перенести на следующий день"
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-ink-3 hover:bg-white/60 transition-colors">
                            <ArrowRight size={18} />
                          </button>
                          <button onClick={() => openInCalendar(task, dateStr)} aria-label="Добавить в Google Календарь"
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-ink-3 hover:bg-white/60 transition-colors hidden sm:flex">
                            <Calendar size={18} />
                          </button>
                          <button onClick={() => setConfirmAction({ id: task.id, type: 'delete' })} aria-label="Удалить задачу"
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-ink-3 hover:text-danger transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Заметка и подзадачи */}
                {isNoteOpen && (
                  <div className="bg-paper-note border-b border-paper-border pl-[54px] sm:pl-[70px] pr-4 sm:pr-6 py-3">
                    <textarea
                      value={task.notes || ''}
                      onChange={e => updateTask(dateStr, task.id, { notes: e.target.value })}
                      ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                      onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                      placeholder="Добавить заметку к задаче…"
                      rows={1}
                      className="w-full bg-transparent text-sm text-ink placeholder-paper-muted focus:outline-none resize-none leading-relaxed overflow-hidden"
                      autoFocus
                    />
                    <div className="mt-1 pt-2 border-t border-paper-border">
                      <p className="text-[11px] font-bold text-paper-muted uppercase tracking-wider mb-1.5">Подзадачи</p>
                      <div className="space-y-1">
                        {(task.subtasks || []).map(st => (
                          <div key={st.id} className="group/sub flex items-center gap-2.5">
                            <input type="checkbox" checked={st.done}
                              onChange={() => updateTask(dateStr, task.id, { subtasks: (task.subtasks || []).map(s => s.id === st.id ? { ...s, done: !s.done } : s) })}
                              className="w-[18px] h-[18px] accent-accent cursor-pointer shrink-0" />
                            <input value={st.text}
                              onChange={e => updateTask(dateStr, task.id, { subtasks: (task.subtasks || []).map(s => s.id === st.id ? { ...s, text: e.target.value } : s) })}
                              className={`flex-grow bg-transparent text-sm focus:outline-none min-w-0 ${st.done ? 'line-through text-paper-muted' : 'text-ink'}`} />
                            <button onClick={() => updateTask(dateStr, task.id, { subtasks: (task.subtasks || []).filter(s => s.id !== st.id) })}
                              className="p-1 text-paper-num hover:text-danger rounded shrink-0 opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100 transition-opacity">
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2.5 text-accent">
                          <Plus size={16} className="shrink-0" />
                          <input placeholder="Добавить подзадачу…"
                            onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { updateTask(dateStr, task.id, { subtasks: [...(task.subtasks || []), { id: generateId(), text: e.target.value.trim(), done: false }] }); e.target.value = ''; } }}
                            className="flex-grow bg-transparent text-sm font-semibold placeholder-accent focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Строка добавления */}
          <div className="flex items-center gap-3 min-h-[52px] pr-4 border-b border-paper-border focus-within:bg-white/40">
            <span className="w-10 sm:w-14 shrink-0 text-center text-xs text-paper-num">{dayTasks.length + 1}</span>
            <Plus size={20} className="text-accent shrink-0" strokeWidth={2.2} />
            <input
              ref={newTaskInputRef}
              className="flex-grow bg-transparent outline-none text-[15px] text-ink placeholder-paper-muted"
              placeholder="Добавить задачу…"
              onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { addTask(dateStr, e.target.value); e.target.value = ''; } }}
            />
            {hasSpeechRecognition && (
              <button onClick={startVoiceInput} aria-label="Голосовой ввод"
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${isListening ? 'text-danger bg-danger-bg animate-pulse' : 'text-paper-muted hover:bg-white/60'}`}>
                <Mic size={17} />
              </button>
            )}
          </div>

          {[...Array(emptyLines)].map((_, i) => (
            <div key={i} className="flex items-center min-h-[44px] border-b border-paper-border">
              <span className="w-10 sm:w-14 shrink-0 text-center text-xs text-paper-num/60">{dayTasks.length + 2 + i}</span>
            </div>
          ))}

          <div className="flex justify-center py-2">
            <button onClick={() => setExtraLines(n => n + 5)}
              className="text-xs text-paper-num hover:text-paper-muted transition-colors px-3 py-1 rounded-md">
              + добавить строки
            </button>
          </div>

          {/* Заметки дня */}
          <div className="pl-[54px] sm:pl-[70px] pr-4 sm:pr-6 py-3">
            <div className="font-serif-note italic text-sm text-[#6B6652] mb-1">Заметки дня</div>
            <textarea
              value={dayNotes[dateStr] || ''}
              onChange={e => setDayNotes({ ...dayNotes, [dateStr]: e.target.value })}
              placeholder="Записи, мысли, идеи на этот день…"
              rows={3}
              className="w-full bg-transparent text-sm text-ink placeholder-paper-muted focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>
    );
  };

  // --- НЕДЕЛЯ ---
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - getDayOfWeek(startOfWeek));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const weekLabel = `${startOfWeek.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${endOfWeek.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;

    return (
      <div>
      <div className="flex items-center justify-center gap-2 mb-3">
        <button onClick={() => navigate(-1)} className="p-1 text-[#6B8078] hover:text-[#0B5D46] hover:bg-[#F1F8F4] rounded-full transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-[#0B5D46] min-w-[150px] text-center">{weekLabel}</span>
        <button onClick={() => navigate(1)} className="p-1 text-[#6B8078] hover:text-[#0B5D46] hover:bg-[#F1F8F4] rounded-full transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
        {[...Array(5)].map((_, i) => {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          const dStr = formatDate(d);
          const isToday = dStr === formatDate(new Date());
          const dayTasks = getFilteredTasks(tasks[dStr] || []).slice().sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));

          return (
            <div key={i} onClick={() => { setCurrentDate(d); setDayStage('day'); setView('day'); }}
              className={`bg-surface rounded-2xl border transition-all cursor-pointer p-2.5 sm:p-3 min-h-[120px] shadow-soft hover:border-[#12805F] ${isToday ? 'border-[#0B5D46]' : 'border-[#DDEAE4]'}`}>
              <div className={`text-xs font-semibold mb-2 pb-1.5 border-b border-[#F1F8F4] ${isToday ? 'text-[#0B5D46]' : 'text-[#6B8078]'}`}>
                {d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 5).map((t, idx) => (
                  <div key={idx} className={`text-[10px] truncate rounded px-1 py-0.5 ${t.completed ? 'bg-[#CDEAD9] text-[#0B5D46] line-through' : (!t.completed && dStr < todayStr ? 'bg-[#FAD3D3] text-[#C0392B]' : 'bg-[#F1F8F4] text-[#0B5D46]')}`}>
                    {t.text}
                  </div>
                ))}
                {dayTasks.length > 5 && <div className="text-[10px] text-[#6B8078]">+{dayTasks.length - 5}</div>}
              </div>
            </div>
          );
        })}

        {/* Итоги недели */}
        {(() => {
          const weekTasks = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const dStr = formatDate(d);
            getFilteredTasks(tasks[dStr] || []).forEach(t => weekTasks.push({ ...t, dateStr: dStr }));
          }
          const wTotal = weekTasks.length;
          const wDone = weekTasks.filter(t => t.completed).length;
          const sorted = weekTasks.slice().sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));
          return (
            <div className="bg-[#F1F8F4] rounded-lg border border-[#DDEAE4] p-2.5 sm:p-3 min-h-[120px]">
              <div className="text-xs font-semibold mb-2 pb-1.5 border-b border-[#DDEAE4] text-[#0B5D46] flex items-center gap-1">
                <BarChart3 size={11} /> Итоги недели
              </div>
              <p className="text-[11px] text-[#4C645B] mb-1.5">Выполнено {wDone} из {wTotal}</p>
              <div className="space-y-1 max-h-[160px] overflow-y-auto">
                {sorted.map((t, idx) => (
                  <div key={idx} className={`text-[10px] truncate rounded px-1 py-0.5 ${t.completed ? 'bg-[#CDEAD9] text-[#0B5D46] line-through' : (!t.completed && t.dateStr < todayStr ? 'bg-[#FAD3D3] text-[#C0392B]' : 'bg-[#F1F8F4] text-[#0B5D46]')}`}>
                    {t.text}
                  </div>
                ))}
                {wTotal === 0 && <p className="text-[10px] text-[#9DB8AC]">Нет задач</p>}
              </div>
            </div>
          );
        })()}

        {/* Выходные (Сб + Вс) */}
        {(() => {
          const sat = new Date(startOfWeek); sat.setDate(startOfWeek.getDate() + 5);
          const sun = new Date(startOfWeek); sun.setDate(startOfWeek.getDate() + 6);
          const satStr = formatDate(sat), sunStr = formatDate(sun);
          const wkTasks = [
            ...getFilteredTasks(tasks[satStr] || []).map(t => ({ ...t, dateStr: satStr })),
            ...getFilteredTasks(tasks[sunStr] || []).map(t => ({ ...t, dateStr: sunStr })),
          ].sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));
          const todayS = formatDate(new Date());
          const isToday = satStr === todayS || sunStr === todayS;
          return (
            <div onClick={() => { setCurrentDate(sat); setView('weekend'); }}
              className={`bg-surface rounded-2xl border transition-all cursor-pointer p-2.5 sm:p-3 min-h-[120px] shadow-soft hover:border-[#12805F] ${isToday ? 'border-[#0B5D46]' : 'border-[#DDEAE4]'}`}>
              <div className={`text-xs font-semibold mb-2 pb-1.5 border-b border-[#F1F8F4] ${isToday ? 'text-[#0B5D46]' : 'text-[#6B8078]'}`}>
                Сб-Вс · {sat.getDate()}-{sun.getDate()}
              </div>
              <div className="space-y-1">
                {wkTasks.slice(0, 5).map((t, idx) => (
                  <div key={idx} className={`text-[10px] truncate rounded px-1 py-0.5 ${t.completed ? 'bg-[#CDEAD9] text-[#0B5D46] line-through' : (!t.completed && t.dateStr < todayStr ? 'bg-[#FAD3D3] text-[#C0392B]' : 'bg-[#F1F8F4] text-[#0B5D46]')}`}>
                    {t.text}
                  </div>
                ))}
                {wkTasks.length > 5 && <div className="text-[10px] text-[#6B8078]">+{wkTasks.length - 5}</div>}
              </div>
            </div>
          );
        })()}
      </div>
      </div>
    );
  };

  // --- ВЫХОДНЫЕ (Сб + Вс) ---
  const renderWeekendView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - getDayOfWeek(startOfWeek));
    const sat = new Date(startOfWeek); sat.setDate(startOfWeek.getDate() + 5);
    const sun = new Date(startOfWeek); sun.setDate(startOfWeek.getDate() + 6);
    const weekendLabel = `${sat.toLocaleDateString('ru-RU', { day: 'numeric' })}—${sun.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;

    const renderDaySection = (dateObj) => {
      const dStr = formatDate(dateObj);
      const dayTasks = getFilteredTasks(tasks[dStr] || []).slice().sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));
      const weekday = dateObj.toLocaleDateString('ru-RU', { weekday: 'long' });
      const dateLabel = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
      return (
        <div className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 py-3 border-b border-[#DDEAE4] flex items-baseline gap-2">
            <span className="text-base font-semibold text-[#0B5D46] capitalize">{weekday}</span>
            <span className="text-xs text-[#6B8078]">{dateLabel}</span>
          </div>
          <div className="p-2 sm:p-3">
            <div className="space-y-0.5">
              {dayTasks.map(task => {
                const isOverdue = !task.completed && dStr < todayStr;
                const rowBg = task.completed ? 'bg-[#DDF3E7] hover:bg-[#CDEAD9]' : isOverdue ? 'bg-[#FDECEC] hover:bg-[#F8DDD7]' : 'hover:bg-[#F1F8F4]';
                return (
                  <div key={task.id} className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${rowBg}`}>
                    <input type="checkbox" checked={task.completed}
                      onChange={() => updateTask(dStr, task.id, { completed: !task.completed })}
                      className="w-4 h-4 cursor-pointer accent-[#0B5D46] shrink-0" />
                    <input type="text" value={task.text}
                      onChange={e => updateTask(dStr, task.id, { text: e.target.value })}
                      className={`flex-grow bg-transparent text-sm focus:outline-none min-w-0 ${task.completed ? 'line-through text-[#9DB8AC]' : 'text-[#0B5D46]'}`} />
                    {(task.tags || []).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#F1F8F4] text-[#6B8078] rounded shrink-0 hidden sm:inline">#{tag}</span>
                    ))}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveToNextDay(task, dStr)}
                        title="Перенести на следующий день"
                        className="p-1.5 text-[#6B8078] hover:text-[#0B5D46] hover:bg-white/70 rounded-full transition-colors">
                        <ArrowRight size={13} />
                      </button>
                      <button onClick={() => openInCalendar(task, dStr)}
                        title="В Google Календарь"
                        className="p-1.5 text-[#6B8078] hover:text-[#0B5D46] hover:bg-white/70 rounded-full transition-colors">
                        <Calendar size={13} />
                      </button>
                      <button onClick={() => deleteTask(dStr, task.id)}
                        className="p-1.5 text-[#6B8078] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={e => { e.preventDefault(); const inp = e.currentTarget.elements.newtask; if (inp.value.trim()) { addTask(dStr, inp.value); inp.value = ''; } }}
              className="flex items-center gap-2.5 px-3 py-2 mt-0.5 rounded-xl bg-[#F1F8F4] focus-within:bg-[#F1F8F4] transition-colors">
              <Plus size={15} className="text-[#12805F] shrink-0" />
              <input name="newtask" className="flex-grow bg-transparent text-sm text-[#0B5D46] placeholder-[#9DB8AC] focus:outline-none"
                placeholder="Добавить задачу..." />
            </form>
          </div>
        </div>
      );
    };

    return (
      <div className="bg-white rounded-3xl border border-[#DDEAE4] shadow-[0_4px_24px_rgba(16,71,54,0.06)] overflow-hidden">
        <div className="px-4 sm:px-8 py-4 flex justify-center sm:justify-end items-center border-b border-[#DDEAE4]">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1 text-[#6B8078] hover:text-[#0B5D46] hover:bg-[#F1F8F4] rounded-full transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center min-w-[130px]">
              <p className="text-base font-semibold text-[#0B5D46]">Выходные</p>
              <p className="text-xs text-[#6B8078]">{weekendLabel}</p>
            </div>
            <button onClick={() => navigate(1)} className="p-1 text-[#6B8078] hover:text-[#0B5D46] hover:bg-[#F1F8F4] rounded-full transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:divide-x divide-y md:divide-y-0 divide-[#DDEAE4]">
          {renderDaySection(sat)}
          {renderDaySection(sun)}
        </div>
      </div>
    );
  };

  // --- ИТОГИ НЕДЕЛИ (экран в дневном листании) ---
  const renderWeekSummaryView = () => {
    const weekStart = mondayOf(currentDate);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const label = `${weekStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${weekEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;
    const weekTasks = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
      const dStr = formatDate(d);
      getFilteredTasks(tasks[dStr] || []).forEach(t => weekTasks.push({ ...t, dateStr: dStr }));
    }
    const total = weekTasks.length;
    const done = weekTasks.filter(t => t.completed).length;
    const notDone = total - done;
    const percent = total ? Math.round((done / total) * 100) : 0;
    const sorted = weekTasks.slice().sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0) || a.dateStr.localeCompare(b.dateStr));
    const fmt = (dStr) => new Date(dStr + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });

    return (
      <div>
        <div className="bg-white rounded-3xl border border-[#DDEAE4] shadow-[0_4px_24px_rgba(16,71,54,0.06)] overflow-hidden">
          <div className="px-5 sm:px-8 py-4 bg-[#0B5D46] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2"><BarChart3 size={16} /> Итоги недели</h2>
              <p className="text-xs text-[#BFE5D6] mt-0.5">Все задачи недели — выполненные и невыполненные</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => navigate(-1)} className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs text-white/90 min-w-[110px] text-center">{label}</span>
              <button onClick={() => navigate(1)} className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          {/* Статистика */}
          <div className="px-5 sm:px-8 py-4 border-b border-[#DDEAE4]">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: 'Всего', value: total, color: '#0B5D46' },
                { label: 'Выполнено', value: done, color: '#12805F' },
                { label: 'Осталось', value: notDone, color: '#C0392B' },
              ].map(kpi => (
                <div key={kpi.label} className="text-center">
                  <p className="text-2xl font-semibold" style={{ color: kpi.color }}>{kpi.value}</p>
                  <p className="text-xs text-[#6B8078]">{kpi.label}</p>
                </div>
              ))}
            </div>
            <div className="h-2.5 bg-[#F1F8F4] rounded-full overflow-hidden">
              <div className="h-full bg-[#12805F] rounded-full transition-all" style={{ width: `${percent}%` }} />
            </div>
            <p className="text-xs text-[#6B8078] mt-1.5 text-center">Выполнено {percent}%</p>
          </div>
          {/* Список задач */}
          <div className="p-3 sm:p-5">
            {total === 0 ? (
              <p className="text-sm text-[#9DB8AC] px-2 py-6 text-center">За неделю задач не было</p>
            ) : (
              <div className="space-y-1">
                {sorted.map(t => {
                  const isOverdue = !t.completed && t.dateStr < todayStr;
                  const rowBg = t.completed ? 'bg-[#DDF3E7] hover:bg-[#CDEAD9]' : isOverdue ? 'bg-[#FDECEC] hover:bg-[#F8DDD7]' : 'hover:bg-[#F1F8F4]';
                  return (
                    <div key={t.id + t.dateStr} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${rowBg}`}>
                      <input type="checkbox" checked={t.completed}
                        onChange={() => updateTask(t.dateStr, t.id, { completed: !t.completed })}
                        className="w-4 h-4 cursor-pointer accent-[#0B5D46] shrink-0" />
                      <span className={`text-sm flex-grow min-w-0 truncate ${t.completed ? 'line-through text-[#9DB8AC]' : 'text-[#0B5D46]'}`}>{t.text}</span>
                      <span className="text-xs text-[#6B8078] shrink-0 capitalize">{fmt(t.dateStr)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- МЕСЯЦ ---
  const renderMonthView = () => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayIndex = (start.getDay() || 7) - 1;

    const monthLabel = currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

    return (
      <div className="bg-white rounded-3xl border border-[#DDEAE4] shadow-[0_4px_24px_rgba(16,71,54,0.06)] overflow-hidden">
        <div className="flex items-center justify-center gap-2 py-3 border-b border-[#DDEAE4]">
          <button onClick={() => navigate(-1)} className="p-1 text-[#6B8078] hover:text-[#0B5D46] hover:bg-[#F1F8F4] rounded-full transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-[#0B5D46] capitalize min-w-[150px] text-center">{monthLabel}</span>
          <button onClick={() => navigate(1)} className="p-1 text-[#6B8078] hover:text-[#0B5D46] hover:bg-[#F1F8F4] rounded-full transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 border-b border-[#DDEAE4]">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold text-[#6B8078] uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {[...Array(42)].map((_, i) => {
            const dayNum = i - firstDayIndex + 1;
            const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
            const dStr = formatDate(dayDate);
            const dayTasks = getFilteredTasks(tasks[dStr] || []).slice().sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));
            const isToday = dStr === formatDate(new Date());

            return (
              <div key={i} onClick={() => isValidDay && (setCurrentDate(dayDate), setDayStage('day'), setView('day'))}
                className={`h-14 sm:h-24 md:h-28 border-b border-r border-[#F1F8F4] p-1 sm:p-1.5 transition-colors ${isValidDay ? 'cursor-pointer hover:bg-[#F1F8F4]' : 'bg-[#F1F8F4]'}`}>
                {isValidDay && (
                  <>
                    <span className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-xs font-semibold ${isToday ? 'bg-[#0B5D46] text-white' : 'text-[#0B5D46]'}`}>
                      {dayNum}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayTasks.slice(0, 2).map((t, idx) => (
                        <div key={idx} className={`hidden sm:block text-[9px] px-1 rounded truncate ${t.completed ? 'bg-[#CDEAD9] text-[#0B5D46] line-through' : (!t.completed && dStr < todayStr ? 'bg-[#FAD3D3] text-[#C0392B]' : 'bg-[#F1F8F4] text-[#0B5D46]')}`}>
                          {t.text}
                        </div>
                      ))}
                      {dayTasks.length > 2 && <div className="hidden sm:block text-[9px] text-[#6B8078] px-1">+{dayTasks.length - 2}</div>}
                      {dayTasks.length > 0 && <div className="sm:hidden w-1.5 h-1.5 rounded-full bg-[#0B5D46] mx-auto mt-1" />}
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

  // --- ВАЖНЫЕ ЗАДАЧИ ---
  const renderImportantView = () => {
    const addImportant = (text) => {
      if (!text.trim()) return;
      saveImportantTasks([...importantTasks, {
        id: generateId(), text: text.trim(), tags: [], notes: '',
        deadline: '', link: '', completed: false, createdAt: new Date().toISOString(),
      }]);
    };

    const updateImportant = (id, updates) => {
      saveImportantTasks(importantTasks.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteImportant = (id) => {
      saveImportantTasks(importantTasks.filter(t => t.id !== id));
    };

    return (
      <div className="bg-white rounded-3xl border border-[#DDEAE4] shadow-[0_4px_24px_rgba(16,71,54,0.06)] overflow-hidden">
        <div className="px-5 sm:px-8 py-5 bg-[#0B5D46]">
          <h2 className="text-base font-semibold text-white">Важные задачи</h2>
          <p className="text-xs text-[#BFE5D6] mt-0.5">Задачи без привязки к дате — цели, планы, важные дела</p>
        </div>

        <div className="divide-y divide-[#F1F8F4] p-2 sm:p-3">
          {importantTasks.slice().sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0)).map((task) => {
            const impOverdue = !task.completed && task.deadline && task.deadline < todayStr;
            const impBg = task.completed
              ? 'bg-[#DDF3E7] hover:bg-[#CDEAD9]'
              : impOverdue
                ? 'bg-[#FDECEC] hover:bg-[#F8DDD7]'
                : 'hover:bg-[#F1F8F4]';
            return (
            <div key={task.id} className="group">
              {/* Основная строка */}
              <div className={`flex items-start gap-3 px-3 sm:px-5 py-3 rounded-2xl ${impBg} transition-colors`}>
                <input type="checkbox" checked={task.completed}
                  onChange={() => updateImportant(task.id, { completed: !task.completed })}
                  className="mt-0.5 w-4 h-4 cursor-pointer accent-[#12805F] shrink-0" />
                <div className="flex-grow min-w-0">
                  {/* Текст задачи */}
                  <input
                    type="text"
                    value={task.text}
                    onChange={e => updateImportant(task.id, { text: e.target.value })}
                    className={`w-full bg-transparent text-sm text-[#14261F] focus:outline-none ${task.completed ? 'line-through text-[#9DB8AC]' : ''}`}
                  />
                  {/* Дедлайн + ссылка + теги */}
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1 bg-[#F1F8F4] rounded-full px-2.5 py-1">
                      <Calendar size={11} className="text-[#12805F]" />
                      <input
                        type="date"
                        value={task.deadline || ''}
                        onChange={e => updateImportant(task.id, { deadline: e.target.value })}
                        onClick={e => { try { e.target.showPicker(); } catch (err) {} }}
                        className="text-xs text-[#4C645B] bg-transparent focus:outline-none cursor-pointer"
                      />
                    </div>
                    <input
                      type="text"
                      value={task.link || ''}
                      onChange={e => updateImportant(task.id, { link: e.target.value })}
                      placeholder="Ссылка на задачу..."
                      className="text-xs text-[#4C645B] placeholder-[#9DB8AC] bg-transparent focus:outline-none min-w-[140px] flex-1"
                    />
                    {task.link && (
                      <a href={task.link} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-xs font-medium text-[#12805F] hover:text-[#0B5D46] shrink-0">
                        открыть →
                      </a>
                    )}
                  </div>
                  {/* Теги */}
                  {(task.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {task.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 bg-[#DDEAE4] text-[#4C645B] rounded-full">#{tag}</span>
                      ))}
                    </div>
                  )}
                  {/* Заметка */}
                  {task.notes !== undefined && (
                    <textarea
                      value={task.notes || ''}
                      onChange={e => updateImportant(task.id, { notes: e.target.value })}
                      placeholder="Заметка..."
                      rows={task.notes ? undefined : 1}
                      className="w-full mt-1.5 bg-transparent text-xs text-[#12805F] placeholder-[#9DB8AC] focus:outline-none resize-none leading-relaxed"
                    />
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                  <button onClick={() => deleteImportant(task.id)}
                    className="p-1.5 text-[#9DB8AC] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Строка добавления */}
        <div className="flex items-center gap-3 mx-2 sm:mx-3 mb-2 sm:mb-3 px-3 sm:px-5 py-3 rounded-2xl bg-[#F1F8F4] focus-within:bg-[#F1F8F4] transition-colors">
          <Plus size={16} className="text-[#12805F] shrink-0" />
          <input
            className="flex-grow bg-transparent text-sm text-[#14261F] placeholder-[#9DB8AC] focus:outline-none"
            placeholder="Добавить важную задачу..."
            onKeyDown={e => { if (e.key === 'Enter') { addImportant(e.target.value); e.target.value = ''; } }}
          />
        </div>
      </div>
    );
  };

  // --- ЗАМЕТКИ ---
  const renderNotesView = () => {
    const note = openNoteId ? notes.find(n => n.id === openNoteId) : null;
    if (openNoteId && note) {
      return (
        <NoteEditor
          note={note}
          onChangeTitle={(t) => updateNote(note.id, { title: t })}
          onChangeContent={(c) => updateNote(note.id, { content: c })}
          onBack={() => setOpenNoteId(null)}
          onDelete={() => deleteNote(note.id)}
        />
      );
    }
    const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '';
    return (
      <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Создать заметку */}
          <button onClick={createNote}
            className="flex flex-col items-center justify-center gap-2 min-h-[150px] rounded-2xl border-2 border-dashed border-[#DDEAE4] text-[#12805F] hover:border-[#12805F] hover:bg-[#F1F8F4] transition-colors">
            <Plus size={24} />
            <span className="text-sm font-medium">Новая заметка</span>
          </button>
          {notes.map(n => {
            const preview = stripHtml(n.content);
            return (
              <div key={n.id} onClick={() => setOpenNoteId(n.id)}
                className="group relative flex flex-col min-h-[150px] rounded-2xl border border-[#DDEAE4] bg-white p-4 cursor-pointer hover:border-[#12805F] hover:shadow-[0_4px_20px_rgba(16,71,54,0.08)] transition-all overflow-hidden">
                <h3 className="text-sm font-semibold text-[#0B5D46] mb-1.5 line-clamp-2 pr-5">{n.title || 'Без названия'}</h3>
                <p className="text-xs text-[#6B8078] flex-grow overflow-hidden line-clamp-5 leading-relaxed">{preview || 'Пустая заметка'}</p>
                <span className="text-[10px] text-[#9DB8AC] mt-2 flex items-center gap-1"><FileText size={10} /> {fmt(n.updatedAt)}</span>
                <button onClick={e => { e.stopPropagation(); deleteNote(n.id); }}
                  className="absolute top-2 right-2 p-1 text-[#9DB8AC] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
        {notes.length === 0 && (
          <p className="text-sm text-[#9DB8AC] text-center mt-6">Пока нет заметок. Создайте первую!</p>
        )}
      </div>
    );
  };

  // --- ПРОСРОЧЕННЫЕ ЗАДАЧИ ---
  const renderOverdueView = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 30);
    const minStr = formatDate(minDate);
    const overdueTasks = Object.entries(tasks)
      .filter(([dStr]) => dStr < todayStr && dStr >= minStr)
      .flatMap(([dStr, arr]) => (arr || []).filter(t => !t.completed).map(t => ({ ...t, dateStr: dStr })))
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    const fmtDate = (dStr) => new Date(dStr + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    return (
      <div className="bg-white rounded-3xl border border-[#DDEAE4] shadow-[0_4px_24px_rgba(16,71,54,0.06)] overflow-hidden">
        <div className="px-5 sm:px-8 py-5 bg-[#C0392B]">
          <h2 className="text-base font-semibold text-white">Просроченные задачи</h2>
          <p className="text-xs text-[#e8c4c4] mt-0.5">Невыполненные задачи за последние 30 дней · {overdueTasks.length}</p>
        </div>
        <div className="p-3 sm:p-5">
          {overdueTasks.length === 0 ? (
            <p className="text-sm text-[#9DB8AC] px-2 py-6 text-center">Просроченных задач нет 🎉</p>
          ) : (
            <div className="space-y-1">
              {overdueTasks.map(t => (
                <div key={t.id + t.dateStr} className="group flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#FDECEC] hover:bg-[#F8DDD7] transition-colors">
                  <span className="text-xs text-[#C0392B] font-medium w-14 shrink-0">{fmtDate(t.dateStr)}</span>
                  <span className="text-sm text-[#0B5D46] flex-grow min-w-0 truncate">{t.text}</span>
                  {(t.tags || []).slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/60 text-[#6B8078] rounded shrink-0 hidden sm:inline">#{tag}</span>
                  ))}
                  <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => updateTask(t.dateStr, t.id, { completed: true })}
                      title="Закрыть задачу"
                      className="p-1.5 text-[#6B8078] hover:text-[#12805F] hover:bg-white/70 rounded-full transition-colors">
                      <Check size={14} />
                    </button>
                    <button onClick={() => moveTaskToImportant(t.dateStr, t)}
                      title="Перенести в «Важные задачи»"
                      className="p-1.5 text-[#6B8078] hover:text-[#0B5D46] hover:bg-white/70 rounded-full transition-colors">
                      <ArrowRight size={14} />
                    </button>
                    <label title="Перенести на дату"
                      className="p-1.5 text-[#6B8078] hover:text-[#0B5D46] hover:bg-white/70 rounded-full transition-colors cursor-pointer relative">
                      <Calendar size={14} />
                      <input type="date"
                        onChange={e => moveTaskToDate(t.dateStr, t, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- ИТОГИ МЕСЯЦА ---
  const renderSummaryView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthName = currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

    // Все задачи месяца
    const allMonthTasks = Object.entries(tasks)
      .filter(([dStr]) => dStr.startsWith(monthPrefix))
      .flatMap(([dStr, arr]) => (arr || []).map(t => ({ ...t, dateStr: dStr })));
    const total = allMonthTasks.length;
    const completed = allMonthTasks.filter(t => t.completed).length;
    const notCompleted = total - completed;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    // Статистика по тегам
    const tagMap = {};
    allMonthTasks.forEach(t => (t.tags || []).forEach(tag => {
      if (!tagMap[tag]) tagMap[tag] = { total: 0, done: 0 };
      tagMap[tag].total++;
      if (t.completed) tagMap[tag].done++;
    }));
    const tagStats = Object.entries(tagMap).map(([tag, v]) => ({ tag, ...v })).sort((a, b) => b.total - a.total);

    // Важные задачи, выполненные в этом месяце
    const importantDone = importantTasks.filter(t => t.completed && t.deadline && t.deadline.startsWith(monthPrefix));

    // Незавершённые задачи месяца
    const unfinished = allMonthTasks.filter(t => !t.completed).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    // Выполненные задачи месяца
    const monthDone = allMonthTasks.filter(t => t.completed).sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    // Диапазон дат для переноса (следующий месяц)
    const nextMonthMin = `${month === 11 ? year + 1 : year}-${String(((month + 1) % 12) + 1).padStart(2, '0')}-01`;

    // Кольцевая диаграмма
    const R = 54, C = 2 * Math.PI * R;
    const doneLen = total ? (completed / total) * C : 0;

    const fmtDate = (dStr) => new Date(dStr + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    return (
      <div className="space-y-4">
        {/* Навигация по месяцам */}
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1 text-[#6B8078] hover:text-[#0B5D46] hover:bg-[#F1F8F4] rounded-full transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-base font-semibold text-[#0B5D46] capitalize min-w-[160px] text-center">{monthName}</span>
          <button onClick={() => navigate(1)} className="p-1 text-[#6B8078] hover:text-[#0B5D46] hover:bg-[#F1F8F4] rounded-full transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* KPI-плитки */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Всего задач', value: total, color: '#0B5D46' },
            { label: 'Выполнено', value: completed, color: '#12805F' },
            { label: 'Не выполнено', value: notCompleted, color: '#C0392B' },
            { label: 'Прогресс', value: `${percent}%`, color: '#12805F' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-[#DDEAE4] shadow-[0_2px_12px_rgba(16,71,54,0.05)] p-4 text-center">
              <p className="text-2xl font-semibold" style={{ color: kpi.color }}>{kpi.value}</p>
              <p className="text-xs text-[#6B8078] mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Диаграммы */}
        <div className="bg-white rounded-3xl border border-[#DDEAE4] shadow-[0_4px_24px_rgba(16,71,54,0.06)] overflow-hidden">
          <div className="px-5 sm:px-8 py-4 bg-[#0B5D46]">
            <h2 className="text-base font-semibold text-white flex items-center gap-2"><BarChart3 size={16} /> Итоги месяца</h2>
          </div>
          <div className="p-5 sm:p-8 flex flex-col md:flex-row gap-8 items-center">
            {/* Donut */}
            <div className="relative shrink-0">
              <svg viewBox="0 0 140 140" className="w-40 h-40">
                <circle cx="70" cy="70" r={R} fill="none" stroke="#F1F8F4" strokeWidth="16" />
                <circle cx="70" cy="70" r={R} fill="none" stroke="#12805F" strokeWidth="16" strokeLinecap="round"
                  strokeDasharray={`${doneLen} ${C - doneLen}`} transform="rotate(-90 70 70)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold text-[#0B5D46]">{percent}%</span>
                <span className="text-xs text-[#6B8078]">{completed} из {total}</span>
              </div>
            </div>
            {/* Бары по тегам */}
            <div className="flex-grow w-full min-w-0">
              <p className="text-xs font-medium text-[#6B8078] mb-3 uppercase tracking-wider">По хэштегам</p>
              {tagStats.length === 0 ? (
                <p className="text-sm text-[#9DB8AC]">Нет задач с тегами в этом месяце</p>
              ) : (
                <div className="space-y-2.5">
                  {tagStats.map(s => (
                    <div key={s.tag}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#0B5D46]">#{s.tag}</span>
                        <span className="text-[#6B8078]">{s.done}/{s.total}</span>
                      </div>
                      <div className="h-2.5 bg-[#F1F8F4] rounded-full overflow-hidden">
                        <div className="h-full bg-[#12805F] rounded-full transition-all" style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Важное за месяц */}
        <div className="bg-white rounded-3xl border border-[#DDEAE4] shadow-[0_4px_24px_rgba(16,71,54,0.06)] overflow-hidden">
          <div className="px-5 sm:px-8 py-4 border-b border-[#DDEAE4] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#0B5D46] flex items-center gap-2"><Check size={16} className="text-[#12805F]" /> Важное за месяц</h2>
            <span className="text-sm text-[#6B8078]">{importantDone.length}</span>
          </div>
          <div className="p-3 sm:p-5">
            {importantDone.length === 0 ? (
              <p className="text-sm text-[#9DB8AC] px-2 py-3">В этом месяце нет выполненных важных задач</p>
            ) : (
              <div className="space-y-1">
                {importantDone.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F1F8F4]">
                    <Check size={14} className="text-[#12805F] shrink-0" />
                    <span className="text-sm text-[#0B5D46] line-through decoration-[#9DB8AC]">{t.text}</span>
                    <span className="text-xs text-[#6B8078] ml-auto shrink-0">{fmtDate(t.deadline)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Выполнено за месяц */}
        <div className="bg-white rounded-3xl border border-[#DDEAE4] shadow-[0_4px_24px_rgba(16,71,54,0.06)] overflow-hidden">
          <div className="px-5 sm:px-8 py-4 border-b border-[#DDEAE4] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#0B5D46] flex items-center gap-2"><Check size={16} className="text-[#12805F]" /> Выполнено за месяц</h2>
            <span className="text-sm text-[#6B8078]">{monthDone.length}</span>
          </div>
          <div className="p-3 sm:p-5">
            {monthDone.length === 0 ? (
              <p className="text-sm text-[#9DB8AC] px-2 py-3">В этом месяце пока нет выполненных задач</p>
            ) : (
              <div className="space-y-1">
                {monthDone.map(t => (
                  <div key={t.id + t.dateStr} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F1F8F4]">
                    <Check size={14} className="text-[#12805F] shrink-0" />
                    <span className="text-sm text-[#0B5D46] line-through decoration-[#9DB8AC] flex-grow min-w-0 truncate">{t.text}</span>
                    {(t.tags || []).slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#DDF3E7] text-[#1E7F4F] rounded-full shrink-0 hidden sm:inline">#{tag}</span>
                    ))}
                    <span className="text-xs text-[#6B8078] ml-auto shrink-0">{fmtDate(t.dateStr)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Незавершённые задачи */}
        <div className="bg-white rounded-3xl border border-[#DDEAE4] shadow-[0_4px_24px_rgba(16,71,54,0.06)] overflow-hidden">
          <div className="px-5 sm:px-8 py-4 border-b border-[#DDEAE4] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#0B5D46]">Незавершённые задачи</h2>
            <span className="text-sm text-[#6B8078]">{unfinished.length}</span>
          </div>
          <div className="p-3 sm:p-5">
            {unfinished.length === 0 ? (
              <p className="text-sm text-[#9DB8AC] px-2 py-3">Все задачи месяца выполнены 🎉</p>
            ) : (
              <div className="space-y-1">
                {unfinished.map(t => (
                  <div key={t.id + t.dateStr} className="group flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F1F8F4]">
                    <span className="text-xs text-[#6B8078] w-14 shrink-0">{fmtDate(t.dateStr)}</span>
                    <span className="text-sm text-[#0B5D46] flex-grow min-w-0 truncate">{t.text}</span>
                    <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => updateTask(t.dateStr, t.id, { completed: true })}
                        title="Закрыть задачу"
                        className="p-1.5 text-[#6B8078] hover:text-[#12805F] hover:bg-[#F1F8F4] rounded-full transition-colors">
                        <Check size={14} />
                      </button>
                      <button onClick={() => moveTaskToImportant(t.dateStr, t)}
                        title="Перенести в «Важные задачи»"
                        className="p-1.5 text-[#6B8078] hover:text-[#0B5D46] hover:bg-[#F1F8F4] rounded-full transition-colors">
                        <ArrowRight size={14} />
                      </button>
                      <label title="Перенести на дату следующего месяца"
                        className="p-1.5 text-[#6B8078] hover:text-[#0B5D46] hover:bg-[#F1F8F4] rounded-full transition-colors cursor-pointer relative">
                        <Calendar size={14} />
                        <input type="date" min={nextMonthMin}
                          onChange={e => moveTaskToDate(t.dateStr, t, e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Цели на следующий месяц */}
        <div className="bg-white rounded-3xl border border-[#DDEAE4] shadow-[0_4px_24px_rgba(16,71,54,0.06)] overflow-hidden">
          <div className="px-5 sm:px-8 py-4 border-b border-[#DDEAE4]">
            <h2 className="text-base font-semibold text-[#0B5D46] flex items-center gap-2"><Target size={16} className="text-[#12805F]" /> Цели на следующий месяц</h2>
          </div>
          <div className="p-3 sm:p-5">
            <div className="space-y-1">
              {monthlyReview.goals.map(g => (
                <div key={g.id} className="group flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F1F8F4]">
                  <input type="checkbox" checked={g.done}
                    onChange={() => saveReview({ ...monthlyReview, goals: monthlyReview.goals.map(x => x.id === g.id ? { ...x, done: !x.done } : x) })}
                    className="w-4 h-4 cursor-pointer accent-[#12805F] shrink-0" />
                  <input value={g.text}
                    onChange={e => saveReview({ ...monthlyReview, goals: monthlyReview.goals.map(x => x.id === g.id ? { ...x, text: e.target.value } : x) })}
                    className={`flex-grow bg-transparent text-sm focus:outline-none ${g.done ? 'line-through text-[#9DB8AC]' : 'text-[#0B5D46]'}`} />
                  <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => addTextToImportant(g.text)}
                      title="Создать «Важную задачу»"
                      className="px-2 py-1 text-[10px] text-[#12805F] hover:bg-[#F1F8F4] rounded-full transition-colors">
                      → в важные
                    </button>
                    <label title="Создать задачу на дату следующего месяца"
                      className="p-1.5 text-[#6B8078] hover:text-[#0B5D46] hover:bg-[#F1F8F4] rounded-full transition-colors cursor-pointer relative">
                      <Calendar size={13} />
                      <input type="date" min={nextMonthMin}
                        onChange={e => addTextToDate(g.text, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer" />
                    </label>
                    <button onClick={() => saveReview({ ...monthlyReview, goals: monthlyReview.goals.filter(x => x.id !== g.id) })}
                      className="p-1.5 text-[#9DB8AC] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl bg-[#F1F8F4] focus-within:bg-[#F1F8F4] transition-colors">
              <Plus size={15} className="text-[#12805F] shrink-0" />
              <input className="flex-grow bg-transparent text-sm text-[#0B5D46] placeholder-[#9DB8AC] focus:outline-none"
                placeholder="Добавить цель..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    saveReview({ ...monthlyReview, goals: [...monthlyReview.goals, { id: generateId(), text: e.target.value.trim(), done: false }] });
                    e.target.value = '';
                  }
                }} />
            </div>
          </div>
        </div>

        {/* Идеи на следующий месяц */}
        <div className="bg-white rounded-3xl border border-[#DDEAE4] shadow-[0_4px_24px_rgba(16,71,54,0.06)] overflow-hidden">
          <div className="px-5 sm:px-8 py-4 border-b border-[#DDEAE4]">
            <h2 className="text-base font-semibold text-[#0B5D46] flex items-center gap-2"><Lightbulb size={16} className="text-[#12805F]" /> Идеи на следующий месяц</h2>
          </div>
          <div className="p-3 sm:p-5">
            <div className="space-y-1">
              {monthlyReview.ideas.map(idea => (
                <div key={idea.id} className="group flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F1F8F4]">
                  <Lightbulb size={13} className="text-[#9DB8AC] shrink-0" />
                  <input value={idea.text}
                    onChange={e => saveReview({ ...monthlyReview, ideas: monthlyReview.ideas.map(x => x.id === idea.id ? { ...x, text: e.target.value } : x) })}
                    className="flex-grow bg-transparent text-sm text-[#0B5D46] focus:outline-none" />
                  <button onClick={() => saveReview({ ...monthlyReview, ideas: monthlyReview.ideas.filter(x => x.id !== idea.id) })}
                    className="p-1.5 text-[#9DB8AC] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl bg-[#F1F8F4] focus-within:bg-[#F1F8F4] transition-colors">
              <Plus size={15} className="text-[#12805F] shrink-0" />
              <input className="flex-grow bg-transparent text-sm text-[#0B5D46] placeholder-[#9DB8AC] focus:outline-none"
                placeholder="Добавить идею..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    saveReview({ ...monthlyReview, ideas: [...monthlyReview.ideas, { id: generateId(), text: e.target.value.trim() }] });
                    e.target.value = '';
                  }
                }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== Вспомогательные данные для нового каркаса =====
  // --- СВЕДЕНИЯ О ЗАДАЧЕ ---
  const renderTaskDetails = () => {
    const back = (d) => { if (d) { setCurrentDate(d); setDayStage('day'); } setView('day'); setDetailTask(null); };
    if (!detailTask) { back(); return null; }
    const { dateStr, id } = detailTask;
    const task = (tasks[dateStr] || []).find(t => t.id === id);
    if (!task) {
      return (
        <div className="bg-surface rounded-[24px] shadow-card p-8 text-center text-ink-3">
          Задача не найдена. <button onClick={() => back()} className="text-primary font-semibold underline">Назад к дню</button>
        </div>
      );
    }
    const d = new Date(dateStr + 'T00:00:00');
    const dateLabel = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const weekdayLabel = d.toLocaleDateString('ru-RU', { weekday: 'long' });
    const isOverdue = !task.completed && dateStr < todayStr;
    const important = (task.tags || []).includes('важное') || isOverdue;
    const subtasks = task.subtasks || [];
    const subDone = subtasks.filter(s => s.done).length;
    const upd = (fields) => updateTask(dateStr, id, fields);

    return (
      <div className="bg-surface rounded-[24px] shadow-card p-5 sm:p-8 flex flex-col">
        {/* Верхняя строка */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button onClick={() => back(d)} className="flex items-center gap-2 min-h-[44px] pl-2 pr-3 text-sm font-semibold text-ink-2 hover:text-ink">
            <ChevronLeft size={18} /> Назад к дню
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { moveToNextDay(task, dateStr); back(); }}
              className="flex items-center gap-2 min-h-[44px] px-4 border border-line bg-surface rounded-[14px] text-sm font-semibold text-ink hover:bg-surface-soft">
              <ArrowRight size={17} className="text-accent" /> На завтра
            </button>
            <button onClick={() => openInCalendar(task, dateStr)}
              className="flex items-center gap-2 min-h-[44px] px-4 border border-line bg-surface rounded-[14px] text-sm font-semibold text-ink hover:bg-surface-soft">
              <Calendar size={17} className="text-accent" /> <span className="hidden sm:inline">В Google Календарь</span><span className="sm:hidden">Календарь</span>
            </button>
            <button onClick={() => { deleteTask(dateStr, id); back(); }}
              className="flex items-center gap-2 min-h-[44px] px-4 border border-danger-btn-border bg-danger-btn rounded-[14px] text-sm font-semibold text-danger">
              <Trash2 size={17} /> Удалить
            </button>
          </div>
        </div>

        {/* Заголовок */}
        <div className="flex items-start gap-4 mt-5">
          <label className="shrink-0 mt-2 cursor-pointer">
            <input type="checkbox" checked={task.completed} onChange={() => upd({ completed: !task.completed })} className="peer sr-only" />
            <span className={`w-7 h-7 rounded-[9px] border-2 flex items-center justify-center ${task.completed ? 'bg-accent border-accent' : 'bg-white border-cb-border'}`}>
              {task.completed && <Check size={18} className="text-white" strokeWidth={3} />}
            </span>
          </label>
          <div className="flex-1 min-w-0">
            <input value={task.text} onChange={e => upd({ text: e.target.value })}
              className={`w-full bg-transparent text-2xl sm:text-[34px] font-extrabold leading-tight tracking-[-0.8px] focus:outline-none ${task.completed ? 'line-through text-done-text' : 'text-ink'}`} />
            <div className="flex items-center gap-2.5 mt-2.5 flex-wrap text-[13px] text-ink-3">
              <span className="flex items-center gap-1.5"><Calendar size={15} /> {dateLabel}</span>
              {important && <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-danger-chip text-danger">Важное</span>}
              {(task.tags || []).filter(t => t !== 'важное').map(tag => (
                <span key={tag} className="text-xs font-semibold px-3 py-0.5 rounded-full bg-tag-green-bg text-tag-green-text">#{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Колонки */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-7 mt-6">
          {/* Левая: заметка + подзадачи */}
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-extrabold mb-2.5">Заметка к задаче</div>
            <textarea value={task.notes || ''} onChange={e => upd({ notes: e.target.value })}
              placeholder="Добавить заметку к задаче…" rows={4}
              className="w-full min-h-[120px] box-border p-4 rounded-[18px] bg-surface-soft text-[15px] leading-6 text-ink placeholder-ink-3 focus:outline-none resize-y" />

            <div className="flex items-baseline justify-between mt-6 mb-2.5">
              <span className="text-[15px] font-extrabold">Подзадачи</span>
              <span className="text-[13px] text-ink-3">{subDone} из {subtasks.length}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-3.5 min-h-[52px] px-4 rounded-[16px] border border-divider">
                  <input type="checkbox" checked={st.done}
                    onChange={() => upd({ subtasks: subtasks.map(s => s.id === st.id ? { ...s, done: !s.done } : s) })}
                    className="w-[22px] h-[22px] accent-accent cursor-pointer shrink-0" />
                  <input value={st.text}
                    onChange={e => upd({ subtasks: subtasks.map(s => s.id === st.id ? { ...s, text: e.target.value } : s) })}
                    className={`flex-1 bg-transparent text-[15px] focus:outline-none min-w-0 ${st.done ? 'line-through text-ink-3' : 'text-ink font-medium'}`} />
                  <button onClick={() => upd({ subtasks: subtasks.filter(s => s.id !== st.id) })} aria-label="Удалить подзадачу"
                    className="w-10 h-10 -mr-2 text-ink-3 hover:text-danger flex items-center justify-center shrink-0"><Trash2 size={17} /></button>
                </div>
              ))}
              <div className="flex items-center gap-3 min-h-[52px] px-4 rounded-[16px] border-[1.5px] border-dashed border-[#BBD5C9] text-accent">
                <Plus size={18} className="shrink-0" />
                <input placeholder="Добавить подзадачу…"
                  onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { upd({ subtasks: [...subtasks, { id: generateId(), text: e.target.value.trim(), done: false }] }); e.target.value = ''; } }}
                  className="flex-1 bg-transparent text-[15px] font-semibold placeholder-accent focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Правая: сведения */}
          <div className="w-full lg:w-[300px] shrink-0 box-border p-5 rounded-[20px] bg-surface-soft self-start">
            <div className="text-[15px] font-extrabold mb-3.5">Сведения</div>
            <div className="flex flex-col gap-3.5 text-sm">
              <div>
                <div className="text-xs text-ink-3 mb-1">Ежедневник</div>
                <div className="flex items-center gap-2 font-semibold"><span className="w-[9px] h-[9px] rounded-full" style={{ backgroundColor: currentColorInfo?.dot || '#12805F' }} />{plannerName}</div>
              </div>
              <div>
                <div className="text-xs text-ink-3 mb-1">Дата</div>
                <div className="font-semibold capitalize">{weekdayLabel}, {dateLabel}</div>
              </div>
              <div>
                <div className="text-xs text-ink-3 mb-1.5">Теги</div>
                <div className="flex gap-1.5 flex-wrap">
                  {important && <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-danger-chip text-danger">Важное</span>}
                  {(task.tags || []).filter(t => t !== 'важное').map(tag => (
                    <span key={tag} className="text-xs font-semibold px-3 py-0.5 rounded-full bg-tag-green-bg text-tag-green-text">#{tag}</span>
                  ))}
                  {(task.tags || []).length === 0 && !important && <span className="text-xs text-ink-3">—</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-ink-3 mb-1">Статус</div>
                <div className="font-semibold">{task.completed ? 'Выполнена' : 'Не выполнена'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== Вспомогательные данные для нового каркаса =====
  const plannerName = planners.find(p => p.id === currentPlannerId)?.name || 'Ежедневник';

  const overdueCount = (() => {
    const minDate = new Date(); minDate.setDate(minDate.getDate() - 30);
    const minStr = formatDate(minDate);
    let c = 0;
    Object.entries(tasks).forEach(([dStr, arr]) => {
      if (dStr < todayStr && dStr >= minStr) c += (arr || []).filter(t => !t.completed).length;
    });
    return c;
  })();

  const bDateStr = formatDate(currentDate);
  const bTasks = tasks[bDateStr] || [];
  const bTotal = bTasks.length;
  const bDone = bTasks.filter(t => t.completed).length;
  const bLeft = bTotal - bDone;
  const ringC = 2 * Math.PI * 40;
  const ringDone = bTotal ? (bDone / bTotal) * ringC : 0;
  const bWeekday = currentDate.toLocaleDateString('ru-RU', { weekday: 'long' });
  const bDateLabel = currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const showBanner = view === 'day' && getDaySlot() <= 4;

  const navItems = [
    { id: 'day', label: 'День', icon: Calendar, active: ['day', 'week', 'weekend', 'month'].includes(view), dropdown: true },
    { id: 'overdue', label: 'Просроченные', icon: Clock, active: view === 'overdue', badge: overdueCount, onClick: () => { setShowViewDropdown(false); setView(view === 'overdue' ? calView : 'overdue'); } },
    { id: 'important', label: 'Важные задачи', icon: Star, active: view === 'important', onClick: () => { setShowViewDropdown(false); setView(view === 'important' ? calView : 'important'); } },
    { id: 'notes', label: 'Заметки', icon: FileText, active: view === 'notes', onClick: () => { setShowViewDropdown(false); setView(view === 'notes' ? calView : 'notes'); } },
    { id: 'summary', label: 'Итоги месяца', icon: BarChart3, active: view === 'summary', onClick: () => { setShowViewDropdown(false); setView(view === 'summary' ? calView : 'summary'); } },
    { id: 'recurring', label: 'Повторяющиеся', icon: Repeat, active: false, onClick: () => { setShowViewDropdown(false); setShowRecurringModal(true); } },
  ];

  const Leaf = ({ size = 26 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0B5D46" aria-hidden="true">
      <path d="M5 19c0-8 4-14 15-14 0 10-5 15-12 15-1 0-2-.3-3-1z" />
      <path d="M5 19c2-5 5-8 9-10" stroke="#E4F0EA" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );

  // Выпадающий список выбора/управления ежедневниками
  const PlannerPicker = ({ compact }) => (
    <div className="relative">
      {compact ? (
        <button onClick={() => setShowPlannerDropdown(v => !v)} aria-label={`Ежедневник: ${plannerName}`}
          className="w-11 h-11 border border-line bg-surface-soft rounded-[14px] flex items-center justify-center">
          <span className="w-[11px] h-[11px] rounded-full" style={{ backgroundColor: currentColorInfo?.dot || '#12805F' }} />
        </button>
      ) : (
        <button onClick={() => setShowPlannerDropdown(v => !v)}
          className="w-full flex items-center gap-2 min-h-[44px] px-3 border border-line bg-surface-soft rounded-[14px] text-sm font-semibold text-ink">
          <span className="w-[9px] h-[9px] rounded-full shrink-0" style={{ backgroundColor: currentColorInfo?.dot || '#12805F' }} />
          <span className="flex-1 text-left truncate">{plannerName}</span>
          <ChevronDown size={14} className={`text-ink-3 transition-transform ${showPlannerDropdown ? 'rotate-180' : ''}`} />
        </button>
      )}
      {showPlannerDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-surface border border-line rounded-2xl shadow-card z-50 min-w-[220px] py-1.5"
          onMouseLeave={() => setShowPlannerDropdown(false)}>
          {planners.map(p => {
            const pColor = PLANNER_COLORS.find(c => c.id === p.color);
            return (
              <button key={p.id} onClick={() => { onSelectPlanner(p.id); setShowPlannerDropdown(false); }}
                className={`w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 hover:bg-surface-soft transition-colors ${p.id === currentPlannerId ? 'text-ink font-semibold' : 'text-ink-2'}`}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pColor?.dot }} />
                {p.name}
                {p.id === currentPlannerId && <Check size={13} className="ml-auto text-accent" />}
              </button>
            );
          })}
          <div className="border-t border-divider mt-1 pt-1">
            <button onClick={() => { onBack(); setShowPlannerDropdown(false); }}
              className="w-full text-left px-3.5 py-2 text-sm text-ink-3 hover:bg-surface-soft transition-colors">
              Все ежедневники
            </button>
            <button onClick={() => { onNewPlanner(); setShowPlannerDropdown(false); }}
              className="w-full text-left px-3.5 py-2 text-sm text-ink hover:bg-surface-soft transition-colors flex items-center gap-1.5">
              <Plus size={14} className="text-accent" /> Создать новый
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Выпадающий список День/Неделя/Месяц
  const ViewDropdownMenu = ({ up }) => (
    showViewDropdown ? (
      <div className={`absolute ${up ? 'bottom-full mb-2' : 'top-full mt-1'} left-0 bg-surface border border-line rounded-xl shadow-card z-50 min-w-[150px] py-1`}
        onMouseLeave={() => setShowViewDropdown(false)}>
        {[{ id: 'day', label: 'День' }, { id: 'week', label: 'Неделя' }, { id: 'month', label: 'Месяц' }].map(o => (
          <button key={o.id} onClick={() => { setView(o.id); setCalView(o.id); setDayStage('day'); setShowViewDropdown(false); }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-surface-soft transition-colors ${view === o.id ? 'text-ink font-semibold' : 'text-ink-2'}`}>
            {o.label}
            {view === o.id && <Check size={13} className="ml-auto text-accent" />}
          </button>
        ))}
      </div>
    ) : null
  );

  // Поповер-календарь (под датой в баннере)
  const CalendarPopover = () => {
    if (!showCalendar) return null;
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const firstIdx = (new Date(y, m, 1).getDay() + 6) % 7;
    const daysInM = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstIdx; i++) cells.push(null);
    for (let d = 1; d <= daysInM; d++) cells.push(d);
    const monthLabel = calMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    return (
      <div className="absolute left-0 top-full mt-3.5 w-80 box-border p-4 bg-surface rounded-[22px] shadow-cal z-50 text-ink" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <button aria-label="Предыдущий месяц" onClick={() => setCalMonth(new Date(y, m - 1, 1))}
            className="w-11 h-11 bg-[#F0F7F3] rounded-[14px] flex items-center justify-center"><ChevronLeft size={18} /></button>
          <span className="text-base font-bold capitalize">{monthLabel}</span>
          <button aria-label="Следующий месяц" onClick={() => setCalMonth(new Date(y, m + 1, 1))}
            className="w-11 h-11 bg-[#F0F7F3] rounded-[14px] flex items-center justify-center"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-ink-3 mb-1">
          {['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map(d => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[15px] font-medium">
          {cells.map((d, i) => {
            if (!d) return <span key={i} className="h-[38px]" />;
            const cellStr = formatDate(new Date(y, m, d));
            const isSel = cellStr === bDateStr;
            return (
              <button key={i} onClick={() => { setCurrentDate(new Date(y, m, d)); setDayStage('day'); setView('day'); setCalView('day'); setShowCalendar(false); }}
                className={`h-[38px] rounded-xl flex items-center justify-center ${isSel ? 'bg-primary text-white font-bold' : 'hover:bg-surface-soft'}`}>
                {d}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Баннер дня: дата + календарь + кольцо прогресса + Добавить
  const DayBanner = () => (
    <div className="relative z-[5] h-[96px] shrink-0 rounded-[24px] text-white flex items-center px-5 sm:px-7 shadow-banner overflow-visible"
      style={{ background: 'linear-gradient(120deg, #0A4D3A, #0B6A4F 55%, #14876A)' }}>
      <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 900 96" preserveAspectRatio="xMaxYMid slice"><circle cx="760" cy="10" r="90" fill="#fff" fillOpacity="0.06" /><circle cx="860" cy="90" r="70" fill="#fff" fillOpacity="0.06" /><circle cx="600" cy="110" r="60" fill="#fff" fillOpacity="0.05" /></svg>
      </div>
      <button aria-label="Предыдущий день" onClick={() => navigate(-1)}
        className="w-9 h-9 mr-2 sm:mr-3 rounded-full flex items-center justify-center shrink-0 hover:bg-white/15 transition-colors" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <ChevronLeft size={20} className="text-white" />
      </button>
      <div className="relative">
        <span className="absolute -top-5 left-0 text-[13px] sm:text-sm font-medium capitalize whitespace-nowrap" style={{ color: '#BFE5D6' }}>{bWeekday}</span>
        <button aria-label="Открыть календарь" aria-expanded={showCalendar} onClick={() => { setCalMonth(new Date(currentDate)); setShowCalendar(v => !v); }}
          className="border-0 bg-transparent p-0 text-left text-white flex items-center gap-2 sm:gap-3 text-[22px] sm:text-[30px] font-bold leading-none tracking-[-0.5px]">
          {bDateLabel}
          <span className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-[10px] sm:rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>
            <Calendar size={17} className="text-white" />
          </span>
        </button>
        <CalendarPopover />
      </div>
      <button aria-label="Следующий день" onClick={() => navigate(1)}
        className="w-9 h-9 ml-2 sm:ml-3 rounded-full flex items-center justify-center shrink-0 hover:bg-white/15 transition-colors" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <ChevronRight size={20} className="text-white" />
      </button>
      <span className="flex-1" />
      <div className="flex items-center gap-3 mr-1 sm:mr-5">
        <div className="relative w-12 h-12 sm:w-[52px] sm:h-[52px]">
          <svg viewBox="0 0 96 96" className="w-full h-full">
            <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="12" />
            <circle cx="48" cy="48" r="40" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${ringDone} ${ringC - ringDone}`} transform="rotate(-90 48 48)" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[13px] sm:text-sm font-bold">{bDone}/{bTotal || 0}</div>
        </div>
        <div className="hidden sm:block">
          <div className="text-[15px] font-bold">Выполнено {bDone} из {bTotal}</div>
          <div className="text-[13px]" style={{ color: '#BFE5D6' }}>{bLeft > 0 ? `Осталось ${bLeft}` : 'Всё готово'}</div>
        </div>
      </div>
      <button onClick={() => { newTaskInputRef.current && newTaskInputRef.current.focus(); }}
        className="relative flex items-center gap-2 min-h-[44px] px-4 sm:px-5 rounded-[22px] bg-white text-primary text-sm font-bold">
        <Plus size={18} /> <span className="hidden sm:inline">Добавить</span>
      </button>
    </div>
  );

  const viewContent = (
    <>
      {view === 'day' && (getDaySlot() === 5 ? renderWeekendView() : getDaySlot() === 6 ? renderWeekSummaryView() : renderDayView())}
      {view === 'week' && renderWeekView()}
      {view === 'weekend' && renderWeekendView()}
      {view === 'month' && renderMonthView()}
      {view === 'important' && renderImportantView()}
      {view === 'notes' && renderNotesView()}
      {view === 'overdue' && renderOverdueView()}
      {view === 'summary' && renderSummaryView()}
      {view === 'details' && renderTaskDetails()}
    </>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E4F0EA, #F4F9F6)' }}>
      {showRecurringModal && <RecurringModal />}

      <div className="flex gap-4 p-2 sm:p-4 min-h-screen">
        {/* ===== Боковая панель (десктоп) ===== */}
        {sidebarCompact ? (
          <aside className="hidden lg:flex w-[76px] shrink-0 bg-surface rounded-[24px] shadow-card py-5 flex-col items-center">
            <Leaf size={30} />
            <button aria-label="Развернуть панель с подписями" aria-expanded="false" onClick={toggleSidebar}
              className="w-11 h-11 mt-3.5 bg-surface-soft rounded-[14px] flex items-center justify-center text-ink-2"><ChevronsRight size={19} /></button>
            <div className="my-3.5"><PlannerPicker compact /></div>
            {navItems.map(n => (
              <div key={n.id} className="relative">
                <button aria-label={n.badge ? `${n.label}: ${n.badge}` : n.label} aria-current={n.active ? 'page' : undefined}
                  onClick={n.dropdown ? () => setShowViewDropdown(v => !v) : n.onClick}
                  className={`relative w-12 h-12 mb-1.5 rounded-[14px] flex items-center justify-center ${n.active ? 'bg-nav-active text-primary' : 'text-ink-2 hover:bg-surface-soft'}`}>
                  <n.icon size={21} />
                  {n.badge > 0 && <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-[9px] bg-danger-badge text-danger text-[11px] font-bold flex items-center justify-center">{n.badge}</span>}
                </button>
                {n.dropdown && <ViewDropdownMenu />}
              </div>
            ))}
            <div className="flex-1" />
            <button onClick={onSignOut} aria-label={`Профиль: ${user.displayName || user.email}, выйти`}
              className="w-[38px] h-[38px] rounded-full bg-primary text-white flex items-center justify-center font-bold">
              {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
            </button>
          </aside>
        ) : (
          <aside className="hidden lg:flex w-[232px] shrink-0 bg-surface rounded-[24px] shadow-card px-3.5 pt-5 pb-4 flex-col">
            <div className="flex items-center gap-2.5 px-2.5 pb-4 font-extrabold text-xl text-primary">
              <Leaf size={28} /> DayBook
              <span className="flex-1" />
              <button aria-label="Свернуть панель до иконок" aria-expanded="true" onClick={toggleSidebar}
                className="w-11 h-11 -my-3 -mr-2 bg-surface-soft rounded-[14px] flex items-center justify-center text-ink-2"><ChevronsLeft size={19} /></button>
            </div>
            <div className="mb-4"><PlannerPicker /></div>
            {navItems.map(n => (
              <div key={n.id} className="relative mb-1">
                <button aria-current={n.active ? 'page' : undefined}
                  onClick={n.dropdown ? () => setShowViewDropdown(v => !v) : n.onClick}
                  className={`w-full flex items-center gap-3 min-h-[46px] px-3.5 rounded-[14px] text-[15px] ${n.active ? 'bg-nav-active text-primary font-bold' : 'text-ink-2 font-medium hover:bg-surface-soft'}`}>
                  <n.icon size={20} />
                  <span className="flex-1 text-left">{n.label}</span>
                  {n.dropdown && <ChevronDown size={15} className={`transition-transform ${showViewDropdown ? 'rotate-180' : ''}`} />}
                  {n.badge > 0 && <span className="min-w-[22px] h-[22px] px-1.5 rounded-[11px] bg-danger-badge text-danger text-xs font-bold flex items-center justify-center">{n.badge}</span>}
                </button>
                {n.dropdown && <ViewDropdownMenu />}
              </div>
            ))}
            <div className="flex-1" />
            <div className="flex items-center gap-2.5 px-2 pt-3 border-t border-divider">
              <span className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold">{(user.displayName || user.email || 'A').charAt(0).toUpperCase()}</span>
              <span className="flex-1 text-sm font-semibold truncate">{user.displayName || user.email}</span>
              <button onClick={onSignOut} className="min-h-[44px] text-[13px] text-ink-3 hover:text-ink flex items-center gap-1"><LogOut size={15} /></button>
            </div>
          </aside>
        )}

        {/* ===== Правая область ===== */}
        <main className="flex-1 min-w-0 flex flex-col gap-3.5 pb-20 lg:pb-0">
          {/* Мобильная шапка */}
          <div className="lg:hidden flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-extrabold text-lg text-primary"><Leaf size={24} /> DayBook</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowLog(v => !v)} aria-label="Журнал действий"
                className="relative w-9 h-9 rounded-full bg-surface shadow-soft flex items-center justify-center text-ink-2">
                <History size={18} />
                {activityLog.length > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-accent" />}
              </button>
              <PlannerPicker />
              <button onClick={onSignOut} className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">{(user.displayName || user.email || 'A').charAt(0).toUpperCase()}</button>
            </div>
          </div>

          {/* Поиск (десктоп) */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex-1 max-w-[420px] flex items-center gap-2.5 h-11 px-4 rounded-[22px] bg-surface shadow-soft text-ink-3 text-sm">
              <Search size={18} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск по дневнику…"
                className="flex-1 bg-transparent focus:outline-none text-ink placeholder-ink-3" />
            </div>
            <span className="flex-1" />
            <button onClick={() => setShowLog(v => !v)} aria-label="Журнал действий"
              className="relative w-11 h-11 rounded-[22px] bg-surface shadow-soft flex items-center justify-center text-ink-2 hover:text-ink">
              <History size={19} />
              {activityLog.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />}
            </button>
          </div>

          {showBanner && <DayBanner />}

          {viewContent}
        </main>
      </div>

      {/* ===== Нижняя панель (мобайл) ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-surface shadow-bottomnav flex items-center justify-around px-1.5 pb-1.5 z-40">
        {[
          { id: 'day', label: 'День', icon: Calendar, active: ['day', 'week', 'weekend', 'month'].includes(view), dropdown: true },
          { id: 'overdue', label: 'Просроч.', icon: Clock, active: view === 'overdue', badge: overdueCount, onClick: () => setView(view === 'overdue' ? calView : 'overdue') },
          { id: 'important', label: 'Важные', icon: Star, active: view === 'important', onClick: () => setView(view === 'important' ? calView : 'important') },
          { id: 'notes', label: 'Заметки', icon: FileText, active: view === 'notes', onClick: () => setView(view === 'notes' ? calView : 'notes') },
          { id: 'summary', label: 'Итоги', icon: BarChart3, active: view === 'summary', onClick: () => setView(view === 'summary' ? calView : 'summary') },
        ].map(n => (
          <div key={n.id} className="relative">
            <button onClick={n.dropdown ? () => setShowViewDropdown(v => !v) : n.onClick}
              className={`relative w-[66px] h-[56px] rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-${n.active ? 'bold' : 'semibold'} ${n.active ? 'bg-nav-active text-primary' : 'text-ink-3'}`}>
              <n.icon size={22} />
              {n.label}
              {n.badge > 0 && <span className="absolute top-1 right-2.5 min-w-[18px] h-[18px] px-1 rounded-[9px] bg-danger text-white text-[11px] font-bold flex items-center justify-center">{n.badge}</span>}
            </button>
            {n.dropdown && <ViewDropdownMenu up />}
          </div>
        ))}
      </nav>

      {/* ===== Журнал действий ===== */}
      {showLog && (
        <div className="fixed inset-0 z-[60]" onClick={() => setShowLog(false)}>
          <div className="absolute top-16 right-3 sm:right-6 w-[320px] max-w-[92vw] max-h-[75vh] overflow-y-auto bg-surface rounded-2xl shadow-cal border border-line" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-line sticky top-0 bg-surface z-10">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2"><History size={16} /> Журнал действий</h3>
              <button onClick={() => setShowLog(false)} className="p-1 text-ink-3 hover:text-ink"><X size={16} /></button>
            </div>
            {activityLog.length === 0 ? (
              <p className="text-sm text-ink-3 px-4 py-8 text-center">Пока нет действий в этой сессии</p>
            ) : (
              <div className="p-2">
                {activityLog.map(e => (
                  <div key={e.id} className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-surface-soft">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink truncate">{e.label}</div>
                      <div className="text-[11px] text-ink-3">{new Date(e.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <button onClick={() => undoLogEntry(e.id)}
                      className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary px-2.5 py-1.5 rounded-lg hover:bg-nav-active">
                      <Undo2 size={13} /> Отменить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerApp;
