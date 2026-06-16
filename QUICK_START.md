# ⚡ Быстрый старт (5 минут)

## Самый простой способ - Drag & Drop на Netlify

### Шаг 1: Подготовка (2 минуты)
```bash
# Откройте терминал и выполните:
npm install
npm run build
```

### Шаг 2: Развертывание (1 минута)
1. Перейдите на https://app.netlify.com/drop
2. Перетащите папку `build` на страницу
3. Дождитесь появления URL
4. **Готово!** ✅

---

## Способ со 100% гарантией - через GitHub

### Шаг 1: Создайте репо
- Перейдите на https://github.com/new
- Назовите `planner-app`
- Создайте репозиторий

### Шаг 2: Загрузите код
```bash
cd папка/с/проектом
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/planner-app.git
git push -u origin main
```

### Шаг 3: Подключите Netlify
- Перейдите на https://app.netlify.com
- Нажмите "New site from Git"
- Выберите свой репо
- Settings: 
  - Build: `npm run build`
  - Publish: `build`
- Deploy!

---

## Успех! 🎉

Вам дали URL вроде: `https://xxx.netlify.app`

**Поделитесь ссылкой с друзьями!** Они смогут использовать ваш планер.

---

## Если что-то не работает:
1. Установлен ли Node.js? → https://nodejs.org/
2. Все ли файлы на месте? → см. FILE_STRUCTURE.md
3. Есть ошибки? → Посмотрите логи в Netlify

**Нужна помощь?** → Откройте DEPLOY_GUIDE.md

---

## Обновление приложения

Если используете GitHub (способ 2):
```bash
# Внесите изменения в код, потом:
git add .
git commit -m "Мое изменение"
git push
```

Netlify сам пересоберет и обновит сайт! ✨
