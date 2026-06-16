# 🚀 Подробная инструкция по развертыванию на Netlify

## Вариант 1: Быстрое развертывание (5 минут) ⚡

Если вы просто хотите быстро развернуть без GitHub:

### Шаг 1: Подготовка файлов
1. Скачайте все файлы проекта из папки `/mnt/user-data/outputs/`
2. Сохраните их структуру:
   ```
   planner-app/
   ├── public/
   │   └── index.html
   ├── src/
   │   ├── App.js
   │   └── index.js
   ├── package.json
   ├── .gitignore
   └── netlify.toml
   ```

### Шаг 2: Установка зависимостей
1. Откройте терминал (cmd на Windows, Terminal на Mac/Linux)
2. Перейдите в папку проекта:
   ```bash
   cd путь/к/planner-app
   ```
3. Установите зависимости:
   ```bash
   npm install
   ```
4. Создайте production версию:
   ```bash
   npm run build
   ```

### Шаг 3: Развертывание на Netlify
1. Перейдите на https://app.netlify.com/drop
2. Перетащите папку `build` на страницу (она должна появиться после шага 2)
3. **Готово!** Ваш сайт развернут! ✅

---

## Вариант 2: Профессиональное развертывание через GitHub (10 минут) 🔧

Этот способ лучше, если вы планируете обновлять приложение.

### Шаг 1: Создание репозитория на GitHub
1. Перейдите на https://github.com/new
2. Заполните форму:
   - **Repository name:** `planner-app`
   - **Description:** `Daily Planner App`
   - Выберите **Public** (чтобы был доступен)
3. Нажмите **Create repository**

### Шаг 2: Загрузка кода на GitHub
1. Откройте терминал в папке с проектом:
   ```bash
   cd путь/к/planner-app
   ```

2. Инициализируйте Git репозиторий:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Planner App"
   ```

3. Добавьте remote (замените USERNAME на ваше имя):
   ```bash
   git branch -M main
   git remote add origin https://github.com/USERNAME/planner-app.git
   git push -u origin main
   ```

### Шаг 3: Подключение к Netlify
1. Перейдите на https://app.netlify.com
2. Нажмите **"New site from Git"**
3. Выберите GitHub и авторизуйтесь
4. Выберите репозиторий `planner-app`
5. Проверьте build settings:
   - **Base directory:** (оставить пусто)
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
6. Нажмите **Deploy site** и ждите... 2-3 минуты
7. **Готово!** Ваш сайт будет доступен по уникальному URL 🎉

---

## Вариант 3: Через Netlify CLI (Продвинутый) 💻

Если у вас есть опыт работы с командной строкой:

1. Установите Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Авторизуйтесь:
   ```bash
   netlify login
   ```

3. Разверните проект:
   ```bash
   cd путь/к/planner-app
   npm run build
   netlify deploy --prod --dir=build
   ```

---

## 🔄 Как обновлять приложение после развертывания?

Если вы использовали **Вариант 2 (GitHub)**:

1. Внесите изменения в файлы проекта
2. Загрузите изменения на GitHub:
   ```bash
   git add .
   git commit -m "Описание изменения"
   git push
   ```
3. **Netlify автоматически пересоберет и обновит сайт!** ✨

---

## 🆘 Решение проблем

### Ошибка: "npm command not found"
- Установите Node.js с https://nodejs.org/
- Перезагрузите терминал после установки

### Ошибка: "cannot find module"
- Убедитесь, что вы в папке проекта
- Удалите папку `node_modules` и установите заново:
  ```bash
  rm -rf node_modules
  npm install
  ```

### Сайт после развертывания выглядит странно
- Очистите кэш браузера (Ctrl+Shift+Delete на Windows)
- Проверьте консоль браузера (F12 → Console) на ошибки

### Netlify не находит GitHub репозиторий
- Убедитесь, что репозиторий **Public**
- Проверьте, что вы авторизованы на GitHub

---

## 📌 Важные файлы проекта

| Файл | Назначение |
|------|-----------|
| `package.json` | Список зависимостей и скрипты |
| `netlify.toml` | Конфигурация Netlify |
| `public/index.html` | HTML шаблон |
| `src/App.js` | Основной компонент приложения |
| `src/index.js` | Точка входа приложения |

---

## ✅ Чек-лист после развертывания

- [ ] Сайт доступен по URL
- [ ] Можно создавать ежедневники
- [ ] Можно добавлять задачи
- [ ] Данные сохраняются при перезагрузке
- [ ] Все три вида (День, Неделя, Месяц) работают
- [ ] Поиск и фильтры работают

---

## 🎁 Бонус: Как скомандировать сайт друзьям?

После развертывания вы получите URL вроде:
```
https://your-site-name.netlify.app
```

Просто отправьте эту ссылку кому угодно - они смогут использовать ваш планер! 🌍

---

**Вопросы? Нужна помощь?** Проверьте логи на странице сайта в Netlify (Site overview → Deploys).
